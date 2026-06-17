# Revenue Forge

**Commercial Autonomy Proof for Agentic Revenue Operations.**

Revenue Forge is a hackathon prototype for the Hermes Agent Accelerated Business Hackathon by Nous Research × NVIDIA × Stripe.

Most agents answer questions. Revenue Forge executes a governed commercial experiment: it finds the market, forges the offer, requests spend authority, opens a Stripe rail, and exports proof of every dollar and decision.

## Core thesis

> Hermes orchestrates. NVIDIA accelerates. Stripe settles. Revenue Forge proves every dollar and decision.

## What it demonstrates

A founder enters a revenue objective and a hard budget cap. The system turns it into a governed revenue mission:

1. **PRIME** decomposes the objective.
2. **SCOUT** scores reachable demand.
3. **GROWTH** forges offer assets.
4. **OPS** requests a **Spend Warrant** and blocks chargeable actions.
5. The operator signs limited authority.
6. **RAILS** opens a Stripe test payment rail.
7. **LEDGER** issues a scale/hold/kill verdict.
8. Revenue Forge exports a **Commercial Autonomy Proof Packet**.

## Sponsor-native value

### Nous Research
Hermes Agent becomes the operating system for commercial agents: skills, tool calls, approvals, logs, and replayable workflows.

### Stripe
Stripe becomes the commerce control plane for agentic businesses: spend warrants, checkout sessions, live-charge locks, and attribution.

### NVIDIA
NVIDIA becomes the governed accelerated runtime path for real commercial workloads: research scoring, generation, policy checks, and ROI decisions.

## Key UX primitives

- **Agent Circuit** — visual chain of PRIME, SCOUT, GROWTH, OPS, RAILS, LEDGER.
- **Revenue Packet** — central artifact accumulating proof.
- **Spend Warrant** — explicit approval gate before chargeable actions.
- **Rail Receipt** — Stripe test checkout receipt.
- **Living Ledger** — terminal-style audit trail.
- **Proof Ledger** — sponsor-native chain of custody.

## Proof packet

The prototype exports both:

- `RevenueForge_ProofPacket_demo.json`
- `RevenueForge_ProofPacket_demo.md`

The typed builder lives in:

```text
src/proofPacket.ts
```

Proof events include:

- `mission.created`
- `market.scored`
- `spend.warrant.requested`
- `operator.approval.signed`
- `stripe.checkout.created`
- `ledger.verdict.issued`

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Open:

```text
http://127.0.0.1:5177
```

## Build

```bash
npm run build
```

## Demo path

1. Click **Forge next artifact** through the first stages.
2. Stop at **Spend Warrant**.
3. Click **Sign spend warrant**.
4. Click **Raise rail receipt**.
5. Scroll to **Commercial Autonomy Proof Ledger**.
6. Click **Export JSON**.

Full script:

```text
DEMO_SCRIPT.md
```

## Repo docs

- `MOAT.md` — strategic moat.
- `COMMERCIAL_AUTONOMY_PROOF.md` — proof standard v0.1.
- `UX_DIRECTION_REVENUE_FORGE.md` — design direction.
- `DEMO_SCRIPT.md` — 90-second recording script.
- `SUBMISSION.md` — hackathon submission brief.

## Current status

Prototype-ready. Next step is submission asset production: 1–3 minute demo video, tweet/writeup, Discord submission, and Typeform entry.
