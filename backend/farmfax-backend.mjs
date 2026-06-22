#!/usr/bin/env node
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const dataDir = process.env.FARMFAX_DATA_DIR || path.join(repoRoot, '.farmfax-data')
const port = Number(process.env.PORT || process.env.FARMFAX_BACKEND_PORT || 8787)
const host = process.env.HOST || '127.0.0.1'
const maxBodyBytes = 2_000_000

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': process.env.FARMFAX_ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
}

function sendJson(res, status, payload) {
  res.writeHead(status, jsonHeaders)
  res.end(JSON.stringify(payload, null, 2))
}

function parseRoute(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`)
  return { pathname: url.pathname, searchParams: url.searchParams }
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.byteLength
    if (size > maxBodyBytes) {
      const err = new Error('Request body too large')
      err.status = 413
      throw err
    }
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('Invalid JSON body')
    err.status = 400
    throw err
  }
}

function reportPath(reportId) {
  const safeId = String(reportId || '').replace(/[^a-zA-Z0-9._-]/g, '')
  if (!safeId) throw Object.assign(new Error('Missing report_id'), { status: 400 })
  return path.join(dataDir, 'reports', `${safeId}.json`)
}

function validateReport(report) {
  const errors = []
  if (!report || typeof report !== 'object' || Array.isArray(report)) errors.push('report must be an object')
  if (!report.report_id || typeof report.report_id !== 'string') errors.push('report_id is required')
  if (!report.schema_version || typeof report.schema_version !== 'string') errors.push('schema_version is required')
  if (!Array.isArray(report.findings)) errors.push('findings array is required')
  if (!Array.isArray(report.risk_summary)) errors.push('risk_summary array is required')
  if (!Array.isArray(report.buyer_questions)) errors.push('buyer_questions array is required')
  if (!report.proof_intelligence || typeof report.proof_intelligence !== 'object') errors.push('proof_intelligence object is required')
  return errors
}

function summarizeReport(report) {
  const findings = Array.isArray(report.findings) ? report.findings : []
  const riskSummary = Array.isArray(report.risk_summary) ? report.risk_summary : []
  const detectorModules = Array.isArray(report.detector_modules) ? report.detector_modules : []
  const counts = {
    red_findings: findings.filter((item) => item.severity === 'red').length,
    yellow_findings: findings.filter((item) => item.severity === 'yellow').length,
    green_findings: findings.filter((item) => item.severity === 'green').length,
    high_risk_cards: riskSummary.filter((item) => item.severity === 'red' || item.level === 'high').length,
    detector_modules: detectorModules.length,
  }
  const topRisks = riskSummary
    .slice()
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 3)
    .map((item) => ({ id: item.id, label: item.label, score: item.score, action: item.buyerAction || item.action }))
  return {
    report_id: report.report_id,
    schema_version: report.schema_version,
    generated_at: report.generated_at || new Date().toISOString(),
    counts,
    top_risks: topRisks,
    next_actions: Array.isArray(report.before_deposit_checklist) ? report.before_deposit_checklist.slice(0, 5) : [],
    backend_truth: {
      storage: 'local-json',
      trained_cv_models: 'not_enabled',
      payment_provider: 'not_enabled',
      purpose: 'report contract persistence and workflow handoff',
    },
  }
}

async function saveReport(report) {
  const errors = validateReport(report)
  if (errors.length) throw Object.assign(new Error('Report validation failed'), { status: 422, errors })
  const payload = {
    ...report,
    backend: {
      storage: 'local-json',
      saved_at: new Date().toISOString(),
      hosted_report_id: report.report_id,
    },
  }
  const file = reportPath(report.report_id)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(payload, null, 2))
  return payload
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})
  const { pathname } = parseRoute(req)

  try {
    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'farmfax-backend',
        version: '0.1.0',
        data_dir: dataDir,
        endpoints: ['/health', '/api/reports', '/api/reports/:id', '/api/analyze'],
      })
    }

    if (req.method === 'POST' && pathname === '/api/reports') {
      const body = await readJsonBody(req)
      const report = body.report || body
      if (!report.report_id) report.report_id = `farmfax-${randomUUID()}`
      const saved = await saveReport(report)
      return sendJson(res, 201, {
        ok: true,
        report_id: saved.report_id,
        url: `/api/reports/${encodeURIComponent(saved.report_id)}`,
        summary: summarizeReport(saved),
      })
    }

    if (req.method === 'GET' && pathname.startsWith('/api/reports/')) {
      const id = decodeURIComponent(pathname.replace('/api/reports/', ''))
      const file = reportPath(id)
      if (!existsSync(file)) return sendJson(res, 404, { ok: false, error: 'report_not_found', report_id: id })
      const report = JSON.parse(await readFile(file, 'utf8'))
      return sendJson(res, 200, { ok: true, report, summary: summarizeReport(report) })
    }

    if (req.method === 'POST' && pathname === '/api/analyze') {
      const body = await readJsonBody(req)
      const report = body.report || body
      const errors = validateReport(report)
      if (errors.length) return sendJson(res, 422, { ok: false, errors })
      return sendJson(res, 200, { ok: true, analysis: summarizeReport(report) })
    }

    return sendJson(res, 404, { ok: false, error: 'not_found' })
  } catch (error) {
    return sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || 'internal_error',
      errors: error.errors || undefined,
    })
  }
}

const server = createServer(handleRequest)
server.listen(port, host, () => {
  console.log(`FarmFax backend listening on http://${host}:${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
