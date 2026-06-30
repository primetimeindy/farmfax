# FarmFax — Final Hackathon Submission Checklist

## Build status

- [x] Public source repo exists: https://github.com/primetimeindy/farmfax
- [x] Public deployed app exists: https://primetimeindy.github.io/farmfax-demo/
- [x] React/Vite production build passes with `npm run build`.
- [x] Demo verification passes with `npm run verify:demo`.
- [x] GitHub Actions runs `npm run verify:demo` on push/PR.
- [x] App title is FarmFax: `FarmFax — Equipment Trust Workflow`.
- [x] Main UI is FarmFax, not old concepts.
- [x] Old ParcelProof/Revenue Forge/land concept docs are quarantined under `archive/old-concepts/`.

## Required submission assets

- [x] `README.md` — project overview, live URL, source URL, winning thesis, sponsor story, run/build/verify commands, safety guardrails.
- [x] `SUBMISSION.md` — hackathon brief with title, one-liner, problem, solution, sponsor mapping, moat, demo path, non-claims.
- [x] `FINAL_DEMO_SCRIPT.md` — 3–4 minute judge script plus Q&A answers.
- [x] `DEPLOY_NOTES.md` — GitHub Pages deploy/verification notes and backend/Stripe seams.
- [x] `FINAL_SUBMISSION_CHECKLIST.md` — this readiness checklist.
- [x] `public/farmfax-qr.svg` — QR to the public demo.
- [x] `scripts/verify-demo.mjs` — local demo verification.
- [x] `assets/submission/01-hero.png` — final hero screenshot.
- [x] `assets/submission/02-buyer-report-evidence.png` — final report/evidence screenshot.
- [x] `assets/submission/03-judge-proof-trace.png` — final judge proof / trace screenshot.
- [x] `assets/submission/farmfax-demo-video.mp4` — 60-second silent demo video asset.

## Required demo path

1. Open https://primetimeindy.github.io/farmfax-demo/.
2. Show hero and state thesis: **Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now.**
3. Click **Load complete sample**.
4. Show sampled hydraulic video: `4 frames checked`, `Frame to review`, thumbnail strip, selected-frame guardrail.
5. Show guided 7-view capture checklist and `Try sample video`.
6. Show buyer report: score, risk strip, recommended next step, **Evidence checked**, buyer leverage questions, missing-proof guardrail.
7. Show **Judge proof**.
8. Show **For judges: demo trace** with working/planned/simulated labels.
9. Export JSON and point to `input_sources`, `demo_truth`, and `unsupported_claims`.
10. Print/save PDF if requested.
11. Show QR/share block.
12. Open hosted report modal and explain Stripe-style monetization without locking export.

## Exact sections judges should see

- Hero: “Check the machine before you buy.”
- Run judge demo / Load complete sample buttons.
- Capture these 7 views.
- Sampled video check.
- Evidence checked summary.
- Buyer risk report.
- Judge proof.
- For judges: demo trace.
- QR/share block.
- Download JSON report.
- Hosted report modal.

## Sponsor proof points

### Nous / Hermes

- Physical-world workflow route: capture → evidence check → report → export / hosted link.
- Shows what is working now and what Hermes would orchestrate next.
- Produces durable proof artifacts with explicit limits.

### NVIDIA / NIM

- Multimodal inspection workload: photos, selected video frames, overlays, OCR-ready serial/hour evidence, checklist completeness, and structured reasoning.
- Clear upgrade path from browser heuristics to a NIM-backed vision trust gate and structured reports.
- Physical economy use case with recurring inference demand.

### Stripe

- Paid reports, verified listings, hosted report links, seller share pages, dealer/shop branding, expert review, subscriptions, and inspector/agent payouts.
- Paid workflow does not gate core JSON/PDF export.
- Clean business model for trust infrastructure in equipment commerce.

## Submission one-liner

FarmFax turns used-equipment field evidence into a buyer trust workflow — guided capture, vision-gated review, buyer risk report, owner questions, JSON/PDF export, and clearly labeled planned commerce seams for paid reports, verified listings, and inspection work.

## Winning narrative

Used farm equipment is bought through trust gaps: listings are incomplete, inspections are inconsistent, records are fragmented, and a bad purchase can cost tens of thousands of dollars. FarmFax starts with the buyer’s phone and creates an evidence-backed trust layer: what was captured, what visible defects were found, how confident the system is, what is missing, what the buyer should ask next, and where planned paid follow-up work would move through Stripe.

## Safety copy

FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, theft determination, appraisal, safety certification, warranty, repair estimate, or full-video inspection. Findings must be verified with the seller, service records, and a qualified mechanic before purchase or operation.

## Product roadmap if asked

1. Add real OCR pipeline for serial/PIN plates, hour meters, model decals, and service documents.
2. Add NVIDIA-accelerated defect detection for rust, leaks, weld repairs, tire/track wear, missing guards, and frame/bucket deformation.
3. Add structured NIM-backed report generation from multi-image/video-frame evidence.
4. Add Hermes/OpenEye-style visual session tracking for pass/fail/uncertain capture-step verification.
5. Add open report schema package and self-hosted API.
6. Add seller response workflow and mechanic/dealer review via Stripe Checkout.
7. Add equipment-history connectors: OEM portals, dealer CRMs, auction listings, service PDFs, insurance/finance/lien providers where available.

## Killer closing line

FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.
