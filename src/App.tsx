import { useMemo, useState } from 'react'
import { baseScores, buildProofPacket, proofPacketToMarkdown, sponsorStack } from './proofPacket'
import './App.css'

type GoalKey = 'homestead' | 'build' | 'farm' | 'inherit' | 'income'
type LayerKey = 'access' | 'soil' | 'water' | 'flood' | 'policy'

type Goal = {
  key: GoalKey
  label: string
  prompt: string
  boost: number
}

type Layer = {
  key: LayerKey
  label: string
  status: 'green' | 'yellow' | 'red'
  summary: string
  proof: string
}

const goals: Goal[] = [
  {
    key: 'homestead',
    label: 'Homestead + goats',
    prompt: 'Build a small home, keep goats, drill a well, and qualify for an ag valuation.',
    boost: 2,
  },
  {
    key: 'build',
    label: 'Build a cabin',
    prompt: 'Build a weekend cabin with driveway, septic, well, and power access.',
    boost: -1,
  },
  {
    key: 'farm',
    label: 'Small farm',
    prompt: 'Grow pasture, orchard rows, and a farm stand without over-improving the land.',
    boost: 7,
  },
  {
    key: 'inherit',
    label: 'Inherited land',
    prompt: 'Decide whether to keep, lease, improve, or sell family land safely.',
    boost: 4,
  },
  {
    key: 'income',
    label: 'Income potential',
    prompt: 'Evaluate grazing, hunting, solar, timber, conservation, and short-stay income paths.',
    boost: -3,
  },
]

const layers: Layer[] = [
  {
    key: 'access',
    label: 'Access',
    status: 'yellow',
    summary: 'Private road touches the parcel, but recorded easement is not verified.',
    proof: 'Title/easement check required before offer.',
  },
  {
    key: 'soil',
    label: 'Soil',
    status: 'green',
    summary: 'Pasture-suitable soil with moderate drainage and workable slope.',
    proof: 'USDA NRCS soil screen: pasture/goats/orchard plausible.',
  },
  {
    key: 'water',
    label: 'Water + septic',
    status: 'yellow',
    summary: 'Well/septic likely possible but unpriced; perc test is unresolved.',
    proof: 'Budget $2.5k–$8k pre-close due diligence range.',
  },
  {
    key: 'flood',
    label: 'Flood / wetlands',
    status: 'green',
    summary: 'Proposed homesite sits outside the demo flood/wetland risk overlay.',
    proof: 'FEMA + NWI screen clear near building pad; verify panel.',
  },
  {
    key: 'policy',
    label: 'Policy + programs',
    status: 'green',
    summary: 'Ag/timber valuation and NRCS support may apply if use-history rules are met.',
    proof: 'County appraisal + FSA/NRCS calls needed.',
  },
]

const dueDiligence = [
  { label: 'Survey refresh', cost: '$1,200–$2,500', tone: 'yellow' },
  { label: 'Perc + septic design', cost: '$650–$1,800', tone: 'yellow' },
  { label: 'Well quote', cost: '$0–$250 quote', tone: 'green' },
  { label: 'Title/easement review', cost: '$300–$900', tone: 'red' },
]

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function statusLabel(status: 'green' | 'yellow' | 'red') {
  if (status === 'green') return 'Clear'
  if (status === 'yellow') return 'Verify'
  return 'Stop'
}

function App() {
  const [selectedGoal, setSelectedGoal] = useState<GoalKey>('homestead')
  const [activeLayer, setActiveLayer] = useState<LayerKey>('access')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [parcelInput, setParcelInput] = useState('12.4 acres near Lockhart, TX · APN R-18422-DEMO · $89,000')

  const goal = goals.find((item) => item.key === selectedGoal) ?? goals[0]
  const layer = layers.find((item) => item.key === activeLayer) ?? layers[0]
  const ledgerLines = useMemo(() => [
    '[00:04] PRIME translated buyer goal into land-use hypothesis',
    '[00:12] ATLAS mapped parcel fixture and county/APN identity',
    `[00:23] SCOUT checked active layer: ${layer.label}`,
    '[00:37] LEDGER generated questions for seller, county, lender, and extension office',
    checkoutOpen ? '[00:51] STRIPE test checkout staged for $19 Land Reality Check' : '[00:51] STRIPE checkout locked until buyer asks for full report',
  ], [checkoutOpen, layer.label])

  const packet = useMemo(() => buildProofPacket({
    goal: goal.prompt,
    activeLayer: layer.label,
    checkoutOpen,
    ledgerLines,
    scoreBoost: goal.boost,
  }), [checkoutOpen, goal.boost, goal.prompt, layer.label, ledgerLines])

  const markdown = useMemo(() => proofPacketToMarkdown(packet), [packet])
  const exportJson = () => downloadFile('ParcelProof_LandDecisionPacket_demo.json', JSON.stringify(packet, null, 2), 'application/json')
  const exportMarkdown = () => downloadFile('ParcelProof_LandDecisionPacket_demo.md', markdown, 'text/markdown')

  return (
    <main className="parcel-shell">
      <section className="hero-panel">
        <div className="navline">
          <span className="pulse" />
          PARCELPROOF / HERMES × NVIDIA × STRIPE
        </div>
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Carfax for land decisions</p>
            <h1>Before you buy land, know what it can actually become.</h1>
            <p className="hero-copy">
              Paste a listing or parcel, choose your real-life goal, and get a plain-English reality check on buildability, access, water, soil, risk, policy, and income potential.
            </p>
            <div className="hero-actions">
              <button onClick={() => setCheckoutOpen(true)}>Unlock $19 report</button>
              <button className="ghost" onClick={exportMarkdown}>Export packet</button>
            </div>
          </div>
          <div className="search-card">
            <label>Paste listing, APN, address, or Acres-style map link</label>
            <textarea value={parcelInput} onChange={(event) => setParcelInput(event.target.value)} />
            <div className="parcel-facts">
              <span><b>12.4</b> acres</span>
              <span><b>$89k</b> list</span>
              <span><b>{packet.fit_score}</b> fit score</span>
            </div>
          </div>
        </div>
      </section>

      <section className="goal-strip">
        {goals.map((item) => (
          <button key={item.key} className={item.key === selectedGoal ? 'goal active' : 'goal'} onClick={() => setSelectedGoal(item.key)}>
            <span>{item.label}</span>
            <small>{item.prompt}</small>
          </button>
        ))}
      </section>

      <section className="command-grid">
        <aside className="left-panel panel">
          <div className="panel-title">Land research team</div>
          {['PRIME', 'ATLAS', 'SCOUT', 'WATER', 'POLICY', 'LEDGER'].map((agent, index) => (
            <div className="agent-row" key={agent}>
              <div className="agent-orb">{index + 1}</div>
              <div>
                <strong>{agent}</strong>
                <span>{['goal fit', 'parcel map', 'risk layers', 'well/septic', 'programs', 'verdict'][index]}</span>
              </div>
            </div>
          ))}
        </aside>

        <section className="map-panel panel">
          <div className="map-topbar">
            <span>Live parcel visualizer</span>
            <strong>{layer.label} layer active</strong>
          </div>
          <div className={`parcel-map layer-${activeLayer}`}>
            <div className="contour c1" />
            <div className="contour c2" />
            <div className="contour c3" />
            <div className="flood-wash" />
            <div className="soil-grid" />
            <div className="road main-road">County Rd 214</div>
            <div className="parcel-shape">
              <span className="pin homesite">home</span>
              <span className="pin water">well?</span>
              <span className="pin gate">gate</span>
              <span className="acre-label">12.4 AC<br />APN R-18422</span>
            </div>
          </div>
          <div className="layer-buttons">
            {layers.map((item) => (
              <button key={item.key} className={item.key === activeLayer ? `layer ${item.status} active` : `layer ${item.status}`} onClick={() => setActiveLayer(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <aside className="right-panel panel">
          <div className="verdict-card">
            <span>Verdict</span>
            <strong>{packet.verdict.replace('_', ' ')}</strong>
            <p>Do not write an offer until access/easement and septic feasibility are verified.</p>
          </div>
          <div className="active-layer-card">
            <span className={`status ${layer.status}`}>{statusLabel(layer.status)}</span>
            <h3>{layer.label}</h3>
            <p>{layer.summary}</p>
            <small>{layer.proof}</small>
          </div>
          <button onClick={exportJson}>Export JSON packet</button>
          <button className="secondary" onClick={exportMarkdown}>Export Markdown packet</button>
        </aside>
      </section>

      <section className="score-section">
        <div className="section-head">
          <p className="eyebrow">Plain-English reality check</p>
          <h2>What regular buyers need to know before signing.</h2>
        </div>
        <div className="score-grid">
          {baseScores.map((score) => (
            <article className={`score-card ${score.status}`} key={score.label}>
              <div className="score-ring">{score.score}</div>
              <div>
                <span>{statusLabel(score.status)}</span>
                <h3>{score.label}</h3>
                <p>{score.finding}</p>
                <small>{score.nextAction}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="packet-grid">
        <div className="packet panel">
          <div className="panel-title">Land Decision Packet</div>
          <h2>{packet.parcel.title}</h2>
          <p>{goal.prompt}</p>
          <div className="packet-meta">
            <span>APN <b>{packet.parcel.apn}</b></span>
            <span>County <b>{packet.parcel.county}</b></span>
            <span>Due diligence <b>${packet.estimated_due_diligence_cost_usd.toLocaleString()}</b></span>
          </div>
          <div className="question-columns">
            <div>
              <h3>Ask the seller</h3>
              {packet.seller_questions.slice(0, 3).map((question) => <p key={question}>• {question}</p>)}
            </div>
            <div>
              <h3>Ask the county</h3>
              {packet.county_questions.slice(0, 3).map((question) => <p key={question}>• {question}</p>)}
            </div>
          </div>
        </div>

        <div className="costs panel">
          <div className="panel-title">Costs before closing</div>
          {dueDiligence.map((item) => (
            <div className={`cost-row ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.cost}</strong>
            </div>
          ))}
          <div className="stripe-box">
            <span>Stripe rail</span>
            <strong>$19 Land Reality Check</strong>
            <p>Test checkout for full buyer packet + expert-review upsell. Live charges locked in demo.</p>
            <button onClick={() => setCheckoutOpen(true)}>Stage checkout</button>
          </div>
        </div>
      </section>

      <section className="sponsor-section panel">
        <div>
          <p className="eyebrow">Why sponsors care</p>
          <h2>Useful to everyday users. Native to the sponsor stack.</h2>
        </div>
        <div className="sponsor-grid">
          {sponsorStack.map((sponsor) => (
            <article key={sponsor.sponsor}>
              <span>{sponsor.lane}</span>
              <h3>{sponsor.sponsor}</h3>
              <p>{sponsor.value}</p>
              <small>{sponsor.proof}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="ledger panel">
        <div className="ticker-label">Source trail</div>
        <div className="ticker-lines">
          {packet.events.map((event) => (
            <p key={event.id}><b>{event.agent}</b> / {event.type}: {event.result}</p>
          ))}
          {ledgerLines.map((line) => <p key={line}>{line}</p>)}
        </div>
      </section>

      {checkoutOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="stripe-modal">
            <div className="modal-topline">
              <span>Stripe test checkout</span>
              <button className="mini ghost" onClick={() => setCheckoutOpen(false)}>Close</button>
            </div>
            <div className="stripe-word">stripe</div>
            <h2>Unlock Land Reality Check</h2>
            <p>Demo checkout for the complete ParcelProof packet, source trail, and county call script. Live charges are disabled.</p>
            <div className="receipt-lines">
              <div><span>Product</span><strong>ParcelProof Report</strong></div>
              <div><span>Mode</span><strong>Test</strong></div>
              <div><span>Price</span><strong>$19.00</strong></div>
              <div><span>Session</span><strong>cs_test_land_12ac</strong></div>
            </div>
            <div className="modal-lock">Human approval required before paid report or expert-review upsell.</div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
