export type SponsorProof = {
  sponsor: 'Nous Research' | 'Stripe' | 'NVIDIA'
  lane: string
  primitive: string
  proof: string
  value: string
}

export type LandEvent = {
  id: string
  type: string
  agent: string
  source?: string
  result: string
  confidence?: 'verified' | 'screened' | 'needs-human-verification'
}

export type LandScore = {
  label: string
  score: number
  status: 'green' | 'yellow' | 'red'
  finding: string
  nextAction: string
}

export type LandDecisionPacket = {
  packet_id: string
  standard: string
  product: string
  schema_version: string
  thesis: string
  parcel: {
    title: string
    county: string
    state: string
    acres: number
    list_price_usd: number
    apn: string
  }
  buyer_goal: string
  fit_score: number
  verdict: 'BUY' | 'NEGOTIATE' | 'WALK' | 'RESEARCH_MORE'
  estimated_due_diligence_cost_usd: number
  live_payment_mode: 'stripe_test' | 'locked'
  scores: LandScore[]
  sponsor_stack: Omit<SponsorProof, 'value'>[]
  events: LandEvent[]
  seller_questions: string[]
  county_questions: string[]
  program_opportunities: string[]
  ledger: string[]
  disclaimer: string
}

export const sponsorStack: SponsorProof[] = [
  {
    sponsor: 'Nous Research',
    lane: 'ORCHESTRATION',
    primitive: 'Hermes Agent land-research workflow',
    proof: 'parcel goal → layer checks → policy questions → buyer packet',
    value: 'Shows Hermes coordinating real-life decision support for non-technical users.',
  },
  {
    sponsor: 'Stripe',
    lane: 'COMMERCE RAIL',
    primitive: 'Paid report + expert-review checkout',
    proof: '$19 Land Reality Check · $99 due-diligence packet · test mode locked',
    value: 'Turns trusted AI decision packets into a clear retail payment flow.',
  },
  {
    sponsor: 'NVIDIA',
    lane: 'ACCELERATED GEO AI',
    primitive: 'satellite, soil, risk, OCR, and scenario scoring workloads',
    proof: 'geospatial overlays · document-heavy rules · visual risk analysis',
    value: 'Frames land decisions as visual/geospatial inference workloads that scale with acceleration.',
  },
]

export const baseScores: LandScore[] = [
  {
    label: 'Buildability',
    score: 71,
    status: 'yellow',
    finding: 'Likely buildable, but county setback and rural residential rules need verification before offer.',
    nextAction: 'Call county planning with APN and ask whether a single-family home, barn, and driveway are allowed.',
  },
  {
    label: 'Legal access',
    score: 58,
    status: 'yellow',
    finding: 'Parcel touches a private road; recorded easement is not confirmed in the fixture.',
    nextAction: 'Ask seller for recorded access easement and title commitment exceptions.',
  },
  {
    label: 'Water + septic',
    score: 64,
    status: 'yellow',
    finding: 'Rural utilities look plausible, but well depth and septic perc test are unresolved costs.',
    nextAction: 'Budget for well quote, perc test, septic design, and utility extension before closing.',
  },
  {
    label: 'Flood / wetlands',
    score: 86,
    status: 'green',
    finding: 'Demo layer screens low flood exposure and no obvious wetland conflict near proposed homesite.',
    nextAction: 'Verify FEMA panel and NWI wetlands before final offer.',
  },
  {
    label: 'Soil + ag fit',
    score: 78,
    status: 'green',
    finding: 'Soil profile is pasture-friendly with moderate drainage; goats, hay, and orchard test plots are plausible.',
    nextAction: 'Ask extension office about forage mix, stocking rate, and soil amendments.',
  },
  {
    label: 'Policy + programs',
    score: 74,
    status: 'green',
    finding: 'Ag/timber valuation and NRCS conservation support may apply, but eligibility is use-history dependent.',
    nextAction: 'Ask appraisal district about ag valuation timeline and USDA/FSA office about EQIP options.',
  },
  {
    label: 'Income potential',
    score: 67,
    status: 'yellow',
    finding: 'Best near-term income paths are grazing lease, farm stand, hunting access, or small event days — not guaranteed cash flow.',
    nextAction: 'Validate local lease comps and restrictions before counting income in financing.',
  },
]

export function buildProofPacket(input: {
  goal: string
  activeLayer: string
  checkoutOpen: boolean
  ledgerLines: string[]
  scoreBoost?: number
}): LandDecisionPacket {
  const fitScore = Math.min(92, Math.round(74 + (input.scoreBoost ?? 0)))

  return {
    packet_id: 'parcelproof_demo_caldwell_001',
    standard: 'Land Decision Packet v0.1',
    schema_version: '0.1.0',
    product: 'ParcelProof',
    thesis: 'Hermes orchestrates, NVIDIA accelerates geospatial reasoning, Stripe powers paid reports, and ParcelProof helps regular people avoid bad land decisions.',
    parcel: {
      title: '12.4 acre homestead candidate',
      county: 'Caldwell County',
      state: 'TX',
      acres: 12.4,
      list_price_usd: 89000,
      apn: 'R-18422-DEMO',
    },
    buyer_goal: input.goal,
    fit_score: fitScore,
    verdict: fitScore >= 82 ? 'BUY' : fitScore >= 68 ? 'NEGOTIATE' : fitScore >= 52 ? 'RESEARCH_MORE' : 'WALK',
    estimated_due_diligence_cost_usd: 3650,
    live_payment_mode: input.checkoutOpen ? 'stripe_test' : 'locked',
    scores: baseScores,
    sponsor_stack: sponsorStack.map(({ sponsor, lane, primitive, proof }) => ({ sponsor, lane, primitive, proof })),
    events: [
      {
        id: 'evt_001_goal_selected',
        type: 'buyer_goal.selected',
        agent: 'PRIME',
        source: 'Hermes Agent',
        result: `Buyer goal converted into land-use hypothesis: ${input.goal}`,
        confidence: 'verified',
      },
      {
        id: 'evt_002_parcel_identified',
        type: 'parcel.identity.screened',
        agent: 'ATLAS',
        source: 'Parcel/APN fixture + Acres-style map reference',
        result: '12.4 acres in Caldwell County, TX mapped as demo APN R-18422-DEMO',
        confidence: 'screened',
      },
      {
        id: 'evt_003_layers_checked',
        type: 'risk_layers.checked',
        agent: 'SCOUT',
        source: 'FEMA, USDA NRCS, NWI, county policy placeholders',
        result: `Active layer ${input.activeLayer} reviewed with green/yellow/red buyer interpretation`,
        confidence: 'screened',
      },
      {
        id: 'evt_004_checkout_ready',
        type: input.checkoutOpen ? 'stripe.checkout.created' : 'stripe.checkout.locked',
        agent: 'RAILS',
        source: 'Stripe test mode',
        result: input.checkoutOpen ? '$19 Land Reality Check checkout staged in test mode' : 'Paid report remains locked until buyer requests full packet',
        confidence: 'verified',
      },
      {
        id: 'evt_005_packet_issued',
        type: 'land_decision_packet.issued',
        agent: 'LEDGER',
        source: 'ParcelProof source trail',
        result: 'Verdict issued with seller questions, county call script, program leads, and unresolved assumptions',
        confidence: 'needs-human-verification',
      },
    ],
    seller_questions: [
      'Can you provide the recorded deeded access or easement document?',
      'Has any perc test, well quote, survey, or septic design been completed?',
      'Are there restrictions, HOA, deed covenants, mineral reservations, or pipeline easements?',
      'What utilities are at the road, and who quoted extension costs?',
    ],
    county_questions: [
      'Is a single-family residence allowed on this APN under current county rules?',
      'What permits are required for driveway, septic, well, barn, and livestock?',
      'Are RV/tiny-home stays allowed during construction?',
      'What is required to qualify or maintain ag/timber valuation?',
    ],
    program_opportunities: [
      'USDA NRCS EQIP conservation assistance for fencing, water, grazing, and soil health practices.',
      'County appraisal district ag/timber valuation if use history and acreage requirements are met.',
      'Local extension office support for forage, goats, orchard, and soil amendment planning.',
      'Potential grazing/hunting lease after access and liability terms are verified.',
    ],
    ledger: input.ledgerLines,
    disclaimer: 'ParcelProof is a screening and due-diligence assistant, not legal, survey, engineering, tax, lending, or insurance advice. Verify all findings with county offices and licensed professionals before buying land.',
  }
}

export function proofPacketToMarkdown(packet: LandDecisionPacket): string {
  return [
    '# ParcelProof Land Decision Packet',
    '',
    `**Parcel:** ${packet.parcel.title} — ${packet.parcel.acres} acres, ${packet.parcel.county}, ${packet.parcel.state}`,
    `**APN:** ${packet.parcel.apn}`,
    `**Buyer goal:** ${packet.buyer_goal}`,
    `**Fit score:** ${packet.fit_score}/100`,
    `**Verdict:** ${packet.verdict}`,
    `**Estimated due-diligence cost:** $${packet.estimated_due_diligence_cost_usd.toLocaleString()}`,
    '',
    '## Reality Check Scores',
    ...packet.scores.map((score) => `- **${score.label} (${score.score}/100, ${score.status}):** ${score.finding} Next: ${score.nextAction}`),
    '',
    '## Seller Questions',
    ...packet.seller_questions.map((q) => `- ${q}`),
    '',
    '## County Questions',
    ...packet.county_questions.map((q) => `- ${q}`),
    '',
    '## Program Opportunities',
    ...packet.program_opportunities.map((q) => `- ${q}`),
    '',
    '## Sponsor Stack',
    ...packet.sponsor_stack.map((item) => `- **${item.sponsor} / ${item.lane}:** ${item.primitive} — ${item.proof}`),
    '',
    '## Source Trail',
    ...packet.events.map((event) => `- \`${event.id}\` / \`${event.type}\` — ${event.agent}: ${event.result}`),
    '',
    '## Ledger',
    ...packet.ledger.map((line) => `- ${line}`),
    '',
    `_${packet.disclaimer}_`,
  ].join('\n')
}
