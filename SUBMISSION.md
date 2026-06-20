# FarmFax — Hackathon Submission Brief

## Submission title

FarmFax: Open Equipment Condition Reports from Phone Photos and Short Videos

## Live demo

https://primetimeindy.github.io/farmfax-demo/

## Source

https://github.com/primetimeindy/farmfax

## Short description

FarmFax is an open-source AI-assisted pre-purchase condition report for used farm equipment. A buyer captures guided phone photos or short videos of a tractor or implement; FarmFax checks visible rust-tone areas, wet/leak-like regions, paint variance, serial/PIN evidence, hour-meter evidence, missing views, and safety/leverage risk; then it exports an open JSON/PDF buyer risk report while offering optional Stripe-style hosted sharing without data lock-in.

## One-liner

Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now — evidence, confidence, missing proof, buyer leverage, and an open record the owner controls.

## Problem

Used farm equipment is expensive, operationally critical, and often bought from incomplete listings, auctions, dealer lots, or private sellers. Buyers need answers before they wire money or drive across the state:

- Does the serial/PIN plate match the claimed machine?
- Is the hour meter plausible enough to trust?
- Are there visible leaks, corrosion, repaint zones, wear, missing guards, or safety concerns?
- Which evidence is missing or too low quality?
- What should the buyer ask the seller before purchase?
- Can the inspection record move with the owner instead of being trapped in an OEM/dealer/auction silo?

Existing listing photos are inconsistent, records are fragmented, and generic chatbots cannot create an evidence trail.

## Solution

FarmFax makes the phone the inspection device and the report the proof artifact.

The live demo flow:

1. Buyer opens FarmFax on phone or desktop.
2. FarmFax guides required captures: walkaround, serial/PIN, hour meter, hydraulics, tires/tracks, paint/body, and engine bay.
3. Capture inputs accept `image/*,video/*`; short videos are sampled into selected evidence frames.
4. Local browser heuristics flag rust-tone pixels, wet/leak-like regions, and paint variance, then render evidence overlays.
5. Identity/hour evidence is scored conservatively with explicit confidence and user-confirmation requirements.
6. A FarmFax buyer risk report summarizes visible condition, identity/paperwork risk, safety/repair risk, evidence completeness, hours plausibility, and negotiation leverage.
7. The buyer exports open JSON/PDF.
8. Stripe powers optional hosted report links, seller share pages, dealer/shop branding, and review workflows — while export remains open.

## Why it matters for Nous Research / Hermes

FarmFax shows Hermes as an orchestration layer for physical-world AI workflows, not just chat. Hermes can coordinate capture completeness, photo/video evidence, OCR/CV tools, Nemotron-style reasoning, report generation, provenance, export, and payment handoffs into one governed workflow. The demo includes a **For judges: demo trace** that labels what is working now vs planned.

## Why it matters for NVIDIA / Nemotron

FarmFax is naturally multimodal and vision-heavy: photos, selected video frames, defect crops, segmentation overlays, serial/hour OCR, checklist completeness, and structured report reasoning. Nemotron can turn visual findings into transparent buyer reports; NVIDIA acceleration becomes more valuable as the detector set grows from browser heuristics to robust CV pipelines.

## Why it matters for Stripe

Stripe monetizes trust workflow without becoming a data prison: hosted report links, seller share pages, dealer/shop branding, expert mechanic review, auction/dealer subscriptions, and paid verification. The core report still exports as JSON/PDF before payment.

## Open-source angle

FarmFax is strongest when inspectable:

- Open report schema.
- Transparent scoring rubric.
- Local-first capture and browser-side evidence checks.
- Export-first record ownership.
- Self-hostable static core.
- Prompt/checklist/detector improvements that compound into a shared inspection standard.
- `input_sources` and `demo_truth` metadata in exported JSON so judges/users can see what was implemented, planned, or simulated.

## Demo path

Use the deterministic judge path:

1. Open https://primetimeindy.github.io/farmfax-demo/.
2. Click **Load complete sample** or **Run judge demo**.
3. Show the hydraulic sampled-video card: `4 frames checked`, `Frame to review`, and the selected-frame guardrail.
4. Show **Evidence checked** in the buyer report.
5. Show compact risk cards, deal posture, buyer leverage questions, and missing-proof copy.
6. Show **Judge proof** and **For judges: demo trace**.
7. Click **Download JSON report** and point to `input_sources` + `demo_truth`.
8. Click **Print / save PDF** if needed.
9. Open **Save hosted report** and emphasize that this is simulated Stripe-style hosting; free export stays available.

## Current implementation

- React + TypeScript + Vite prototype.
- Deployed static app on GitHub Pages.
- Phone-first capture slots with `accept="image/*,video/*"` and `capture="environment"`.
- Browser-side photo analysis for rust-tone, wet/leak-like, and paint-variance heuristics.
- Browser-side short-video sampling with selected frames only.
- Evidence overlay masks on submitted photos or selected video frames.
- One-click **Try sample video**, **Run judge demo**, and **Load complete sample** flows.
- Visible **Evidence checked** summary.
- Typed FarmFax report object with schema version `farmfax.report.v0.1-open`.
- Exported JSON includes `input_sources`, `demo_truth`, unsupported claims, visual analysis, risk summary, and buyer questions.
- Buyer risk summary: serial/paperwork, costly repair/safety, proof supplied, hours check, and offer leverage.
- JSON report export and print/PDF path.
- QR/share block for phone viewing.
- Stripe-style hosted report modal.
- CI verifies `npm run verify:demo` on GitHub Actions.

## What is intentionally not claimed

FarmFax does not certify mechanical condition, title status, lien status, theft status, safety, market value, repair cost, or full-video inspection. It is an evidence-backed screening aid that tells buyers what visible evidence suggests, what is missing, and what to verify with a seller, mechanic, dealer, or records provider.

## Moat

The moat is guided evidence capture plus an open inspection record standard. Better captures create better model inputs; every report generates structured examples of machine type, evidence quality, visible defects, confidence, buyer questions, missing proof, and downstream verification outcomes.

## Winning narrative

Farm equipment commerce runs on trust gaps. Listings are messy, inspections are inconsistent, and records live in silos. FarmFax starts where the buyer already is — phone in hand, standing next to a machine — and turns that moment into a portable, evidence-backed buyer risk report. It is practical enough for a hackathon demo, open enough for the community to extend, and commercial enough for Stripe-powered hosted reports and dealer workflows.

## Final closing line

FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.
