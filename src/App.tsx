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

type CaptureSlot = {
  id: SlotId
  title: string
  prompt: string
  why: string
  state: CaptureState
  image?: string
  analysis?: ImageAnalysis
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
  equipment_type: string
  serial_number: string
  hour_meter: number
  make_model_guess: CatalogCandidate
  condition_score: number
  confidence: number
  findings: Finding[]
  visual_analysis: Array<{ slot: SlotId; rustPct: number; wetPct: number; paintVariance: number; confidence: number; summary: string }>
  risk_summary: RiskCard[]
  buyer_questions: string[]
  missing_evidence: string[]
  open_record_commitment: string
  integration_stack: string[]
}

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
    line: 'Multimodal reasoning over captured evidence: defect crops, OCR fields, checklist completeness, and buyer questions.',
  },
  {
    name: 'Hermes',
    line: 'Workflow orchestrator: phone intake → CV/OCR modules → Nemotron report → export/payment/audit trail.',
  },
  {
    name: 'Stripe',
    line: 'Paid hosted report links, review workflow, dealer/shop branding — without holding equipment records hostage.',
  },
]

function stateLabel(state: CaptureState) {
  if (state === 'accepted') return 'accepted'
  if (state === 'review') return 'needs review'
  return 'missing'
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
    { id: 'identity', label: 'Identity / fraud risk', score: identityScore, level: identityLevel, severity: riskSeverity(identityLevel), verdict: identityLevel === 'high' ? 'Identity evidence has serious gaps or conflicts.' : identityLevel === 'medium' ? 'Serial/model cues are plausible, but paperwork match is unverified.' : 'Identity evidence aligns in submitted capture.', evidence: 'serial plate · catalog match · paperwork not checked', buyerAction: 'Compare PIN plate to bill of sale, lien/title paperwork, dealer stock record, and service invoices.', factors: identityFactors },
    { id: 'safety', label: 'Safety / weld / structural', score: safetyScore, level: safetyLevel, severity: riskSeverity(safetyLevel), verdict: safetyLevel === 'high' ? 'Inspect before purchase or operation.' : safetyLevel === 'medium' ? 'Potential safety/repair concerns need closer inspection.' : 'No obvious safety-critical issue in supplied evidence.', evidence: `${redFindings.length} red flag · engine ${engine?.state ?? 'unknown'} · hydraulics ${hydraulics?.state ?? 'unknown'}`, buyerAction: 'Inspect welds, pins, mounts, guards, hoses, loader arms, frame rails, and operator safety equipment.', factors: safetyFactors },
    { id: 'evidence', label: 'Evidence completeness', score: evidenceScore, level: evidenceLevel, severity: riskSeverity(evidenceLevel), verdict: evidenceLevel === 'high' ? 'Major required evidence is missing.' : evidenceLevel === 'medium' ? 'Mostly complete, but important views still need review.' : 'Capture checklist is strong for a pre-purchase screen.', evidence: `${accepted.length}/7 accepted · ${missing.length} missing · ${analyzedCount}/7 CV analyzed`, buyerAction: 'Ask seller for missing or cleaner captures before relying on the report.', factors: evidenceFactors },
    { id: 'hours', label: 'Hour-meter plausibility', score: hourScore, level: hourLevel, severity: riskSeverity(hourLevel), verdict: hourLevel === 'high' ? 'Hour evidence has serious conflicts or missing proof.' : hourLevel === 'medium' ? 'Displayed hours should be reconciled with records and visible wear.' : 'Hour evidence appears usable, pending normal record review.', evidence: `${hourLabel} OCR · service records not supplied`, buyerAction: 'Ask for service invoices, ECU/dealer diagnostics if available, and prior auction/dealer listings.', factors: hourFactors },
    { id: 'leverage', label: 'Negotiation leverage', score: leverageScore, level: leverageLevel, severity: riskSeverity(leverageLevel), verdict: leverageLevel === 'high' ? 'Strong evidence-backed leverage for repair demand or contingency.' : leverageLevel === 'medium' ? 'Moderate leverage from visible issues and unanswered proof.' : 'Limited visible leverage; use report mainly for diligence.', evidence: `${redFindings.length} red · ${yellowFindings.length} yellow · ${missing.length} missing`, buyerAction: 'Use findings to request records, additional captures, inspection contingency, or seller concession — not as an appraisal.', factors: leverageFactors },
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

function App() {
  const [scenarioState, setScenarioState] = useState(() => createScenarioState('risky-tractor'))
  const slots = scenarioState.slots
  const findings = scenarioState.findings
  const reportSeed = scenarioState.reportSeed
  const activeScenario = farmFaxScenarios.find((scenario) => scenario.id === scenarioState.selectedScenarioId) ?? farmFaxScenarios[0]
  const [equipmentType, setEquipmentType] = useState('tractor')
  const [stripeOpen, setStripeOpen] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding>(findings[0])
  const [cameraSlot, setCameraSlot] = useState<CaptureSlot | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRequestRef = useRef(0)

  const acceptedCount = slots.filter((slot) => slot.state === 'accepted').length
  const reviewCount = slots.filter((slot) => slot.state === 'review').length
  const analyzedSlots = slots.filter((slot) => slot.analysis)
  const missing = slots.filter((slot) => slot.state === 'missing')
  const riskSummary = useMemo(() => buildRiskSummary(slots, findings, analyzedSlots.length, reportSeed), [slots, findings, analyzedSlots.length, reportSeed])
  const dealPosture = missing.some((slot) => slot.id === 'serial' || slot.id === 'hours')
    ? 'Do not deposit or travel until seller supplies missing evidence'
    : riskSummary.some((risk) => risk.severity === 'red')
      ? 'Proceed with inspection conditions'
      : riskSummary.some((risk) => risk.severity === 'yellow')
        ? 'Proceed after seller follow-up'
        : 'Proceed with normal diligence'
  const conditionScore = useMemo(() => {
    const penalty = findings.reduce((sum, finding) => sum + severityWeight(finding.severity), 0) + missing.length * 5
    return Math.round(Math.max(0, Math.min(100, reportSeed.conditionScore - penalty * 0.15 + acceptedCount)))
  }, [acceptedCount, findings, missing.length, reportSeed.conditionScore])

  const report: FarmFaxReport = useMemo(() => ({
    report_id: reportSeed.reportId,
    schema_version: 'farmfax.report.v0.1-open',
    equipment_type: reportSeed.equipmentType,
    serial_number: reportSeed.serialNumber,
    hour_meter: reportSeed.hourMeter ?? 0,
    make_model_guess: reportSeed.makeModelGuess,
    condition_score: conditionScore,
    confidence: reportSeed.confidence,
    findings,
    visual_analysis: analyzedSlots.map((slot) => ({
      slot: slot.id,
      rustPct: slot.analysis!.rustPct,
      wetPct: slot.analysis!.wetPct,
      paintVariance: slot.analysis!.paintVariance,
      confidence: slot.analysis!.confidence,
      summary: slot.analysis!.summary,
    })),
    risk_summary: riskSummary,
    buyer_questions: reportSeed.buyerQuestions,
    missing_evidence: missing.map((slot) => slot.title),
    open_record_commitment: reportSeed.openRecordCommitment,
    integration_stack: architectureStack.map((item) => item.name),
  }), [analyzedSlots, conditionScore, findings, missing, reportSeed, riskSummary])

  const openRecordPreview = useMemo(() => ({
    schema: report.schema_version,
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

  async function saveSlotImage(slotId: SlotId, image: string) {
    setScenarioState((current) => scenarioReducer(current, { type: 'replace-slot-image', slotId, image }))
    const analysis = await analyzeImageHeuristics(image)
    setScenarioState((current) => scenarioReducer(current, { type: 'set-slot-analysis', slotId, image, analysis }))
  }

  function updateSlotImage(slotId: SlotId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => saveSlotImage(slotId, String(reader.result))
    reader.readAsDataURL(file)
    event.target.value = ''
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
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
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
        <div><span className="live-dot" /> FarmFax // open equipment record</div>
        <nav>
          <a href="#capture">Phone input</a>
          <a href="#catalog">Serial catalog</a>
          <a href="#report">Report</a>
        </nav>
      </header>

      <section className="hero-card farm-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Carfax for farm equipment — without locked data</p>
          <div className="demo-badge">{activeScenario.demoBadge} · upload/capture photos to override</div>
          <h1>Scan the machine before you buy the story.</h1>
          <p className="lede">
            FarmFax turns a phone walkthrough into an open, evidence-backed condition report for tractors, skid steers,
            trailers, implements, and other working equipment. It cross-references serial/PIN plates, make/model clues,
            visible defects, and maintenance evidence — then exports a portable record the owner controls.
          </p>
          <div className="scenario-switcher" aria-label="sample scenario selector">
            {farmFaxScenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={scenario.id === scenarioState.selectedScenarioId ? 'active' : 'ghost'}
                onClick={() => setScenarioState(createScenarioState(scenario.id as ScenarioId))}
              >
                <b>{scenario.label}</b>
                <span>{scenario.description}</span>
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <button onClick={() => document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth' })}>Run guided inspection</button>
            <button className="ghost" onClick={exportReport}>Export open JSON</button>
          </div>
          <div className="principle-strip">
            <span>Evidence-first</span>
            <span>Open schema</span>
            <span>Repair-friendly</span>
            <span>No data hostage</span>
          </div>
        </div>
        <aside className="summary-card machine-card">
          <span>visible condition</span>
          <strong>{conditionScore}</strong>
          <p>{report.make_model_guess.make} {report.make_model_guess.model} · {reportSeed.hourMeter == null ? 'hours unknown' : `${report.hour_meter.toLocaleString()} hrs`} · report confidence {report.confidence}%</p>
          <div className="mini-stats">
            <div><b>{acceptedCount}</b><span>captures</span></div>
            <div><b>{reviewCount}</b><span>review</span></div>
            <div><b>{findings.length}</b><span>findings</span></div>
          </div>
        </aside>
      </section>

      <section className="architecture-row architecture-stack" aria-label="demo architecture stack">
        <div className="stack-heading panel"><span>Demo architecture stack</span><p>Planned integration roles for hackathon positioning; not a claim of endorsement or production certification.</p></div>
        {architectureStack.map((item) => (
          <article className="panel" key={item.name}>
            <span>{item.name}</span>
            <p>{item.line}</p>
          </article>
        ))}
      </section>

      <section className="analysis-layout farm-layout" id="capture">
        <div className="panel capture-panel">
          <div className="section-label">phone-guided inspection</div>
          <h2>The phone is the input device.</h2>
          <p className="muted">Guided capture is the moat. Better inputs beat hallucinated AI. Uploads below are browser-local in this demo.</p>
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
                  <button className="camera-button" type="button" onClick={() => openCamera(slot)}>Open camera</button>
                  <label>
                    <div className="capture-preview">
                      {slot.image ? <img src={slot.image} alt={`${slot.title} capture`} /> : <div className="phone-placeholder">upload fallback</div>}
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
                    <input accept="image/*" capture="environment" type="file" onChange={(event) => updateSlotImage(slot.id, event)} />
                  </label>
                  {slot.image && !slot.analysis && <small className="analysis-pending">analyzing pixels…</small>}
                  {slot.analysis && (
                    <div className="analysis-mini">
                      <b>{slot.analysis.confidence}% CV</b>
                      <span>rust {slot.analysis.rustPct}%</span>
                      <span>wet {slot.analysis.wetPct}%</span>
                      <span>paint {slot.analysis.paintVariance}/100</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel vision-panel">
          <div className="section-label">browser CV + planned Nemotron layer</div>
          <h2>Evidence, not vibes.</h2>
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
                <span>{finding.confidence}% · {finding.evidence}</span>
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
          <div className="section-label">serial code + visual catalog</div>
          <h2>Cross-reference identity before trusting the listing.</h2>
          <div className="identity-grid">
            <article>
              <span>OCR serial / PIN</span>
              <b>{report.serial_number}</b>
              <p>Plate crop confidence 86%. User confirmation required before report publication.</p>
            </article>
            <article>
              <span>hour meter</span>
              <b>{reportSeed.hourMeter == null ? 'Unknown' : `${report.hour_meter.toLocaleString()} hrs`}</b>
              <p>Dashboard OCR confidence 79%. Ask for service records around this hour mark.</p>
            </article>
            <article>
              <span>external IDs</span>
              <b>dealer stock · auction lot · owner log</b>
              <p>Future adapters preserve OEM/dealer/auction references without locking the record inside one system.</p>
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
          <div className="section-label">anti vendor lock-in</div>
          <h2>Own the machine. Own the history.</h2>
          <p>
            OEM portals, dealer CRMs, auction listings, and shop PDFs trap records in silos. FarmFax uses an open schema:
            owners can export JSON/PDF, mechanics can add documented service events, and paid hosting never becomes data captivity.
          </p>
          <ul>
            <li>Open report schema and scoring rubric</li>
            <li>Portable maintenance + repair events</li>
            <li>Self-hostable core record</li>
            <li>Stripe monetizes workflow, not record access</li>
          </ul>
        </aside>
      </section>

      <section className="packet-layout" id="report">
        <div className="panel report-panel">
          <div className="section-label">consolidated FarmFax report</div>
          <h2>Buyer risk report generated.</h2>
          <div className="report-score">
            <strong>{report.condition_score}</strong>
            <div>
              <b>{report.make_model_guess.make} {report.make_model_guess.model}</b>
              <p>Visible-condition score from submitted evidence. Not a mechanical guarantee, title check, appraisal, or substitute for a qualified inspection.</p>
            </div>
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
          <div className="risk-disclosure">Scores are demo screening heuristics from submitted/sample evidence — not diagnostic, mechanical, legal, title, theft, or appraisal conclusions.</div>
          <div className="deal-posture">
            <span>deal posture</span>
            <h3>{dealPosture}</h3>
            <p>{report.risk_summary.find((risk) => risk.id === 'leverage')?.buyerAction}</p>
          </div>
          <div className="question-grid">
            {report.buyer_questions.map((question) => (
              <div key={question}><b>buyer leverage question</b><p>{question}</p></div>
            ))}
          </div>
          <div className="data-disclosures">
            <p><b>Missing evidence:</b> {report.missing_evidence.length ? report.missing_evidence.join(', ') : 'none'}</p>
            <p><b>Open record:</b> {report.open_record_commitment}</p>
            <p><b>Guardrail:</b> FarmFax reports visible evidence, confidence, and missing proof. Unknowns stay unknown.</p>
          </div>
          <div className="open-record-preview">
            <div>
              <span>open record JSON preview</span>
              <b>Portable by default</b>
            </div>
            <pre>{JSON.stringify(openRecordPreview, null, 2)}</pre>
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
              <p key={item.slot}>[{item.slot}] {item.summary} · confidence {item.confidence}%</p>
            )) : <p>No live slot image analyzed yet. Capture/upload a photo to run the local heuristic pass.</p>}
          </div>
          <div className="hero-actions">
            <button onClick={exportReport}>Download report JSON</button>
            <button className="ghost" onClick={() => window.print()}>Print / save PDF</button>
          </div>
        </div>

        <aside className="panel commerce-panel">
          <div className="section-label">Stripe rail</div>
          <h2>$29</h2>
          <p>Demo checkout for hosted report, seller share link, and dealer/shop branding. Export remains available without paying.</p>
          <button onClick={() => setStripeOpen(true)}>Open Stripe checkout demo</button>
        </aside>
      </section>

      <section className="source-trail">
        <b>audit trail</b>
        <p>[phone] guided capture slots · accepted {acceptedCount}/7 · missing {missing.length}</p>
        <p>[implemented] browser HSV/wet/paint heuristics · analyzed {analyzedSlots.length}/7 slots · masks render over evidence photos</p>
        <p>[planned] Nemotron multimodal reasoning over findings, OCR, missing evidence, and buyer questions</p>
        <p>[planned] Hermes orchestration for capture → detection → catalog → report → export/payment</p>
        <p>[simulated] Stripe workflow payments only; record ownership and export rights stay with the machine owner</p>
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
                Upload fallback
                <input accept="image/*" capture="environment" type="file" onChange={(event) => {
                  updateSlotImage(cameraSlot.id, event)
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
            <div className="modal-topline"><span>Stripe checkout simulation</span><button className="ghost" onClick={() => setStripeOpen(false)}>close</button></div>
            <div className="stripe-word">Stripe</div>
            <h2>Hosted FarmFax report</h2>
            <p>Pay for hosted report link, seller share page, and dealer/shop branding. The underlying equipment record still exports as open JSON/PDF.</p>
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
