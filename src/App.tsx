import { useMemo, useState } from 'react'
import './App.css'
import './modal.css'

type Stage = {
  id: string
  agent: string
  title: string
  headline: string
  detail: string
  metrics: { label: string; value: string; tone?: 'good' | 'warn' | 'hot' }[]
  outputs: string[]
  audit: string
}

const stages: Stage[] = [
  {
    id: 'brief',
    agent: 'PRIME',
    title: 'Mission brief',
    headline: 'Objective decomposed into a revenue workflow.',
    detail: 'Turn one founder request into an executable GTM sprint: pick ICP, source prospects, generate assets, approve spend, publish a Stripe-backed offer, and report ROI.',
    metrics: [
      { label: 'Budget cap', value: '$250', tone: 'warn' },
      { label: 'Approval gates', value: '3', tone: 'good' },
      { label: 'Target window', value: '72h' },
    ],
    outputs: ['ICP: AI/devtools founders with 5–50 employees', 'Offer: $49/mo agent ops audit', 'Primary channel: founder-led LinkedIn + niche communities'],
    audit: 'Mission accepted. No spend authorized until operator approval.',
  },
  {
    id: 'research',
    agent: 'SCOUT',
    title: 'ICP + opportunity scan',
    headline: 'Scout found high-intent segments with pain now.',
    detail: 'The operator scores niches by urgency, ability to pay, reachable channels, and demo clarity. Generic lead lists are rejected.',
    metrics: [
      { label: 'Accounts scored', value: '128' },
      { label: 'Qualified leads', value: '31', tone: 'good' },
      { label: 'Avg fit score', value: '82/100', tone: 'good' },
    ],
    outputs: ['Top segment: seed-stage AI infra teams shipping agent products', 'Buying trigger: demos need payment/provisioning rails', 'Objection: security + runaway spend risk'],
    audit: 'Read-only research completed. Source URLs and scoring weights logged.',
  },
  {
    id: 'assets',
    agent: 'GROWTH',
    title: 'Campaign asset generator',
    headline: 'Growth produced a testable wedge and outreach package.',
    detail: 'The copy is tied to the judge/customer pain: agents should operate under budget, payment, and audit controls.',
    metrics: [
      { label: 'Landing variants', value: '3' },
      { label: 'Outbound snippets', value: '9' },
      { label: 'CTA clarity', value: 'A-', tone: 'good' },
    ],
    outputs: ['CTA: “Get a 10-minute Agent Ops Revenue Audit”', 'Subject: Your agent can spend. Can it prove ROI?', 'Landing hero: Budgeted agents that turn workflows into revenue'],
    audit: 'Creative generated. No messages sent before operator approval.',
  },
  {
    id: 'spend',
    agent: 'OPS',
    title: 'Budgeted spend gate',
    headline: 'Ops built the spend plan but held execution at the approval gate.',
    detail: 'The agent can buy enrichment, provision SaaS, or boost a test — but every paid action is capped, justified, and reversible.',
    metrics: [
      { label: 'Enrichment', value: '$42' },
      { label: 'Micro-boost', value: '$75' },
      { label: 'Remaining cap', value: '$133', tone: 'warn' },
    ],
    outputs: ['Approve: enrich 31 leads @ <$1.50 each', 'Approve: reserve $75 for highest-performing asset', 'Reject: $500 cold ad test — exceeds sprint cap'],
    audit: 'Spend plan staged. Requires FINAL APPROVE before chargeable actions.',
  },
  {
    id: 'stripe',
    agent: 'RAILS',
    title: 'Stripe monetization rail',
    headline: 'Rails provisioned a test-mode offer and checkout path.',
    detail: 'The demo shows the business loop: a generated offer can accept payment, route a customer to onboarding, and update the operator report.',
    metrics: [
      { label: 'Price', value: '$49/mo', tone: 'hot' },
      { label: 'Mode', value: 'test' },
      { label: 'Checkout', value: 'ready', tone: 'good' },
    ],
    outputs: ['Product: Agent Ops Revenue Audit', 'Price: monthly recurring $49', 'Checkout URL: stripe.test/agent-ops-audit'],
    audit: 'Stripe test rail created. Live mode disabled until legal/billing checklist passes.',
  },
  {
    id: 'ledger',
    agent: 'LEDGER',
    title: 'ROI + control report',
    headline: 'Ledger converts activity into a decision, not a vibe.',
    detail: 'The operator sees spend, expected pipeline, risks, next actions, and a complete audit trail for every autonomous step.',
    metrics: [
      { label: 'Projected CAC', value: '$38', tone: 'good' },
      { label: 'Break-even', value: '1 sale' },
      { label: 'Expected ROI', value: '2.7x', tone: 'hot' },
    ],
    outputs: ['Next action: approve enrichment only, hold ads until 3 replies', 'Risk: low sample size; cap follow-up to 48h', 'Kill switch: pause if reply rate <4% after 50 sends'],
    audit: 'Sprint ready for operator decision. All spend remains inside cap.',
  },
]

const agents = [
  { name: 'PRIME', role: 'strategy', status: 'orchestrating' },
  { name: 'SCOUT', role: 'market intel', status: 'complete' },
  { name: 'GROWTH', role: 'assets', status: 'armed' },
  { name: 'OPS', role: 'spend guard', status: 'waiting approval' },
  { name: 'RAILS', role: 'Stripe/x402', status: 'test-ready' },
  { name: 'LEDGER', role: 'ROI audit', status: 'monitoring' },
]

function App() {
  const [objective, setObjective] = useState('Generate qualified leads for a Hermes-powered agent ops product, spend under $250, and prove ROI before scaling.')
  const [stageIndex, setStageIndex] = useState(0)
  const [approved, setApproved] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const current = stages[stageIndex]
  const completed = useMemo(() => Math.round(((stageIndex + 1) / stages.length) * 100), [stageIndex])
  const auditTrail = stages.slice(0, stageIndex + 1).map((stage) => `${stage.agent}: ${stage.audit}`)

  const runNext = () => setStageIndex((idx) => Math.min(idx + 1, stages.length - 1))
  const reset = () => {
    setStageIndex(0)
    setApproved(false)
    setCheckoutOpen(false)
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">Hermes Agent × NVIDIA × Stripe hackathon concept</div>
          <h1>Agentic Revenue Operator</h1>
          <p className="lede">A supervised business agent that researches a market, spends inside a hard budget, provisions monetization, and reports ROI — with approval gates instead of runaway autonomy.</p>
          <div className="hero-actions">
            <button onClick={runNext} disabled={stageIndex === stages.length - 1}>Run next agent</button>
            <button className="secondary" onClick={() => setApproved(true)}>FINAL APPROVE staged spend</button>
            <button className="ghost" onClick={reset}>Reset demo</button>
          </div>
        </div>
        <div className="mission-card">
          <span className="pulse" />
          <label>Operator objective</label>
          <textarea value={objective} onChange={(event) => setObjective(event.target.value)} />
          <div className="guardrail-grid">
            <div><strong>$250</strong><span>hard budget cap</span></div>
            <div><strong>0</strong><span>live charges without approval</span></div>
            <div><strong>100%</strong><span>audited actions</span></div>
          </div>
        </div>
      </section>

      <section className="status-strip">
        <div>
          <span className="muted">Workflow progress</span>
          <strong>{completed}%</strong>
        </div>
        <div className="progress"><span style={{ width: `${completed}%` }} /></div>
        <div className={approved ? 'approval approved' : 'approval'}>{approved ? 'Spend gate approved' : 'Spend gate locked'}</div>
      </section>

      <section className="grid">
        <aside className="panel agents-panel">
          <h2>Agent swarm</h2>
          {agents.map((agent) => (
            <div className="agent" key={agent.name}>
              <div className="avatar">{agent.name.slice(0, 1)}</div>
              <div>
                <strong>{agent.name}</strong>
                <span>{agent.role}</span>
              </div>
              <em>{agent.status}</em>
            </div>
          ))}
        </aside>

        <section className="panel main-stage">
          <div className="stage-topline">
            <span>{current.agent}</span>
            <span>{stageIndex + 1}/{stages.length}</span>
          </div>
          <h2>{current.title}</h2>
          <h3>{current.headline}</h3>
          <p>{current.detail}</p>

          <div className="metrics">
            {current.metrics.map((metric) => (
              <div className={`metric ${metric.tone ?? ''}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="outputs">
            <h4>Generated outputs</h4>
            {current.outputs.map((output) => <p key={output}>↳ {output}</p>)}
          </div>
        </section>

        <aside className="panel rail-panel">
          <h2>Revenue rail</h2>
          <div className="checkout-card">
            <span>Stripe test offer</span>
            <strong>Agent Ops Revenue Audit</strong>
            <p>$49 / month · recurring</p>
            <button className="checkout" onClick={() => setCheckoutOpen(true)}>Open test checkout</button>
          </div>
          <div className="risk-box">
            <h4>Autonomy constraints</h4>
            <p>Budget cap: $250</p>
            <p>Paid action: approval required</p>
            <p>Kill switch: reply rate &lt;4%</p>
            <p>Live mode: disabled</p>
          </div>
        </aside>
      </section>

      <section className="panel audit-panel">
        <div>
          <h2>Ledger audit trail</h2>
          <p>Every agent action becomes operator-readable evidence.</p>
        </div>
        <ol>
          {auditTrail.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      {checkoutOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Stripe test checkout preview">
          <div className="stripe-modal">
            <div className="modal-topline">
              <span>Stripe test checkout</span>
              <button className="ghost small" onClick={() => setCheckoutOpen(false)}>Close</button>
            </div>
            <div className="stripe-brand">stripe</div>
            <h2>Agent Ops Revenue Audit</h2>
            <p>Recurring offer generated by RAILS for the current GTM sprint.</p>
            <div className="invoice-lines">
              <div><span>Monthly subscription</span><strong>$49.00</strong></div>
              <div><span>Mode</span><strong>test</strong></div>
              <div><span>Session</span><strong>cs_test_revops_72h</strong></div>
            </div>
            <div className="modal-decision">
              <strong>{approved ? 'Operator approval recorded' : 'Live charging locked'}</strong>
              <span>{approved ? 'Safe to route demo customers through test checkout.' : 'Approve spend before any real provisioning or paid action.'}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
