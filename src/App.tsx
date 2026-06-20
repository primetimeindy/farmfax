import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'

type CaptureState = 'accepted' | 'review' | 'missing'
type Severity = 'green' | 'yellow' | 'red'
type SlotId = 'walkaround' | 'serial' | 'hours' | 'hydraulics' | 'tires' | 'paint' | 'engine'

type CaptureSlot = {
  id: SlotId
  title: string
  prompt: string
  why: string
  state: CaptureState
  image?: string
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
  buyer_questions: string[]
  missing_evidence: string[]
  open_record_guarantee: string
  sponsor_stack: string[]
}

const initialSlots: CaptureSlot[] = [
  {
    id: 'walkaround',
    title: '360° walkaround',
    prompt: 'Slow phone video or four photos: front, left, rear, right.',
    why: 'Establishes baseline body condition and prevents cherry-picked seller photos.',
    state: 'accepted',
  },
  {
    id: 'serial',
    title: 'Serial / PIN plate',
    prompt: 'Move close, avoid glare, capture the entire plate and nearby decals.',
    why: 'Cross-references make/model family and anchors the portable equipment record.',
    state: 'accepted',
  },
  {
    id: 'hours',
    title: 'Hour meter + dashboard',
    prompt: 'Capture ignition-on hour meter, warning lights, and display glass.',
    why: 'Flags odometer/hour inconsistency and creates negotiation evidence.',
    state: 'accepted',
  },
  {
    id: 'hydraulics',
    title: 'Hydraulic lines / cylinders',
    prompt: 'Capture lift cylinders, hoses, couplers, wet spots, and ground underneath.',
    why: 'Hydraulic seepage can turn a cheap deal into an expensive repair.',
    state: 'review',
  },
  {
    id: 'tires',
    title: 'Tires / tracks / undercarriage',
    prompt: 'Capture tread depth, sidewalls, cracks, lugs, and uneven wear.',
    why: 'Tires and tracks are visible, expensive, and often hidden in listings.',
    state: 'accepted',
  },
  {
    id: 'paint',
    title: 'Paint / body / welds',
    prompt: 'Capture loader arms, hood panels, frame rails, welds, dents, repaint zones.',
    why: 'Paint mismatch can signal cosmetic repaint, repaired collision, or replacement panels.',
    state: 'review',
  },
  {
    id: 'engine',
    title: 'Engine bay / cold start',
    prompt: 'Capture engine bay plus 10s start video if available.',
    why: 'Visual AI cannot certify internals, but can flag leaks, smoke context, and missing evidence.',
    state: 'missing',
  },
]

const findings: Finding[] = [
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
  {
    severity: 'green',
    category: 'Tire wear',
    finding: 'Visible tread/lug wear appears serviceable; no obvious sidewall cracking in provided shot.',
    confidence: 71,
    evidence: 'tires',
    nextStep: 'Measure tread depth and check inside sidewalls before purchase.',
  },
]

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

const sponsorStack = [
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
    line: 'Paid verification, hosted report links, dealer/shop subscriptions — without holding equipment records hostage.',
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

function App() {
  const [slots, setSlots] = useState<CaptureSlot[]>(initialSlots)
  const [equipmentType, setEquipmentType] = useState('tractor')
  const [stripeOpen, setStripeOpen] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding>(findings[0])

  const acceptedCount = slots.filter((slot) => slot.state === 'accepted').length
  const reviewCount = slots.filter((slot) => slot.state === 'review').length
  const missing = slots.filter((slot) => slot.state === 'missing')
  const conditionScore = useMemo(() => {
    const penalty = findings.reduce((sum, finding) => sum + severityWeight(finding.severity), 0) + missing.length * 5
    return Math.max(0, Math.min(100, 94 - penalty + acceptedCount * 2))
  }, [acceptedCount, missing.length])

  const report: FarmFaxReport = useMemo(() => ({
    report_id: 'ffx-demo-5075e-1842h',
    schema_version: 'farmfax.report.v0.1-open',
    equipment_type: equipmentType,
    serial_number: 'LV5075E7P0D18422',
    hour_meter: 1842,
    make_model_guess: catalogCandidates[0],
    condition_score: conditionScore,
    confidence: 78,
    findings,
    buyer_questions: [
      'Can you provide service records for hydraulic hoses/cylinders in the last 24 months?',
      'Has the right rear panel or loader arm ever been repainted, welded, or replaced?',
      'Can you send a cold-start video and photo of the engine bay after 10 minutes of operation?',
      'Does the serial/PIN plate match the bill of sale, lien/title paperwork, and dealer stock record?',
    ],
    missing_evidence: missing.map((slot) => slot.title),
    open_record_guarantee: 'Core FarmFax records export as JSON/PDF. Paid hosting can end; the machine history still moves with the owner.',
    sponsor_stack: sponsorStack.map((item) => item.name),
  }), [conditionScore, equipmentType, missing])

  function updateSlotImage(slotId: SlotId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSlots((current) => current.map((slot) => slot.id === slotId
        ? { ...slot, image: String(reader.result), state: 'accepted' }
        : slot))
    }
    reader.readAsDataURL(file)
  }

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
          <h1>Scan the machine before you buy the story.</h1>
          <p className="lede">
            FarmFax turns a phone walkthrough into an open, evidence-backed condition report for tractors, skid steers,
            trailers, implements, and other working equipment. It cross-references serial/PIN plates, make/model clues,
            visible defects, and maintenance evidence — then exports a portable record the owner controls.
          </p>
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
          <p>{catalogCandidates[0].make} {catalogCandidates[0].model} · {report.hour_meter.toLocaleString()} hrs · report confidence {report.confidence}%</p>
          <div className="mini-stats">
            <div><b>{acceptedCount}</b><span>captures</span></div>
            <div><b>{reviewCount}</b><span>review</span></div>
            <div><b>{findings.length}</b><span>findings</span></div>
          </div>
        </aside>
      </section>

      <section className="sponsor-row sponsor-stack">
        {sponsorStack.map((item) => (
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
              <button key={type} className={equipmentType === type ? 'active' : 'ghost'} onClick={() => setEquipmentType(type)}>{type}</button>
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
                <label>
                  {slot.image ? <img src={slot.image} alt={`${slot.title} upload`} /> : <div className="phone-placeholder">tap to add photo</div>}
                  <input accept="image/*" capture="environment" type="file" onChange={(event) => updateSlotImage(slot.id, event)} />
                </label>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel vision-panel">
          <div className="section-label">open cv + nemotron pass</div>
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
              <p>Plate crop confidence 86%. User confirmation required before report verification.</p>
            </article>
            <article>
              <span>hour meter</span>
              <b>{report.hour_meter.toLocaleString()} hrs</b>
              <p>Dashboard OCR confidence 79%. Ask for service records around this hour mark.</p>
            </article>
            <article>
              <span>external IDs</span>
              <b>dealer stock · auction lot · owner log</b>
              <p>Future adapters preserve OEM/dealer/auction references without locking the record inside one system.</p>
            </article>
          </div>
          <div className="candidate-list">
            {catalogCandidates.map((candidate) => (
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
            owners can export JSON/PDF, mechanics can add verified service events, and paid hosting never becomes data captivity.
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
          <h2>Buyer packet generated.</h2>
          <div className="report-score">
            <strong>{report.condition_score}</strong>
            <div>
              <b>{report.make_model_guess.make} {report.make_model_guess.model}</b>
              <p>Visible-condition score. Not a mechanical guarantee, title check, appraisal, or replacement for an inspector.</p>
            </div>
          </div>
          <div className="question-grid">
            {report.buyer_questions.map((question) => (
              <div key={question}><b>ask seller</b><p>{question}</p></div>
            ))}
          </div>
          <div className="data-disclosures">
            <p><b>Missing evidence:</b> {report.missing_evidence.length ? report.missing_evidence.join(', ') : 'none'}</p>
            <p><b>Open record:</b> {report.open_record_guarantee}</p>
            <p><b>Guardrail:</b> FarmFax reports visible evidence and confidence. Unknowns stay unknown.</p>
          </div>
          <div className="hero-actions">
            <button onClick={exportReport}>Download report JSON</button>
            <button className="ghost" onClick={() => window.print()}>Print / save PDF</button>
          </div>
        </div>

        <aside className="panel commerce-panel">
          <div className="section-label">Stripe rail</div>
          <h2>$29</h2>
          <p>Demo checkout for verified hosted report, seller share link, and dealer/shop branding. Export remains available without paying.</p>
          <button onClick={() => setStripeOpen(true)}>Open Stripe checkout demo</button>
        </aside>
      </section>

      <section className="source-trail">
        <b>audit trail</b>
        <p>[phone] guided capture slots · accepted {acceptedCount}/7 · missing {missing.length}</p>
        <p>[cv] rust/paint/leak/wear detectors are evidence-first and confidence-scored</p>
        <p>[nemotron] structured multimodal reasoning over findings, OCR, missing evidence, and buyer questions</p>
        <p>[hermes] orchestrates capture → detection → catalog → report → export/payment</p>
        <p>[stripe] workflow payments only; record ownership and export rights stay with the machine owner</p>
      </section>

      {stripeOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="stripe-modal">
            <div className="modal-topline"><span>Stripe checkout simulation</span><button className="ghost" onClick={() => setStripeOpen(false)}>close</button></div>
            <div className="stripe-word">Stripe</div>
            <h2>Verified FarmFax report</h2>
            <p>Pay for hosted verification, share link, and dealer/shop branding. The underlying equipment record still exports as open JSON/PDF.</p>
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
