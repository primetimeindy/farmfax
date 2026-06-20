export type CaptureState = 'accepted' | 'review' | 'missing'
export type Severity = 'green' | 'yellow' | 'red'
export type RiskLevel = 'low' | 'medium' | 'high'

export type SlotId =
  | 'walkaround'
  | 'serial'
  | 'hours'
  | 'hydraulics'
  | 'tires'
  | 'paint'
  | 'engine'

export type AnalysisCell = { x: number; y: number; kind: 'rust' | 'wet' | 'paint' }

export type ImageAnalysis = {
  rustPct: number
  wetPct: number
  paintVariance: number
  confidence: number
  cells: AnalysisCell[]
  summary: string
}

export type MediaType = 'image' | 'video'

export type VideoFrameAnalysis = {
  time: number
  image: string
  analysis: ImageAnalysis
}

export type VideoAnalysis = {
  duration: number
  frameCount: number
  posterTime: number
  frames: VideoFrameAnalysis[]
  aggregate: ImageAnalysis
  summary: string
}

export type CaptureSlot = {
  id: SlotId
  title: string
  prompt: string
  why: string
  state: CaptureState
  image?: string
  analysis?: ImageAnalysis
  video?: VideoAnalysis
  mediaType?: MediaType
}

export type Finding = {
  severity: Severity
  category: string
  finding: string
  confidence: number
  evidence: SlotId
  nextStep: string
}

export type CatalogCandidate = {
  make: string
  model: string
  family: string
  confidence: number
  basis: string
}

export type RiskFactor = {
  label: string
  points: number
  evidence: string
  explanation: string
}

export type RiskCard = {
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

export type ScenarioId = 'clean-tractor' | 'risky-tractor' | 'incomplete-seller-listing'

export type ScenarioSlotSeed = Omit<CaptureSlot, 'image'> & {
  imageSeed?: PlaceholderImageSeed
}

export type PlaceholderImageSeed = {
  label: string
  tone: 'clean' | 'rust' | 'wet' | 'missing' | 'documents'
  accent?: string
}

export type ScenarioReportSeed = {
  reportId: string
  equipmentType: string
  serialNumber: string
  hourMeter: number | null
  makeModelGuess: CatalogCandidate
  conditionScore: number
  confidence: number
  buyerQuestions: string[]
  openRecordCommitment: string
}

export type FarmFaxScenario = {
  id: ScenarioId
  label: string
  description: string
  demoBadge: string
  slots: ScenarioSlotSeed[]
  findings: Finding[]
  report: ScenarioReportSeed
}

export type ScenarioState = {
  selectedScenarioId: ScenarioId
  slots: CaptureSlot[]
  findings: Finding[]
  reportSeed: ScenarioReportSeed
}

export type ScenarioAction =
  | { type: 'load-scenario'; scenarioId: ScenarioId }
  | { type: 'replace-slot-image'; slotId: SlotId; image: string; analysis?: ImageAnalysis; mediaType?: MediaType; video?: VideoAnalysis }
  | { type: 'set-slot-analysis'; slotId: SlotId; image: string; analysis: ImageAnalysis; mediaType?: MediaType; video?: VideoAnalysis }
  | { type: 'mark-slot-review'; slotId: SlotId }
  | { type: 'clear-slot'; slotId: SlotId }

const slotCopy = (slot: ScenarioSlotSeed): CaptureSlot => ({
  id: slot.id,
  title: slot.title,
  prompt: slot.prompt,
  why: slot.why,
  state: slot.state,
  image: slot.imageSeed ? svgDataUrl(slot.imageSeed) : undefined,
  analysis: slot.analysis,
})

const svgDataUrl = ({ label, tone, accent }: PlaceholderImageSeed) => {
  const palette: Record<PlaceholderImageSeed['tone'], { bg: string; fg: string; mark: string }> = {
    clean: { bg: '#e8f5df', fg: '#225c2b', mark: '#f9c846' },
    rust: { bg: '#f7e2cc', fg: '#803815', mark: '#b35b25' },
    wet: { bg: '#dfe8ec', fg: '#172635', mark: '#20384f' },
    missing: { bg: '#f3f4f6', fg: '#4b5563', mark: '#d1d5db' },
    documents: { bg: '#eaf2ff', fg: '#1f3c73', mark: '#8bb6ff' },
  }
  const colors = palette[tone]
  const safeLabel = escapeSvg(label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-label="${safeLabel}">
    <rect width="960" height="640" fill="${colors.bg}"/>
    <rect x="64" y="92" width="832" height="456" rx="42" fill="#ffffff" opacity="0.62"/>
    <ellipse cx="310" cy="404" rx="104" ry="104" fill="${colors.fg}" opacity="0.92"/>
    <ellipse cx="672" cy="414" rx="86" ry="86" fill="${colors.fg}" opacity="0.84"/>
    <rect x="245" y="228" width="450" height="132" rx="28" fill="${accent ?? colors.fg}" opacity="0.92"/>
    <rect x="420" y="152" width="178" height="98" rx="22" fill="${accent ?? colors.fg}" opacity="0.78"/>
    <path d="M628 250 L775 285 L806 335 L664 330 Z" fill="${colors.mark}" opacity="0.9"/>
    ${tone === 'rust' ? '<circle cx="278" cy="230" r="26" fill="#8b2f14"/><circle cx="360" cy="362" r="18" fill="#9f3d18"/><circle cx="706" cy="336" r="22" fill="#7a2e16"/>' : ''}
    ${tone === 'wet' ? '<path d="M590 345 C650 340 695 368 732 430 C670 438 622 418 590 345 Z" fill="#0f172a" opacity="0.66"/>' : ''}
    <text x="480" y="586" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="800" fill="${colors.fg}">${safeLabel}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const escapeSvg = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const commonPrompts: Record<SlotId, Pick<CaptureSlot, 'title' | 'prompt' | 'why'>> = {
  walkaround: {
    title: '360° walkaround',
    prompt: 'Slow phone video or four photos: front, left, rear, right.',
    why: 'Establishes baseline body condition and prevents cherry-picked seller photos.',
  },
  serial: {
    title: 'Serial / PIN plate',
    prompt: 'Move close, avoid glare, capture the entire plate and nearby decals.',
    why: 'Cross-references make/model family and anchors the portable equipment record.',
  },
  hours: {
    title: 'Hour meter + dashboard',
    prompt: 'Capture ignition-on hour meter, warning lights, and display glass.',
    why: 'Flags odometer/hour inconsistency and creates negotiation evidence.',
  },
  hydraulics: {
    title: 'Hydraulic lines / cylinders',
    prompt: 'Capture lift cylinders, hoses, couplers, wet spots, and ground underneath.',
    why: 'Hydraulic seepage can turn a cheap deal into an expensive repair.',
  },
  tires: {
    title: 'Tires / tracks / undercarriage',
    prompt: 'Capture tread depth, sidewalls, cracks, lugs, and uneven wear.',
    why: 'Tires and tracks are visible, expensive, and often hidden in listings.',
  },
  paint: {
    title: 'Paint / body / welds',
    prompt: 'Capture loader arms, hood panels, frame rails, welds, dents, repaint zones.',
    why: 'Paint mismatch can signal cosmetic repaint, repaired collision, or replacement panels.',
  },
  engine: {
    title: 'Engine bay / cold start',
    prompt: 'Capture engine bay plus 10s start video if available.',
    why: 'Visual AI cannot certify internals, but can flag leaks, smoke context, and missing evidence.',
  },
}

const scenarioSlot = (
  id: SlotId,
  state: CaptureState,
  imageSeed: PlaceholderImageSeed | undefined,
  analysis?: ImageAnalysis,
): ScenarioSlotSeed => ({ ...commonPrompts[id], id, state, imageSeed, analysis })

const cleanAnalysis: ImageAnalysis = {
  rustPct: 0.8,
  wetPct: 0.3,
  paintVariance: 12,
  confidence: 86,
  cells: [],
  summary: 'low rust-tone signal · low leak-tone signal · paint variance low',
}

const riskyRustAnalysis: ImageAnalysis = {
  rustPct: 12.4,
  wetPct: 2.1,
  paintVariance: 46,
  confidence: 84,
  cells: [
    { x: 2, y: 2, kind: 'rust' },
    { x: 3, y: 3, kind: 'rust' },
    { x: 6, y: 3, kind: 'paint' },
  ],
  summary: '12.4% rust-tone pixels · low leak-tone signal · paint variance 46/100',
}

const riskyWetAnalysis: ImageAnalysis = {
  rustPct: 3.6,
  wetPct: 14.8,
  paintVariance: 28,
  confidence: 88,
  cells: [
    { x: 5, y: 3, kind: 'wet' },
    { x: 6, y: 4, kind: 'wet' },
  ],
  summary: '3.6% rust-tone pixels · 14.8% dark/wet signal · paint variance low',
}

export const farmFaxScenarios = [
  {
    id: 'clean-tractor',
    label: 'Clean tractor',
    description: 'Mostly complete photos and no obvious major visual issue.',
    demoBadge: 'Scenario: clean tractor · complete evidence',
    slots: [
      scenarioSlot('walkaround', 'accepted', { label: 'Clean walkaround', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('serial', 'accepted', { label: 'Readable PIN plate', tone: 'documents' }, cleanAnalysis),
      scenarioSlot('hours', 'accepted', { label: '1,126h dashboard', tone: 'documents' }, cleanAnalysis),
      scenarioSlot('hydraulics', 'accepted', { label: 'Dry hydraulics', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('tires', 'accepted', { label: 'Even tire wear', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('paint', 'accepted', { label: 'Consistent paint', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('engine', 'accepted', { label: 'Clean engine bay', tone: 'clean' }, cleanAnalysis),
    ],
    findings: [
      {
        severity: 'green',
        category: 'Evidence completeness',
        finding: 'All required inspection views are supplied and readable for a pre-purchase screen.',
        confidence: 92,
        evidence: 'walkaround',
        nextStep: 'Still verify paperwork, service records, and cold-start behavior in person.',
      },
      {
        severity: 'green',
        category: 'Visible leak evidence',
        finding: 'Hydraulic and engine-bay views show low dark/wet signal in the demo analysis.',
        confidence: 86,
        evidence: 'hydraulics',
        nextStep: 'Run loader through full cycle and inspect after warm-up.',
      },
    ],
    report: {
      reportId: 'ffx-demo-clean-tractor-1126h',
      equipmentType: 'tractor',
      serialNumber: 'LV5075E7P0C11260',
      hourMeter: 1126,
      makeModelGuess: {
        make: 'John Deere',
        model: '5075E',
        family: '5E Utility Tractor',
        confidence: 91,
        basis: 'Readable PIN plate + green/yellow body + utility tractor silhouette',
      },
      conditionScore: 91,
      confidence: 88,
      buyerQuestions: [
        'Can you share service records matching the 1,126h meter reading?',
        'Does the PIN plate match the bill of sale and lien/title paperwork?',
      ],
      openRecordCommitment: 'Clean scenario exports a complete portable JSON/PDF record owned by the buyer/seller.',
    },
  },
  {
    id: 'risky-tractor',
    label: 'Risky tractor',
    description: 'Photos show issues that should slow the deal down before deposit.',
    demoBadge: 'Scenario: risky tractor · red/yellow findings',
    slots: [
      scenarioSlot('walkaround', 'accepted', { label: 'Rust walkaround', tone: 'rust' }, riskyRustAnalysis),
      scenarioSlot('serial', 'accepted', { label: 'Readable PIN plate', tone: 'documents' }, cleanAnalysis),
      scenarioSlot('hours', 'accepted', { label: '1,842h dashboard', tone: 'documents' }, cleanAnalysis),
      scenarioSlot('hydraulics', 'review', { label: 'Wet cylinder area', tone: 'wet' }, riskyWetAnalysis),
      scenarioSlot('tires', 'accepted', { label: 'Serviceable tires', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('paint', 'review', { label: 'Paint mismatch', tone: 'rust', accent: '#315f31' }, riskyRustAnalysis),
      scenarioSlot('engine', 'missing', undefined),
    ],
    findings: [
      {
        severity: 'yellow',
        category: 'Rust / corrosion',
        finding: 'Moderate corrosion clusters around loader arm mount and lower step bracket.',
        confidence: 74,
        evidence: 'walkaround',
        nextStep: 'Ask for close-up photos after pressure wash; inspect pins and bushings in person.',
      },
      {
        severity: 'red',
        category: 'Hydraulic leak evidence',
        finding: 'Dark wet streak pattern near right lift cylinder; could be seepage or fresh grease.',
        confidence: 68,
        evidence: 'hydraulics',
        nextStep: 'Ask whether cylinder seals or hoses were replaced; run loader through full cycle.',
      },
      {
        severity: 'yellow',
        category: 'Paint mismatch',
        finding: 'Rear quarter panel color distribution differs from hood and loader arms.',
        confidence: 63,
        evidence: 'paint',
        nextStep: 'Ask about repaint, collision, storm damage, or panel replacement history.',
      },
    ],
    report: {
      reportId: 'ffx-demo-risky-tractor-1842h',
      equipmentType: 'tractor',
      serialNumber: 'LV5075E7P0D18422',
      hourMeter: 1842,
      makeModelGuess: {
        make: 'John Deere',
        model: '5075E',
        family: '5E Utility Tractor',
        confidence: 82,
        basis: 'OCR pattern LV5075E + green/yellow body + loader geometry + decal family',
      },
      conditionScore: 63,
      confidence: 78,
      buyerQuestions: [
        'Can you provide service records for hydraulic hoses/cylinders in the last 24 months?',
        'Has the right rear panel or loader arm ever been repainted, welded, or replaced?',
        'Can you send a cold-start video and photo of the engine bay after 10 minutes of operation?',
      ],
      openRecordCommitment: 'Risky scenario preserves each defect as portable evidence instead of locking it in a paid portal.',
    },
  },
  {
    id: 'incomplete-seller-listing',
    label: 'Incomplete seller listing',
    description: 'Attractive listing photos, but not enough proof to trust yet.',
    demoBadge: 'Scenario: incomplete listing · missing evidence gate',
    slots: [
      scenarioSlot('walkaround', 'accepted', { label: 'Listing hero photo', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('serial', 'missing', undefined),
      scenarioSlot('hours', 'missing', undefined),
      scenarioSlot('hydraulics', 'missing', undefined),
      scenarioSlot('tires', 'review', { label: 'Partial tire crop', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('paint', 'accepted', { label: 'Polished paint photo', tone: 'clean' }, cleanAnalysis),
      scenarioSlot('engine', 'missing', undefined),
    ],
    findings: [
      {
        severity: 'red',
        category: 'Identity evidence missing',
        finding: 'No serial/PIN plate capture is available, so the listing cannot be anchored to paperwork or service records.',
        confidence: 96,
        evidence: 'serial',
        nextStep: 'Require a readable plate photo before deposit, travel, or wire transfer.',
      },
      {
        severity: 'red',
        category: 'Hour meter missing',
        finding: 'No dashboard/hour-meter evidence is supplied; displayed usage cannot be checked against wear.',
        confidence: 94,
        evidence: 'hours',
        nextStep: 'Ask for ignition-on dashboard photo and service records showing recent hours.',
      },
      {
        severity: 'yellow',
        category: 'Listing photo bias',
        finding: 'Provided views favor exterior appearance while omitting engine bay, hydraulics, and underside.',
        confidence: 88,
        evidence: 'walkaround',
        nextStep: 'Request the full FarmFax capture checklist before relying on condition claims.',
      },
    ],
    report: {
      reportId: 'ffx-demo-incomplete-listing',
      equipmentType: 'tractor',
      serialNumber: 'UNKNOWN',
      hourMeter: null,
      makeModelGuess: {
        make: 'Unknown',
        model: 'Utility tractor',
        family: 'Seller listing only',
        confidence: 34,
        basis: 'Exterior photo suggests category, but missing serial/decal/dashboard evidence prevents a model claim',
      },
      conditionScore: 42,
      confidence: 39,
      buyerQuestions: [
        'Can you send a readable serial/PIN plate photo?',
        'Can you send an ignition-on dashboard/hour-meter photo?',
        'Can you send engine bay, hydraulics, underside, and tire sidewall photos?',
      ],
      openRecordCommitment: 'Incomplete scenario demonstrates that FarmFax should surface uncertainty instead of inventing confidence.',
    },
  },
] as const satisfies readonly FarmFaxScenario[]

export const scenarioById: Record<ScenarioId, FarmFaxScenario> = farmFaxScenarios.reduce(
  (byId, scenario) => ({ ...byId, [scenario.id]: scenario }),
  {} as Record<ScenarioId, FarmFaxScenario>,
)

export function createScenarioState(scenarioId: ScenarioId = 'risky-tractor'): ScenarioState {
  const scenario = scenarioById[scenarioId]
  return {
    selectedScenarioId: scenario.id,
    slots: scenario.slots.map(slotCopy),
    findings: scenario.findings,
    reportSeed: scenario.report,
  }
}

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'load-scenario':
      return createScenarioState(action.scenarioId)
    case 'replace-slot-image':
      return {
        ...state,
        slots: state.slots.map((slot) =>
          slot.id === action.slotId
            ? { ...slot, image: action.image, state: 'accepted', analysis: action.analysis, video: action.video, mediaType: action.mediaType ?? 'image' }
            : slot,
        ),
      }
    case 'set-slot-analysis':
      return {
        ...state,
        slots: state.slots.map((slot) =>
          slot.id === action.slotId && slot.image === action.image
            ? { ...slot, analysis: action.analysis, video: action.video, mediaType: action.mediaType ?? slot.mediaType ?? 'image' }
            : slot,
        ),
      }
    case 'mark-slot-review':
      return {
        ...state,
        slots: state.slots.map((slot) => (slot.id === action.slotId ? { ...slot, state: 'review' } : slot)),
      }
    case 'clear-slot':
      return {
        ...state,
        slots: state.slots.map((slot) =>
          slot.id === action.slotId ? { ...slot, state: 'missing', image: undefined, analysis: undefined, video: undefined, mediaType: undefined } : slot,
        ),
      }
    default:
      return state
  }
}

export function scenarioStateForApp(scenarioId: ScenarioId) {
  const state = createScenarioState(scenarioId)
  return {
    selectedScenarioId: state.selectedScenarioId,
    slots: state.slots,
    findings: state.findings,
    reportSeed: state.reportSeed,
    analyzedCount: state.slots.filter((slot) => slot.analysis).length,
    missingEvidence: state.slots.filter((slot) => slot.state === 'missing').map((slot) => slot.title),
  }
}
