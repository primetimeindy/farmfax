# FarmFax

**An agent-run trust and payments workflow for used farm equipment — built from phone photos and short videos.**

FarmFax helps buyers slow down risky equipment deals before deposit. A buyer or seller captures the views a mechanic would ask for — walkaround, serial/PIN plate, hour meter, hydraulics, tires/tracks, paint/body/welds, and engine bay/cold start — then FarmFax turns that media into a portable buyer risk report with visible findings, confidence, missing proof, seller questions, open JSON/PDF export, and paid report/verified-listing rails.

> Carfax tells you what paperwork says happened. FarmFax shows what the machine is telling you right now: evidence, reasoning, missing proof, and buyer leverage.

## Live links

- **Public demo:** https://primetimeindy.github.io/farmfax-demo/
- **Sample FarmFax report:** https://primetimeindy.github.io/farmfax-demo/sample-report.html
- **Source:** https://github.com/primetimeindy/farmfax
- **CI:** GitHub Actions runs `npm run verify:demo` on push/PR.

## Why this matters

Used farm equipment is expensive, operationally critical, and often bought from incomplete listings, auction pages, dealer lots, or private sellers. A machine can look clean in photos while hiding repair exposure: hydraulic seepage, repaint, corrosion, questionable hours, missing serial evidence, or missing engine/cold-start proof.

FarmFax is built for the moment before money moves:

- Should I drive out to see this?
- Should I send a deposit?
- What proof is missing?
- What should I ask the seller?
- What evidence should travel with the machine after the deal?

## What the demo does today

1. **Guided evidence capture** — seven required views reduce listing-photo cherry-picking.
2. **Photo + video input** — uploads/captures accept `image/*,video/*`; short videos are sampled into evidence frames.
3. **Real-photo analysis overlay** — findings are anchored to submitted photos or selected video frames.
4. **Browser evidence checks** — local heuristics flag rust-tone pixels, wet/leak-like regions, and paint variance.
5. **Buyer risk report** — summary cards cover identity/paperwork, costly repair/safety, proof supplied, hours plausibility, and offer leverage.
6. **Evidence-linked reasoning** — findings point to a photo/video source, confidence, what it suggests, and what to verify next.
7. **Open export** — buyer-owned JSON download and browser print/PDF remain available before any paid hosted link.
8. **Truth-labeled demo seams** — `input_sources` and `demo_truth` separate implemented browser checks from planned Hermes/NVIDIA NIM orchestration and simulated Stripe hosting.

## Demo path for judges

1. Open https://primetimeindy.github.io/farmfax-demo/.
2. Click **Run judge demo** or **Load complete sample**.
3. Show the real-photo condition overlay.
4. Click **Try sample video** and point to `4 frames checked`, `Frame to review`, and the selected-frame guardrail.
5. Scroll to the buyer risk report and show **Evidence checked**, risk cards, buyer questions, and missing-proof copy.
6. Open **Judge proof** / **For judges: demo trace**.
7. Click **Download JSON report** and point to `input_sources`, `demo_truth`, `unsupported_claims`, `visual_analysis`, and `risk_summary`.
8. Open the standalone sample report: `/sample-report.html`.

## Sample report model

The sample report is intentionally closer to a vehicle-history report than a chatbot answer. It combines:

- equipment identity and hour meter evidence
- summary risk score and deal posture
- photo/video evidence cards
- reasoning tied to each media source
- buyer questions and seller requests
- unsupported claims / limitations
- export-friendly structure

Open it here:

```text
https://primetimeindy.github.io/farmfax-demo/sample-report.html
```

## Sponsor-native story

### Nous Research / Hermes

Hermes is the agentic operations layer for the physical-world business workflow: capture completeness, media routing, overclaim challenges, OCR/CV checks, reasoning, provenance, report generation, export, payment handoff, and follow-up tasks. The static demo labels this path honestly as a planned backend seam.

### NVIDIA / NIM

FarmFax is naturally multimodal: photos, selected video frames, defect crops, serial/hour OCR, segmentation overlays, and structured inspection reasoning. The hackathon demo uses lightweight browser heuristics; NVIDIA NIM is the production trust gate for condition, completeness, visible damage, missing proof, and accelerated inspection pipelines.

### Stripe

Stripe monetizes trust workflow without locking the record: paid inspection reports, verified listings, hosted reports, seller share pages, dealer/shop branding, expert mechanic review, auction/dealer subscriptions, and Connect payouts for inspectors or agents. Core JSON/PDF export stays buyer-owned.

## Safety and trust guardrails

FarmFax is an AI-assisted screening aid. It does **not** certify mechanical condition, title/lien/theft status, market value, safety compliance, warranty, repair cost, or full-video inspection. Unknowns stay unknown; missing evidence raises risk instead of being guessed away.

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Verify locally

```bash
npm run verify:demo
```

This runs lint, build, and a deterministic verifier for demo-critical files, hooks, PWA metadata, sample media, and the standalone sample report.

## Build

```bash
npm run build
```

Static output:

```text
dist/
```

## Repository map

- `src/App.tsx` — main FarmFax app.
- `src/farmfax/scenarios.ts` — deterministic scenarios and capture-state reducer.
- `public/sample-report.html` — Carfax-style FarmFax sample report with evidence-linked reasoning.
- `public/farmfax-video-fixture.mp4` — deterministic short sample video for video-frame demo.
- `public/sample-photos/` — demo equipment media with attribution notes.
- `public/farmfax-qr.svg` — QR to the public demo.
- `scripts/verify-demo.mjs` — checks demo-critical files, source labels, metadata, and build output.
- `.github/workflows/verify-demo.yml` — CI workflow.
- `SUBMISSION.md` — hackathon submission brief.
- `PERSONAL_PITCH_SCRIPT.md` — founder story pitch.
- `FINAL_DEMO_SCRIPT.md` — 3–4 minute judge demo script.
- `FINAL_SUBMISSION_CHECKLIST.md` — final readiness checklist.
- `DEPLOY_NOTES.md` — deploy and verification notes.
- `archive/old-concepts/` — old ParcelProof/Revenue Forge ideation history only, not part of the FarmFax submission.
