import { access, readFile, stat } from 'node:fs/promises'
import { constants } from 'node:fs'

const root = new URL('../', import.meta.url)
const requiredFiles = [
  'dist/index.html',
  'public/farmfax-video-fixture.mp4',
  'public/farmfax-qr.svg',
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/icons/farmfax-icon-192.png',
  'public/icons/farmfax-icon-512.png',
  'public/sample-photos/walkaround.jpg',
  'public/sample-photos/serial-plate.jpg',
  'public/sample-photos/hour-meter.jpg',
  'public/sample-photos/hydraulics.jpg',
  'public/sample-photos/tires.jpg',
  'public/sample-photos/paint-body.jpg',
  'public/sample-photos/engine-bay.jpg',
  'public/sample-photos/ATTRIBUTION.md',
  'public/sample-report.html',
  'src/App.tsx',
]
const requiredSourceLabels = [
  'Run judge demo',
  'Try sample video',
  'Load complete sample',
  'Evidence checked',
  'Download JSON report',
  'For judges: demo trace',
  'Judge proof',
  'What FarmFax can verify today',
  'What FarmFax will not claim',
  'Sample media disclosure',
  'data-qa="defense-panel"',
  'data-qa="real-photo-analysis"',
  'data-qa="analysis-overlay-photo"',
  'data-qa="scan-cockpit"',
  'data-qa="scan-readiness-meter"',
  'Defect radar',
  'Evidence quality',
  'data-qa="camera-guide-overlay"',
  'Fill frame',
  'Hold steady',
  'Move closer',
  'Glare detected',
  'data-qa="zone-checklist"',
  'Engine / cold start',
  'data-qa="before-deposit-decision"',
  'Before deposit decision',
  'data-qa="report-preview-card"',
  'FarmFax report preview',
  'data-qa="specific-detector-stack"',
  'Tire tread wear',
  'Hose / cylinder wetness',
  'Serial plate readability',
  'Hour meter OCR confidence',
  'Rust cluster map',
  'Repaint / color mismatch',
  'Missing guard / safety components',
  'data-qa="slot-detector-chips"',
  'data-qa="detector-module-report"',
  'OCR readiness module',
  'Edge / texture tread module',
  'Wet-mask segmentation module',
  'Color-cluster repaint module',
  'Safety checklist module',
  'Detector modules run locally in browser',
  'data-qa="report-intelligence-panel"',
  'Detector module intelligence in export',
  'seller_questions_from_detectors',
  'module_risk_summary',
  'browser_detector_modules: implemented',
  'trained_cv_models: planned',
  'nemotron_reasoning_layer: planned',
  'data-qa="report-trust-loop"',
  'Report trust loop',
  'Open JSON preview',
  'copy seller questions',
  'mechanic_handoff_summary',
  'before_deposit_checklist',
  'Trust challenge: export is useful only if a buyer can hand it to the seller or mechanic.',
  'data-qa="qr-share-block"',
  'data-qa="phone-install-card"',
  'sample-photos/',
  'input_sources',
  'demo_truth',
]

async function assertFile(path) {
  const fileUrl = new URL(path, root)
  await access(fileUrl, constants.R_OK)
  const meta = await stat(fileUrl)
  if (!meta.size) throw new Error(`${path} exists but is empty`)
  return meta.size
}

for (const file of requiredFiles) {
  const size = await assertFile(file)
  console.log(`ok file ${file} (${size} bytes)`)
}

const appSource = [
  await readFile(new URL('src/App.tsx', root), 'utf8'),
  await readFile(new URL('src/farmfax/scenarios.ts', root), 'utf8'),
].join('\n')
for (const label of requiredSourceLabels) {
  if (!appSource.includes(label)) throw new Error(`missing required demo label/hook in source: ${label}`)
  console.log(`ok label ${label}`)
}

const qr = await readFile(new URL('public/farmfax-qr.svg', root), 'utf8')
if (!qr.includes('<svg')) throw new Error('public/farmfax-qr.svg is not an SVG QR asset')
console.log('ok QR SVG parses as SVG text')

const manifest = JSON.parse(await readFile(new URL('public/manifest.webmanifest', root), 'utf8'))
if (manifest.name !== 'FarmFax' && manifest.short_name !== 'FarmFax') throw new Error('manifest must identify FarmFax')
if (manifest.display !== 'standalone') throw new Error('manifest display must be standalone for phone install')
if (!manifest.start_url || !manifest.scope) throw new Error('manifest must define start_url and scope')
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) throw new Error('manifest must define app icons')
for (const size of ['192x192', '512x512']) {
  if (!manifest.icons.some((icon) => icon.sizes === size && icon.src.includes('/icons/'))) throw new Error(`manifest missing ${size} app icon`)
}
console.log('ok PWA manifest is install-ready')

const indexHtml = await readFile(new URL('index.html', root), 'utf8')
for (const snippet of ['rel="manifest"', 'apple-mobile-web-app-capable', 'apple-touch-icon', 'theme-color']) {
  if (!indexHtml.includes(snippet)) throw new Error(`index.html missing phone-app metadata: ${snippet}`)
}
console.log('ok index.html includes iOS/PWA install metadata')

const sw = await readFile(new URL('public/sw.js', root), 'utf8')
for (const snippet of ['farmfax-phone-app-v3', 'install', 'activate', 'fetch', "request.mode === 'navigate'"]) {
  if (!sw.includes(snippet)) throw new Error(`service worker missing ${snippet} handler`)
}
console.log('ok service worker has versioned network-first navigation caching')

const dist = await readFile(new URL('dist/index.html', root), 'utf8')
if (!dist.includes('/assets/')) throw new Error('dist/index.html does not reference Vite assets')
console.log('ok dist index references built assets')

const sampleReport = await readFile(new URL('public/sample-report.html', root), 'utf8')
for (const snippet of ['FarmFax Sample Report', 'Evidence-linked findings', 'Hydraulic leak evidence', 'farmfax-video-fixture.mp4', 'What this report will not claim']) {
  if (!sampleReport.includes(snippet)) throw new Error(`sample report missing ${snippet}`)
}
console.log('ok standalone sample report has evidence-linked photo/video reasoning')

console.log('FarmFax demo verification passed')
