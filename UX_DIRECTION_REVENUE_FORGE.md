# Agentic Revenue Operator — UX/UI Direction

## Direction name: **Revenue Forge**

Stop presenting the product as a dashboard. Present it as a **transactional forge**: the operator drops one commercial objective into a secure machine, agents transform it into market evidence, spend requests, Stripe rails, and an ROI ledger. The demo should feel like watching a high-stakes revenue artifact being machined in real time — not checking cards on a SaaS homepage.

Core sentence:
> “A supervised agent found the market, forged the offer, requested spend, opened the payment rail, and stamped every action into the ledger.”

Demo mental model:
- **Input:** an operator objective.
- **Machine:** six agent modules connected by glowing value-flow traces.
- **Artifact:** a growing “Revenue Packet” that accumulates evidence, assets, spend approvals, checkout, and ledger proof.
- **Operator role:** not chatting with AI — authorizing irreversible commercial moves.

---

## 1. New interaction model: the **Revenue Packet**

Replace the current generic stage/card layout with a single central object: a vertical/horizontal **Revenue Packet** that gets stamped as agents complete work.

### Main screen composition

- **Left rail: Agent Circuit**
  - Six nodes: PRIME, SCOUT, GROWTH, OPS, RAILS, LEDGER.
  - Nodes are connected by animated traces. The active node glows and sends pulses toward the central packet.
  - Each node has a tiny state: `idle`, `working`, `stamped`, `blocked`, `approval`.

- **Center: The Forge Bay**
  - The current stage is shown as a large “artifact plate,” not a card.
  - Outputs are stamped into the packet as physical-looking rows: evidence slips, copy plates, spend warrants, checkout rail, ledger stamp.
  - The packet has a visible spine with stamped sections:
    - `01 BRIEF`
    - `02 MARKET`
    - `03 ASSETS`
    - `04 SPEND WARRANT`
    - `05 PAYMENT RAIL`
    - `06 ROI LEDGER`

- **Right rail: Controls / Consequences**
  - Hard budget gauge.
  - “Live charges locked” seal.
  - Approval switch with scary copy: `ARM $117 SPEND` instead of “approve.”
  - Stripe rail preview as a compact terminal receipt.

- **Bottom: Living Ledger Ticker**
  - Thin terminal strip streaming audit events.
  - Every click appends a stamped line with timestamp-ish demo copy.
  - Make this the proof layer judges notice.

### Key demo click path

1. Start with the objective already typed in a command block.
2. Click **Forge next artifact**.
3. Agent circuit sends pulse into central packet.
4. New packet section stamps in with a `CHUNK`/`CLACK` motion.
5. On spend stage, the flow physically stops at a red/orange lock: **operator action required**.
6. Click **Arm spend warrant**.
7. Lock turns into green signed seal.
8. Click Stripe rail: checkout receipt rises from the packet.
9. Final stage: packet compresses into a **ROI verdict card**: `Scale / Hold / Kill`.

---

## 2. Visual system

### Mood

Not “dark glass dashboard.” Instead:
- finance terminal
- industrial control surface
- secure hardware enclave
- circuit-board revenue machine
- stamped paper trail

### Palette tokens

Use fewer neon gradients. More metal, amber, mint, paper, warning red.

```css
:root {
  --bg-void: #050608;
  --bg-bay: #0b0f12;
  --panel-metal: #121820;
  --panel-raised: #18212b;
  --line-dim: rgba(166, 185, 203, 0.18);
  --line-hot: #7df9d4;
  --line-amber: #ffb84d;
  --line-danger: #ff5d5d;
  --ink: #eef6f2;
  --muted: #84919c;
  --paper: #d8c7a3;
  --paper-ink: #17130d;
  --stripe: #635bff;
  --success: #7df9a7;
  --shadow-heavy: 0 30px 100px rgba(0,0,0,.55);
  --radius-machine: 18px;
  --radius-ticket: 10px;
}
```

### Typography

- Display: keep Inter or system, but use aggressive tracking and uppercase labels.
- Add one monospace face for evidence and ledgers: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Numbers should feel like instrument readouts.

Typography rules:
- Big hero becomes less marketing, more system state:
  - `REVENUE FORGE ONLINE`
  - `Objective loaded. Agents waiting for operator authority.`
- Section labels should be operational:
  - `MARKET SIGNAL`
  - `SPEND WARRANT`
  - `PAYMENT RAIL`
  - `LEDGER VERDICT`

### Texture/details

Implement quickly with CSS:
- subtle grid background using `linear-gradient` grid overlays
- animated SVG/canvas-free traces using absolutely positioned div lines
- ticket perforation using repeating radial gradients
- stamped labels with rotated `APPROVED`, `LOCKED`, `TEST MODE`
- scanline shimmer on active node
- noisy paper effect via low-opacity repeating linear gradients

---

## 3. Components to build quickly

### `AgentCircuit`

Purpose: replaces generic “Agent swarm.”

Visual:
- vertical rail of nodes with connecting lines
- active node sends moving pulse down line
- completed nodes get a small stamp: `✓ stamped`
- spend node can become `approval required`

Data shape:
```ts
type AgentNodeState = 'idle' | 'working' | 'stamped' | 'approval' | 'blocked'
```

Microcopy examples:
- PRIME: `decomposes objective`
- SCOUT: `scores reachable demand`
- GROWTH: `forges offer assets`
- OPS: `prices reversible actions`
- RAILS: `opens test checkout`
- LEDGER: `issues verdict`

### `RevenuePacket`

Purpose: central memorable object.

Sections:
- current artifact plate at top
- packet spine/progress stamps on side
- generated outputs as “evidence slips”

Output treatment:
- Instead of `↳ text`, use labeled slips:
  - `SIGNAL`
  - `COPY PLATE`
  - `WARRANT`
  - `RAIL`
  - `VERDICT`

Example current stage header:
```txt
ARTIFACT 03 / GROWTH
COPY PLATE FORGED
```

### `SpendWarrant`

Purpose: make approval dramatic and defensible.

Visual:
- paper/metal warrant with line items
- red wax/electronic seal when locked
- green signature strip when approved

Copy:
- Button before approval: `Sign spend warrant`
- Status before: `Chargeable actions are physically blocked.`
- Status after: `Operator signed. Cap remains $250. Live mode still disabled.`

### `RailReceipt`

Purpose: make Stripe feel tangible.

Visual:
- receipt rising from a terminal slot
- Stripe purple stripe on top
- rows: Product, Price, Mode, Checkout, Billing safety

Copy:
```txt
PAYMENT RAIL / TEST MODE
Product: Agent Ops Revenue Audit
Price: $49/mo
Mode: Stripe test
Live charges: disabled
```

### `LedgerTicker`

Purpose: bottom proof strip.

Examples:
```txt
[00:12] PRIME stamped objective decomposition — no spend authority granted
[00:24] SCOUT scored 128 accounts — sources retained
[00:41] OPS requested $117 warrant — blocked pending signature
[00:55] OPERATOR signed warrant — cap enforced at $250
[01:08] RAILS opened checkout in test mode — live disabled
```

### `VerdictDial`

Purpose: final 10-second payoff.

Three outcomes:
- `KILL` red
- `HOLD` amber
- `SCALE` mint

For demo, land on:
```txt
VERDICT: HOLD → APPROVE ENRICHMENT ONLY
Projected CAC: $38
Break-even: 1 sale
Expected ROI: 2.7x
Next gate: 3 replies before ads
```

---

## 4. Motion language

Keep it CSS-only and demo-safe.

### Motions

- **Trace pulse:** a small glowing dot moves between agent nodes when advancing stages.
- **Artifact stamp:** current stage enters with `translateY(12px) scale(.98)` to `none`, plus a brief amber border flash.
- **Ledger append:** new audit line slides in from bottom with monospace cursor blink.
- **Spend lock:** on spend stage, central packet gets an orange lock overlay until approval.
- **Checkout receipt:** modal slides up like paper from a terminal slot, not a generic modal fade.
- **Final verdict:** dial needle rotates from `KILL` through `HOLD` to final position.

CSS sketch:
```css
@keyframes tracePulse {
  from { transform: translateY(0); opacity: 0; }
  15% { opacity: 1; }
  to { transform: translateY(72px); opacity: 0; }
}

@keyframes stampIn {
  0% { transform: translateY(14px) scale(.985); opacity: 0; filter: blur(6px); }
  70% { box-shadow: 0 0 0 2px var(--line-amber); }
  100% { transform: none; opacity: 1; filter: none; }
}

@keyframes receiptRise {
  from { transform: translateY(44px) rotateX(8deg); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## 5. Copy system

### Rename primary actions

Current:
- `Run next agent`
- `FINAL APPROVE staged spend`
- `Open test checkout`

New:
- `Forge next artifact`
- `Sign spend warrant`
- `Print payment rail`
- `Seal ROI ledger`
- `Reset machine`

### Hero copy

Replace current lede with:
> A supervised agentic machine that turns one commercial objective into a forged revenue packet: market proof, offer assets, bounded spend, Stripe test checkout, and an operator-readable ROI verdict.

### Stage copy upgrades

- `Mission brief` → `Objective ingested`
- `ICP + opportunity scan` → `Market signal stamped`
- `Campaign asset generator` → `Offer plate forged`
- `Budgeted spend gate` → `Spend warrant pending signature`
- `Stripe monetization rail` → `Payment rail printed`
- `ROI + control report` → `Ledger verdict sealed`

### Guardrail language

Use concrete, confident safety copy:
- `No live charge can cross this boundary.`
- `Spend is a warrant, not a suggestion.`
- `Every autonomous move leaves a receipt.`
- `The agent can recommend. The operator signs.`

---

## 6. 1–3 minute hackathon demo script

### 0:00–0:20 — hook

“Most agent demos stop at recommendations. This one closes the loop: it researches, creates an offer, requests bounded spend, opens a payment rail, and produces an ROI verdict — but every risky action is operator-signed.”

Show `REVENUE FORGE ONLINE` and objective loaded.

### 0:20–1:10 — forge artifacts

Click `Forge next artifact` through PRIME, SCOUT, GROWTH.

Narration:
- “Prime decomposes the objective.”
- “Scout rejects generic lead lists and scores reachable demand.”
- “Growth forges the landing page and outbound wedge.”

Make outputs visibly stamp into the packet.

### 1:10–1:45 — spend gate

Stop at OPS.

Narration:
“Here’s the important part: the agent wants to spend $117, but the circuit physically stops. It cannot enrich, boost, or buy anything until the operator signs the warrant.”

Click `Sign spend warrant`.

### 1:45–2:20 — Stripe rail

Click payment rail.

Narration:
“Rails prints a Stripe test-mode checkout for a $49 recurring audit offer. Live mode is disabled, but the monetization loop is real enough to demo.”

### 2:20–3:00 — verdict

Click final stage.

Narration:
“The ledger turns activity into a decision: approve enrichment only, hold ads until three replies, kill if reply rate drops under 4%. The agent didn’t just do work; it produced a controlled revenue decision.”

---

## 7. Fast implementation plan

### Highest-impact quick changes

1. Rename UI shell to `Revenue Forge` and rewrite button/stage copy.
2. Replace `Agent swarm` cards with a connected `AgentCircuit` rail.
3. Replace center `main-stage` with `RevenuePacket` styling: spine, stamps, evidence slips.
4. Turn spend approval into `SpendWarrant` with locked/signed visual state.
5. Turn audit panel into bottom `LedgerTicker`.
6. Restyle Stripe modal as `RailReceipt` rising from terminal slot.
7. Add CSS motion: trace pulse, stampIn, receiptRise, ledger append.

### Avoid

- Generic gradient SaaS cards.
- “AI assistant chat” UI.
- Big KPI dashboard grids.
- Floating orb mascot.
- More than 2 neon colors at once.
- Ambiguous copy like “optimize,” “accelerate,” “insights.”

---

## 8. Success criteria

A judge should be able to remember it as:
> “The one where agents forged a revenue packet and had to get a spend warrant signed.”

The memorable visual should be:
- glowing agent circuit on the left
- stamped revenue packet in the center
- spend warrant lock/signature moment
- ledger ticker proving control
- Stripe receipt rising from the machine
