# FarmFax

**Open-source AI-assisted pre-purchase condition reports for used farm equipment.**

FarmFax turns a guided phone walkthrough into an evidence-backed buyer risk report for tractors, skid steers, trailers, implements, and other working equipment. The live demo supports photo capture/upload, short-video sampling, local browser-side rust/wet/paint checks, evidence overlays, compact buyer-risk cards, JSON/PDF export, a judge-proof trace, and a Stripe-style hosted-report path that does **not** lock up the underlying record.

## Live demo

- Public app: https://primetimeindy.github.io/farmfax-demo/
- Source: https://github.com/primetimeindy/farmfax
- CI: GitHub Actions runs `npm run verify:demo` on push/PR.

## Install on phone

FarmFax now ships as a phone-installable PWA.

- iPhone: open the public app in Safari → Share → Add to Home Screen.
- Android: open the public app in Chrome → Install app / Add to Home screen.

The installed app launches standalone, uses FarmFax icons, and keeps the core demo shell cached through the service worker.

## What it does

> Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now — with evidence, confidence, missing proof, buyer leverage, and an open record the owner controls.

## What the demo shows

1. **Phone-guided capture** — required views for walkaround, serial/PIN plate, hour meter, hydraulics, tires/tracks, paint/body panels, and engine bay.
2. **Photo + short-video input** — capture/upload accepts `image/*,video/*`; videos are sampled into selected evidence frames.
3. **Local evidence checks** — browser heuristics flag rust-tone pixels, wet/leak-like regions, and paint variance; overlays render on evidence photos or selected video frames.
4. **One-click demo reliability** — **Run judge demo**, **Try sample video**, and **Load complete sample** make the judging path deterministic.
5. **Buyer risk report** — compact risk cards for serial/paperwork, costly repair/safety, proof supplied, hours check, and offer leverage.
6. **Open export** — JSON download and browser print/PDF preserve buyer ownership of the report.
7. **Truth-labeled sponsor seams** — JSON includes `input_sources` and `demo_truth` fields that distinguish implemented browser checks from planned Hermes/Nemotron and simulated Stripe checkout.

## Sponsor-native story

### Nous Research / Hermes

Hermes is the workflow layer for physical-world AI: capture completeness → evidence checks → risk reasoning → buyer questions → export/payment handoff. The current demo shows the route in the **For judges: demo trace** panel; real Hermes orchestration is labeled as a planned backend seam.

### NVIDIA / Nemotron

FarmFax is naturally multimodal: photos, selected video frames, defect overlays, OCR-ready serial/hour evidence, checklist completeness, and structured report reasoning. The demo runs lightweight browser heuristics today; Nemotron/NVIDIA are the planned upgrade path for robust multimodal reasoning and accelerated defect detection.

### Stripe

Stripe powers optional hosted report links, seller share pages, dealer/shop branding, expert review, and subscription workflows. Core JSON/PDF export remains available before payment.

## Safety and trust guardrails

FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, theft determination, appraisal, safety certification, warranty, repair estimate, or full-video inspection. Every finding should show evidence, confidence, limits, and the next buyer action. Unknowns stay unknown.

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

This runs:

```text
npm run lint
npm run build
node scripts/verify-demo.mjs
```

The verifier checks that the production build exists, demo fixtures exist, QR exists, and required judge-demo hooks/copy are present.

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
- `src/farmfax/scenarios.ts` — deterministic demo scenarios and capture-state reducer.
- `public/farmfax-video-fixture.mp4` — deterministic short sample video for the video-frame demo.
- `public/sample-photos/` — authentic-looking Wikimedia Commons sample photos for the default report scenarios, with attribution notes.
- `public/farmfax-qr.svg` — QR to the public demo.
- `scripts/verify-demo.mjs` — checks demo-critical files, source labels, metadata, and build output.
- `.github/workflows/verify-demo.yml` — CI workflow that runs `npm run verify:demo`.
- `assets/submission/01-hero.png` — final hero screenshot.
- `assets/submission/02-buyer-report-evidence.png` — final report/evidence screenshot.
- `assets/submission/03-judge-proof-trace.png` — final judge-proof/trace screenshot.
- `assets/submission/farmfax-demo-video.mp4` — 60-second silent demo video asset.
- `SUBMISSION.md` — hackathon submission brief.
- `FINAL_DEMO_SCRIPT.md` — 3–4 minute judge demo script.
- `FINAL_SUBMISSION_CHECKLIST.md` — final readiness checklist.
- `DEPLOY_NOTES.md` — deploy and verification notes.
- `archive/old-concepts/` — old ParcelProof/Revenue Forge ideation history only, not part of the FarmFax submission.
