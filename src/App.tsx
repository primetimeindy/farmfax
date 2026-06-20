import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createScenarioState, farmFaxScenarios, scenarioReducer } from './farmfax/scenarios'
import type { ScenarioId, ScenarioReportSeed } from './farmfax/scenarios'
import './App.css'

type CaptureState = 'accepted' | 'review' | 'missing'
type Severity = 'green' | 'yellow' | 'red'
type SlotId = 'walkaround' | 'serial' | 'hours' | 'hydraulics' | 'tires' | 'paint' | 'engine'

type AnalysisCell = { x: number; y: number; kind: 'rust' | 'wet' | 'paint' }

type ImageAnalysis = {
  rustPct: number
  wetPct: number
  paintVariance: number
  confidence: number
  cells: AnalysisCell[]
  summary: string
}

type VideoFrameAnalysis = {
  time: number
  image: string
  analysis: ImageAnalysis
}

type VideoAnalysis = {
  duration: number
  frameCount: number
  posterTime: number
  frames: VideoFrameAnalysis[]
  aggregate: ImageAnalysis
  summary: string
}

type CaptureSlot = {
  id: SlotId
  title: string
  prompt: string
  why: string
  state: CaptureState
  image?: string
  analysis?: ImageAnalysis
  video?: VideoAnalysis
  mediaType?: 'image' | 'video'
}

type Finding = {
  severity: Severity
  category: string
  finding: string
  confidence: number
  evidence: SlotId
  nextStep: string
}

type CatalogCandidate = {
  make: string
  model: string
  family: string
  confidence: number
  basis: string
}

type RiskLevel = 'low' | 'medium' | 'high'

type RiskFactor = {
  label: string
  points: number
  evidence: string
  explanation: string
}

type RiskCard = {
  id: 'identity' | 'safety' | 'evidence' | 'hours' | 'leverage'
  label: string
  score: number
  level: RiskLevel
  severity: Severity
  verdict: string
  evidence: string
  buyerAction: string
  factors: RiskFactor[]
}

type FarmFaxReport = {
  report_id: string
  schema_version: string
  generated_at: string
  scenario_id: ScenarioId
  demo_mode: boolean
  equipment_type: string
  serial_number: string
  hour_meter: number
  make_model_guess: CatalogCandidate
  condition_score: number
  confidence: number
  input_sources: {
    photos: number
    videos: number
    sampled_video_frames: number
    accepted_slots: number
    missing_slots: number
  }
  demo_truth: {
    browser_photo_checks: 'implemented'
    browser_video_frame_sampling: 'implemented'
    hermes_orchestration: 'planned'
    nemotron_reasoning: 'planned'
    stripe_checkout: 'simulated'
    unsupported_claims: string[]
  }
  findings: Finding[]
  visual_analysis: Array<{ slot: SlotId; source: 'photo' | 'video_frame'; rustPct: number; wetPct: number; paintVariance: number; confidence: number; summary: string; frameCount?: number; worstFrameTime?: number }>
  risk_summary: RiskCard[]
  buyer_questions: string[]
  missing_evidence: string[]
  open_record_commitment: string
  integration_stack: string[]
}

const PUBLIC_DEMO_URL = 'https://primetimeindy.github.io/farmfax-demo/'
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const catalogCandidates: CatalogCandidate[] = [
  {
    make: 'John Deere',
    model: '5075E',
    family: '5E Utility Tractor',
    confidence: 82,
    basis: 'OCR pattern LV5075E + green/yellow body + loader geometry + decal family',
  },
  {
    make: 'John Deere',
    model: '5065E',
    family: '5E Utility Tractor',
    confidence: 61,
    basis: 'Similar serial prefix and chassis silhouette; needs plate confirmation',
  },
  {
    make: 'Massey Ferguson',
    model: '4707',
    family: '4700 Series',
    confidence: 18,
    basis: 'False-positive fallback from utility tractor proportions; color evidence weak',
  },
]

const architectureStack = [
  {
    name: 'NVIDIA / Nemotron',
    line: 'Planned reasoning layer for weighing submitted evidence and writing buyer questions. It does not certify the machine.',
  },
  {
    name: 'Hermes',
    line: 'Planned orchestration for capture, evidence checks, report generation, export, and the hosted-report seam.',
  },
  {
    name: 'Stripe',
    line: 'Current demo simulates the hosted-report payment path. PDF and JSON export remain buyer-owned.',
  },
]

function stateLabel(state: CaptureState) {
  if (state === 'accepted') return 'photo received'
  if (state === 'review') return 'retake recommended'
  return 'still needed'
}

function slotTitle(slots: CaptureSlot[], slotId: SlotId) {
  return slots.find((slot) => slot.id === slotId)?.title ?? slotId
}

function severityWeight(severity: Severity) {
  if (severity === 'red') return 15
  if (severity === 'yellow') return 7
  return -2
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function riskLevel(score: number): RiskLevel {
  if (score >= 70) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

function riskSeverity(level: RiskLevel): Severity {
  if (level === 'high') return 'red'
  if (level === 'medium') return 'yellow'
  return 'green'
}

function buildRiskSummary(slots: CaptureSlot[], baseFindings: Finding[], analyzedCount: number, reportSeed: ScenarioReportSeed): RiskCard[] {
  const missing = slots.filter((slot) => slot.state === 'missing')
  const needsReview = slots.filter((slot) => slot.state === 'review')
  const accepted = slots.filter((slot) => slot.state === 'accepted')
  const serial = slots.find((slot) => slot.id === 'serial')
  const hours = slots.find((slot) => slot.id === 'hours')
  const engine = slots.find((slot) => slot.id === 'engine')
  const hydraulics = slots.find((slot) => slot.id === 'hydraulics')
  const redFindings = baseFindings.filter((finding) => finding.severity === 'red')
  const yellowFindings = baseFindings.filter((finding) => finding.severity === 'yellow')
  const highRust = slots.some((slot) => (slot.analysis?.rustPct ?? 0) > 8)
  const highWet = slots.some((slot) => (slot.analysis?.wetPct ?? 0) > 8)
  const paintShift = slots.some((slot) => (slot.analysis?.paintVariance ?? 0) > 35)

  const evidenceFactors: RiskFactor[] = [
    ...missing.map((slot) => ({ label: `${slot.title} missing`, points: slot.id === 'engine' || slot.id === 'serial' || slot.id === 'hours' ? 22 : 10, evidence: slot.id, explanation: 'Required view is absent, so FarmFax increases uncertainty instead of guessing.' })),
    ...needsReview.map((slot) => ({ label: `${slot.title} needs review`, points: slot.id === 'hydraulics' || slot.id === 'paint' ? 9 : 5, evidence: slot.id, explanation: 'Evidence exists but needs a cleaner capture before treating it as fully trusted.' })),
  ]
  if (analyzedCount < accepted.length) evidenceFactors.push({ label: 'Some accepted slots lack CV pass', points: 8, evidence: 'browser_cv', explanation: 'Accepted evidence should ideally include local rust/wet/paint analysis.' })
  const evidenceScore = clampScore(evidenceFactors.reduce((sum, factor) => sum + factor.points, 0))
  const evidenceLevel = riskLevel(evidenceScore)

  const identityFactors: RiskFactor[] = []
  if (serial?.state === 'missing') identityFactors.push({ label: 'Serial/PIN plate missing', points: 50, evidence: 'serial', explanation: 'Machine identity cannot be anchored without readable plate evidence.' })
  if (serial?.state === 'review') identityFactors.push({ label: 'Serial/PIN plate needs cleaner capture', points: 18, evidence: 'serial', explanation: 'Glare, blur, crop, or paint around the plate can reduce confidence.' })
  identityFactors.push({ label: 'Paperwork match not verified', points: 14, evidence: 'bill_of_sale', explanation: 'Serial/PIN still needs bill of sale, lien/title, dealer, or service-record confirmation.' })
  if (reportSeed.makeModelGuess.confidence < 85) identityFactors.push({ label: 'Catalog match not definitive', points: 8, evidence: 'catalog', explanation: `Top make/model match is ${reportSeed.makeModelGuess.confidence}%, useful but not a certification.` })
  const identityScore = clampScore(identityFactors.reduce((sum, factor) => sum + factor.points, 0))
  const identityLevel = riskLevel(identityScore)

  const hourFactors: RiskFactor[] = []
  if (hours?.state === 'missing') hourFactors.push({ label: 'Hour meter missing', points: 35, evidence: 'hours', explanation: 'Displayed hours cannot be anchored without dashboard evidence.' })
  if (hours?.state === 'review') hourFactors.push({ label: 'Hour meter needs confirmation', points: 16, evidence: 'hours', explanation: 'Hour OCR/capture confidence is not high enough for reliance.' })
  const hourLabel = reportSeed.hourMeter == null ? 'unknown hours' : `${reportSeed.hourMeter.toLocaleString()}h`
  hourFactors.push({ label: `No service records near ${hourLabel} shown`, points: 12, evidence: 'service_records', explanation: 'Maintenance records should reconcile displayed hours and wear.' })
  if ((highRust || highWet || paintShift) && hours?.state !== 'missing') hourFactors.push({ label: 'Visible wear should be reconciled with hours', points: 12, evidence: 'cv_findings', explanation: 'Rust/wet/paint signals do not prove hour rollback, but they justify record review.' })
  const hourScore = clampScore(hourFactors.reduce((sum, factor) => sum + factor.points, 0))
  const hourLevel = riskLevel(hourScore)

  const safetyFactors: RiskFactor[] = []
  if (hydraulics?.state === 'review' || highWet) safetyFactors.push({ label: 'Hydraulic leak evidence needs inspection', points: 28, evidence: 'hydraulics', explanation: 'Hydraulic leaks can create repair, fire, environmental, and operator safety risk.' })
  if (engine?.state === 'missing') safetyFactors.push({ label: 'Engine bay / cold-start missing', points: 18, evidence: 'engine', explanation: 'Belts, hoses, battery corrosion, smoke, and startup behavior remain unknown.' })
  if (highRust) safetyFactors.push({ label: 'Rust-tone signal near structural views', points: 14, evidence: 'browser_cv', explanation: 'Rust near mounts, steps, arms, or frame points should be inspected for metal loss.' })
  redFindings.forEach((finding) => safetyFactors.push({ label: `Red finding: ${finding.category}`, points: 10, evidence: finding.evidence, explanation: finding.finding }))
  const safetyScore = clampScore(safetyFactors.reduce((sum, factor) => sum + factor.points, 0))
  const safetyLevel = riskLevel(safetyScore)

  const leverageFactors: RiskFactor[] = [
    ...redFindings.map((finding) => ({ label: `Repair ask: ${finding.category}`, points: 14, evidence: finding.evidence, explanation: finding.finding })),
    ...yellowFindings.map((finding) => ({ label: `Verify: ${finding.category}`, points: 6, evidence: finding.evidence, explanation: finding.finding })),
  ]
  if (evidenceScore >= 35) leverageFactors.push({ label: 'Evidence gaps support contingency', points: 10, evidence: 'missing_evidence', explanation: 'Buyer can ask seller for missing captures before deposit or travel.' })
  if (hourScore >= 35) leverageFactors.push({ label: 'Hours need records', points: 8, evidence: 'hours', explanation: 'Service records or ECU/dealer readout should reconcile displayed hours.' })
  const leverageScore = clampScore(leverageFactors.reduce((sum, factor) => sum + factor.points, 0))
  const leverageLevel = riskLevel(leverageScore)

  return [
    { id: 'identity', label: 'Serial / paperwork', score: identityScore, level: identityLevel, severity: riskSeverity(identityLevel), verdict: identityLevel === 'high' ? 'Machine identity cannot be trusted from current photos.' : identityLevel === 'medium' ? 'Serial/model cues are plausible, but paperwork still needs checking.' : 'Visible model cues match the listing.', evidence: 'serial plate · model cues · paperwork not checked', buyerAction: 'Compare PIN plate to bill of sale, lien/title paperwork, dealer stock record, and service invoices.', factors: identityFactors },
    { id: 'safety', label: 'Costly repair / safety', score: safetyScore, level: safetyLevel, severity: riskSeverity(safetyLevel), verdict: safetyLevel === 'high' ? 'Do not skip inspection before buying or operating.' : safetyLevel === 'medium' ? 'Possible repair or safety concern needs closer inspection.' : 'No obvious safety-critical issue in supplied photos.', evidence: `${redFindings.length} red flag · engine ${engine?.state ?? 'unknown'} · hydraulics ${hydraulics?.state ?? 'unknown'}`, buyerAction: 'Inspect welds, pins, mounts, guards, hoses, loader arms, frame rails, and operator safety equipment.', factors: safetyFactors },
    { id: 'evidence', label: 'Proof supplied', score: evidenceScore, level: evidenceLevel, severity: riskSeverity(evidenceLevel), verdict: evidenceLevel === 'high' ? 'Too little evidence to judge this machine.' : evidenceLevel === 'medium' ? 'Important proof is missing or needs a retake.' : 'Core views are captured.', evidence: `${accepted.length}/7 photos received · ${missing.length} still needed · ${analyzedCount}/7 checked`, buyerAction: 'Ask seller for missing or cleaner photos before relying on the report.', factors: evidenceFactors },
    { id: 'hours', label: 'Hours check', score: hourScore, level: hourLevel, severity: riskSeverity(hourLevel), verdict: hourLevel === 'high' ? 'Hour evidence has serious gaps or missing proof.' : hourLevel === 'medium' ? 'Displayed hours should be checked against records and wear.' : 'Hour evidence appears usable, pending normal record review.', evidence: `${hourLabel} shown · service records not supplied`, buyerAction: 'Ask for service invoices, ECU/dealer diagnostics if available, and prior auction/dealer listings.', factors: hourFactors },
    { id: 'leverage', label: 'Offer leverage', score: leverageScore, level: leverageLevel, severity: riskSeverity(leverageLevel), verdict: leverageLevel === 'high' ? 'Strong reason to require repair proof or a contingency.' : leverageLevel === 'medium' ? 'Moderate leverage from visible issues and unanswered proof.' : 'Limited visible leverage; use report mainly for diligence.', evidence: `${redFindings.length} red · ${yellowFindings.length} yellow · ${missing.length} missing`, buyerAction: 'Use findings to request records, additional photos, inspection contingency, or seller concession — not as an appraisal.', factors: leverageFactors },
  ]
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : delta / max
  return { h, s, v: max }
}

function analyzeImageHeuristics(imageSrc: string): Promise<ImageAnalysis> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const width = 160
      const height = Math.max(90, Math.round((image.height / image.width) * width))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        resolve({ rustPct: 0, wetPct: 0, paintVariance: 0, confidence: 0, cells: [], summary: 'analysis unavailable' })
        return
      }
      ctx.drawImage(image, 0, 0, width, height)
      const data = ctx.getImageData(0, 0, width, height).data
      let rust = 0
      let wet = 0
      let saturated = 0
      const hueByCell = new Map<string, number[]>()
      const flagged = new Map<string, AnalysisCell>()
      const cols = 8
      const rows = 6
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4
          const { h, s, v } = rgbToHsv(data[idx], data[idx + 1], data[idx + 2])
          const cellX = Math.min(cols - 1, Math.floor((x / width) * cols))
          const cellY = Math.min(rows - 1, Math.floor((y / height) * rows))
          const cellKey = `${cellX}-${cellY}`
          const isRust = h >= 8 && h <= 45 && s > 0.28 && v > 0.16
          const isWet = v < 0.23 && s > 0.12 && !(h >= 190 && h <= 250)
          if (isRust) {
            rust += 1
            flagged.set(`${cellKey}-rust`, { x: cellX, y: cellY, kind: 'rust' })
          }
          if (isWet) {
            wet += 1
            flagged.set(`${cellKey}-wet`, { x: cellX, y: cellY, kind: 'wet' })
          }
          if (s > 0.25 && v > 0.22) {
            saturated += 1
            const list = hueByCell.get(cellKey) ?? []
            list.push(h)
            hueByCell.set(cellKey, list)
          }
        }
      }
      const sampleCount = Math.ceil(width / 2) * Math.ceil(height / 2)
      const cellMeans = Array.from(hueByCell.entries())
        .filter(([, hues]) => hues.length > 18)
        .map(([key, hues]) => ({ key, hue: hues.reduce((sum, value) => sum + value, 0) / hues.length }))
      const avgHue = cellMeans.length ? cellMeans.reduce((sum, item) => sum + item.hue, 0) / cellMeans.length : 0
      const hueStd = cellMeans.length ? Math.sqrt(cellMeans.reduce((sum, item) => sum + Math.pow(item.hue - avgHue, 2), 0) / cellMeans.length) : 0
      const paintVariance = Math.min(100, Math.round((hueStd / 75) * 100))
      if (paintVariance > 28 && saturated > sampleCount * 0.08) {
        cellMeans
          .filter((item) => Math.abs(item.hue - avgHue) > 35)
          .slice(0, 10)
          .forEach((item) => {
            const [x, y] = item.key.split('-').map(Number)
            flagged.set(`${item.key}-paint`, { x, y, kind: 'paint' })
          })
      }
      const rustPct = Math.round((rust / sampleCount) * 1000) / 10
      const wetPct = Math.round((wet / sampleCount) * 1000) / 10
      const confidence = Math.min(92, Math.max(35, Math.round(44 + rustPct * 1.5 + wetPct * 1.2 + paintVariance * 0.35)))
      const summary = [
        rustPct > 2 ? `${rustPct}% rust-tone pixels` : 'low rust-tone signal',
        wetPct > 5 ? `${wetPct}% dark/wet signal` : 'low leak-tone signal',
        paintVariance > 30 ? `paint variance ${paintVariance}/100` : 'paint variance low',
      ].join(' · ')
      resolve({ rustPct, wetPct, paintVariance, confidence, cells: Array.from(flagged.values()).slice(0, 28), summary })
    }
    image.onerror = () => resolve({ rustPct: 0, wetPct: 0, paintVariance: 0, confidence: 0, cells: [], summary: 'image could not be analyzed' })
    image.src = imageSrc
  })
}

function videoFrameRisk(frame: VideoFrameAnalysis) {
  return frame.analysis.rustPct * 1.3 + frame.analysis.wetPct * 1.5 + frame.analysis.paintVariance * 0.35
}

function mediaEvent(element: HTMLMediaElement, eventName: keyof HTMLMediaElementEventMap, timeoutMs = 7000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Video took too long to load. Try a shorter clip or use photos.'))
    }, timeoutMs)
    const cleanup = () => {
      window.clearTimeout(timeout)
      element.removeEventListener(eventName, onEvent)
      element.removeEventListener('error', onError)
    }
    const onEvent = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('This video could not be read in this browser. Use photos instead.'))
    }
    element.addEventListener(eventName, onEvent, { once: true })
    element.addEventListener('error', onError, { once: true })
  })
}

async function seekVideoFrame(video: HTMLVideoElement, time: number) {
  const target = Math.min(Math.max(time, 0), Math.max(0, video.duration - 0.05))
  if (Math.abs(video.currentTime - target) < 0.03) return
  const seeked = mediaEvent(video, 'seeked')
  video.currentTime = target
  await seeked
}

function drawVideoFrame(video: HTMLVideoElement) {
  const sourceWidth = video.videoWidth || 640
  const sourceHeight = video.videoHeight || 360
  if (!sourceWidth || !sourceHeight) throw new Error('Video frame has no readable size.')
  const width = Math.min(640, sourceWidth)
  const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable for video sampling.')
  context.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function videoSampleTimes(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return []
  return Array.from(new Set([0.2, 0.4, 0.6, 0.8]
    .map((pct) => Math.min(duration - 0.05, Math.max(0.05, duration * pct)))
    .map((time) => Math.round(time * 10) / 10)))
    .slice(0, 4)
}

async function analyzeVideoFile(file: File): Promise<{ poster: string; video: VideoAnalysis }> {
  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = objectUrl

  try {
    await mediaEvent(video, 'loadedmetadata')
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    const sampleTimes = videoSampleTimes(duration)
    if (!sampleTimes.length) throw new Error('Video has no readable duration. Use a short photo sequence instead.')

    const frames: VideoFrameAnalysis[] = []
    for (const time of sampleTimes) {
      await seekVideoFrame(video, time)
      const image = drawVideoFrame(video)
      const analysis = await analyzeImageHeuristics(image)
      frames.push({ time, image, analysis })
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    }
    if (!frames.length) throw new Error('No video frames could be checked.')

    const worstFrame = frames.reduce((worst, frame) => (videoFrameRisk(frame) > videoFrameRisk(worst) ? frame : worst), frames[0])
    const aggregate: ImageAnalysis = {
      ...worstFrame.analysis,
      summary: worstFrame.analysis.summary,
    }
    return {
      poster: worstFrame.image,
      video: {
        duration,
        frameCount: frames.length,
        posterTime: worstFrame.time,
        frames,
        aggregate,
        summary: `${frames.length} frames checked · most concerning frame ${worstFrame.time.toFixed(1)}s · ${aggregate.summary}`,
      },
    }
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

function App() {
  const [scenarioState, setScenarioState] = useState(() => createScenarioState('risky-tractor'))
  const slots = scenarioState.slots
  const findings = scenarioState.findings
  const reportSeed = scenarioState.reportSeed
  const activeScenario = farmFaxScenarios.find((scenario) => scenario.id === scenarioState.selectedScenarioId) ?? farmFaxScenarios[0]
  const [equipmentType, setEquipmentType] = useState('tractor')
  const [stripeOpen, setStripeOpen] = useState(false)
  const [isSampleVideoLoading, setIsSampleVideoLoading] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding>(findings[0])
  const [cameraSlot, setCameraSlot] = useState<CaptureSlot | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRequestRef = useRef(0)
  const uploadRequestRef = useRef<Record<SlotId, number>>({
    walkaround: 0,
    serial: 0,
    hours: 0,
    hydraulics: 0,
    tires: 0,
    paint: 0,
    engine: 0,
  })
  const [mediaErrors, setMediaErrors] = useState<Partial<Record<SlotId, string>>>({})

  const acceptedCount = slots.filter((slot) => slot.state === 'accepted').length
  const reviewCount = slots.filter((slot) => slot.state === 'review').length
  const analyzedSlots = slots.filter((slot) => slot.analysis)
  const missing = slots.filter((slot) => slot.state === 'missing')
  const videoSourceCount = slots.filter((slot) => slot.mediaType === 'video').length
  const photoSourceCount = analyzedSlots.filter((slot) => slot.mediaType !== 'video').length
  const sampledFrameCount = slots.reduce((sum, slot) => sum + (slot.video?.frameCount ?? 0), 0)
  const riskSummary = useMemo(() => buildRiskSummary(slots, findings, analyzedSlots.length, reportSeed), [slots, findings, analyzedSlots.length, reportSeed])
  const dealPosture = missing.some((slot) => slot.id === 'serial' || slot.id === 'hours')
    ? 'Do not send money yet'
    : riskSummary.some((risk) => risk.severity === 'red')
      ? 'Inspect before any deposit'
      : riskSummary.some((risk) => risk.severity === 'yellow')
        ? 'Ask seller for proof first'
        : 'Looks worth a call'
  const nextMoveCopy = missing.some((slot) => slot.id === 'serial' || slot.id === 'hours')
    ? 'Ask for the missing serial plate and hour meter photos before you drive out, wire money, or place a deposit.'
    : riskSummary.some((risk) => risk.id === 'safety' && risk.severity === 'red')
      ? 'Have the leak, weld, frame, and engine evidence inspected before any deposit. Use the questions below to slow the deal down.'
      : riskSummary.some((risk) => risk.severity === 'yellow')
        ? 'The packet is usable, but ask for the missing or cleaner photos before you rely on the listing.'
        : 'Photos look complete enough for a seller call. Still match serial paperwork and service records before paying.'
  const conditionScore = useMemo(() => {
    const penalty = findings.reduce((sum, finding) => sum + severityWeight(finding.severity), 0) + missing.length * 5
    return Math.round(Math.max(0, Math.min(100, reportSeed.conditionScore - penalty * 0.15 + acceptedCount)))
  }, [acceptedCount, findings, missing.length, reportSeed.conditionScore])

  const report: FarmFaxReport = useMemo(() => ({
    report_id: reportSeed.reportId,
    schema_version: 'farmfax.report.v0.1-open',
    generated_at: new Date().toISOString(),
    scenario_id: scenarioState.selectedScenarioId,
    demo_mode: true,
    equipment_type: reportSeed.equipmentType,
    serial_number: reportSeed.serialNumber,
    hour_meter: reportSeed.hourMeter ?? 0,
    make_model_guess: reportSeed.makeModelGuess,
    condition_score: conditionScore,
    confidence: reportSeed.confidence,
    input_sources: {
      photos: photoSourceCount,
      videos: videoSourceCount,
      sampled_video_frames: sampledFrameCount,
      accepted_slots: acceptedCount,
      missing_slots: missing.length,
    },
    demo_truth: {
      browser_photo_checks: 'implemented',
      browser_video_frame_sampling: 'implemented',
      hermes_orchestration: 'planned',
      nemotron_reasoning: 'planned',
      stripe_checkout: 'simulated',
      unsupported_claims: [
        'mechanical certification',
        'title/lien/theft status',
        'safety certification',
        'appraisal or repair estimate',
        'full-video inspection',
      ],
    },
    findings,
    visual_analysis: analyzedSlots.map((slot) => ({
      slot: slot.id,
      source: slot.mediaType === 'video' ? 'video_frame' : 'photo',
      rustPct: slot.analysis!.rustPct,
      wetPct: slot.analysis!.wetPct,
      paintVariance: slot.analysis!.paintVariance,
      confidence: slot.analysis!.confidence,
      summary: slot.video ? slot.video.summary : slot.analysis!.summary,
      frameCount: slot.video?.frameCount,
      worstFrameTime: slot.video?.posterTime,
    })),
    risk_summary: riskSummary,
    buyer_questions: reportSeed.buyerQuestions,
    missing_evidence: missing.map((slot) => slot.title),
    open_record_commitment: reportSeed.openRecordCommitment,
    integration_stack: architectureStack.map((item) => item.name),
  }), [acceptedCount, analyzedSlots, conditionScore, findings, missing, photoSourceCount, reportSeed, sampledFrameCount, scenarioState.selectedScenarioId, riskSummary, videoSourceCount])

  const openRecordPreview = useMemo(() => ({
    schema: report.schema_version,
    generated_at: report.generated_at,
    scenario_id: report.scenario_id,
    demo_mode: report.demo_mode,
    input_sources: report.input_sources,
    demo_truth: report.demo_truth,
    equipment_identity: {
      type: report.equipment_type,
      serial_pin: report.serial_number,
      make_model_guess: `${report.make_model_guess.make} ${report.make_model_guess.model}`,
      hour_meter: reportSeed.hourMeter ?? 'unknown',
    },
    evidence: report.visual_analysis.length ? report.visual_analysis.map((item) => ({ slot: item.slot, summary: item.summary, confidence: item.confidence })) : slots.map((slot) => ({ slot: slot.id, state: slot.state, has_image: Boolean(slot.image) })),
    risk_summary: report.risk_summary.map((risk) => ({ id: risk.id, score: risk.score, level: risk.level, action: risk.buyerAction })),
    portability: 'Core record exports as JSON/PDF; paid hosting does not own the equipment history.',
  }), [report, reportSeed.hourMeter, slots])

  const workflowTrace = useMemo(() => [
    {
      status: 'working demo',
      label: '7-view capture checklist',
      detail: `${acceptedCount}/7 accepted · ${reviewCount} need review · ${missing.length} missing`,
    },
    {
      status: 'working demo',
      label: 'Photo + selected video-frame check',
      detail: `${analyzedSlots.length}/7 slots checked · ${videoSourceCount} video source${videoSourceCount === 1 ? '' : 's'}`,
    },
    {
      status: 'working demo',
      label: 'Buyer risk report',
      detail: `${report.risk_summary.filter((risk) => risk.severity === 'red').length} red · ${report.risk_summary.filter((risk) => risk.severity === 'yellow').length} yellow · ${report.buyer_questions.length} seller questions`,
    },
    {
      status: 'planned',
      label: 'Nemotron evidence reasoning',
      detail: 'Turns submitted evidence, OCR, missing proof, and findings into plain buyer questions.',
    },
    {
      status: 'planned',
      label: 'Hermes workflow routing',
      detail: 'Routes capture → evidence check → report → export / hosted link.',
    },
    {
      status: 'simulated',
      label: 'Stripe hosted report',
      detail: 'Payment screen only; free JSON/PDF export stays with the owner.',
    },
  ], [acceptedCount, analyzedSlots.length, missing.length, report.buyer_questions.length, report.risk_summary, reviewCount, videoSourceCount])

  const shareUrl = PUBLIC_DEMO_URL

  function nextUploadRequest(slotId: SlotId) {
    uploadRequestRef.current[slotId] += 1
    setMediaErrors((current) => ({ ...current, [slotId]: undefined }))
    return uploadRequestRef.current[slotId]
  }

  function isCurrentUpload(slotId: SlotId, requestId: number) {
    return uploadRequestRef.current[slotId] === requestId
  }

  async function saveSlotImage(slotId: SlotId, image: string, requestId = nextUploadRequest(slotId)) {
    if (!isCurrentUpload(slotId, requestId)) return
    setScenarioState((current) => scenarioReducer(current, { type: 'replace-slot-image', slotId, image, mediaType: 'image' }))
    const analysis = await analyzeImageHeuristics(image)
    if (!isCurrentUpload(slotId, requestId)) return
    setScenarioState((current) => scenarioReducer(current, { type: 'set-slot-analysis', slotId, image, analysis, mediaType: 'image' }))
  }

  async function saveSlotVideo(slotId: SlotId, file: File, requestId: number) {
    try {
      const { poster, video } = await analyzeVideoFile(file)
      if (!isCurrentUpload(slotId, requestId)) return
      setScenarioState((current) => scenarioReducer(current, {
        type: 'replace-slot-image',
        slotId,
        image: poster,
        analysis: video.aggregate,
        mediaType: 'video',
        video,
      }))
    } catch (error) {
      if (!isCurrentUpload(slotId, requestId)) return
      setMediaErrors((current) => ({
        ...current,
        [slotId]: error instanceof Error ? error.message : 'Video could not be checked. Use photos instead.',
      }))
    }
  }

  async function runSampleVideo(slotId: SlotId = 'hydraulics', options: { scrollToReport?: boolean } = {}) {
    setIsSampleVideoLoading(true)
    const requestId = nextUploadRequest(slotId)
    try {
      const response = await fetch(assetUrl('/farmfax-video-fixture.mp4'))
      if (!response.ok) throw new Error('Sample video fixture could not be loaded.')
      const blob = await response.blob()
      const file = new File([blob], 'farmfax-video-fixture.mp4', { type: blob.type || 'video/mp4' })
      await saveSlotVideo(slotId, file, requestId)
      const targetId = options.scrollToReport ? 'report' : 'capture'
      window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (error) {
      if (!isCurrentUpload(slotId, requestId)) return
      setMediaErrors((current) => ({
        ...current,
        [slotId]: error instanceof Error ? error.message : 'Sample video could not be checked. Upload photos instead.',
      }))
    } finally {
      if (isCurrentUpload(slotId, requestId)) setIsSampleVideoLoading(false)
    }
  }

  async function runJudgeDemo() {
    loadScenario('risky-tractor')
    await runSampleVideo('hydraulics', { scrollToReport: true })
  }

  async function runCompleteSampleInspection() {
    loadScenario('clean-tractor')
    await runSampleVideo('hydraulics', { scrollToReport: true })
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard?.writeText(shareUrl)
    } catch {
      window.prompt('Copy FarmFax demo URL', shareUrl)
    }
  }

  function updateSlotMedia(slotId: SlotId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const requestId = nextUploadRequest(slotId)
    if (file.type.startsWith('video/')) {
      void saveSlotVideo(slotId, file, requestId)
      return
    }
    if (!file.type.startsWith('image/')) {
      setMediaErrors((current) => ({ ...current, [slotId]: 'Use a photo or short video file.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => void saveSlotImage(slotId, String(reader.result), requestId)
    reader.onerror = () => setMediaErrors((current) => ({ ...current, [slotId]: 'Photo could not be read. Try another file.' }))
    reader.readAsDataURL(file)
  }

  function loadScenario(scenarioId: ScenarioId) {
    uploadRequestRef.current = {
      walkaround: 0,
      serial: 0,
      hours: 0,
      hydraulics: 0,
      tires: 0,
      paint: 0,
      engine: 0,
    }
    setMediaErrors({})
    setIsSampleVideoLoading(false)
    setScenarioState(createScenarioState(scenarioId))
  }

  function stopCamera() {
    cameraRequestRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  async function openCamera(slot: CaptureSlot) {
    const requestId = cameraRequestRef.current + 1
    cameraRequestRef.current = requestId
    setCameraSlot(slot)
    setCameraError('')
    setIsCameraStarting(true)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    let acquiredStream: MediaStream | null = null
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API unavailable in this browser. Use the upload fallback.')
      }
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
      })
      if (cameraRequestRef.current !== requestId) {
        acquiredStream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = acquiredStream
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      if (cameraRequestRef.current !== requestId || !videoRef.current) {
        acquiredStream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        return
      }
      videoRef.current.srcObject = acquiredStream
      await videoRef.current.play()
    } catch (error) {
      acquiredStream?.getTracks().forEach((track) => track.stop())
      if (cameraRequestRef.current === requestId) {
        setCameraError(error instanceof Error ? error.message : 'Unable to start camera. Use upload fallback.')
      }
    } finally {
      if (cameraRequestRef.current === requestId) setIsCameraStarting(false)
    }
  }

  function closeCamera() {
    stopCamera()
    setCameraSlot(null)
    setCameraError('')
    setIsCameraStarting(false)
  }

  function captureFrame() {
    if (!cameraSlot || !videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    saveSlotImage(cameraSlot.id, canvas.toDataURL('image/jpeg', 0.9))
    closeCamera()
  }

  useEffect(() => {
    setSelectedFinding(findings[0])
  }, [findings])

  useEffect(() => {
    const videoElement = videoRef.current
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoElement) videoElement.srcObject = null
    }
  }, [])

  function exportReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.report_id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><span className="live-dot" /> FarmFax // used equipment check</div>
        <nav>
          <a href="#capture">Photos needed</a>
          <a href="#catalog">Paperwork check</a>
          <a href="#report">Buyer report</a>
        </nav>
      </header>

      <section className="hero-card farm-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Open condition intelligence for used farm equipment</p>
          <div className="demo-badge">{activeScenario.demoBadge} · browser demo · no backend required</div>
          <h1>Check the machine before you buy.</h1>
          <p className="lede">
            FarmFax turns guided phone photos and short videos into an evidence-backed buyer report: visible condition,
            missing proof, serial/PIN and hour-meter notes, seller questions, and buyer-owned JSON/PDF export.
          </p>
          <div className="hero-actions primary-actions">
            <button onClick={() => document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth' })}>Start photo checklist</button>
            <button className="ghost" onClick={() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })}>See buyer report</button>
          </div>
          <div className="judge-fast-path" aria-label="judge demo controls">
            <span>Judges:</span>
            <button className="ghost judge-demo-button" data-qa="judge-demo-button" onClick={() => void runJudgeDemo()} disabled={isSampleVideoLoading}>
              {isSampleVideoLoading ? 'Running sample…' : 'Run judge demo'}
            </button>
            <button className="ghost" data-qa="sample-inspection-button" onClick={() => void runCompleteSampleInspection()} disabled={isSampleVideoLoading}>
              Load complete sample
            </button>
          </div>
        </div>
        <aside className="summary-card machine-card">
          <span>recommended next move</span>
          <strong>{conditionScore}</strong>
          <p><b>{dealPosture}</b><br />{nextMoveCopy}</p>
          <div className="mini-stats">
            <div><b>{acceptedCount}</b><span>captures</span></div>
            <div><b>{reviewCount}</b><span>review</span></div>
            <div><b>{findings.length}</b><span>findings</span></div>
          </div>
        </aside>
      </section>

      <section className="proof-strip" aria-label="what FarmFax gives buyers">
        <article>
          <span>01</span>
          <b>Guided evidence</b>
          <p>Seven required views beat cherry-picked listing photos: walkaround, serial plate, hours, hydraulics, tires, paint/welds, and engine bay.</p>
        </article>
        <article>
          <span>02</span>
          <b>Photo + sampled video</b>
          <p>Browser checks flag rust-tone, wet/leak signals, paint mismatch, and selected video frames — with visible confidence and limits.</p>
        </article>
        <article>
          <span>03</span>
          <b>Unknowns stay unknown</b>
          <p>Missing or weak evidence lowers confidence instead of letting AI invent a clean answer.</p>
        </article>
        <article>
          <span>04</span>
          <b>Buyer-owned report</b>
          <p>Export JSON/PDF before paying for optional hosted sharing. No data lock-in.</p>
        </article>
      </section>

      <section className="sample-selector panel" aria-label="sample inspection selector">
        <div>
          <span className="section-label">choose a sample inspection</span>
          <h2>Run the story judges need to see.</h2>
          <p className="muted">Use complete, risky, or missing-proof sample data — then replace it with your own phone photos and short videos.</p>
        </div>
        <div className="scenario-switcher" aria-label="sample scenario selector">
          {farmFaxScenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={scenario.id === scenarioState.selectedScenarioId ? 'active' : 'ghost'}
              onClick={() => loadScenario(scenario.id as ScenarioId)}
            >
              <b>{scenario.label}</b>
              <span>{scenario.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="architecture-row architecture-stack" aria-label="demo architecture stack">
        <div className="stack-heading panel"><span>Demo stack</span><p>The farmer sees a clean diligence flow. Judges can see which pieces run now and which sponsor seams are intentionally marked as planned or simulated.</p></div>
        {architectureStack.map((item) => (
          <article className="panel" key={item.name}>
            <span>{item.name}</span>
            <p>{item.line}</p>
          </article>
        ))}
      </section>

      <section className="analysis-layout farm-layout" id="capture">
        <div className="panel capture-panel">
          <div className="section-label">guided evidence capture</div>
          <h2>Seven views that reduce blind spots.</h2>
          <div className="capture-intro-row">
            <p className="muted">Start with photos. Add a short video when motion, sound, smoke, or hydraulics matter. FarmFax samples selected frames; it does not inspect full video.</p>
            <button className="ghost sample-video-button" data-qa="sample-video-button" type="button" onClick={() => void runSampleVideo('hydraulics')} disabled={isSampleVideoLoading}>
              {isSampleVideoLoading ? 'Checking sample…' : 'Try sample video'}
            </button>
          </div>
          <div className="equipment-toggle" aria-label="equipment type">
            {['tractor', 'skid steer', 'trailer', 'implement'].map((type) => (
              <button key={type} className={equipmentType === type ? 'active' : 'ghost'} disabled={type !== 'tractor'} onClick={() => type === 'tractor' && setEquipmentType(type)}>{type}{type !== 'tractor' ? ' soon' : ''}</button>
            ))}
          </div>
          <div className="capture-grid">
            {slots.map((slot) => (
              <article className={`capture-slot ${slot.state}`} key={slot.id}>
                <div>
                  <span>{stateLabel(slot.state)}</span>
                  <h3>{slot.title}</h3>
                  <p>{slot.prompt}</p>
                  <small>{slot.why}</small>
                </div>
                <div className="slot-media-actions">
                  <button className="camera-button" type="button" onClick={() => openCamera(slot)}>Take photo</button>
                  <label>
                    <div className="capture-preview">
                      {slot.image ? (
                        <>
                          <img src={slot.image} alt={`${slot.title} capture`} />
                          {slot.mediaType === 'video' && <span className="video-badge">video sampled</span>}
                        </>
                      ) : <div className="phone-placeholder">Tap to upload photo or video</div>}
                      {slot.analysis && (
                        <div className="heuristic-mask" aria-label="browser-side rust paint leak heuristic overlay">
                          {slot.analysis.cells.map((cell, index) => (
                            <span
                              className={`mask-cell ${cell.kind}`}
                              key={`${cell.kind}-${cell.x}-${cell.y}-${index}`}
                              style={{ left: `${cell.x * 12.5}%`, top: `${cell.y * 16.66}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <input accept="image/*,video/*" capture="environment" type="file" onChange={(event) => updateSlotMedia(slot.id, event)} />
                  </label>
                  {slot.image && !slot.analysis && <small className="analysis-pending">checking image…</small>}
                  {slot.analysis && (
                    <div className="analysis-mini">
                      <b>{slot.mediaType === 'video' ? 'sampled video check' : `${slot.analysis.confidence}% photo check`}</b>
                      <span>rust {slot.analysis.rustPct}%</span>
                      <span>wet {slot.analysis.wetPct}%</span>
                      <span>paint {slot.analysis.paintVariance}/100</span>
                    </div>
                  )}
                  {slot.video && (
                    <div className="video-summary">
                      <b>{slot.video.frameCount} frames checked</b>
                      <span>Frame to review: {slot.video.posterTime.toFixed(1)}s</span>
                      <div className="video-frame-strip" aria-label="sampled video frames">
                        {slot.video.frames.map((frame) => (
                          <img key={`${slot.id}-${frame.time}`} src={frame.image} alt={`${slot.title} sampled at ${frame.time.toFixed(1)} seconds`} />
                        ))}
                      </div>
                      <small>Video check samples selected frames only. It does not inspect every moment.</small>
                    </div>
                  )}
                  {mediaErrors[slot.id] && <small className="media-error">{mediaErrors[slot.id]}</small>}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel vision-panel">
          <div className="section-label">visible condition signals</div>
          <h2>What the submitted media suggests.</h2>
          <div className="overlay-card">
            <div className="tractor-silhouette">
              <span className="hotspot rust">rust</span>
              <span className="hotspot leak">leak?</span>
              <span className="hotspot paint">paint</span>
              <span className="hotspot tire">tread</span>
            </div>
          </div>
          <div className="finding-list">
            {findings.map((finding) => (
              <button key={finding.category} className={`finding-button ${finding.severity} ${selectedFinding.category === finding.category ? 'active' : ''}`} onClick={() => setSelectedFinding(finding)}>
                <b>{finding.category}</b>
                <span>{finding.severity === 'red' ? 'Do not skip this' : finding.severity === 'yellow' ? 'Check this' : 'Looks okay'} · {finding.evidence}</span>
              </button>
            ))}
          </div>
          <article className={`selected-finding ${selectedFinding.severity}`}>
            <span>{selectedFinding.severity} flag</span>
            <h3>{selectedFinding.finding}</h3>
            <p>{selectedFinding.nextStep}</p>
          </article>
        </aside>
      </section>

      <section className="packet-layout" id="catalog">
        <div className="panel catalog-panel">
          <div className="section-label">identity and records</div>
          <h2>Match the machine to the paper trail.</h2>
          <div className="identity-grid">
            <article>
              <span>serial / PIN shown</span>
              <b>{report.serial_number}</b>
              <p>Compare this to the bill of sale, lien/title paperwork, and service records before sending money.</p>
            </article>
            <article>
              <span>hour meter</span>
              <b>{reportSeed.hourMeter == null ? 'Unknown' : `${report.hour_meter.toLocaleString()} hrs`}</b>
              <p>Ask for service records near this hour reading and compare wear in person.</p>
            </article>
            <article>
              <span>external IDs</span>
              <b>dealer stock · auction lot · owner log</b>
              <p>Future adapters can carry OEM, dealer, auction, and owner references without locking the record inside one system.</p>
            </article>
          </div>
          <div className="candidate-list">
            {[report.make_model_guess, ...catalogCandidates.filter((candidate) => `${candidate.make}-${candidate.model}` !== `${report.make_model_guess.make}-${report.make_model_guess.model}`)].map((candidate) => (
              <article key={`${candidate.make}-${candidate.model}`}>
                <div><b>{candidate.make} {candidate.model}</b><span>{candidate.confidence}%</span></div>
                <p>{candidate.family}</p>
                <small>{candidate.basis}</small>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel lock-panel">
          <div className="section-label">buyer-owned record</div>
          <h2>Your report should not live inside a marketplace.</h2>
          <p>
            FarmFax keeps the buyer packet portable. Save PDF or JSON for your mechanic, lender, partner, seller follow-up, or future resale.
            Paid hosting only makes sharing easier; it does not own the machine history.
          </p>
          <ul>
            <li>Save PDF for the deal folder</li>
            <li>Export data for records or resale</li>
            <li>Share questions with seller or mechanic</li>
            <li>Hosted links are optional</li>
          </ul>
        </aside>
      </section>

      <section className="packet-layout" id="report">
        <div className="panel report-panel">
          <div className="section-label">buyer risk report</div>
          <h2>A sharper pre-buy conversation.</h2>
          <div className="report-score">
            <strong>{report.condition_score}</strong>
            <div>
              <b>{report.make_model_guess.make} {report.make_model_guess.model}</b>
              <p>Screening score from submitted media only. FarmFax helps you decide what to ask next; it is not a mechanical inspection, title check, appraisal, warranty, or guarantee.</p>
            </div>
          </div>
          <div className="deal-posture priority-action">
            <span>recommended next step</span>
            <h3>{dealPosture}</h3>
            <p>{nextMoveCopy}</p>
          </div>
          <div className="risk-strip">
            {report.risk_summary.map((risk) => (
              <article className={`risk-card ${risk.severity}`} key={risk.id}>
                <span>{risk.severity} · {risk.score}/100</span>
                <h3>{risk.label}</h3>
                <p>{risk.verdict}</p>
                <small>{risk.evidence}</small>
              </article>
            ))}
          </div>
          <div className="risk-disclosure">FarmFax reviews submitted photos, short videos, and entered details only. It is not a mechanic inspection, title search, theft check, lien check, appraisal, repair estimate, warranty, or guarantee.</div>
          <div className="evidence-strip" data-qa="evidence-summary">
            <b>Evidence checked</b>
            <div>
              {report.visual_analysis.length ? report.visual_analysis.slice(0, 5).map((item) => (
                <span key={item.slot}>{slotTitle(slots, item.slot)} · {item.source === 'video_frame' ? `${item.frameCount} video frames` : `${item.confidence}% photo`}</span>
              )) : <span>No live photo or video checked yet</span>}
              {report.missing_evidence.length > 0 && <span>{report.missing_evidence.length} view{report.missing_evidence.length === 1 ? '' : 's'} still needed</span>}
            </div>
          </div>
          <div className="question-grid">
            {report.buyer_questions.map((question) => (
              <div key={question}><b>ask seller before deposit</b><p>{question}</p></div>
            ))}
          </div>
          <div className="data-disclosures">
            <p><b>Proof still needed:</b> {report.missing_evidence.length ? report.missing_evidence.join(', ') : 'none'}</p>
            <p><b>Your copy:</b> {report.open_record_commitment}</p>
            <p><b>Plain rule:</b> FarmFax reports visible evidence and missing proof. Unknowns stay unknown.</p>
          </div>
          <details className="advanced-details">
            <summary>Show technical details</summary>
            <div className="open-record-preview">
              <div>
                <span>open record JSON preview</span>
                <b>Portable by default</b>
              </div>
              <pre data-qa="report-json-metadata">{JSON.stringify(openRecordPreview, null, 2)}</pre>
            </div>
            <div className="risk-factor-grid">
              {report.risk_summary.filter((risk) => risk.factors.length).slice(0, 4).map((risk) => (
                <article key={`${risk.id}-factors`}>
                  <b>{risk.label} factors</b>
                  {risk.factors.slice(0, 3).map((factor) => (
                    <p key={`${risk.id}-${factor.label}`}>+{factor.points} · {factor.label}: {factor.explanation}</p>
                  ))}
                </article>
              ))}
            </div>
            <div className="analysis-ledger">
              <b>Evidence ledger</b>
              {report.visual_analysis.length ? report.visual_analysis.map((item) => (
                <p key={item.slot}>[{item.slot}] {item.source === 'video_frame' ? `video checked · ${item.summary}` : `photo checked · ${item.summary}`}</p>
              )) : <p>No live slot image analyzed yet. Capture/upload a photo or short video to run the local check.</p>}
            </div>
          </details>
          <div className="hero-actions">
            <button onClick={exportReport}>Download JSON report</button>
            <button className="ghost" onClick={() => window.print()}>Print / save PDF</button>
          </div>
        </div>

        <aside className="panel commerce-panel">
          <div className="section-label">hosted report seam</div>
          <h2>$29</h2>
          <p>Optional hosted report link for a seller, mechanic, lender, or partner. In this demo, checkout is simulated. Your PDF/JSON export stays available without paying.</p>
          <div className="qr-share-block" data-qa="qr-share-block">
            <img src={assetUrl('/farmfax-qr.svg')} alt="QR code for FarmFax demo" data-qa="qr-code" />
            <div>
              <b>View on phone</b>
              <input data-qa="share-url" value={shareUrl} readOnly aria-label="FarmFax public demo URL" />
              <button className="ghost" type="button" onClick={() => void copyShareUrl()}>Copy link</button>
            </div>
          </div>
          <div className="phone-install-card" data-qa="phone-install-card">
            <b>Install as phone app</b>
            <p>iPhone: open in Safari → Share → Add to Home Screen. Android: open in Chrome → Install app / Add to Home screen.</p>
          </div>
          <button onClick={() => setStripeOpen(true)}>Save hosted report</button>
        </aside>
      </section>

      <section className="judge-proof-panel" data-qa="judge-proof-panel">
        <div className="trace-heading">
          <span>Judge proof</span>
          <p>One screen for the live mechanics, the open export, and the limits we refuse to blur.</p>
        </div>
        <div className="judge-proof-grid">
          <article data-qa="judge-proof-item"><b>Browser evidence pass</b><p>Photo heuristics and selected video-frame sampling run in the demo.</p></article>
          <article data-qa="judge-proof-item"><b>Buyer-owned export</b><p>JSON and PDF remain available before any paid hosted link.</p></article>
          <article data-qa="judge-proof-item"><b>Hermes orchestration seam</b><p>Capture → evidence check → report → export / hosted link is the planned route.</p></article>
          <article data-qa="judge-proof-item"><b>Honest sponsor labels</b><p>Nemotron reasoning is planned, Stripe checkout is simulated, and unsupported claims are listed in JSON.</p></article>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => void runJudgeDemo()}>Run judge demo</button>
          <button className="ghost" type="button" onClick={() => void runCompleteSampleInspection()}>Load complete sample</button>
          <button className="ghost" type="button" onClick={exportReport}>Download JSON report</button>
        </div>
      </section>

      <section className="source-trail" data-qa="workflow-trace">
        <div className="trace-heading">
          <span>For judges: demo trace</span>
          <p>Live now, planned next, and where Hermes fits without pretending the prototype is more than it is.</p>
        </div>
        <div className="trace-grid">
          {workflowTrace.map((step) => (
            <article key={step.label} className={`trace-step ${step.status.replaceAll(' ', '-')}`}>
              <span>{step.status}</span>
              <b>{step.label}</b>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {cameraSlot && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="FarmFax phone camera capture">
          <div className="camera-modal">
            <div className="modal-topline"><span>Phone camera capture</span><button className="ghost" onClick={closeCamera}>close</button></div>
            <h2>{cameraSlot.title}</h2>
            <p>{cameraSlot.prompt}</p>
            <div className="camera-frame">
              <video ref={videoRef} playsInline muted autoPlay />
              {isCameraStarting && <div className="camera-status">Starting rear camera…</div>}
              {cameraError && <div className="camera-error">{cameraError}</div>}
            </div>
            <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
            <div className="camera-actions">
              <button onClick={captureFrame} disabled={!!cameraError || isCameraStarting}>Capture evidence photo</button>
              <label className="upload-button">
                Upload photo/video
                <input accept="image/*,video/*" capture="environment" type="file" onChange={(event) => {
                  updateSlotMedia(cameraSlot.id, event)
                  closeCamera()
                }} />
              </label>
            </div>
            <small>Evidence is stored in-browser for the demo. Production signs capture metadata before routing to Hermes/Nemotron.</small>
          </div>
        </div>
      )}

      {stripeOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="stripe-modal">
            <div className="modal-topline"><span>Hosted report demo</span><button className="ghost" onClick={() => setStripeOpen(false)}>close</button></div>
            <div className="stripe-word">FarmFax</div>
            <h2>Save your FarmFax report</h2>
            <p>Free export stays yours. The paid option creates a clean hosted link for seller follow-up, mechanic review, lender sharing, or partner approval. Checkout is simulated in this demo and does not certify the machine.</p>
            <div className="receipt">
              <span>Report</span><b>{report.report_id}</b>
              <span>Price</span><b>$29.00</b>
              <span>Data rights</span><b>Owner-controlled export</b>
              <span>Status</span><b>Demo only</b>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
