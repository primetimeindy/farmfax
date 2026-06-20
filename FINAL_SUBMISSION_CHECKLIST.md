# FarmFax — Final Hackathon Submission Checklist

## Build status

- [x] React/Vite production build passes with `npm run build`.
- [x] App title is FarmFax: `FarmFax — Open Equipment Condition Reports`.
- [x] Main UI is FarmFax, not ParcelProof/Revenue Forge.
- [x] README rewritten for FarmFax.
- [x] Submission brief rewritten for FarmFax.
- [x] Final demo script rewritten for FarmFax.
- [x] Deploy notes added for FarmFax.

## Required submission assets

- [x] `README.md` — project overview, winning thesis, sponsor story, run/build commands, safety guardrails.
- [x] `SUBMISSION.md` — hackathon brief with title, one-liner, problem, solution, sponsor mapping, moat, demo path, non-claims.
- [x] `FINAL_DEMO_SCRIPT.md` — 3–4 minute judge script plus Q&A answers.
- [x] `DEPLOY_NOTES.md` — local build/deploy/verification notes and env seam for Stripe hosted checkout.
- [x] `FARMFAX_PIVOT_STRATEGY.md` — deeper strategic memo.
- [x] `docs/FARMFAX_MVP_TECH_ARCHITECTURE.md` — technical architecture reference.

## Required demo path

1. Open local or deployed app.
2. Show hero: **Scan the machine before you buy the story.**
3. State thesis: **Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now.**
4. Show guided phone capture slots.
5. Upload/capture at least one image if available; otherwise call out sample evidence.
6. Show local rust/wet/paint CV heuristics and evidence overlays.
7. Show serial/PIN, hour meter, make/model candidate panel.
8. Show anti-vendor-lock open schema panel.
9. Show buyer risk report: score, risk strip, deal posture, buyer leverage questions, missing evidence, evidence ledger.
10. Export JSON and/or print/save PDF.
11. Open Stripe checkout demo.
12. Close on open report ownership and sponsor-native architecture.

## Exact sections judges should see

- Hero: “Scan the machine before you buy the story.”
- Demo architecture stack.
- Phone-guided inspection.
- Open CV + Nemotron pass.
- Serial code + visual catalog.
- Anti vendor lock-in.
- Consolidated FarmFax report.
- Stripe rail.
- Audit trail.

## Sponsor proof points

### Nous / Hermes

- Orchestrates capture completeness, CV/OCR evidence, reasoning, report generation, provenance, export, and payment handoff.
- Demonstrates AI agents in a physical-world workflow instead of another chat interface.
- Produces durable proof artifacts with explicit limits.

### NVIDIA / Nemotron

- Multimodal inspection workload: photos, defect crops, segmentation overlays, OCR, and structured reasoning.
- Clear upgrade path from local browser heuristics to GPU-accelerated CV and Nemotron-generated structured reports.
- Physical economy use case with recurring inference demand.

### Stripe

- Hosted report links, seller share pages, dealer/shop branding, expert review, and subscription workflow.
- Paid workflow does not gate core JSON/PDF export.
- Clean business model for trust infrastructure in equipment commerce.

## Submission one-liner

FarmFax turns a guided phone walkthrough into an open, evidence-backed buyer risk report for used farm equipment — visible-condition scoring, identity/hour evidence, safety flags, missing proof, leverage questions, JSON/PDF export, and Stripe-hosted sharing without data lock-in.

## Winning narrative

Used farm equipment is bought through trust gaps: listings are incomplete, inspections are inconsistent, records are fragmented, and a bad purchase can cost tens of thousands of dollars. FarmFax starts with the buyer’s phone and creates the first portable evidence layer: what was captured, what visible defects were found, how confident the system is, what is missing, and what the buyer should ask next. It is not a fake certification; it is a practical, open, extensible inspection report that makes the market more trustworthy.

## Safety copy

FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, theft determination, appraisal, safety certification, warranty, or repair estimate. Findings must be verified with the seller, service records, and a qualified mechanic before purchase or operation.

## Product roadmap if asked

1. Add real OCR pipeline for serial/PIN plates, hour meters, model decals, and service documents.
2. Add NVIDIA-accelerated defect detection for rust, leaks, weld repairs, tire/track wear, missing guards, and frame/bucket deformation.
3. Add structured Nemotron report generation from multi-image evidence.
4. Add open report schema package and self-hosted API.
5. Add seller response workflow and mechanic/dealer review via Stripe Checkout.
6. Add equipment-history connectors: OEM portals, dealer CRMs, auction listings, service PDFs, insurance/finance/lien providers where available.

## Killer closing line

FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.
