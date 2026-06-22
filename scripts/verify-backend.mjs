#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const repoRoot = process.cwd()
const port = 8797
const dataDir = await mkdtemp(path.join(tmpdir(), 'farmfax-backend-'))
const backendPath = path.join(repoRoot, 'backend', 'farmfax-backend.mjs')

const sampleReport = {
  report_id: 'farmfax-backend-verification',
  schema_version: 'farmfax.report.v0.1-open',
  generated_at: new Date().toISOString(),
  findings: [
    { severity: 'red', category: 'Hydraulics', finding: 'Wet cylinder body visible', confidence: 82 },
    { severity: 'yellow', category: 'Identity', finding: 'Serial plate readable but glare present', confidence: 74 },
  ],
  risk_summary: [
    { id: 'evidence', label: 'Proof supplied', score: 38, level: 'medium', severity: 'yellow', buyerAction: 'Ask for clean retakes.' },
    { id: 'mechanical', label: 'Mechanical risk', score: 76, level: 'high', severity: 'red', buyerAction: 'Require mechanic review before deposit.' },
  ],
  buyer_questions: ['Can you send a cold-start video?', 'Can you show the hydraulic cylinder after running?'],
  detector_modules: [
    { slot: 'hydraulics', name: 'Wet-mask segmentation module', score: 78, risk: 'red', output: 'Glossy dark wetness signal.' },
  ],
  before_deposit_checklist: ['Verify serial/PIN paperwork.', 'Mechanic reviews hydraulic leak before deposit.'],
  proof_intelligence: {
    browser_detector_modules: 'implemented',
    trained_cv_models: 'planned',
    nemotron_reasoning_layer: 'planned',
  },
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`)
  }
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${JSON.stringify(body)}`)
  }
  return body
}

const child = spawn(process.execPath, [backendPath], {
  cwd: repoRoot,
  env: { ...process.env, FARMFAX_BACKEND_PORT: String(port), FARMFAX_DATA_DIR: dataDir },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stdout = ''
let stderr = ''
child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
child.stderr.on('data', (chunk) => { stderr += chunk.toString() })

try {
  const base = `http://127.0.0.1:${port}`
  let healthy = false
  for (let i = 0; i < 30; i += 1) {
    try {
      const health = await requestJson(`${base}/health`)
      healthy = health.ok === true && health.service === 'farmfax-backend'
      if (healthy) break
    } catch {
      await wait(100)
    }
  }
  if (!healthy) throw new Error(`Backend did not become healthy. stdout=${stdout} stderr=${stderr}`)

  const analysis = await requestJson(`${base}/api/analyze`, {
    method: 'POST',
    body: JSON.stringify({ report: sampleReport }),
  })
  if (analysis.analysis.counts.red_findings !== 1) throw new Error('Analysis did not count red findings')
  if (analysis.analysis.backend_truth.storage !== 'local-json') throw new Error('Analysis backend truth missing')

  const saved = await requestJson(`${base}/api/reports`, {
    method: 'POST',
    body: JSON.stringify({ report: sampleReport }),
  })
  if (saved.report_id !== sampleReport.report_id) throw new Error('Saved report id mismatch')
  if (!saved.url.includes(sampleReport.report_id)) throw new Error('Saved report URL missing id')

  const fetched = await requestJson(`${base}${saved.url}`)
  if (fetched.report.report_id !== sampleReport.report_id) throw new Error('Fetched report id mismatch')
  if (fetched.summary.counts.detector_modules !== 1) throw new Error('Fetched summary detector count mismatch')

  const invalidResponse = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ report_id: 'bad' }),
  })
  if (invalidResponse.status !== 422) throw new Error(`Expected 422 for invalid report, got ${invalidResponse.status}`)

  console.log('FarmFax backend verification passed')
  console.log(`ok health ${base}/health`)
  console.log(`ok analyze counts red=${analysis.analysis.counts.red_findings}`)
  console.log(`ok save ${saved.url}`)
  console.log(`ok fetch ${fetched.report.report_id}`)
  console.log('ok invalid report rejected with 422')
} finally {
  child.kill('SIGTERM')
  await wait(100)
  await rm(dataDir, { recursive: true, force: true })
}
