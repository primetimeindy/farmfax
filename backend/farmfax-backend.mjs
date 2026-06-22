#!/usr/bin/env node
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const dataDir = process.env.FARMFAX_DATA_DIR || path.join(repoRoot, '.farmfax-data')
const port = Number(process.env.PORT || process.env.FARMFAX_BACKEND_PORT || 8787)
const host = process.env.HOST || (process.env.RENDER || process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
const maxBodyBytes = 2_000_000
const serviceVersion = '0.2.0'

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': process.env.FARMFAX_ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
}

function nowIso() {
  return new Date().toISOString()
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...headers })
  res.end(body)
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2), jsonHeaders)
}

function sendHtml(res, status, html) {
  send(res, status, html, {
    'content-type': 'text/html; charset=utf-8',
    'access-control-allow-origin': process.env.FARMFAX_ALLOWED_ORIGIN || '*',
    'cache-control': 'no-store',
  })
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
    if (size > maxBodyBytes) throw Object.assign(new Error('Request body too large'), { status: 413 })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400 })
  }
}

function safeId(value, label = 'id') {
  const clean = String(value || '').replace(/[^a-zA-Z0-9._-]/g, '')
  if (!clean) throw Object.assign(new Error(`Missing ${label}`), { status: 400 })
  return clean
}

function reportPath(reportId) {
  return path.join(dataDir, 'reports', `${safeId(reportId, 'report_id')}.json`)
}

function sessionPath(sessionId) {
  return path.join(dataDir, 'sessions', `${safeId(sessionId, 'session_id')}.json`)
}

async function writeJson(file, payload) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(payload, null, 2))
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

function validateReport(report) {
  const errors = []
  if (!report || typeof report !== 'object' || Array.isArray(report)) errors.push('report must be an object')
  if (!report?.report_id || typeof report.report_id !== 'string') errors.push('report_id is required')
  if (!report?.schema_version || typeof report.schema_version !== 'string') errors.push('schema_version is required')
  if (!Array.isArray(report?.findings)) errors.push('findings array is required')
  if (!Array.isArray(report?.risk_summary)) errors.push('risk_summary array is required')
  if (!Array.isArray(report?.buyer_questions)) errors.push('buyer_questions array is required')
  if (!report?.proof_intelligence || typeof report.proof_intelligence !== 'object') errors.push('proof_intelligence object is required')
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
    generated_at: report.generated_at || nowIso(),
    counts,
    top_risks: topRisks,
    next_actions: Array.isArray(report.before_deposit_checklist) ? report.before_deposit_checklist.slice(0, 5) : [],
    backend_truth: {
      storage: 'local-json',
      trained_cv_models: 'not_enabled',
      payment_provider: 'not_enabled',
      purpose: 'report contract persistence and workflow handoff',
      disclaimer: 'FarmFax is decision-support only, not a certified inspection or title/lien determination.',
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
      saved_at: nowIso(),
      hosted_report_id: report.report_id,
      api_version: serviceVersion,
    },
  }
  await writeJson(reportPath(report.report_id), payload)
  return payload
}

async function getReport(reportId) {
  const file = reportPath(reportId)
  if (!existsSync(file)) throw Object.assign(new Error('report_not_found'), { status: 404 })
  return readJson(file)
}

async function createSession(body) {
  const sessionId = `farmfax-session-${randomUUID()}`
  const session = {
    session_id: sessionId,
    status: 'capture_started',
    equipment_type: body.equipment_type || 'unknown',
    buyer_id: body.buyer_id || 'anonymous',
    source: body.source || 'api',
    created_at: nowIso(),
    updated_at: nowIso(),
    media: [],
    handoffs: [],
    truth_layer: {
      browser_detector_modules: 'implemented-in-demo',
      backend_storage: 'implemented-local-json',
      trained_cv_models: 'planned',
      payment_provider: 'not_enabled',
      overclaim_guard: 'decision-support only',
    },
  }
  await writeJson(sessionPath(sessionId), session)
  return session
}

async function getSession(sessionId) {
  const file = sessionPath(sessionId)
  if (!existsSync(file)) throw Object.assign(new Error('session_not_found'), { status: 404 })
  return readJson(file)
}

async function saveSession(session) {
  session.updated_at = nowIso()
  await writeJson(sessionPath(session.session_id), session)
  return session
}

function validateMedia(body) {
  const errors = []
  if (!body.slot || typeof body.slot !== 'string') errors.push('slot is required')
  if (!['photo', 'video', 'document'].includes(body.media_type)) errors.push('media_type must be photo, video, or document')
  if (!body.filename || typeof body.filename !== 'string') errors.push('filename is required')
  return errors
}

async function attachMedia(sessionId, body) {
  const errors = validateMedia(body)
  if (errors.length) throw Object.assign(new Error('Media validation failed'), { status: 422, errors })
  const session = await getSession(sessionId)
  const media = {
    media_id: `media-${randomUUID()}`,
    slot: body.slot,
    media_type: body.media_type,
    filename: body.filename,
    sha256: body.sha256 || createHash('sha256').update(`${sessionId}:${body.filename}:${nowIso()}`).digest('hex'),
    detector_outputs: Array.isArray(body.detector_outputs) ? body.detector_outputs : [],
    notes: body.notes || [],
    uploaded_at: nowIso(),
  }
  session.media.push(media)
  session.status = 'capture_in_progress'
  await saveSession(session)
  return { session, media }
}

async function createHandoff(sessionId, body) {
  const session = await getSession(sessionId)
  const recipientType = body.recipient_type || 'mechanic'
  if (!['mechanic', 'seller', 'dealer', 'buyer'].includes(recipientType)) {
    throw Object.assign(new Error('recipient_type must be mechanic, seller, dealer, or buyer'), { status: 422 })
  }
  const handoff = {
    handoff_id: `handoff-${randomUUID()}`,
    recipient_type: recipientType,
    report_id: body.report_id || null,
    notes: Array.isArray(body.notes) ? body.notes : [],
    checklist: Array.isArray(body.checklist) ? body.checklist : [],
    created_at: nowIso(),
    status: 'drafted',
  }
  session.handoffs.push(handoff)
  session.status = 'handoff_ready'
  await saveSession(session)
  return { session, handoff }
}

async function createShare(reportId, body) {
  const report = await getReport(reportId)
  const share = {
    share_id: `share-${randomUUID()}`,
    report_id: report.report_id,
    visibility: body.visibility || 'private-link',
    expires_at: new Date(Date.now() + Number(body.expires_in_hours || 72) * 60 * 60 * 1000).toISOString(),
    created_at: nowIso(),
    disclaimer: 'Shared FarmFax reports are buyer-owned decision support, not certifications.',
  }
  const sharesFile = path.join(dataDir, 'shares', `${share.share_id}.json`)
  await writeJson(sharesFile, share)
  return share
}

function publicBaseUrl(req) {
  const forwardedProto = req?.headers?.['x-forwarded-proto']
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || (process.env.RENDER ? 'https' : 'http')
  const forwardedHost = req?.headers?.['x-forwarded-host']
  const requestHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req?.headers?.host
  return requestHost ? `${proto}://${requestHost}` : `http://${host}:${port}`
}

function openApiSpec(req) {
  const endpointSummary = 'FarmFax report persistence, capture-session tracking, media metadata, and seller/mechanic handoff API.'
  return {
    openapi: '3.1.0',
    info: { title: 'FarmFax API', version: serviceVersion, description: `${endpointSummary} Decision-support only; not a certified inspection.` },
    servers: [{ url: publicBaseUrl(req) }],
    paths: {
      '/health': { get: { summary: 'Health check' } },
      '/api/openapi.json': { get: { summary: 'OpenAPI contract' } },
      '/api/sessions': { post: { summary: 'Create buyer capture session' } },
      '/api/sessions/{session_id}': { get: { summary: 'Get capture session' } },
      '/api/sessions/{session_id}/media': { post: { summary: 'Attach photo/video/document metadata and detector outputs' } },
      '/api/sessions/{session_id}/handoff': { post: { summary: 'Create seller/mechanic/dealer handoff package' } },
      '/api/analyze': { post: { summary: 'Validate and summarize a FarmFax report' } },
      '/api/reports': { post: { summary: 'Persist a FarmFax report' } },
      '/api/reports/{report_id}': { get: { summary: 'Fetch a persisted FarmFax report' } },
      '/api/reports/{report_id}/share': { post: { summary: 'Create a share link record for a hosted report' } },
    },
  }
}

function docsHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FarmFax API</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0c120f; color: #edf7ef; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
    .hero { border: 1px solid rgba(146, 255, 181, .22); background: linear-gradient(135deg, rgba(30, 128, 86, .35), rgba(9, 16, 14, .92)); border-radius: 28px; padding: 32px; box-shadow: 0 20px 80px rgba(0,0,0,.35); }
    .pill { display: inline-block; border: 1px solid rgba(146, 255, 181, .28); color: #a6ffc5; padding: 6px 10px; border-radius: 999px; font-size: 13px; }
    h1 { font-size: clamp(34px, 7vw, 72px); line-height: .92; margin: 18px 0; }
    code, pre { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.09); border-radius: 12px; }
    code { padding: 2px 6px; }
    pre { padding: 14px; overflow: auto; }
    section { margin-top: 24px; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; padding: 22px; background: rgba(255,255,255,.04); }
    li { margin: 8px 0; }
    a { color: #a6ffc5; }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <span class="pill">FarmFax backend · v${serviceVersion}</span>
      <h1>FarmFax API layer</h1>
      <p>Judge-visible backend for capture sessions, media metadata, report validation, hosted report persistence, share records, and seller/mechanic handoffs.</p>
      <p><strong>Truth layer:</strong> decision-support only. This API does not claim certified inspection, title/lien search, warranty, appraisal, or full-video certification.</p>
    </div>
    <section>
      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /health</code> — readiness and endpoint inventory.</li>
        <li><code>GET /api/openapi.json</code> — machine-readable contract.</li>
        <li><code>POST /api/sessions</code> — create a buyer capture session.</li>
        <li><code>POST /api/sessions/:id/media</code> — attach photo/video/document metadata and detector outputs.</li>
        <li><code>POST /api/sessions/:id/handoff</code> — draft seller/mechanic/dealer handoff.</li>
        <li><code>POST /api/analyze</code> — validate and summarize a FarmFax report.</li>
        <li><code>POST /api/reports</code> — persist the hosted report payload.</li>
        <li><code>GET /api/reports/:id</code> — fetch report and summary.</li>
        <li><code>POST /api/reports/:id/share</code> — create a share-link record.</li>
      </ul>
    </section>
    <section>
      <h2>Try it locally</h2>
      <pre>npm run backend:dev
open http://${host}:${port}/docs
curl http://${host}:${port}/api/openapi.json</pre>
    </section>
  </main>
</body>
</html>`
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})
  const { pathname } = parseRoute(req)

  try {
    if (req.method === 'GET' && pathname === '/') return sendHtml(res, 200, docsHtml())
    if (req.method === 'GET' && pathname === '/docs') return sendHtml(res, 200, docsHtml())
    if (req.method === 'GET' && pathname === '/api/openapi.json') return sendJson(res, 200, openApiSpec(req))

    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'farmfax-backend',
        version: serviceVersion,
        data_dir: dataDir,
        endpoints: Object.keys(openApiSpec(req).paths),
        truth_layer: 'decision-support only; no certified inspection claims',
      })
    }

    if (req.method === 'POST' && pathname === '/api/sessions') {
      const session = await createSession(await readJsonBody(req))
      return sendJson(res, 201, { ok: true, session_id: session.session_id, status: session.status, session })
    }

    const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/)
    if (req.method === 'GET' && sessionMatch) {
      const session = await getSession(decodeURIComponent(sessionMatch[1]))
      return sendJson(res, 200, { ok: true, session })
    }

    const mediaMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/media$/)
    if (req.method === 'POST' && mediaMatch) {
      const { session, media } = await attachMedia(decodeURIComponent(mediaMatch[1]), await readJsonBody(req))
      return sendJson(res, 201, { ok: true, media_id: media.media_id, media_count: session.media.length, media, session })
    }

    const handoffMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/handoff$/)
    if (req.method === 'POST' && handoffMatch) {
      const { session, handoff } = await createHandoff(decodeURIComponent(handoffMatch[1]), await readJsonBody(req))
      return sendJson(res, 201, { ok: true, handoff_id: handoff.handoff_id, handoff, session })
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

    const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/)
    if (req.method === 'GET' && reportMatch) {
      const report = await getReport(decodeURIComponent(reportMatch[1]))
      return sendJson(res, 200, { ok: true, report, summary: summarizeReport(report) })
    }

    const shareMatch = pathname.match(/^\/api\/reports\/([^/]+)\/share$/)
    if (req.method === 'POST' && shareMatch) {
      const body = await readJsonBody(req)
      const share = await createShare(decodeURIComponent(shareMatch[1]), body)
      return sendJson(res, 201, { ok: true, share_id: share.share_id, share_url: `/share/${share.report_id}?token=${share.share_id}`, share })
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
