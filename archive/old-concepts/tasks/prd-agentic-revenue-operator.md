# Agentic Revenue Operator — Hackathon PRD

## One-liner
A Hermes-powered founder GTM operator that turns a business objective into a supervised revenue workflow: research ICP, propose budgeted paid actions, generate lead/outreach assets, provision a Stripe monetization path, and report ROI with approval gates.

## Demo objective
Show that agents can earn, spend, and run real operations — not just answer questions.

## Public positioning
"Most agents answer questions. This one runs a revenue workflow with a budget, payment rail, audit log, and operator approval gates."

## Scope for prototype
- Single-page command center app suitable for 1–3 minute demo video.
- Interactive demo flow from objective input to final operator report.
- Hard-coded seed data is acceptable for demo, but flow must feel operational and auditable.
- No real external spend in the prototype; spending is represented by approval gates and test-mode rails.

## Core demo flow
1. Operator enters objective: generate qualified leads for a devtools / AI agent product.
2. PRIME decomposes mission into agents: Scout, Growth, Ops, Ledger.
3. Scout produces ICP, lead sources, and top accounts.
4. Growth generates outreach copy and landing-page angle.
5. Ops creates a spend plan with budget cap and approval gate.
6. Stripe rail produces a test-mode offer/checkout artifact.
7. Ledger reports projected ROI, spend, risk, next action, and audit trail.

## Acceptance criteria
- App builds with `npm run build`.
- Main screen has a striking hackathon-ready UI.
- Demo can be run without credentials.
- User can click through at least 5 workflow stages.
- App visibly shows budget guardrails, approval gates, and Stripe/test checkout rail.
- Final report has concrete outputs: ICP, leads, offer, outreach, budget, ROI, audit log.
