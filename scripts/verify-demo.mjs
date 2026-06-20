import { access, readFile, stat } from 'node:fs/promises'
import { constants } from 'node:fs'

const root = new URL('../', import.meta.url)
const requiredFiles = [
  'dist/index.html',
  'public/farmfax-video-fixture.mp4',
  'public/farmfax-qr.svg',
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
  'data-qa="qr-share-block"',
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

const appSource = await readFile(new URL('src/App.tsx', root), 'utf8')
for (const label of requiredSourceLabels) {
  if (!appSource.includes(label)) throw new Error(`missing required demo label/hook in src/App.tsx: ${label}`)
  console.log(`ok label ${label}`)
}

const qr = await readFile(new URL('public/farmfax-qr.svg', root), 'utf8')
if (!qr.includes('<svg')) throw new Error('public/farmfax-qr.svg is not an SVG QR asset')
console.log('ok QR SVG parses as SVG text')

const dist = await readFile(new URL('dist/index.html', root), 'utf8')
if (!dist.includes('/assets/')) throw new Error('dist/index.html does not reference Vite assets')
console.log('ok dist index references built assets')

console.log('FarmFax demo verification passed')
