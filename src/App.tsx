import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createScenarioState, farmFaxScenarios, scenarioReducer } from './farmfax/scenarios'
import type { ScenarioId, ScenarioReportSeed, ScenarioState } from './farmfax/scenarios'
import './App.css'

const FARMFAX_API_URL = import.meta.env.VITE_FARMFAX_API_URL || 'http://127.0.0.1:8787'

type CaptureState = 'accepted' | 'review' | 'missing' | 'skipped'
type Severity = 'green' | 'yellow' | 'red'
type SlotId = 'walkaround' | 'serial' | 'hours' | 'hydraulics' | 'tires' | 'paint' | 'engine'

type AnalysisCell = { x: number; y: number; kind: 'rust' | 'wet' | 'paint' }

type DetectorModuleResult = {
  name: string
  score: number
  output: string
  challenge: string
}

type ImageAnalysis = {
  rustPct: number
  wetPct: number
  paintVariance: number
  edgeDensity?: number
  textureScore?: number
  ocrReadiness?: number
  wetMaskPct?: number
  colorClusterScore?: number
  safetyChecklistScore?: number
  confidence: number
  cells: AnalysisCell[]
  summary: string
  detectorModules?: DetectorModuleResult[]
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

type DetectorSignal = {
  label: string
  value: string
  status: 'good' | 'review' | 'missing' | 'skipped'
  reason: string
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

type DetectorModuleExport = DetectorModuleResult & {
  slot: SlotId
  slotTitle: string
  risk: 'green' | 'yellow' | 'red'
}

type RunningStatus = 'non_running' | 'not_shown' | 'unknown'

type CustomSessionRecord = {
  session_id: string
  session_name: string
  created_at: string
  saved_at?: string
  tractor_make_entered: string
  tractor_model_entered: string
  recorder_notes: string
}

type CaptureOrderStep = {
  order: number
  slot: SlotId
  title: string
  media_needed: string
  instruction: string
  analysis_reason: string
  status: CaptureState
  steps: string[]
  video_steps: string[]
}

type FarmFaxReport = {
  report_id: string
  schema_version: string
  generated_at: string
  scenario_id: ScenarioId
  report_source: 'submitted_media' | 'preview'
  demo_mode: boolean
  session: CustomSessionRecord
  custom_equipment: {
    make_entered: string
    model_entered: string
    display_name: string
    recorder_notes: string
    input_status: 'entered_by_recorder' | 'not_entered'
    truth_note: string
  }
  capture_order: CaptureOrderStep[]
  media_driven_result: {
    headline: string
    basis: string[]
    next_capture_step: string
    truth_note: string
  }
  equipment_type: string
  serial_number: string
  hour_meter: number | null
  hour_meter_status: 'shown' | 'media_supplied_unknown' | 'unknown'
  running_status: RunningStatus
  running_status_source: string
  make_model_guess: CatalogCandidate
  condition_score: number
  confidence: number
  input_sources: {
    photos: number
    videos: number
    sampled_video_frames: number
    accepted_slots: number
    missing_slots: number
    skipped_slots: number
  }
  submitted_media: {
    supplied_slots: string[]
    missing_slots: string[]
    skipped_slots: string[]
    videos: number
    photos: number
  }
  advice_summary: string[]
  scoring_explanation: string[]
  buy_or_skip_calculator: {
    verdict: 'buy' | 'negotiate' | 'skip'
    label: string
    reason: string
    max_deposit_action: string
  }
  demo_truth: {
    browser_photo_checks: 'implemented'
    browser_video_frame_sampling: 'implemented'
    browser_detector_modules: 'implemented'
    trained_cv_models: 'planned'
    hermes_orchestration: 'planned'
    nemotron_reasoning_layer: 'planned'
    nemotron_reasoning: 'planned'
    stripe_checkout: 'simulated'
    unsupported_claims: string[]
  }
  findings: Finding[]
  visual_analysis: Array<{ slot: SlotId; source: 'photo' | 'video_frame'; rustPct: number; wetPct: number; paintVariance: number; confidence: number; summary: string; frameCount?: number; worstFrameTime?: number }>
  detector_modules: DetectorModuleExport[]
  module_risk_summary: Array<{ module: string; score: number; risk: 'green' | 'yellow' | 'red'; action: string }>
  seller_questions_from_detectors: string[]
  proof_intelligence: {
    'browser_detector_modules: implemented': boolean
    'trained_cv_models: planned': boolean
    'nemotron_reasoning_layer: planned': boolean
    challenge: string
  }
  mechanic_handoff_summary: string[]
  before_deposit_checklist: Array<{ label: string; status: 'done' | 'needs-proof' | 'review'; action: string }>
  risk_summary: RiskCard[]
  buyer_questions: string[]
  missing_evidence: string[]
  open_record_commitment: string
  integration_stack: string[]
  market_context_stats: Array<{ label: string; value: string; source: string; date: string; caveat: string }>
  system_integrations: Array<{ name: string; role: string; status: 'working demo' | 'planned backend seam' | 'simulated commerce seam'; proof: string }>
}

const PUBLIC_DEMO_URL = 'https://primetimeindy.github.io/farmfax-demo/'
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const CUSTOM_SESSION_STORAGE_KEY = 'farmfax.custom.session.v1'
const customSessionId = () => `farmfax-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7)}`
const nowIso = () => new Date().toISOString()


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
    name: 'Hermes workflow',
    role: 'Physical-world workflow orchestration',
    status: 'planned backend seam' as const,
    line: 'Routes capture → evidence check → overclaim challenge → buyer report → export / hosted handoff.',
  },
  {
    name: 'Multimodal reasoning',
    role: 'Photo, OCR-ready, and video-frame inspection path',
    status: 'planned backend seam' as const,
    line: 'Upgrades browser heuristics into GPU-accelerated CV and structured reasoning over photos, serial plates, hour meters, and selected video frames.',
  },
  {
    name: 'Hosted report commerce',
    role: 'Paid trust infrastructure for equipment transactions',
    status: 'simulated commerce seam' as const,
    line: 'Monetizes hosted report links, seller share pages, dealer branding, and expert review while keeping JSON/PDF export buyer-owned.',
  },
]

const marketContextStats = [
  { label: 'Agricultural machinery market', value: '$193B in 2026', source: 'Mordor Intelligence agricultural machinery market estimate', date: '2026', caveat: 'Market-size context only; not a valuation for this tractor.' },
  { label: 'Tractors remain core', value: '35.9% of 2025 machinery value', source: 'Mordor Intelligence type-segment estimate', date: '2025', caveat: 'Category mix, not condition or resale proof.' },
  { label: 'Live resale marketplace proof', value: '8,192 agriculture listings', source: 'IronPlanet agriculture category snapshot', date: 'Jun 2026', caveat: 'Listing count snapshot; inventory changes.' },
  { label: 'Repair access friction', value: '125 sensors in one combine', source: 'U.S. PIRG Deere in the Headlights', date: '2023', caveat: 'Repair-access example; not a claim about this tractor.' },
]

const hourMeterLabel = (hours: number | null) => (hours == null ? 'Unknown' : `${hours.toLocaleString()} hrs`)

function createBlankRealReportState(): ScenarioState {
  const state = createScenarioState('incomplete-seller-listing')
  return {
    ...state,
    findings: [] as Finding[],
    reportSeed: {
      ...state.reportSeed,
      reportId: `ffx-real-report-${new Date().toISOString().slice(0, 10)}`,
      serialNumber: 'UNKNOWN',
      hourMeter: null,
      conditionScore: 76,
      confidence: 0,
      makeModelGuess: {
        ...state.reportSeed.makeModelGuess,
        make: 'Unknown',
        model: 'Tractor',
        confidence: 0,
        basis: 'New real report: model not inferred until recorder enters make/model and supplies serial/decal evidence.',
      },
      buyerQuestions: [] as string[],
      openRecordCommitment: 'Real report generated from submitted photos, video frames, entered details, and missing-proof checks.',
    },
    slots: state.slots.map((slot) => ({ ...slot, state: 'missing' as const, image: undefined, analysis: undefined, video: undefined, mediaType: undefined })),
  }
}

function stateLabel(state: CaptureState) {
  if (state === 'accepted') return 'photo received'
  if (state === 'review') return 'retake recommended'
  if (state === 'skipped') return 'skipped'
  return 'still needed'
}

function slotTitle(slots: CaptureSlot[], slotId: SlotId) {
  return slots.find((slot) => slot.id === slotId)?.title ?? slotId
}

function cellLabel(kind: AnalysisCell['kind']) {
  return kind === 'wet' ? 'leak?' : kind
}

function captureInstruction(slot: CaptureSlot) {
  if (slot.id === 'walkaround') return 'Record first: slow 360° walkaround video, or four photos: front, left, rear, right.'
  if (slot.id === 'serial') return 'Second: move close on the serial/PIN plate; avoid glare and include the full plate plus nearby decals.'
  if (slot.id === 'hours') return 'Third: ignition-on dashboard/hour meter. Hold steady until numbers are readable.'
  if (slot.id === 'hydraulics') return 'Fourth: hoses, cylinders, couplers, wet spots, and ground underneath; add short motion video if possible.'
  if (slot.id === 'tires') return 'Fifth: tire or track tread, sidewall, lugs, cracks, and undercarriage edge at ground level.'
  if (slot.id === 'paint') return 'Sixth: hood, loader arms, welds, frame rails, dents, and repaint/body mismatch zones.'
  return 'Seventh: engine bay and running-status proof. If it does not run, say so plainly and capture visible parts.'
}

function captureMediaNeeded(slotId: SlotId) {
  if (slotId === 'walkaround') return 'video preferred, photos ok'
  if (slotId === 'hydraulics' || slotId === 'engine') return 'photo + short video if possible'
  return 'photo required'
}

function captureStepList(slot: CaptureSlot) {
  if (slot.id === 'walkaround') return ['Stand 8–12 feet back and fit the full tractor in frame.', 'Record a slow clockwise walkaround or take front, left, rear, and right photos.', 'Pause on loader arms, hitch, cab, body panels, and obvious dents or rust.', 'Save this first so FarmFax can anchor the rest of the evidence.']
  if (slot.id === 'serial') return ['Find the serial/PIN plate or stamped ID.', 'Move close enough that the plate fills most of the frame.', 'Avoid glare; include all four plate corners and nearby decals.', 'Retake if the numbers cannot be read on your phone screen.']
  if (slot.id === 'hours') return ['Turn ignition/display on if safe.', 'Center the hour meter and dashboard lights.', 'Hold steady for 2 seconds; avoid reflections on glass.', 'Capture service-warning lights if visible.']
  if (slot.id === 'hydraulics') return ['Start at lift cylinders and hoses.', 'Capture chrome rods, seals, couplers, wet spots, and the ground underneath.', 'If safe, record a short clip while hydraulics move.', 'Retake close-ups where oil, grease, or fresh wiping is visible.']
  if (slot.id === 'tires') return ['Get low to the ground at tire/track height.', 'Fill frame with tread/lugs, sidewall, cracks, and rim edge.', 'Capture both worn and best-looking sides if they differ.', 'Include undercarriage edge where possible.']
  if (slot.id === 'paint') return ['Sweep hood, panels, loader arms, welds, frame rails, and hitch.', 'Pause on color mismatch, overspray, dents, weld repairs, and rust bubbles.', 'Keep lighting even so paint mismatch is not just shadow.', 'Capture any decals that identify model/series.']
  return ['Open or aim into the engine bay only if safe.', 'Capture belts, hoses, battery, filters, guards/covers, leaks, and missing parts.', 'If it runs, record cold start, smoke, idle, and shutdown; if not, state non-running plainly in notes.', 'Do not imply the app inspected hidden mechanical condition.']
}

function videoStepList(slot: CaptureSlot) {
  if (slot.id === 'walkaround') return ['Video target: 20–45 seconds, slow movement, no fast pans.', 'Keep the entire machine visible, then move closer to problem areas.']
  if (slot.id === 'hydraulics') return ['Video target: 5–15 seconds on cylinder/hoses during movement if safe.', 'FarmFax samples frames only; also take still close-ups of leaks.']
  if (slot.id === 'engine') return ['Video target: 10–20 seconds for cold-start/running proof if safe.', 'If non-running, record visible engine bay and explain what is missing or disconnected.']
  return ['Video optional: use a still photo first; short clip can help show context.', 'FarmFax samples selected frames, not every second.']
}

function cameraGuideForSlot(slot: CaptureSlot | null) {
  if (!slot) return { primary: 'Fill frame', detail: 'Center the machine area inside the brackets.' }
  if (slot.id === 'serial') return { primary: 'Fill frame with serial plate', detail: 'Move closer until the PIN fills the guide. Avoid glare and crop all four plate corners.' }
  if (slot.id === 'hours') return { primary: 'Fill frame with hour meter', detail: 'Hold steady on the lit dashboard so the hour reading is readable.' }
  if (slot.id === 'hydraulics') return { primary: 'Fill frame with cylinder + hoses', detail: 'Move closer on wet spots, fittings, and chrome rod surfaces.' }
  if (slot.id === 'tires') return { primary: 'Fill frame with tread + sidewall', detail: 'Hold steady and include tread blocks, sidewall, and undercarriage edge.' }
  if (slot.id === 'engine') return { primary: 'Fill frame with engine bay', detail: 'Capture belts, hoses, filters, leaks, smoke context, and cold-start proof.' }
  return { primary: 'Fill frame with full machine side', detail: 'Hold steady, walk slowly, and keep paint, welds, loader arms, and panels in view.' }
}

function detectorSignalsForSlot(slot: CaptureSlot): DetectorSignal[] {
  if (slot.state === 'skipped') return [{ label: 'Skipped by buyer', value: 'Skipped', status: 'skipped', reason: 'FarmFax can still generate the PDF, but this skipped view lowers confidence and becomes an owner question.' }]
  if (slot.state === 'missing') {
    if (slot.id === 'engine') return [{ label: 'Guard / cover visibility check', value: 'No engine/cold-start media', status: 'missing', reason: 'Missing engine bay proof blocks a basic checklist view of guards, covers, belts, leaks, and smoke context.' }]
    return [{ label: 'Proof missing', value: 'No media', status: 'missing', reason: 'FarmFax cannot inspect what was not captured.' }]
  }
  const analysis = slot.analysis
  if (slot.id === 'tires') return [{ label: 'Tread photo evidence proxy', value: analysis ? `${Math.max(0, 100 - Math.round(analysis.paintVariance * 1.6))}% usable visual-tread proxy` : 'pending', status: analysis && analysis.paintVariance > 42 ? 'review' : 'good', reason: 'Checks whether the tread/sidewall photo is useful for buyer review of wear, cracking, and undercarriage visibility.' }]
  if (slot.id === 'hydraulics') return [{ label: 'Hose / cylinder wetness', value: analysis ? `${analysis.wetPct}% wet signal` : 'pending', status: analysis && analysis.wetPct > 8 ? 'review' : 'good', reason: 'Wet signal near hoses/cylinders can point to seepage, grease, or recent service residue.' }]
  if (slot.id === 'serial') return [{ label: 'Serial plate readability', value: analysis ? `${analysis.confidence}% readable` : 'pending', status: analysis && analysis.confidence < 80 ? 'review' : 'good', reason: 'Readable plate anchors the machine to paperwork and service records.' }]
  if (slot.id === 'hours') return [{ label: 'Hour meter OCR readiness', value: analysis ? `${analysis.confidence}% OCR-ready` : 'pending', status: analysis && analysis.confidence < 80 ? 'review' : 'good', reason: 'Dashboard/hour proof should be readable enough for later OCR or record comparison; no hour extraction is claimed.' }]
  if (slot.id === 'walkaround') return [{ label: 'Rust cluster map', value: analysis ? `${analysis.rustPct}% rust tone` : 'pending', status: analysis && analysis.rustPct > 8 ? 'review' : 'good', reason: 'Clusters rust/corrosion-like pixels around steps, mounts, panels, and loader areas.' }]
  if (slot.id === 'paint') return [{ label: 'Repaint / color mismatch', value: analysis ? `${analysis.paintVariance}/100 variance` : 'pending', status: analysis && analysis.paintVariance > 35 ? 'review' : 'good', reason: 'Color variance can suggest repaint, replaced panels, storm damage, or collision repair.' }]
  if (slot.id === 'engine') return [{ label: 'Guard / cover visibility check', value: 'requires engine/running-status proof', status: 'review', reason: 'Engine bay media plus an honest running/non-running note gives a reviewer a basic view of covers, belts, guards, leaks, and visible omissions.' }]
  return []
}

function detectorPriority(status: DetectorSignal['status']) {
  return status === 'missing' ? 3 : status === 'review' ? 2 : 1
}

function modulesForAnalysis(analysis: ImageAnalysis): DetectorModuleResult[] {
  if (analysis.detectorModules?.length) return analysis.detectorModules
  const edgeDensity = analysis.edgeDensity ?? Math.min(100, Math.round((analysis.confidence - 35) * 0.9))
  const ocrReadiness = analysis.ocrReadiness ?? Math.min(96, Math.max(18, Math.round(analysis.confidence * 0.85 + edgeDensity * 0.3)))
  const textureScore = analysis.textureScore ?? Math.min(100, Math.round(edgeDensity * 1.25))
  const wetMaskPct = analysis.wetMaskPct ?? Math.round(analysis.wetPct * 10) / 10
  const colorClusterScore = analysis.colorClusterScore ?? Math.min(100, Math.round(analysis.paintVariance * 0.9))
  const safetyChecklistScore = analysis.safetyChecklistScore ?? Math.min(100, Math.max(20, Math.round(62 + edgeDensity * 0.45 - analysis.wetPct)))
  return [
    { name: 'OCR readiness module', score: ocrReadiness, output: `${ocrReadiness}% plate/meter readability proxy`, challenge: 'Not text extraction yet: flags whether OCR should be trusted before serial/hour claims.' },
    { name: 'Edge / texture tread module', score: textureScore, output: `${edgeDensity}% high-edge tread/texture signal`, challenge: 'Separates tread-like texture from clean sheet metal; still needs angle-specific tire training data.' },
    { name: 'Wet-mask segmentation module', score: Math.min(100, Math.round(wetMaskPct * 6 + analysis.wetPct * 2)), output: `${wetMaskPct}% glossy-dark wet mask`, challenge: 'Finds wet-looking regions, not fluid type; human review remains required.' },
    { name: 'Color-cluster repaint module', score: colorClusterScore, output: `${analysis.paintVariance}/100 hue variance`, challenge: 'Detects color discontinuity; lighting/shadows can still create false positives.' },
    { name: 'Safety checklist module', score: safetyChecklistScore, output: `${safetyChecklistScore}% visible guard/cover coverage proxy`, challenge: 'Equipment-specific component templates are required before certification.' },
  ]
}

function detectorRisk(module: DetectorModuleResult): DetectorModuleExport['risk'] {
  if (module.name.includes('Wet-mask') && module.score >= 18) return 'red'
  if (module.name.includes('Color-cluster') && module.score >= 35) return 'yellow'
  if (module.name.includes('OCR') && module.score < 72) return 'red'
  if (module.name.includes('Safety') && module.score < 64) return 'yellow'
  if (module.name.includes('Edge') && module.score < 32) return 'yellow'
  return 'green'
}

function detectorAction(module: DetectorModuleResult, risk: DetectorModuleExport['risk']) {
  if (module.name.includes('OCR')) return risk === 'green' ? 'Serial/hour proof is exportable; still ask seller to confirm plate text.' : 'Ask seller for a closer serial/hour-meter photo before trusting identity or hours.'
  if (module.name.includes('Wet-mask')) return risk === 'green' ? 'No strong wet-mask signal in supplied media.' : 'Ask seller for a wiped-clean hose/cylinder close-up and cold-start hydraulic cycle video.'
  if (module.name.includes('Color-cluster')) return risk === 'green' ? 'No major color-cluster anomaly in supplied view.' : 'Ask whether panels were repainted or repaired, with receipts if available.'
  if (module.name.includes('Safety')) return risk === 'green' ? 'Visible guard/cover proof is acceptable for buyer review.' : 'Ask for engine-bay/guard photos before deposit.'
  return risk === 'green' ? 'Texture evidence is acceptable for buyer review.' : 'Ask for close tire/track tread photos at ground level.'
}

function questionFromDetector(item: DetectorModuleExport) {
  if (item.name.includes('OCR')) return `Send a closer serial/hour photo. Current readability proxy: ${item.score}%.`
  if (item.name.includes('Wet-mask')) return `Check hydraulics: ${item.output}. Wipe area, cycle loader, then recheck for fresh wetness.`
  if (item.name.includes('Color-cluster')) return `Ask about repaint or repair. Paint variance: ${item.output}.`
  if (item.name.includes('Safety')) return `Send engine bay/guard photos. Guard/cover coverage proxy: ${item.score}%.`
  return `Send a low-angle tire/tread close-up. Texture score: ${item.score}%.`
}

function realAdviceForMissing(slot: CaptureSlot): Finding {
  const skipped = slot.state === 'skipped'
  const critical = slot.id === 'serial' || slot.id === 'hours' || slot.id === 'engine' || slot.id === 'hydraulics'
  const category = slot.id === 'serial' ? 'Serial/PIN missing'
    : slot.id === 'hours' ? 'Hour meter missing'
      : slot.id === 'engine' ? 'Engine/running proof missing'
        : slot.id === 'hydraulics' ? 'Hydraulics missing'
          : `${slot.title} missing`
  return {
    severity: critical && !skipped ? 'red' : 'yellow',
    category: skipped ? `Skipped: ${slot.title}` : category,
    finding: skipped ? `${slot.title} was skipped, so the PDF lists it as unanswered buyer risk.` : `${slot.title} was not submitted, so this report cannot judge that part of the tractor.`,
    confidence: skipped ? 76 : 96,
    evidence: slot.id,
    nextStep: skipped ? `Ask the owner to supply ${slot.title.toLowerCase()} proof before relying on the score.` : slot.id === 'serial' ? 'Do not send a deposit until serial/PIN is readable and matched to paperwork.'
      : slot.id === 'hours' ? 'Get ignition-on hour-meter proof and compare hours to wear/service records.'
        : slot.id === 'engine' ? 'Get engine bay plus cold-start/running or honest non-running proof before pricing repairs.'
          : slot.id === 'hydraulics' ? 'Get cylinder/hoses/couplers photos; hydraulic leaks are expensive and safety-relevant.'
            : `Capture ${slot.title.toLowerCase()} before relying on condition.`,
  }
}

function buildRealMediaFindings(slots: CaptureSlot[]): Finding[] {
  const findings: Finding[] = []
  for (const slot of slots) {
    const analysis = slot.analysis
    if (slot.state === 'missing' || !analysis) {
      findings.push(realAdviceForMissing(slot))
      continue
    }
    if (analysis.rustPct > 10) findings.push({ severity: 'red', category: 'Rust / corrosion', finding: `${analysis.rustPct}% rust-tone signal in ${slot.title}.`, confidence: analysis.confidence, evidence: slot.id, nextStep: 'Inspect frame rails, loader mounts, step brackets, hitch points, and welds for metal loss; use rust as negotiation leverage.' })
    else if (analysis.rustPct > 4) findings.push({ severity: 'yellow', category: 'Rust / corrosion', finding: `${analysis.rustPct}% rust-tone signal in ${slot.title}.`, confidence: analysis.confidence, evidence: slot.id, nextStep: 'Ask for closer photos after cleaning; check whether rust is surface-only or structural.' })
    if (analysis.wetPct > 10 || (analysis.wetMaskPct ?? 0) > 5) findings.push({ severity: 'red', category: 'Wet / leak signal', finding: `${analysis.wetPct}% dark/wet signal in ${slot.title}.`, confidence: analysis.confidence, evidence: slot.id, nextStep: 'Wipe area clean, run hydraulics/engine, then recheck. Price in possible hoses, seals, fluids, or shop diagnosis.' })
    else if (analysis.wetPct > 4) findings.push({ severity: 'yellow', category: 'Wet / leak signal', finding: `${analysis.wetPct}% wet-looking signal in ${slot.title}.`, confidence: analysis.confidence, evidence: slot.id, nextStep: 'Ask whether this is grease, washing, or an active leak; request a follow-up photo after operation.' })
    if (analysis.paintVariance > 40) findings.push({ severity: 'yellow', category: 'Paint / repair history', finding: `Paint variance ${analysis.paintVariance}/100 in ${slot.title}.`, confidence: analysis.confidence, evidence: slot.id, nextStep: 'Ask about repaint, replaced panels, weld repair, rollover/collision history, or storm damage.' })
    if ((slot.id === 'serial' || slot.id === 'hours') && analysis.confidence < 78) findings.push({ severity: 'red', category: slot.id === 'serial' ? 'Serial readability' : 'Hour meter readability', finding: `${slot.title} is not readable enough for paperwork confidence.`, confidence: analysis.confidence, evidence: slot.id, nextStep: slot.id === 'serial' ? 'Retake straight-on with no glare; match PIN to bill of sale before deposit.' : 'Retake ignition-on dashboard; compare hours with pedals, seat, tires, pins, and service records.' })
    if (slot.id === 'tires' && (analysis.textureScore ?? 100) < 36) findings.push({ severity: 'yellow', category: 'Tire / tread evidence', finding: 'Tire/tread photo does not show enough useful texture detail.', confidence: analysis.confidence, evidence: slot.id, nextStep: 'Get low-angle tread, sidewall cracks, rim, lugs, and undercarriage edge; tire replacement can change the deal price.' })
    if (slot.id === 'engine' && (analysis.safetyChecklistScore ?? 100) < 64) findings.push({ severity: 'yellow', category: 'Engine bay / guards', finding: 'Engine bay view has limited guard/cover/component visibility.', confidence: analysis.confidence, evidence: slot.id, nextStep: 'Capture belts, hoses, battery, filters, guards/covers, leaks, smoke context, and running/non-running proof.' })
  }
  if (!findings.length) {
    findings.push({ severity: 'green', category: 'No major visible issue', finding: 'Submitted media did not show major rust, wet/leak, paint, tire, or identity red flags.', confidence: 82, evidence: 'walkaround', nextStep: 'Still verify serial paperwork, service records, cold start, and in-person operation before money changes hands.' })
  }
  return findings.slice(0, 10)
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
  const skipped = slots.filter((slot) => slot.state === 'skipped')
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
    { id: 'evidence', label: 'Proof supplied', score: evidenceScore, level: evidenceLevel, severity: riskSeverity(evidenceLevel), verdict: evidenceLevel === 'high' ? 'Too little evidence to judge this machine.' : evidenceLevel === 'medium' ? 'Important proof is missing or needs a retake.' : 'Core views are captured.', evidence: `${accepted.length}/7 captures received · ${missing.length} missing · ${skipped.length} skipped · ${analyzedCount}/7 checked`, buyerAction: 'Ask seller for missing or cleaner photos before relying on the report.', factors: evidenceFactors },
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

function emptyAnalysis(summary: string): ImageAnalysis {
  return {
    rustPct: 0,
    wetPct: 0,
    paintVariance: 0,
    edgeDensity: 0,
    textureScore: 0,
    ocrReadiness: 0,
    wetMaskPct: 0,
    colorClusterScore: 0,
    safetyChecklistScore: 0,
    confidence: 0,
    cells: [],
    summary,
    detectorModules: [],
  }
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
        resolve(emptyAnalysis('analysis unavailable'))
        return
      }
      ctx.drawImage(image, 0, 0, width, height)
      const data = ctx.getImageData(0, 0, width, height).data
      let rust = 0
      let wet = 0
      let saturated = 0
      let edgeHits = 0
      let textureEnergy = 0
      let darkGlossyCluster = 0
      const hueByCell = new Map<string, number[]>()
      const flagged = new Map<string, AnalysisCell>()
      const cols = 8
      const rows = 6
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const { h, s, v } = rgbToHsv(r, g, b)
          const rightIdx = (y * width + Math.min(width - 1, x + 2)) * 4
          const downIdx = (Math.min(height - 1, y + 2) * width + x) * 4
          const lum = r * 0.299 + g * 0.587 + b * 0.114
          const lumRight = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114
          const lumDown = data[downIdx] * 0.299 + data[downIdx + 1] * 0.587 + data[downIdx + 2] * 0.114
          const gradient = Math.abs(lum - lumRight) + Math.abs(lum - lumDown)
          textureEnergy += gradient
          if (gradient > 52) edgeHits += 1
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
            if (gradient > 38) darkGlossyCluster += 1
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
      const edgeDensity = Math.round((edgeHits / sampleCount) * 1000) / 10
      const textureScore = Math.min(100, Math.round((textureEnergy / sampleCount / 80) * 100))
      const ocrReadiness = Math.min(96, Math.max(18, Math.round(38 + edgeDensity * 1.3 + (100 - paintVariance) * 0.22)))
      const wetMaskPct = Math.round((darkGlossyCluster / sampleCount) * 1000) / 10
      const colorClusterScore = Math.min(100, Math.round(paintVariance * 0.72 + cellMeans.length * 1.8))
      const safetyChecklistScore = Math.min(100, Math.max(20, Math.round(52 + edgeDensity * 1.1 - wetPct * 0.7)))
      const confidence = Math.min(94, Math.max(38, Math.round(42 + rustPct * 1.2 + wetPct + paintVariance * 0.25 + edgeDensity * 0.4)))
      const detectorModules: DetectorModuleResult[] = [
        { name: 'OCR readiness module', score: ocrReadiness, output: `${ocrReadiness}% plate/meter readability proxy`, challenge: 'Not text extraction yet: flags whether OCR should be trusted before serial/hour claims.' },
        { name: 'Edge / texture tread module', score: textureScore, output: `${edgeDensity}% high-edge tread/texture signal`, challenge: 'Separates tread-like texture from clean sheet metal; still needs angle-specific tire training data.' },
        { name: 'Wet-mask segmentation module', score: Math.min(100, Math.round(wetMaskPct * 6 + wetPct * 2)), output: `${wetMaskPct}% glossy-dark wet mask`, challenge: 'Finds wet-looking regions, not fluid type; human review remains required.' },
        { name: 'Color-cluster repaint module', score: colorClusterScore, output: `${paintVariance}/100 hue variance`, challenge: 'Detects color discontinuity; lighting/shadows can still create false positives.' },
        { name: 'Safety checklist module', score: safetyChecklistScore, output: `${safetyChecklistScore}% visible guard/cover coverage proxy`, challenge: 'Equipment-specific component templates are required before certification.' },
      ]
      const summary = [
        rustPct > 2 ? `${rustPct}% rust-tone pixels` : 'low rust-tone signal',
        wetPct > 5 ? `${wetPct}% dark/wet signal` : 'low leak-tone signal',
        paintVariance > 30 ? `paint variance ${paintVariance}/100` : 'paint variance low',
        `edge density ${edgeDensity}%`,
      ].join(' · ')
      resolve({ rustPct, wetPct, paintVariance, edgeDensity, textureScore, ocrReadiness, wetMaskPct, colorClusterScore, safetyChecklistScore, confidence, cells: Array.from(flagged.values()).slice(0, 28), summary, detectorModules })
    }
    image.onerror = () => resolve(emptyAnalysis('image could not be analyzed'))
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
  const [scenarioState, setScenarioState] = useState(() => createBlankRealReportState())
  const [reportGenerated, setReportGenerated] = useState(false)
  const slots = scenarioState.slots
  const realMediaFindings = useMemo(() => buildRealMediaFindings(slots), [slots])
  const findings = realMediaFindings
  const reportSeed = scenarioState.reportSeed
  const [equipmentType, setEquipmentType] = useState('tractor')
  const [customSessionIdValue, setCustomSessionIdValue] = useState(() => customSessionId())
  const [customSessionName, setCustomSessionName] = useState('Real tractor recording session')
  const [customSessionCreatedAt, setCustomSessionCreatedAt] = useState(() => nowIso())
  const [customSessionSavedAt, setCustomSessionSavedAt] = useState('')
  const [tractorMake, setTractorMake] = useState('')
  const [tractorModel, setTractorModel] = useState('')
  const [tractorNotes, setTractorNotes] = useState('')
  const [sessionStatus, setSessionStatus] = useState('')
  const [stripeOpen, setStripeOpen] = useState(false)
  const [isSampleVideoLoading, setIsSampleVideoLoading] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding>(findings[0])
  const [cameraSlot, setCameraSlot] = useState<CaptureSlot | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const cameraRequestRef = useRef(0)
  const [guidedCaptureActive, setGuidedCaptureActive] = useState(false)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
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
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')

  const acceptedCount = slots.filter((slot) => slot.state === 'accepted').length
  const reviewCount = slots.filter((slot) => slot.state === 'review').length
  const analyzedSlots = slots.filter((slot) => slot.analysis)
  const missing = slots.filter((slot) => slot.state === 'missing')
  const skipped = slots.filter((slot) => slot.state === 'skipped')
  const videoSourceCount = slots.filter((slot) => slot.mediaType === 'video').length
  const enteredEquipmentName = [tractorMake.trim(), tractorModel.trim()].filter(Boolean).join(' ')
  const reportDisplayName = enteredEquipmentName || `${reportSeed.makeModelGuess.make} ${reportSeed.makeModelGuess.model}`
  const customSession = useMemo<CustomSessionRecord>(() => ({
    session_id: customSessionIdValue,
    session_name: customSessionName.trim() || 'Untitled FarmFax session',
    created_at: customSessionCreatedAt,
    saved_at: customSessionSavedAt || undefined,
    tractor_make_entered: tractorMake.trim(),
    tractor_model_entered: tractorModel.trim(),
    recorder_notes: tractorNotes.trim(),
  }), [customSessionCreatedAt, customSessionIdValue, customSessionName, customSessionSavedAt, tractorMake, tractorModel, tractorNotes])
  const captureOrder = useMemo<CaptureOrderStep[]>(() => slots.map((slot, index) => ({
    order: index + 1,
    slot: slot.id,
    title: slot.title,
    media_needed: captureMediaNeeded(slot.id),
    instruction: captureInstruction(slot),
    analysis_reason: slot.why,
    status: slot.state,
    steps: captureStepList(slot),
    video_steps: videoStepList(slot),
  })), [slots])
  const photoSourceCount = analyzedSlots.filter((slot) => slot.mediaType !== 'video').length
  const sampledFrameCount = slots.reduce((sum, slot) => sum + (slot.video?.frameCount ?? 0), 0)
  const scanReadiness = Math.round(((acceptedCount + reviewCount * 0.55 + skipped.length * 0.2) / slots.length) * 100)
  const highestRiskFinding = findings.find((finding) => finding.severity === 'red') ?? findings.find((finding) => finding.severity === 'yellow') ?? findings[0]
  const scanMode = missing.length ? 'Evidence missing' : reviewCount ? 'Human review needed' : 'Ready for buyer report'
  const scanFocus = highestRiskFinding ? slotTitle(slots, highestRiskFinding.evidence) : 'Walkaround'
  const analysisSlot = useMemo(() => (
    slots.find((slot) => slot.id === selectedFinding.evidence && slot.image && slot.analysis)
    ?? slots.find((slot) => slot.image && slot.analysis && slot.state === 'review')
    ?? slots.find((slot) => slot.image && slot.analysis)
  ), [slots, selectedFinding.evidence])
  const overlayCells = analysisSlot?.analysis?.cells.length
    ? analysisSlot.analysis.cells.slice(0, 5)
    : [
        { x: 2, y: 3, kind: 'rust' as const },
        { x: 5, y: 2, kind: 'paint' as const },
        { x: 6, y: 4, kind: 'wet' as const },
      ]
  const zoneChecklist = useMemo(() => ([
    { label: 'Exterior', ids: ['walkaround', 'paint'] as SlotId[] },
    { label: 'Cab / dashboard', ids: ['serial', 'hours'] as SlotId[] },
    { label: 'Hydraulics', ids: ['hydraulics'] as SlotId[] },
    { label: 'Tires / tracks', ids: ['tires'] as SlotId[] },
    { label: 'Engine bay / running proof', ids: ['engine'] as SlotId[] },
  ].map((zone) => {
    const zoneSlots = zone.ids.map((id) => slots.find((slot) => slot.id === id)).filter(Boolean) as CaptureSlot[]
    const status = zoneSlots.some((slot) => slot.state === 'missing') ? 'missing' : zoneSlots.some((slot) => slot.state === 'skipped') ? 'skipped' : zoneSlots.some((slot) => slot.state === 'review') ? 'review' : 'received'
    return { ...zone, status, count: zoneSlots.filter((slot) => slot.state !== 'missing').length, total: zoneSlots.length }
  })), [slots])
  const baseSellerQuestionPreview = (reportGenerated ? realMediaFindings.map((finding) => finding.nextStep) : reportSeed.buyerQuestions).slice(0, 3)
  const missingProofPreview = missing.slice(0, 3)
  const guideCopy = cameraGuideForSlot(cameraSlot)
  const specificDetectorSignals = useMemo(() => slots
    .flatMap((slot) => detectorSignalsForSlot(slot).map((signal) => ({ ...signal, slot })))
    .sort((a, b) => detectorPriority(b.status) - detectorPriority(a.status))
    .slice(0, 7), [slots])
  const detectorModuleExports = useMemo<DetectorModuleExport[]>(() => slots
    .flatMap((slot) => {
      const analysis = slot.analysis as ImageAnalysis | undefined
      if (!analysis) return []
      return modulesForAnalysis(analysis).map((module) => {
        const risk = detectorRisk(module)
        return { ...module, slot: slot.id, slotTitle: slot.title, risk }
      })
    }), [slots])
  const detectorModuleRollup = useMemo(() => detectorModuleExports.slice(0, 10), [detectorModuleExports])
  const moduleRiskSummary = useMemo(() => detectorModuleExports
    .filter((module) => module.risk !== 'green')
    .slice(0, 6)
    .map((module) => ({ module: module.name, score: module.score, risk: module.risk, action: detectorAction(module, module.risk) })), [detectorModuleExports])
  const detectorQuestions = useMemo(() => detectorModuleExports
    .filter((module) => module.risk !== 'green')
    .slice(0, 5)
    .map(questionFromDetector), [detectorModuleExports])
  const sellerQuestionPreview = [...baseSellerQuestionPreview, ...detectorQuestions].slice(0, 3)
  const riskSummary = useMemo(() => buildRiskSummary(slots, findings, analyzedSlots.length, reportSeed), [slots, findings, analyzedSlots.length, reportSeed])
  const dealPosture = [...missing, ...skipped].some((slot) => slot.id === 'serial' || slot.id === 'hours')
    ? 'Do not send money yet'
    : riskSummary.some((risk) => risk.severity === 'red')
      ? 'Inspect before any deposit'
      : riskSummary.some((risk) => risk.severity === 'yellow')
        ? 'Ask seller for proof first'
        : 'Looks worth a call'
  const nextMoveCopy = [...missing, ...skipped].some((slot) => slot.id === 'serial' || slot.id === 'hours')
    ? 'Get serial/PIN and hour-meter proof before deposit. Skips are allowed, but they count against the buy/skip score.'
    : riskSummary.some((risk) => risk.id === 'safety' && risk.severity === 'red')
      ? 'Have the leak, weld, frame, and engine evidence inspected before any deposit. Use the questions below to slow the deal down.'
      : riskSummary.some((risk) => risk.severity === 'yellow')
        ? 'The packet is usable, but ask for the missing or cleaner photos before you rely on the listing.'
        : 'Photos look complete enough for a seller call. Still match serial paperwork and service records before paying.'
  const nextMissingStep = captureOrder.find((step) => step.status === 'missing') ?? captureOrder.find((step) => step.status === 'review')
  const mediaDrivenResult = useMemo(() => ({
    headline: `${dealPosture}: ${nextMoveCopy}`,
    basis: [
      `${acceptedCount} accepted capture${acceptedCount === 1 ? '' : 's'}, ${reviewCount} review item${reviewCount === 1 ? '' : 's'}, ${missing.length} missing view${missing.length === 1 ? '' : 's'}`,
      `${moduleRiskSummary.length} detector follow-up${moduleRiskSummary.length === 1 ? '' : 's'} from submitted media`,
      `${reportDisplayName} is the report subject; entered make/model still needs serial/PIN and paperwork confirmation`,
      highestRiskFinding ? `Top visible finding: ${highestRiskFinding.category} — ${highestRiskFinding.finding}` : 'No visible finding selected yet',
    ],
    next_capture_step: nextMissingStep ? `${nextMissingStep.order}. ${nextMissingStep.title}: ${nextMissingStep.instruction}` : 'All required capture slots have media; review seller questions and export the report.',
    truth_note: 'FarmFax changes the report based on uploaded photos, sampled video frames, missing views, and entered tractor details. It does not certify hidden condition.',
  }), [acceptedCount, dealPosture, highestRiskFinding, missing.length, moduleRiskSummary.length, nextMissingStep, nextMoveCopy, reportDisplayName, reviewCount])

  const mechanicHandoffSummary = useMemo(() => [
    `${reportSeed.makeModelGuess.make} ${reportSeed.makeModelGuess.model} · ${reportSeed.hourMeter == null ? 'hour meter unknown' : `${reportSeed.hourMeter.toLocaleString()} hrs`} · serial/PIN ${reportSeed.serialNumber}`,
    `Top buyer concern: ${highestRiskFinding.category} — ${highestRiskFinding.finding}`,
    moduleRiskSummary[0] ? `Detector follow-up: ${moduleRiskSummary[0].action}` : 'Detector follow-up: no module risk above green in supplied media.',
    `Missing proof: ${missing.length ? missing.map((slot) => slot.title).join(', ') : 'none in required checklist'}`,
    'Trust challenge: export is useful only if a buyer can hand it to the seller or mechanic.',
  ], [highestRiskFinding.category, highestRiskFinding.finding, missing, moduleRiskSummary, reportSeed.hourMeter, reportSeed.makeModelGuess.make, reportSeed.makeModelGuess.model, reportSeed.serialNumber])
  const beforeDepositChecklist = useMemo(() => [
    { label: 'Match serial/PIN to paperwork', status: missing.some((slot) => slot.id === 'serial') ? 'needs-proof' as const : 'done' as const, action: missing.some((slot) => slot.id === 'serial') ? 'Get a straight-on serial plate photo before deposit.' : 'Compare serial/PIN against bill of sale and lien/title records.' },
    { label: 'Verify hour meter against wear', status: missing.some((slot) => slot.id === 'hours') ? 'needs-proof' as const : 'review' as const, action: missing.some((slot) => slot.id === 'hours') ? 'Get hour meter photo before scheduling pickup.' : 'Ask mechanic to compare hour reading with pedals, tires/tracks, pins, and seat wear.' },
    { label: 'Resolve detector module flags', status: moduleRiskSummary.length ? 'review' as const : 'done' as const, action: moduleRiskSummary[0]?.action ?? 'No detector module requires extra proof before the seller call.' },
    { label: 'Send seller questions', status: detectorQuestions.length ? 'review' as const : 'done' as const, action: detectorQuestions.length ? 'Copy generated questions and require answers/photos before sending money.' : 'Use baseline seller questions before inspection.' },
  ], [detectorQuestions.length, missing, moduleRiskSummary])
  const conditionScore = useMemo(() => {
    const missingPenalty = missing.length * 3
    const skippedPenalty = skipped.length * 5
    const reviewPenalty = reviewCount * 4
    const findingPenalty = findings.reduce((sum, finding) => sum + (finding.severity === 'red' ? 8 : finding.severity === 'yellow' ? 4 : -2), 0)
    const detectorPenalty = moduleRiskSummary.reduce((sum, module) => sum + (module.risk === 'red' ? 8 : module.risk === 'yellow' ? 4 : 0), 0)
    const mediaBonus = Math.min(12, analyzedSlots.length * 2 + sampledFrameCount)
    return Math.round(Math.max(0, Math.min(100, 96 - missingPenalty - skippedPenalty - reviewPenalty - findingPenalty - detectorPenalty + mediaBonus)))
  }, [analyzedSlots.length, findings, missing.length, moduleRiskSummary, reviewCount, sampledFrameCount, skipped.length])
  const runningStatus: RunningStatus = slots.find((slot) => slot.id === 'engine')?.state === 'missing' ? 'not_shown' : 'unknown'
  const runningStatusSource = runningStatus === 'not_shown' ? 'engine/running proof missing' : 'engine bay media supplied; running not proven'
  const serialSlot = slots.find((slot) => slot.id === 'serial')
  const hoursSlot = slots.find((slot) => slot.id === 'hours')
  const reportConfidence = Math.max(18, Math.min(90, Math.round(acceptedCount * 8 + analyzedSlots.length * 5 + sampledFrameCount - missing.length * 7 - skipped.length * 5 - reviewCount * 4)))
  const submittedIdentity: CatalogCandidate = useMemo(() => ({
    make: tractorMake.trim() || 'Recorder-entered',
    model: tractorModel.trim() || 'Unknown model',
    family: 'tractor',
    confidence: serialSlot?.state === 'missing' ? 35 : 62,
    basis: 'Make/model entered by recorder; serial/PIN and paperwork match still required.',
  }), [serialSlot?.state, tractorMake, tractorModel])
  const reportAdviceSummary = useMemo(() => [dealPosture, ...findings.map((finding) => finding.nextStep), ...moduleRiskSummary.map((module) => module.action)].filter(Boolean).slice(0, 5), [dealPosture, findings, moduleRiskSummary])
  const scoringExplanation = useMemo(() => [
    `Base 96`,
    `-${missing.length * 3} missing evidence`,
    `-${skipped.length * 5} skipped evidence`,
    `-${reviewCount * 4} retake/review`,
    `+${Math.min(12, analyzedSlots.length * 2 + sampledFrameCount)} submitted-media bonus`,
  ], [analyzedSlots.length, missing.length, reviewCount, sampledFrameCount, skipped.length])
  const buySkipCalculator = useMemo(() => {
    const criticalGap = [...missing, ...skipped].some((slot) => slot.id === 'serial' || slot.id === 'hours')
    if (criticalGap || conditionScore < 45) return { verdict: 'skip' as const, label: 'SKIP / NO DEPOSIT', reason: 'Identity or hour proof is missing/skipped, or score is too low for a safe remote buy.', max_deposit_action: '$0 until proof is supplied' }
    if (conditionScore < 72 || riskSummary.some((risk) => risk.severity === 'red')) return { verdict: 'negotiate' as const, label: 'NEGOTIATE / INSPECT', reason: 'There is enough evidence to continue, but repair or proof gaps should lower price or require mechanic review.', max_deposit_action: 'Refundable deposit only after seller answers questions' }
    return { verdict: 'buy' as const, label: 'BUY CANDIDATE', reason: 'Core media is supplied and no red proof gate is active. Still verify paperwork and records.', max_deposit_action: 'Proceed only after paperwork match' }
  }, [conditionScore, missing, riskSummary, skipped])

  const report: FarmFaxReport = useMemo(() => ({
    report_id: reportGenerated ? customSession.session_id : reportSeed.reportId,
    schema_version: 'farmfax.report.v0.1-open',
    generated_at: new Date().toISOString(),
    scenario_id: scenarioState.selectedScenarioId,
    report_source: reportGenerated ? 'submitted_media' : 'preview',
    demo_mode: !reportGenerated,
    session: customSession,
    custom_equipment: {
      make_entered: tractorMake.trim(),
      model_entered: tractorModel.trim(),
      display_name: reportDisplayName,
      recorder_notes: tractorNotes.trim(),
      input_status: enteredEquipmentName ? 'entered_by_recorder' : 'not_entered',
      truth_note: enteredEquipmentName ? 'Make/model was entered by the recorder and still needs serial/PIN and paperwork confirmation.' : 'No custom make/model entered; report shows scenario/catalog guess only.',
    },
    capture_order: captureOrder,
    media_driven_result: mediaDrivenResult,
    equipment_type: reportSeed.equipmentType,
    serial_number: serialSlot?.state === 'missing' ? 'UNKNOWN' : 'MEDIA_SUPPLIED_NOT_OCR_VERIFIED',
    hour_meter: null,
    hour_meter_status: hoursSlot?.state === 'missing' ? 'unknown' : 'media_supplied_unknown',
    running_status: runningStatus,
    running_status_source: runningStatusSource,
    make_model_guess: enteredEquipmentName ? submittedIdentity : reportSeed.makeModelGuess,
    condition_score: conditionScore,
    confidence: reportConfidence,
    input_sources: {
      photos: photoSourceCount,
      videos: videoSourceCount,
      sampled_video_frames: sampledFrameCount,
      accepted_slots: acceptedCount,
      missing_slots: missing.length,
      skipped_slots: skipped.length,
    },
    submitted_media: {
      supplied_slots: slots.filter((slot) => slot.state !== 'missing').map((slot) => slot.title),
      missing_slots: missing.map((slot) => slot.title),
      skipped_slots: skipped.map((slot) => slot.title),
      videos: videoSourceCount,
      photos: photoSourceCount,
    },
    advice_summary: reportAdviceSummary,
    scoring_explanation: scoringExplanation,
    buy_or_skip_calculator: buySkipCalculator,
    demo_truth: {
      browser_photo_checks: 'implemented',
      browser_video_frame_sampling: 'implemented',
      browser_detector_modules: 'implemented',
      trained_cv_models: 'planned',
      hermes_orchestration: 'planned',
      nemotron_reasoning_layer: 'planned',
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
    detector_modules: detectorModuleExports,
    module_risk_summary: moduleRiskSummary,
    seller_questions_from_detectors: detectorQuestions,
    proof_intelligence: {
      'browser_detector_modules: implemented': true,
      'trained_cv_models: planned': true,
      'nemotron_reasoning_layer: planned': true,
      challenge: 'Detector module outputs are exported as buyer decision support, not as mechanical certification.',
    },
    mechanic_handoff_summary: mechanicHandoffSummary,
    before_deposit_checklist: beforeDepositChecklist,
    risk_summary: riskSummary,
    buyer_questions: [...findings.map((finding) => finding.nextStep), ...detectorQuestions].slice(0, 8),
    missing_evidence: [...missing.map((slot) => slot.title), ...skipped.map((slot) => `${slot.title} (skipped)`)],
    open_record_commitment: 'Real report generated from submitted media and missing-proof checks; buyer owns the export.',
    integration_stack: architectureStack.map((item) => item.name),
    market_context_stats: marketContextStats,
    system_integrations: architectureStack.map((item) => ({
      name: item.name,
      role: item.role,
      status: item.status,
      proof: item.line,
    })),
  }), [acceptedCount, analyzedSlots, beforeDepositChecklist, captureOrder, conditionScore, customSession, detectorModuleExports, detectorQuestions, enteredEquipmentName, findings, mechanicHandoffSummary, mediaDrivenResult, missing, moduleRiskSummary, photoSourceCount, buySkipCalculator, reportAdviceSummary, reportConfidence, scoringExplanation, reportDisplayName, reportGenerated, reportSeed, runningStatus, runningStatusSource, sampledFrameCount, scenarioState.selectedScenarioId, serialSlot?.state, hoursSlot?.state, slots, submittedIdentity, riskSummary, tractorMake, tractorModel, tractorNotes, videoSourceCount, skipped])

  const openRecordPreview = useMemo(() => ({
    schema: report.schema_version,
    generated_at: report.generated_at,
    scenario_id: report.scenario_id,
    demo_mode: report.demo_mode,
    report_source: report.report_source,
    session: report.session,
    custom_equipment: report.custom_equipment,
    capture_order: report.capture_order,
    report_generated: reportGenerated,
    media_driven_result: report.media_driven_result,
    input_sources: report.input_sources,
    submitted_media: report.submitted_media,
    advice_summary: report.advice_summary,
    scoring_explanation: report.scoring_explanation,
    buy_or_skip_calculator: report.buy_or_skip_calculator,
    demo_truth: report.demo_truth,
    equipment_identity: {
      type: report.equipment_type,
      serial_pin: report.serial_number,
      make_model_entered: report.custom_equipment.display_name,
      make_model_guess: `${report.make_model_guess.make} ${report.make_model_guess.model}`,
      make_model_truth_note: report.custom_equipment.truth_note,
      hour_meter: report.hour_meter,
      hour_meter_status: report.hour_meter_status,
      running_status: report.running_status,
      running_status_source: report.running_status_source,
    },
    evidence: report.visual_analysis.length ? report.visual_analysis.map((item) => ({ slot: item.slot, summary: item.summary, confidence: item.confidence })) : slots.map((slot) => ({ slot: slot.id, state: slot.state, has_image: Boolean(slot.image) })),
    detector_modules: report.detector_modules.map((module) => ({ slot: module.slot, module: module.name, score: module.score, risk: module.risk, output: module.output })),
    module_risk_summary: report.module_risk_summary,
    seller_questions_from_detectors: report.seller_questions_from_detectors,
    proof_intelligence: report.proof_intelligence,
    market_context_stats: report.market_context_stats,
    system_integrations: report.system_integrations,
    mechanic_handoff_summary: report.mechanic_handoff_summary,
    before_deposit_checklist: report.before_deposit_checklist,
    risk_summary: report.risk_summary.map((risk) => ({ id: risk.id, score: risk.score, level: risk.level, action: risk.buyerAction })),
    portability: 'Core record exports as JSON/PDF; paid hosting does not own the equipment history.',
  }), [report, reportGenerated, slots])

  const workflowTrace = useMemo(() => [
    {
      status: 'working demo',
      label: '7-view capture checklist',
      detail: `${acceptedCount}/7 accepted · ${reviewCount} review · ${missing.length} missing · ${skipped.length} skipped`,
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
      label: 'Multimodal evidence reasoning',
      detail: 'Turns submitted evidence, OCR-ready proof, missing proof, and findings into plain buyer questions.',
    },
    {
      status: 'planned',
      label: 'Hermes workflow routing',
      detail: 'Routes capture → evidence check → report → export / hosted link.',
    },
    {
      status: 'simulated',
      label: 'Hosted report checkout',
      detail: 'Payment screen only; free JSON/PDF export stays with the owner.',
    },
  ], [acceptedCount, analyzedSlots.length, missing.length, report.buyer_questions.length, report.risk_summary, reviewCount, videoSourceCount, skipped])

  const shareUrl = PUBLIC_DEMO_URL

  function nextNeededSlot(currentSlots = slots) {
    return currentSlots.find((slot) => slot.state === 'missing') ?? currentSlots.find((slot) => slot.state === 'review') ?? null
  }

  function startGuidedCameraCapture() {
    setGuidedCaptureActive(true)
    setReportGenerated(false)
    const slot = nextNeededSlot()
    if (slot) void openCamera(slot)
    else {
      setSessionStatus('all required slots have media — generate the scored report')
      window.setTimeout(() => setSessionStatus(''), 2400)
    }
  }

  function continueGuidedCapture(completedSlotId?: SlotId) {
    if (!guidedCaptureActive) return
    window.setTimeout(() => {
      const remaining = slots.filter((slot) => slot.id !== completedSlotId)
      const next = nextNeededSlot(remaining)
      if (next) void openCamera(next)
      else {
        setGuidedCaptureActive(false)
        setSessionStatus('capture sequence complete — generate scored report')
        window.setTimeout(() => setSessionStatus(''), 2600)
        document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 450)
  }

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
    setReportGenerated(false)
    setScenarioState((current) => scenarioReducer(current, { type: 'replace-slot-image', slotId, image, mediaType: 'image' }))
    const analysis = await analyzeImageHeuristics(image)
    if (!isCurrentUpload(slotId, requestId)) return
    setScenarioState((current) => scenarioReducer(current, { type: 'set-slot-analysis', slotId, image, analysis, mediaType: 'image' }))
    continueGuidedCapture(slotId)
  }

  async function saveSlotVideo(slotId: SlotId, file: File, requestId: number) {
    try {
      const { poster, video } = await analyzeVideoFile(file)
      if (!isCurrentUpload(slotId, requestId)) return
      setReportGenerated(false)
      setScenarioState((current) => scenarioReducer(current, {
        type: 'replace-slot-image',
        slotId,
        image: poster,
        analysis: video.aggregate,
        mediaType: 'video',
        video,
      }))
      continueGuidedCapture(slotId)
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

  function skipSlot(slotId: SlotId) {
    stopCamera()
    setReportGenerated(false)
    setScenarioState((current) => scenarioReducer(current, { type: 'mark-slot-skipped', slotId }))
    setSessionStatus('slot skipped — PDF will list it as missing proof')
    window.setTimeout(() => setSessionStatus(''), 2200)
    continueGuidedCapture(slotId)
  }

  function generatePdfReport() {
    saveCustomSession()
    setReportGenerated(true)
    document.body.classList.add('pdf-print-mode')
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => document.body.classList.remove('pdf-print-mode'), 1200)
    }, 120)
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
    setReportGenerated(false)
    setScenarioState(createScenarioState(scenarioId))
  }

  function stopCamera() {
    cameraRequestRef.current += 1
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
    setIsRecordingVideo(false)
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

  function startVideoRecording() {
    if (!cameraSlot || !streamRef.current || isRecordingVideo) return
    if (typeof MediaRecorder === 'undefined') {
      setCameraError('Video recording is unavailable in this browser. Use Upload photo/video instead.')
      return
    }
    recordedChunksRef.current = []
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : undefined })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' })
        recordedChunksRef.current = []
        setIsRecordingVideo(false)
        if (!cameraSlot || !blob.size) return
        const requestId = nextUploadRequest(cameraSlot.id)
        const file = new File([blob], `${cameraSlot.id}-farmfax-video.webm`, { type: blob.type || 'video/webm' })
        void saveSlotVideo(cameraSlot.id, file, requestId)
        closeCamera()
      }
      recorder.start()
      setIsRecordingVideo(true)
    } catch {
      setCameraError('Could not start video recording. Use Upload photo/video instead.')
    }
  }

  function stopVideoRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
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

  function startNewReportFlow() {
    newCustomSession()
    window.setTimeout(() => document.getElementById('custom-session')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function generateCustomReport() {
    saveCustomSession()
    setReportGenerated(true)
    window.setTimeout(() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function saveCustomSession() {
    const savedAt = nowIso()
    const payload = {
      customSessionIdValue,
      customSessionName,
      customSessionCreatedAt,
      customSessionSavedAt: savedAt,
      tractorMake,
      tractorModel,
      tractorNotes,
      equipmentType,
      scenarioState,
    }
    localStorage.setItem(CUSTOM_SESSION_STORAGE_KEY, JSON.stringify(payload))
    setCustomSessionSavedAt(savedAt)
    setSessionStatus('session saved on this device')
    window.setTimeout(() => setSessionStatus(''), 2400)
  }

  function loadCustomSession() {
    const raw = localStorage.getItem(CUSTOM_SESSION_STORAGE_KEY)
    if (!raw) {
      setSessionStatus('no saved session on this device yet')
      window.setTimeout(() => setSessionStatus(''), 2400)
      return
    }
    try {
      const saved = JSON.parse(raw) as {
        customSessionIdValue?: string
        customSessionName?: string
        customSessionCreatedAt?: string
        customSessionSavedAt?: string
        tractorMake?: string
        tractorModel?: string
        tractorNotes?: string
        equipmentType?: string
        scenarioState?: typeof scenarioState
      }
      setCustomSessionIdValue(saved.customSessionIdValue || customSessionId())
      setCustomSessionName(saved.customSessionName || 'Restored FarmFax session')
      setCustomSessionCreatedAt(saved.customSessionCreatedAt || nowIso())
      setCustomSessionSavedAt(saved.customSessionSavedAt || '')
      setTractorMake(saved.tractorMake || '')
      setTractorModel(saved.tractorModel || '')
      setTractorNotes(saved.tractorNotes || '')
      setEquipmentType(saved.equipmentType || 'tractor')
      if (saved.scenarioState) setScenarioState(saved.scenarioState)
      setSessionStatus('saved session loaded')
    } catch {
      setSessionStatus('saved session could not be loaded')
    }
    window.setTimeout(() => setSessionStatus(''), 2400)
  }

  function newCustomSession() {
    setCustomSessionIdValue(customSessionId())
    setCustomSessionName('Real tractor recording session')
    setCustomSessionCreatedAt(nowIso())
    setCustomSessionSavedAt('')
    setTractorMake('')
    setTractorModel('')
    setTractorNotes('')
    setReportGenerated(false)
    setGuidedCaptureActive(false)
    setScenarioState(createBlankRealReportState())
    setSessionStatus('new blank recording session ready')
    window.setTimeout(() => setSessionStatus(''), 2400)
  }

  function exportReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.session.session_id}-${report.custom_equipment.display_name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'tractor'}-farmfax-report.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function copySellerQuestions() {
    const text = report.buyer_questions.map((question, index) => `${index + 1}. ${question}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('seller questions copied')
    } catch {
      setCopyStatus('copy blocked — select questions from JSON preview')
    }
    window.setTimeout(() => setCopyStatus(''), 2400)
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
          <p className="eyebrow">Real equipment condition report</p>
          <div className="demo-badge">Real report mode · browser analysis · no backend required</div>
          <h1>Record it. Score it. PDF it.</h1>
          <p className="lede">
            Take the required photos/videos. Skip what you can't capture. Generate a free PDF with findings, reasoning, owner questions, and buy/skip score.
          </p>
          <div className="hero-actions primary-actions">
            <button onClick={() => document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth' })}>Start capture</button>
            <button className="ghost" onClick={() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })}>View PDF report</button>
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
          <h2>Optional sample data — use only for demo.</h2>
          <p className="muted">For a real report, press Start new report and capture your own tractor media.</p>
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

      <section id="custom-session" className="custom-session-panel panel" data-qa="custom-session-builder">
        <div>
          <span className="section-label">free sample report</span>
          <h2>Start. Capture. Generate PDF.</h2>
          <p className="muted">Camera-first flow. Skip any view you cannot capture; skipped proof is scored and explained in the PDF.</p>
        </div>
        <div className="session-form-grid">
          <label>Session name<input data-qa="custom-session-name" value={customSessionName} onChange={(event) => { setReportGenerated(false); setCustomSessionName(event.target.value) }} /></label>
          <label>Tractor make<input data-qa="tractor-make-input" placeholder="e.g. John Deere" value={tractorMake} onChange={(event) => { setReportGenerated(false); setTractorMake(event.target.value) }} /></label>
          <label>Model / series<input data-qa="tractor-model-input" placeholder="e.g. 5075E" value={tractorModel} onChange={(event) => { setReportGenerated(false); setTractorModel(event.target.value) }} /></label>
          <label className="wide">Recorder notes<input data-qa="tractor-notes-input" placeholder="e.g. non-running, parked 2 years, seller says battery dead" value={tractorNotes} onChange={(event) => { setReportGenerated(false); setTractorNotes(event.target.value) }} /></label>
        </div>
        <div className="session-actions">
          <button type="button" data-qa="start-new-report" onClick={startNewReportFlow}>Start new report</button>
          <button type="button" data-qa="auto-camera-capture" onClick={startGuidedCameraCapture}>Auto camera capture</button>
          <button type="button" data-qa="save-custom-session" onClick={saveCustomSession}>Save progress</button>
          <button className="ghost" type="button" data-qa="load-custom-session" onClick={loadCustomSession}>Load saved session</button>
          <button className="ghost" type="button" data-qa="new-custom-session" onClick={newCustomSession}>Reset blank session</button>
          <button type="button" data-qa="generate-custom-report" onClick={generateCustomReport}>Generate report</button>
          <button type="button" data-qa="generate-pdf-report" onClick={generatePdfReport}>Generate PDF report</button>
          {sessionStatus && <small>{sessionStatus}</small>}
        </div>
        <div className="session-summary">
          <span>session_id</span><b>{customSessionIdValue}</b>
          <span>report subject</span><b>{reportDisplayName}</b>
          <span>capture plan</span><b>7 ordered photos/videos</b>
        </div>
        <div className="report-flow-panel" data-qa="new-report-workflow">
          <span className="section-label">new report workflow</span>
          <ol>
            <li><b>Start new report</b><small>Creates a fresh blank tractor session.</small></li>
            <li><b>Record with guidance</b><small>Follow each photo/video step in order and upload into the matching slot.</small></li>
            <li><b>Generate scored report</b><small>After submission, FarmFax scores evidence, surfaces risks, missing proof, and seller suggestions.</small></li>
          </ol>
          <p>{reportGenerated ? 'PDF-ready report generated.' : 'Capture or skip each view, then generate the report.'}</p>
        </div>
      </section>

      <section className="architecture-row architecture-stack" aria-label="demo architecture stack">
        <div className="stack-heading panel"><span>Demo stack</span><p>The farmer sees a clean diligence flow. Judges can see which pieces run now and which backend or commerce seams are intentionally marked as planned or simulated.</p></div>
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
          <h2>Capture checklist.</h2>
          <div className="capture-intro-row">
            <p className="muted">Photos first. Video when motion, leaks, smoke, or sound matter.</p>
            <button className="ghost sample-video-button" data-qa="sample-video-button" type="button" onClick={() => void runSampleVideo('hydraulics')} disabled={isSampleVideoLoading}>
              {isSampleVideoLoading ? 'Checking sample…' : 'Try sample video'}
            </button>
          </div>
          <div className="equipment-toggle" aria-label="equipment type">
            {['tractor', 'skid steer', 'trailer', 'implement'].map((type) => (
              <button key={type} className={equipmentType === type ? 'active' : 'ghost'} disabled={type !== 'tractor'} onClick={() => type === 'tractor' && setEquipmentType(type)}>{type}{type !== 'tractor' ? ' soon' : ''}</button>
            ))}
          </div>
          <div className="capture-order-panel" data-qa="ordered-capture-instructions">
            <div>
              <span className="section-label">record in this order</span>
              <h3>Tap, record, or skip.</h3>
              <p className="muted">Auto camera opens the next needed view.</p>
            </div>
            <ol className="capture-order-list">
              {captureOrder.map((step) => (
                <li key={step.slot} className={step.status}>
                  <button className="ghost" type="button" onClick={() => document.getElementById(`slot-${step.slot}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                    {step.order}. {step.title}
                  </button>
                  <span>{step.media_needed}</span>
                  <p>{step.instruction}</p>
                  <div className="automated-step-list">
                    {step.steps.map((item, itemIndex) => <small key={`${step.slot}-photo-${itemIndex}`}>Photo step {itemIndex + 1}: {item}</small>)}
                    {step.video_steps.map((item, itemIndex) => <small key={`${step.slot}-video-${itemIndex}`}>Video step {itemIndex + 1}: {item}</small>)}
                  </div>
                </li>
              ))}
            </ol>
            <div className="submit-evidence-bar" data-qa="submit-evidence-generate">
              <b>{reportGenerated ? 'Report is generated' : 'When your photos/videos are submitted, generate the scored report.'}</b>
              <button type="button" data-qa="auto-camera-capture-inline" onClick={startGuidedCameraCapture}>Auto-load camera for next needed shot</button>
              <button type="button" onClick={generateCustomReport}>Generate scored report</button>
              <button type="button" data-qa="generate-pdf-report-inline" onClick={generatePdfReport}>Generate PDF</button>
            </div>
          </div>
          <div className="scan-cockpit" data-qa="scan-cockpit">
            <div className="scan-viewport">
              {analysisSlot?.image && <img src={analysisSlot.image} alt="Live FarmFax scan evidence" />}
              <div className="scan-gridlines" aria-hidden="true" />
              <div className="scan-beam" aria-hidden="true" />
              {overlayCells.map((cell, index) => (
                <span
                  className={`scan-tag ${cell.kind}`}
                  key={`scan-${cell.kind}-${cell.x}-${cell.y}-${index}`}
                  style={{ left: `${10 + cell.x * 10.5}%`, top: `${12 + cell.y * 9.5}%` }}
                >
                  {cellLabel(cell.kind)}
                </span>
              ))}
              <div className="scan-hud-top"><span>LIVE MEDIA PASS</span><b>{scanMode}</b></div>
              <div className="scan-hud-bottom"><span>focus</span><b>{scanFocus}</b></div>
            </div>
            <div className="scan-console">
              <div>
                <span className="section-label">Evidence quality</span>
                <h3>{scanReadiness}% scan readiness</h3>
                <div className="readiness-bar" data-qa="scan-readiness-meter" aria-label={`Scan readiness ${scanReadiness}%`}>
                  <i style={{ width: `${scanReadiness}%` }} />
                </div>
              </div>
              <div className="scan-stats">
                <article><span>photos</span><b>{photoSourceCount}</b></article>
                <article><span>videos</span><b>{videoSourceCount}</b></article>
                <article><span>frames</span><b>{sampledFrameCount}</b></article>
                <article><span>review</span><b>{reviewCount}</b></article>
              </div>
              <div className="defect-radar">
                <span className="section-label">Defect radar</span>
                {findings.map((finding) => (
                  <button key={`radar-${finding.category}`} type="button" className={`radar-pill ${finding.severity}`} onClick={() => setSelectedFinding(finding)}>
                    <b>{finding.category}</b>
                    <small>{finding.confidence}% · {slotTitle(slots, finding.evidence)}</small>
                  </button>
                ))}
              </div>
              <p className="scan-disclaimer">High-tech does not mean magic: FarmFax flags visible evidence and missing proof. It does not certify hidden defects.</p>
            </div>
          </div>
          <div className="zone-checklist" data-qa="zone-checklist">
            <div>
              <span className="section-label">Defect checklist by zone</span>
              <h3>Every expensive area gets a status.</h3>
            </div>
            <div className="zone-grid">
              {zoneChecklist.map((zone) => (
                <article key={zone.label} className={zone.status}>
                  <span>{zone.status === 'received' ? 'received' : zone.status === 'review' ? 'review' : 'missing'}</span>
                  <b>{zone.label}</b>
                  <small>{zone.count}/{zone.total} views supplied</small>
                </article>
              ))}
            </div>
          </div>
          <div className="specific-detector-stack" data-qa="specific-detector-stack">
            <div>
              <span className="section-label">Specific detector stack</span>
              <h3>More precise checks, still evidence-bound.</h3>
              <p>These are visible-media detectors. They improve specificity without pretending to catch hidden mechanical failures.</p>
            </div>
            <div className="detector-grid">
              {specificDetectorSignals.map((signal) => (
                <article key={`${signal.slot.id}-${signal.label}`} className={signal.status}>
                  <span>{signal.status}</span>
                  <b>{signal.label}</b>
                  <strong>{signal.value}</strong>
                  <small>{signal.slot.title} · {signal.reason}</small>
                </article>
              ))}
            </div>
          </div>
          <div className="detector-module-report" data-qa="detector-module-report">
            <div>
              <span className="section-label">Detector modules run locally in browser</span>
              <h3>Actual passes, not just labels.</h3>
              <p>FarmFax now runs lightweight image-processing modules: OCR-readiness, edge/texture tread scoring, wet-mask segmentation, color-cluster repaint comparison, and safety-checklist coverage. Challenge: these are decision-support signals until trained detector models and ground-truth labels exist.</p>
            </div>
            <div className="module-grid">
              {(detectorModuleRollup.length ? detectorModuleRollup : [
                { name: 'OCR readiness module', score: 0, output: 'waiting for serial/hour media', challenge: 'Run when plate or meter evidence is supplied.', slotTitle: 'Serial / hour meter' },
                { name: 'Edge / texture tread module', score: 0, output: 'waiting for tire media', challenge: 'Run when tire/track evidence is supplied.', slotTitle: 'Tires / tracks' },
                { name: 'Wet-mask segmentation module', score: 0, output: 'waiting for hydraulic media', challenge: 'Run when hose/cylinder evidence is supplied.', slotTitle: 'Hydraulics' },
                { name: 'Color-cluster repaint module', score: 0, output: 'waiting for paint/body media', challenge: 'Run when body panel evidence is supplied.', slotTitle: 'Paint / body' },
                { name: 'Safety checklist module', score: 0, output: 'waiting for engine bay media', challenge: 'Run when engine/guard evidence is supplied.', slotTitle: 'Engine bay' },
              ]).map((module) => (
                <article key={`${module.slotTitle}-${module.name}`}>
                  <span>{module.slotTitle}</span>
                  <b>{module.name}</b>
                  <strong>{module.score}%</strong>
                  <small>{module.output}</small>
                  <em>{module.challenge}</em>
                </article>
              ))}
            </div>
          </div>
          <div className="capture-grid">
            {slots.map((slot) => (
              <article id={`slot-${slot.id}`} className={`capture-slot ${slot.state}`} key={slot.id}>
                <div>
                  <span>{stateLabel(slot.state)}</span>
                  <h3>{slot.title}</h3>
                  <p>{slot.prompt}</p>
                  <small>{slot.why}</small>
                  <ol className="slot-step-list" aria-label={`${slot.title} automated capture steps`}>
                    {captureStepList(slot).map((item) => <li key={`${slot.id}-${item}`}>{item}</li>)}
                  </ol>
                </div>
                <div className="slot-media-actions">
                  <button className="camera-button" type="button" onClick={() => openCamera(slot)}>Take photo/video</button>
                  <button className="ghost skip-slot-button" data-qa="skip-capture-slot" type="button" onClick={() => skipSlot(slot.id)}>Skip this view</button>
                  <label>
                    <div className="capture-preview">
                      {slot.image ? (
                        <>
                          <img src={slot.image} alt={`${slot.title} capture`} />
                          {slot.mediaType === 'video' && <span className="video-badge">video sampled</span>}
                        </>
                      ) : <div className="phone-placeholder">Tap upload</div>}
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
                  <div className="slot-detector-chips" data-qa="slot-detector-chips">
                    {detectorSignalsForSlot(slot).map((signal) => (
                      <span key={`${slot.id}-${signal.label}`} className={signal.status}>{signal.label}: {signal.value}</span>
                    ))}
                  </div>
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
          <div className="overlay-card" data-qa="real-photo-analysis">
            <div className="photo-analysis-frame">
              {analysisSlot?.image && (
                <img data-qa="analysis-overlay-photo" src={analysisSlot.image} alt={`${analysisSlot.title} evidence with FarmFax analysis overlay`} />
              )}
              <div className="analysis-scrim" aria-hidden="true" />
              {overlayCells.map((cell, index) => (
                <span
                  key={`${cell.kind}-${cell.x}-${cell.y}-${index}`}
                  className={`analysis-box ${cell.kind}`}
                  style={{ left: `${8 + cell.x * 11}%`, top: `${10 + cell.y * 10}%` }}
                >
                  {cellLabel(cell.kind)}
                </span>
              ))}
              <div className="analysis-photo-caption">
                <b>{analysisSlot?.title ?? 'Submitted media'}</b>
                <span>{analysisSlot?.video ? `${analysisSlot.video.frameCount} sampled video frames` : 'real sample photo'} · {analysisSlot?.analysis?.confidence ?? 84}% confidence</span>
              </div>
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

      <section className="post-scan-decision" aria-label="before deposit decision">
        <article className="decision-card" data-qa="before-deposit-decision">
          <span>Before deposit decision</span>
          <h2>{dealPosture}</h2>
          <p>{nextMoveCopy}</p>
          <div className="decision-actions">
            <button type="button" onClick={() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })}>View PDF report</button>
            <button className="ghost" type="button" onClick={() => void runCompleteSampleInspection()}>Load complete proof</button>
          </div>
        </article>
        <article className="report-preview-card" data-qa="report-preview-card">
          <div className="preview-topline"><span>FarmFax report preview</span><b>{conditionScore}/100</b></div>
          <h3>{report.custom_equipment.display_name} · {hourMeterLabel(report.hour_meter)}</h3>
          <div className="preview-findings">
            {findings.slice(0, 3).map((finding) => (
              <p key={`preview-${finding.category}`}><b>{finding.category}:</b> {finding.finding}</p>
            ))}
          </div>
          <div className="preview-proof-row">
            <div><span>Missing proof</span><b>{missingProofPreview.length ? missingProofPreview.map((slot) => slot.title).join(', ') : 'None in required set'}</b></div>
            <div><span>Seller asks</span><b>{sellerQuestionPreview.length}</b></div>
          </div>
          <div className="preview-questions">
            {sellerQuestionPreview.map((question) => <small key={question}>{question}</small>)}
          </div>
          <button type="button" onClick={exportReport}>Download JSON report</button>
        </article>
      </section>

      <section className="report-intelligence-panel" data-qa="report-intelligence-panel">
        <div>
          <span className="section-label">Detector module intelligence in export</span>
          <h2>Proof export now carries the detector reasoning.</h2>
          <p>The JSON report includes detector_modules, module_risk_summary, seller_questions_from_detectors, and proof_intelligence. Challenge: browser modules are implemented now; trained CV models and the Nemotron reasoning layer remain planned.</p>
        </div>
        <div className="intel-grid">
          <article>
            <span>module_risk_summary</span>
            <b>{moduleRiskSummary.length || 0} buyer flags</b>
            <small>{moduleRiskSummary[0]?.action ?? 'No detector module requires immediate seller follow-up.'}</small>
          </article>
          <article>
            <span>seller_questions_from_detectors</span>
            <b>{detectorQuestions.length} generated asks</b>
            <small>{detectorQuestions[0] ?? 'Detector output did not generate extra seller questions.'}</small>
          </article>
          <article>
            <span>proof_intelligence</span>
            <b>browser_detector_modules: implemented</b>
            <small>trained_cv_models: planned · nemotron_reasoning_layer: planned</small>
          </article>
        </div>
      </section>

      <section className="report-trust-loop" data-qa="report-trust-loop">
        <div>
          <span className="section-label">Report trust loop</span>
          <h2>Make the export usable by the next human.</h2>
          <p>Trust challenge: export is useful only if a buyer can hand it to the seller or mechanic. So the report now has a JSON preview, copy seller questions, mechanic_handoff_summary, and before_deposit_checklist.</p>
          <div className="trust-actions">
            <button type="button" onClick={() => setJsonPreviewOpen((open) => !open)}>{jsonPreviewOpen ? 'Close JSON preview' : 'Open JSON preview'}</button>
            <button className="ghost" type="button" onClick={() => void copySellerQuestions()}>copy seller questions</button>
            {copyStatus && <small>{copyStatus}</small>}
          </div>
        </div>
        <div className="trust-grid">
          <article>
            <span>mechanic_handoff_summary</span>
            {report.mechanic_handoff_summary.map((item) => <small key={item}>{item}</small>)}
          </article>
          <article>
            <span>before_deposit_checklist</span>
            {report.before_deposit_checklist.map((item) => (
              <small key={item.label}><b>{item.status}</b> · {item.label}: {item.action}</small>
            ))}
          </article>
        </div>
        {jsonPreviewOpen && (
          <pre className="json-preview-drawer" data-qa="json-preview-drawer">{JSON.stringify(openRecordPreview, null, 2)}</pre>
        )}
      </section>

      <section className="packet-layout" id="catalog">
        <div className="panel catalog-panel">
          <div className="section-label">identity and records</div>
          <h2>Match the machine to the paper trail.</h2>
          <div className="identity-grid">
            <article>
              <span>make/model entered</span>
              <b>{report.custom_equipment.display_name}</b>
              <p>{report.custom_equipment.truth_note}</p>
            </article>
            <article>
              <span>serial / PIN shown</span>
              <b>{report.serial_number}</b>
              <p>Compare this to the bill of sale, lien/title paperwork, and service records before sending money.</p>
            </article>
            <article>
              <span>hour meter</span>
              <b>{hourMeterLabel(report.hour_meter)}</b>
              <p>{report.hour_meter == null ? 'Ask for a readable hour-meter photo before relying on usage.' : 'Ask for service records near this hour reading and compare wear in person.'}</p>
            </article>
            <article>
              <span>running_status</span>
              <b>{report.running_status}</b>
              <p>{report.running_status_source}</p>
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

      <section className="packet-layout pdf-report-shell" id="report">
        <div className="panel report-panel" data-qa="auto-populated-pdf-report">
          <div className="section-label">auto-populated PDF report</div>
          <h2>{reportGenerated ? 'PDF-ready equipment report.' : 'Generate after capture.'}</h2>
          {!reportGenerated && (
            <div className="report-pending-card" data-qa="report-pending-state">
              <b>Report not generated yet</b>
              <p>Capture photos/videos or skip unavailable views. Then generate the PDF report.</p>
              <button type="button" onClick={() => document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Go record/submit photos and videos</button>
            </div>
          )}
          <div className="report-score">
            <strong>{report.condition_score}</strong>
            <div>
              <b>{report.custom_equipment.display_name}</b>
              <p>{report.custom_equipment.truth_note}</p>
              <p>Score from submitted media, skipped views, visible rust/wet/paint/tire signals, and missing identity/hour proof.</p>
            </div>
          </div>
          <div className="deal-posture priority-action">
            <span>recommended next step</span>
            <h3>{dealPosture}</h3>
            <p>{nextMoveCopy}</p>
          </div>
          <div className={`buy-skip-calculator ${report.buy_or_skip_calculator.verdict}`} data-qa="buy-or-skip-calculator">
            <span>Buy / skip calculator</span>
            <h3>{report.buy_or_skip_calculator.label}</h3>
            <p>{report.buy_or_skip_calculator.reason}</p>
            <b>{report.buy_or_skip_calculator.max_deposit_action}</b>
          </div>
          <div className="score-explanation" data-qa="score-explanation">
            <span>Score explained</span>
            {report.scoring_explanation.map((item) => <b key={item}>{item}</b>)}
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
          <div className="media-driven-result" data-qa="media-driven-result">
            <span>Media-driven result</span>
            <h3>{report.media_driven_result.headline}</h3>
            {report.media_driven_result.basis.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
            <b>Next capture: {report.media_driven_result.next_capture_step}</b>
            <small>{report.media_driven_result.truth_note}</small>
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
            <p><b>Session:</b> {report.session.session_name} · {report.session.session_id}</p>
            <p><b>Recorder make/model:</b> {report.custom_equipment.display_name} — {report.custom_equipment.truth_note}</p>
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
            <button data-qa="pdf-report-button" onClick={generatePdfReport}>Generate PDF report</button>
            <button className="ghost" onClick={exportReport}>Download JSON data</button>
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
          <div className="live-api-contract" data-qa="live-api-contract">
            <span>Live API contract</span>
            <b>OpenAPI 3.1 backend seam</b>
            <p>Judges can inspect the backend docs, report/session API, and truth-layer guard. Configure the deployed host with VITE_FARMFAX_API_URL.</p>
            <a href={`${FARMFAX_API_URL}/docs`} target="_blank" rel="noreferrer">API docs</a>
            <a href={`${FARMFAX_API_URL}/api/openapi.json`} target="_blank" rel="noreferrer">OpenAPI JSON</a>
          </div>
          <button onClick={() => setStripeOpen(true)}>Save hosted report</button>
        </aside>
      </section>

      <section className="judge-conversion-panel" data-qa="judge-conversion-panel">
        <div className="trace-heading">
          <span>30-second judge loop</span>
          <p>Run the proof path, challenge the overclaim, then inspect the live API contract.</p>
        </div>
        <div className="judge-script-grid">
          <article>
            <span>00–10 sec</span>
            <b>Click “Run judge demo”</b>
            <p>Watch FarmFax load a risky tractor, score visible evidence, and surface what should slow the buyer down before deposit.</p>
          </article>
          <article>
            <span>10–20 sec</span>
            <b>Open the buyer report</b>
            <p>Notice the seller questions, missing-proof list, JSON/PDF export, and the rule that unknowns stay unknown.</p>
          </article>
          <article>
            <span>20–30 sec</span>
            <b>Inspect the API contract</b>
            <p>Use the Render-backed docs/OpenAPI links to see capture sessions, report persistence, handoffs, and the truth-layer guard.</p>
          </article>
        </div>
        <div className="submission-link-grid" data-qa="submission-links">
          <a href="https://primetimeindy.github.io/farmfax-demo/?v=renderapi-readonly#report" target="_blank" rel="noreferrer">Live demo</a>
          <a href={`${FARMFAX_API_URL}/docs`} target="_blank" rel="noreferrer">API docs</a>
          <a href={`${FARMFAX_API_URL}/api/openapi.json`} target="_blank" rel="noreferrer">OpenAPI JSON</a>
          <a href="https://github.com/primetimeindy/farmfax" target="_blank" rel="noreferrer">GitHub repo</a>
        </div>
        <div className="truth-layer-callout" data-qa="truth-layer-callout">
          <b>Truth-layer challenge</b>
          <p>FarmFax does not certify equipment. It creates buyer-owned evidence packets and flags missing proof before deposit.</p>
          <small>Loop: capture evidence → challenge overclaims → export/share the record → hand off to seller or mechanic.</small>
        </div>
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
          <article data-qa="judge-proof-item"><b>Honest truth labels</b><p>Multimodal reasoning is planned, checkout is simulated, and unsupported claims are listed in JSON.</p></article>
        </div>
        <div className="defense-panel" data-qa="defense-panel">
          <article>
            <span>What FarmFax can verify today</span>
            <p>Submitted photo slots, short-video frame samples, visible rust/wet/paint cues, missing evidence, buyer questions, JSON/PDF export, and phone-installable demo flow.</p>
          </article>
          <article>
            <span>What FarmFax will not claim</span>
            <p>No mechanic certification, title/lien/theft result, appraisal, repair estimate, warranty, safety certification, or full-video inspection.</p>
          </article>
          <article>
            <span>Sample media disclosure</span>
            <p>Bundled photos and video are authentic-looking demo media from Wikimedia sources. Real reports use the buyer or seller’s own phone evidence.</p>
          </article>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => void runJudgeDemo()}>Run judge demo</button>
          <button className="ghost" type="button" onClick={() => void runCompleteSampleInspection()}>Load complete sample</button>
          <button className="ghost" type="button" onClick={exportReport}>Download JSON report</button>
        </div>
      </section>

      <section className="market-context-panel" data-qa="market-context-panel">
        <div className="trace-heading">
          <span>Market context</span>
          <p>Used farm equipment is a high-trust, high-dollar secondary market where repair access and missing proof change the buyer's risk.</p>
        </div>
        <div className="market-stat-grid">
          {report.market_context_stats.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <b>{item.value}</b>
              <p>{item.source} · {item.date}</p>
              <small>{item.caveat}</small>
            </article>
          ))}
        </div>
        <div className="repair-access-callout">
          <b>Repair access problem</b>
          <p>Modern equipment can be software-gated and dealer-dependent. The FTC found repair restrictions can include unavailable diagnostic software and limited parts access, while U.S. PIRG documents how sensor/controller networks and dealer delays can strand farmers during planting or harvest windows.</p>
          <small>FarmFax does not solve right-to-repair. It gives buyers a portable evidence packet: running status, missing proof, visible condition, seller questions, and mechanic handoff before money changes hands.</small>
        </div>
        <details className="system-map-details">
          <summary>Show system map</summary>
          <div className="system-map-grid">
            {report.system_integrations.map((item) => (
              <article key={item.name}>
                <span>{item.status}</span>
                <b>{item.name}</b>
                <h3>{item.role}</h3>
                <p>{item.proof}</p>
              </article>
            ))}
          </div>
        </details>
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
            {guidedCaptureActive && <p className="guided-capture-status" data-qa="guided-camera-status">Auto guided capture is on — submit this slot and FarmFax will load the next needed camera view.</p>}
            <p>{cameraSlot.prompt}</p>
            <div className="camera-frame">
              <video ref={videoRef} playsInline muted autoPlay />
              <div className="camera-guide-overlay" data-qa="camera-guide-overlay" aria-hidden="true">
                <div className="guide-brackets"><i /><i /><i /><i /></div>
                <div className="guide-copy">
                  <b>{guideCopy.primary}</b>
                  <span>{guideCopy.detail}</span>
                </div>
                <div className="guide-pills">
                  <span>Hold steady</span>
                  <span>Move closer</span>
                  <span>Glare detected</span>
                </div>
              </div>
              {isCameraStarting && <div className="camera-status">Starting rear camera…</div>}
              {cameraError && <div className="camera-error">{cameraError}</div>}
            </div>
            <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
            <div className="camera-actions">
              <button onClick={captureFrame} disabled={!!cameraError || isCameraStarting || isRecordingVideo}>Capture evidence photo</button>
              {!isRecordingVideo ? (
                <button className="ghost" type="button" data-qa="record-evidence-video" onClick={startVideoRecording} disabled={!!cameraError || isCameraStarting}>Record evidence video</button>
              ) : (
                <button type="button" data-qa="stop-evidence-video" onClick={stopVideoRecording}>Stop video + submit</button>
              )}
              <button className="ghost" type="button" data-qa="skip-camera-slot" onClick={() => { skipSlot(cameraSlot.id); closeCamera() }}>Skip this view</button>
              <label className="upload-button">
                Upload photo/video
                <input accept="image/*,video/*" capture="environment" type="file" onChange={(event) => {
                  updateSlotMedia(cameraSlot.id, event)
                  closeCamera()
                }} />
              </label>
            </div>
            <small>Evidence is stored in-browser for the demo. Production signs capture metadata before routing to the Hermes workflow and multimodal reasoning layer.</small>
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
