import { useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import './proof.css'

type Stage = {
  id: string
  agent: string
  agentRole: string
  section: string
  title: string
  headline: string
  detail: string
  kind: 'SIGNAL' | 'COPY PLATE' | 'WARRANT' | 'RAIL' | 'VERDICT' | 'BRIEF'
  metrics: { label: string; value: string; tone?: 'good' | 'warn' | 'danger' | 'stripe' }[]
  slips: { label: string; text: string }[]
  ledger: string
}

const stages: Stage[] = [
  {
    id: 'brief',
    agent: 'PRIME',
    agentRole: 'decomposes objective',
    section: '01 BRIEF',
    kind: 'BRIEF',
    title: 'Objective decomposition stamped',
    headline: 'The founder goal becomes a governed revenue mission.',
    detail: 'PRIME turns the raw commercial objective into constraints, approval rules, and measurable success criteria. This is not a chat session. It is an operating warrant.',
    metrics: [
      { label: 'Hard cap', value: '$250', tone: 'warn' },
      { label: 'Approval gates', value: '3', tone: 'good' },
      { label: 'Target window', value: '72h' },
    ],
    slips: [
      { label: 'MISSION', text: 'Generate qualified leads for a Hermes-powered agent ops product.' },
      { label: 'CONSTRAINT', text: 'No chargeable action may run without signed operator authority.' },
      { label: 'SUCCESS', text: 'Prove a path to 1 paid audit before scaling spend.' },
    ],
    ledger: 'PRIME stamped mission constraints — zero spend authority granted',
  },
  {
    id: 'market',
    agent: 'SCOUT',
    agentRole: 'scores reachable demand',
    section: '02 MARKET',
    kind: 'SIGNAL',
    title: 'Market signal forged',
    headline: 'SCOUT found a reachable wedge with pain now.',
    detail: 'Instead of scraping a lead list, the agent scores demand by urgency, buying trigger, channel reachability, and ability to pay.',
    metrics: [
      { label: 'Accounts scored', value: '128' },
      { label: 'Qualified', value: '31', tone: 'good' },
      { label: 'Fit score', value: '82', tone: 'good' },
    ],
    slips: [
      { label: 'ICP', text: 'Seed-stage AI infra teams shipping agent products.' },
      { label: 'TRIGGER', text: 'Their agents need spending/provisioning rails without runaway risk.' },
      { label: 'OBJECTION', text: 'Security, auditability, and proving ROI before budget expansion.' },
    ],
    ledger: 'SCOUT retained sources and scoring weights — 31 accounts passed threshold',
  },
  {
    id: 'assets',
    agent: 'GROWTH',
    agentRole: 'forges offer assets',
    section: '03 ASSETS',
    kind: 'COPY PLATE',
    title: 'Copy plate forged',
    headline: 'The offer is built around controlled autonomy, not AI novelty.',
    detail: 'GROWTH produces a wedge, CTA, and outreach packet designed to test willingness to pay quickly.',
    metrics: [
      { label: 'Landing variants', value: '3' },
      { label: 'Outbound snippets', value: '9' },
      { label: 'CTA clarity', value: 'A-', tone: 'good' },
    ],
    slips: [
      { label: 'CTA', text: 'Get a 10-minute Agent Ops Revenue Audit.' },
      { label: 'SUBJECT', text: 'Your agent can spend. Can it prove ROI?' },
      { label: 'HERO', text: 'Budgeted agents that turn workflows into revenue.' },
    ],
    ledger: 'GROWTH forged assets — no messages sent before approval',
  },
  {
    id: 'spend',
    agent: 'OPS',
    agentRole: 'prices reversible actions',
    section: '04 SPEND WARRANT',
    kind: 'WARRANT',
    title: 'Spend warrant blocked',
    headline: 'The machine stops where money starts.',
    detail: 'OPS stages chargeable actions behind a physical approval gate. The product moat is safe execution: budget cap, kill switch, and logged authority.',
    metrics: [
      { label: 'Lead enrichment', value: '$42', tone: 'warn' },
      { label: 'Micro-boost', value: '$75', tone: 'warn' },
      { label: 'Remaining cap', value: '$133', tone: 'good' },
    ],
    slips: [
      { label: 'APPROVE', text: 'Enrich 31 leads only if cost remains under $1.50/account.' },
      { label: 'HOLD', text: 'Reserve $75 boost until first 3 human replies arrive.' },
      { label: 'REJECT', text: '$500 cold ad test exceeds sprint cap and is refused.' },
    ],
    ledger: 'OPS requested $117 warrant — chargeable actions physically blocked',
  },
  {
    id: 'rail',
    agent: 'RAILS',
    agentRole: 'opens test checkout',
    section: '05 PAYMENT RAIL',
    kind: 'RAIL',
    title: 'Payment rail opened',
    headline: 'The revenue path is provisioned before demand is scaled.',
    detail: 'RAILS creates the monetization surface: a Stripe test product, recurring price, and checkout receipt that can attribute revenue back to the experiment.',
    metrics: [
      { label: 'Price', value: '$49/mo', tone: 'stripe' },
      { label: 'Mode', value: 'test' },
      { label: 'Live charges', value: 'locked', tone: 'danger' },
    ],
    slips: [
      { label: 'PRODUCT', text: 'Agent Ops Revenue Audit.' },
      { label: 'CHECKOUT', text: 'cs_test_revops_72h staged for demo attribution.' },
      { label: 'SAFETY', text: 'Live mode disabled until legal, billing, and operator gates pass.' },
    ],
    ledger: 'RAILS opened Stripe test rail — live charging remains disabled',
  },
  {
    id: 'ledger',
    agent: 'LEDGER',
    agentRole: 'issues verdict',
    section: '06 ROI LEDGER',
    kind: 'VERDICT',
    title: 'ROI verdict sealed',
    headline: 'The agent recommends a commercial decision, not a vibe.',
    detail: 'LEDGER compresses the experiment into a scale/hold/kill decision with expected CAC, break-even logic, and stop-loss thresholds.',
    metrics: [
      { label: 'Projected CAC', value: '$38', tone: 'good' },
      { label: 'Break-even', value: '1 sale' },
      { label: 'Verdict', value: 'HOLD→SCALE', tone: 'good' },
    ],
    slips: [
      { label: 'NEXT', text: 'Approve enrichment only. Hold ads until 3 qualified replies.' },
      { label: 'STOP', text: 'Pause if reply rate is below 4% after 50 sends.' },
      { label: 'SCALE', text: 'Expand to $750 only if CAC stays under $60.' },
    ],
    ledger: 'LEDGER issued HOLD→SCALE verdict — every action replayable',
  },
]

const agentStates = ['PRIME', 'SCOUT', 'GROWTH', 'OPS', 'RAILS', 'LEDGER']

const sponsorStack = [
  {
    sponsor: 'Nous Research',
    lane: 'ORCHESTRATION',
    primitive: 'Hermes Agent skills + tool calls',
    proof: '6 agents delegated · 5 skills executed · replayable operator log',
    value: 'Shows Hermes as the business-ops operating system, not a chatbot wrapper.',
  },
  {
    sponsor: 'Stripe',
    lane: 'COMMERCE RAIL',
    primitive: 'Spend warrant + checkout session + attribution',
    proof: '$250 cap · $117 staged spend · $49/mo test checkout · live locked',
    value: 'Positions Stripe as the financial control plane for agentic companies.',
  },
  {
    sponsor: 'NVIDIA',
    lane: 'RUNTIME',
    primitive: 'Accelerated inference + policy checks + workload trace',
    proof: 'research scoring · asset generation · ROI policy · scale path to GPU runtime',
    value: 'Frames NVIDIA as governed runtime infrastructure for real commercial agents.',
  },
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

function App() {
  const [objective, setObjective] = useState('Get 10 qualified paid-pilot conversations for a Hermes-powered agent ops product under a $250 cap. Require approval before spend.')
  const [stageIndex, setStageIndex] = useState(0)
  const [approved, setApproved] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const current = stages[stageIndex]

  const progress = Math.round(((stageIndex + 1) / stages.length) * 100)
  const ledgerLines = useMemo(() => {
    const base = stages.slice(0, stageIndex + 1).map((stage, index) => `[00:${String(12 + index * 11).padStart(2, '0')}] ${stage.ledger}`)
    if (approved) base.push('[01:05] OPERATOR signed spend warrant — cap enforced at $250')
    if (railOpen) base.push('[01:18] RAIL RECEIPT opened — Stripe test mode verified')
    return base
  }, [stageIndex, approved, railOpen])

  const proofPacket = useMemo(() => ({
    packet_id: 'rf_demo_001',
    standard: 'Commercial Autonomy Proof v0.1',
    product: 'Agentic Revenue Operator / Revenue Forge',
    thesis: 'Hermes orchestrates, NVIDIA accelerates, Stripe settles, and Revenue Forge proves every dollar and decision.',
    mission: {
      objective,
      budget_cap_usd: 250,
      staged_spend_usd: 117,
      live_charges_enabled: false,
      operator_approval_required: true,
      current_stage: current.section,
      verdict: stageIndex === stages.length - 1 ? 'HOLD_TO_SCALE' : 'FORGING',
    },
    sponsor_stack: sponsorStack.map((sponsor) => ({
      sponsor: sponsor.sponsor,
      lane: sponsor.lane,
      primitive: sponsor.primitive,
      proof: sponsor.proof,
    })),
    events: [
      {
        type: 'mission.created',
        agent: 'PRIME',
        framework: 'Hermes Agent',
        runtime: 'NVIDIA-accelerated inference ready',
        payment_rail: 'Stripe test mode',
        result: 'Commercial objective converted into governed revenue mission',
      },
      {
        type: 'market.scored',
        agent: 'SCOUT',
        framework: 'Hermes Agent skill execution',
        runtime: 'Accelerated scoring workload',
        result: '128 accounts scored, 31 qualified, fit score 82',
      },
      {
        type: 'spend.warrant.requested',
        agent: 'OPS',
        policy: 'budget_cap_usd <= 250 && human_approval_required',
        result: '$117 staged spend blocked until operator signature',
      },
      {
        type: approved ? 'operator.approval.signed' : 'operator.approval.pending',
        agent: 'OPERATOR',
        result: approved ? 'Spend warrant signed; cap still enforced' : 'No chargeable action has authority',
      },
      {
        type: 'stripe.checkout.created',
        agent: 'RAILS',
        payment_rail: 'Stripe',
        mode: 'test',
        checkout_session: 'cs_test_revops_72h',
        product: 'Agent Ops Revenue Audit',
        price: '$49/mo',
        live_charges_enabled: false,
      },
      {
        type: 'ledger.verdict.issued',
        agent: 'LEDGER',
        projected_cac_usd: 38,
        break_even_sales: 1,
        verdict: 'Hold paid spend until 3 qualified replies, then scale if CAC < $60',
      },
    ],
    ledger: ledgerLines,
  }), [approved, current.section, ledgerLines, objective, stageIndex])

  const proofMarkdown = useMemo(() => [
    '# Revenue Forge Proof Packet',
    '',
    `**Standard:** ${proofPacket.standard}`,
    `**Mission:** ${proofPacket.mission.objective}`,
    `**Budget cap:** $${proofPacket.mission.budget_cap_usd}`,
    `**Live charges enabled:** ${proofPacket.mission.live_charges_enabled ? 'yes' : 'no'}`,
    `**Verdict:** ${proofPacket.mission.verdict}`,
    '',
    '## Sponsor Stack',
    ...proofPacket.sponsor_stack.map((item) => `- **${item.sponsor} / ${item.lane}:** ${item.primitive} — ${item.proof}`),
    '',
    '## Proof Events',
    ...proofPacket.events.map((event) => `- \`${event.type}\` — ${event.agent}: ${'result' in event ? event.result : ''}`),
    '',
    '## Ledger',
    ...proofPacket.ledger.map((line) => `- ${line}`),
  ].join('\n'), [proofPacket])

  const exportJson = () => downloadFile('RevenueForge_ProofPacket_demo.json', JSON.stringify(proofPacket, null, 2), 'application/json')
  const exportMarkdown = () => downloadFile('RevenueForge_ProofPacket_demo.md', proofMarkdown, 'text/markdown')

  const nextStage = () => setStageIndex((index) => Math.min(stages.length - 1, index + 1))
  const reset = () => {
    setStageIndex(0)
    setApproved(false)
    setRailOpen(false)
  }

  return (
    <main className="forge-shell">
      <section className="forge-hero">
        <div className="system-mark">
          <span className="mark-dot" />
          HERMES / NVIDIA / STRIPE HACKATHON BUILD
        </div>
        <div className="hero-grid">
          <div>
            <h1>Revenue Forge Online</h1>
            <p className="hero-line">A supervised agentic machine that finds the market, forges the offer, requests spend authority, opens the payment rail, and stamps every move into an ROI ledger.</p>
          </div>
          <div className="mission-block">
            <label>Loaded objective</label>
            <textarea value={objective} onChange={(event) => setObjective(event.target.value)} />
            <div className="mission-metrics">
              <span><b>$250</b> cap</span>
              <span><b>0</b> live charges</span>
              <span><b>100%</b> replayable</span>
            </div>
          </div>
        </div>
      </section>

      <section className="machine-grid">
        <aside className="agent-circuit machine-panel">
          <div className="panel-kicker">Agent circuit</div>
          {agentStates.map((agent, index) => {
            const stage = stages[index]
            const state = index < stageIndex ? 'stamped' : index === stageIndex ? (agent === 'OPS' && !approved ? 'approval' : 'working') : 'idle'
            return (
              <div className={`circuit-node ${state}`} key={agent}>
                <div className="node-core">{agent.slice(0, 1)}</div>
                <div className="node-copy">
                  <strong>{agent}</strong>
                  <span>{stage.agentRole}</span>
                </div>
                <em>{state}</em>
              </div>
            )
          })}
        </aside>

        <section className="forge-bay machine-panel">
          <div className="packet-topbar">
            <span>{current.section}</span>
            <span>{progress}% forged</span>
          </div>
          <div className="packet-shell">
            <div className="packet-spine">
              {stages.map((stage, index) => (
                <button key={stage.id} className={index === stageIndex ? 'active' : index < stageIndex ? 'done' : ''} onClick={() => setStageIndex(index)}>
                  {stage.section.split(' ')[0]}
                </button>
              ))}
            </div>
            <article className={`artifact-plate ${current.kind.toLowerCase().replace(' ', '-')}`}>
              <div className="artifact-kind">{current.kind}</div>
              <h2>{current.title}</h2>
              <h3>{current.headline}</h3>
              <p>{current.detail}</p>
              <div className="instrument-row">
                {current.metrics.map((metric) => (
                  <div className={`instrument ${metric.tone ?? ''}`} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
              <div className="evidence-stack">
                {current.slips.map((slip) => (
                  <div className="evidence-slip" key={slip.label}>
                    <span>{slip.label}</span>
                    <p>{slip.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <aside className="controls-rail machine-panel">
          <div className="panel-kicker">Controls / consequences</div>
          <div className="budget-gauge" style={{ '--progress': `${progress}%` } as CSSProperties}>
            <span>Budget authority</span>
            <strong>{approved ? '$117 armed' : '$0 armed'}</strong>
            <div className="gauge-track"><i /></div>
            <p>Hard cap remains $250. Agent cannot exceed warrant.</p>
          </div>
          <div className={`warrant ${approved ? 'signed' : 'locked'}`}>
            <span>{approved ? 'SIGNED WARRANT' : 'LOCKED WARRANT'}</span>
            <strong>{approved ? 'Operator authority recorded' : 'Chargeable actions blocked'}</strong>
            <button onClick={() => setApproved(true)}>{approved ? 'Warrant signed' : 'Sign spend warrant'}</button>
          </div>
          <div className="rail-receipt">
            <span>PAYMENT RAIL / TEST MODE</span>
            <strong>Agent Ops Revenue Audit</strong>
            <p>$49/mo · cs_test_revops_72h</p>
            <button onClick={() => setRailOpen(true)}>Raise rail receipt</button>
          </div>
        </aside>
      </section>

      <section className="operator-bar machine-panel">
        <button onClick={nextStage} disabled={stageIndex === stages.length - 1}>Forge next artifact</button>
        <button className="secondary" onClick={() => setApproved(true)}>Arm $117 spend</button>
        <button className="ghost" onClick={reset}>Reset machine</button>
        <div className="verdict-dial"><span>Verdict</span><strong>{stageIndex === stages.length - 1 ? 'HOLD → SCALE' : 'FORGING'}</strong></div>
      </section>

      <section className="proof-ledger machine-panel">
        <div className="proof-header">
          <div>
            <span className="panel-kicker">Sponsor-native proof layer</span>
            <h2>Commercial Autonomy Proof Ledger</h2>
            <p>Hermes orchestrates, NVIDIA accelerates, Stripe settles, and Revenue Forge proves every dollar and decision.</p>
          </div>
          <div className="proof-actions">
            <button onClick={exportJson}>Export JSON</button>
            <button className="ghost" onClick={exportMarkdown}>Export MD</button>
          </div>
        </div>
        <div className="sponsor-grid">
          {sponsorStack.map((sponsor) => (
            <article className="sponsor-card" key={sponsor.sponsor}>
              <span>{sponsor.lane}</span>
              <strong>{sponsor.sponsor}</strong>
              <p>{sponsor.primitive}</p>
              <em>{sponsor.proof}</em>
              <small>{sponsor.value}</small>
            </article>
          ))}
        </div>
        <div className="proof-chain">
          {proofPacket.events.map((event, index) => (
            <div className="proof-event" key={event.type}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <span>{event.type}</span>
              <strong>{event.agent}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="ledger-ticker">
        <div className="ticker-label">Living Ledger</div>
        <div className="ticker-lines">
          {ledgerLines.map((line) => <span key={line}>{line}</span>)}
        </div>
      </section>

      {railOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Stripe rail receipt">
          <div className="rail-modal">
            <div className="modal-topline">
              <span>PAYMENT RAIL / STRIPE TEST</span>
              <button className="ghost mini" onClick={() => setRailOpen(false)}>Close</button>
            </div>
            <div className="stripe-word">stripe</div>
            <h2>Agent Ops Revenue Audit</h2>
            <p>Recurring offer generated by RAILS and bound to the current revenue mission.</p>
            <div className="receipt-lines">
              <div><span>Product</span><strong>Agent Ops Revenue Audit</strong></div>
              <div><span>Price</span><strong>$49.00 / month</strong></div>
              <div><span>Mode</span><strong>test</strong></div>
              <div><span>Checkout</span><strong>cs_test_revops_72h</strong></div>
            </div>
            <div className="modal-lock">{approved ? 'Spend warrant signed. Live charging still disabled for demo safety.' : 'Live charging locked. Sign the spend warrant before provisioning paid actions.'}</div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
