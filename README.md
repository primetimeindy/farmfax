# FarmFax

**Open-source AI-assisted pre-purchase condition reports for used farm equipment.**

FarmFax turns a phone walkthrough into an evidence-backed buyer risk report for tractors, skid steers, trailers, implements, and other working equipment. The demo uses guided capture slots, local browser-side CV heuristics for rust/wet/paint signals, serial/hour evidence, identity/risk scoring, buyer leverage questions, open JSON/PDF export, and a Stripe-hosted-report upsell that does **not** lock up the underlying record.

## Winning thesis

> Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now — with evidence, confidence, missing proof, and an open record the owner controls.

## Why now

Used farm equipment moves through auctions, dealers, private sellers, Facebook Marketplace, and shop PDFs. Buyers are staring at expensive machines with fragmented records and no portable evidence trail. FarmFax starts with the most credible wedge: visible condition and buyer risk from a guided phone inspection.

## What the demo shows

1. **Phone-guided capture** — required views for walkaround, serial/PIN plate, hour meter, hydraulics, tires/tracks, paint/body panels, and engine bay.
2. **Local CV pass** — browser heuristics analyze uploaded images for rust-tone pixels, wet/leak-like regions, and paint variance; overlays render on evidence photos.
3. **Identity and usage risk** — serial/PIN and hour-meter evidence are treated as confidence-gated inputs, not universal truth.
4. **Buyer risk report** — compact risk cards for identity/fraud risk, safety/structural risk, evidence completeness, and negotiation leverage.
5. **Open export** — JSON download and browser print/PDF preserve buyer ownership of the report.
6. **Stripe monetization path** — hosted share links, dealer/shop branding, and review workflow are paid; export remains available without payment.

## Sponsor-native story

### Nous Research / Hermes

Hermes is the orchestration layer for a physical-world AI workflow: capture checklist → CV/OCR evidence → risk reasoning → buyer questions → export/payment handoff. The product is not a chatbot; it is a governed inspection workflow with provenance.

### NVIDIA / Nemotron

FarmFax is a vision-heavy workload: multi-image reasoning, segmentation overlays, OCR, defect crops, and structured report generation. Nemotron-style reasoning can turn visual evidence and checklist completeness into transparent JSON reports while GPU-accelerated CV improves defect detection over time.

### Stripe

Stripe powers the business model without creating the vendor lock-in FarmFax opposes: paid hosted report links, seller share pages, dealer/shop branding, expert review, and subscription workflows. Core JSON/PDF export remains open.

## Safety and trust guardrails

FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, appraisal, theft determination, safety certification, warranty, or repair estimate. Every finding should show evidence, confidence, limits, and the next buyer action. Unknowns stay unknown.

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

Verified production build output:

```text
✓ built in 52ms
```

## Key files

- `src/App.tsx` — FarmFax interactive prototype, capture workflow, local CV heuristics, report builder, export/payment UI.
- `src/App.css` — FarmFax command-center visual system and print styles.
- `SUBMISSION.md` — hackathon submission brief.
- `FINAL_DEMO_SCRIPT.md` — 3-minute judge demo script.
- `FINAL_SUBMISSION_CHECKLIST.md` — asset and readiness checklist.
- `DEPLOY_NOTES.md` — deployment, environment, and verification notes.
- `FARMFAX_PIVOT_STRATEGY.md` — strategic pivot memo and MVP scope.
- `docs/FARMFAX_MVP_TECH_ARCHITECTURE.md` — deeper technical architecture.
