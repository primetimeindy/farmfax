export type SponsorProof = {
  sponsor: 'Nous Research' | 'Stripe' | 'NVIDIA'
  lane: string
  primitive: string
  proof: string
  value: string
}

export type ProofEvent = {
  id: string
  type: string
  agent: string
  framework?: string
  runtime?: string
  payment_rail?: string
  policy?: string
  mode?: string
  checkout_session?: string
  product?: string
  price?: string
  projected_cac_usd?: number
  break_even_sales?: number
  live_charges_enabled?: boolean
  result?: string
  verdict?: string
}

export type ProofPacket = {
  packet_id: string
  standard: string
  product: string
  schema_version: string
  thesis: string
  mission: {
    objective: string
    budget_cap_usd: number
    staged_spend_usd: number
    live_charges_enabled: boolean
    operator_approval_required: boolean
    current_stage: string
    verdict: 'FORGING' | 'HOLD_TO_SCALE'
  }
  sponsor_stack: Omit<SponsorProof, 'value'>[]
  events: ProofEvent[]
  ledger: string[]
  replay: {
    demo_route: string
    export_formats: string[]
    deterministic: boolean
  }
}

export const sponsorStack: SponsorProof[] = [
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

export function buildProofPacket(input: {
  objective: string
  approved: boolean
  currentStage: string
  finalStageReached: boolean
  ledgerLines: string[]
}): ProofPacket {
  const { objective, approved, currentStage, finalStageReached, ledgerLines } = input

  return {
    packet_id: 'rf_demo_001',
    standard: 'Commercial Autonomy Proof v0.1',
    schema_version: '0.1.0',
    product: 'Agentic Revenue Operator / Revenue Forge',
    thesis: 'Hermes orchestrates, NVIDIA accelerates, Stripe settles, and Revenue Forge proves every dollar and decision.',
    mission: {
      objective,
      budget_cap_usd: 250,
      staged_spend_usd: 117,
      live_charges_enabled: false,
      operator_approval_required: true,
      current_stage: currentStage,
      verdict: finalStageReached ? 'HOLD_TO_SCALE' : 'FORGING',
    },
    sponsor_stack: sponsorStack.map(({ sponsor, lane, primitive, proof }) => ({ sponsor, lane, primitive, proof })),
    events: [
      {
        id: 'evt_001_mission_created',
        type: 'mission.created',
        agent: 'PRIME',
        framework: 'Hermes Agent',
        runtime: 'NVIDIA-accelerated inference ready',
        payment_rail: 'Stripe test mode',
        result: 'Commercial objective converted into governed revenue mission',
      },
      {
        id: 'evt_002_market_scored',
        type: 'market.scored',
        agent: 'SCOUT',
        framework: 'Hermes Agent skill execution',
        runtime: 'Accelerated scoring workload',
        result: '128 accounts scored, 31 qualified, fit score 82',
      },
      {
        id: 'evt_003_spend_warrant_requested',
        type: 'spend.warrant.requested',
        agent: 'OPS',
        policy: 'budget_cap_usd <= 250 && human_approval_required',
        result: '$117 staged spend blocked until operator signature',
      },
      {
        id: approved ? 'evt_004_operator_approval_signed' : 'evt_004_operator_approval_pending',
        type: approved ? 'operator.approval.signed' : 'operator.approval.pending',
        agent: 'OPERATOR',
        result: approved ? 'Spend warrant signed; cap still enforced' : 'No chargeable action has authority',
      },
      {
        id: 'evt_005_stripe_checkout_created',
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
        id: 'evt_006_ledger_verdict_issued',
        type: 'ledger.verdict.issued',
        agent: 'LEDGER',
        projected_cac_usd: 38,
        break_even_sales: 1,
        verdict: 'Hold paid spend until 3 qualified replies, then scale if CAC < $60',
      },
    ],
    ledger: ledgerLines,
    replay: {
      demo_route: '/?proof=1',
      export_formats: ['json', 'markdown'],
      deterministic: true,
    },
  }
}

export function proofPacketToMarkdown(proofPacket: ProofPacket): string {
  return [
    '# Revenue Forge Proof Packet',
    '',
    `**Standard:** ${proofPacket.standard}`,
    `**Schema:** ${proofPacket.schema_version}`,
    `**Mission:** ${proofPacket.mission.objective}`,
    `**Budget cap:** $${proofPacket.mission.budget_cap_usd}`,
    `**Live charges enabled:** ${proofPacket.mission.live_charges_enabled ? 'yes' : 'no'}`,
    `**Verdict:** ${proofPacket.mission.verdict}`,
    '',
    '## Sponsor Stack',
    ...proofPacket.sponsor_stack.map((item) => `- **${item.sponsor} / ${item.lane}:** ${item.primitive} — ${item.proof}`),
    '',
    '## Proof Events',
    ...proofPacket.events.map((event) => `- \`${event.id}\` / \`${event.type}\` — ${event.agent}: ${event.result ?? event.verdict ?? ''}`),
    '',
    '## Ledger',
    ...proofPacket.ledger.map((line) => `- ${line}`),
  ].join('\n')
}
