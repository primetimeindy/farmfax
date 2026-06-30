# FarmFax — Hackathon Submission Brief

## Submission title

FarmFax: Agent-Run Inspection Reports and Payment Workflows for Used Farm Equipment

## Live demo

https://primetimeindy.github.io/farmfax-demo/

## Sample report

https://primetimeindy.github.io/farmfax-demo/sample-report.html

## Source

https://github.com/primetimeindy/farmfax

## One-liner

FarmFax turns used-equipment field evidence into a buyer trust workflow: guided capture, vision-gated evidence review, buyer risk report, owner questions, and explicitly labeled planned commerce handoffs for paid reports, verified listings, and inspection work.

## Problem

Buying used farm equipment is a high-dollar trust problem. A tractor can look clean in a listing but still hide expensive risks: hydraulic seepage, corrosion, repaint, questionable hours, missing serial evidence, weak service history, or missing engine/cold-start proof.

The buying process is fragmented:

- listings show inconsistent photos;
- auction pages rarely answer the real inspection questions;
- private sellers may omit the serial plate, hour meter, hydraulics, or engine bay;
- repair exposure matters because parts, diagnostics, and dealer service can be constrained;
- the buyer often has to decide whether to drive hours, wire money, or place a deposit with incomplete evidence.

Generic chatbots can summarize a listing. They do not run an inspection business loop: intake evidence, challenge claims, sell the report, and route follow-up work. FarmFax does.

## Solution

FarmFax makes the phone the inspection device, the report the proof artifact, and a simulated Stripe-style modal the honest commerce seam for monetizing trust.

The live prototype guides a buyer or seller through the views a mechanic would ask for:

1. 360° walkaround
2. Serial / PIN plate
3. Hour meter + dashboard
4. Hydraulic lines / cylinders
5. Tires / tracks / undercarriage
6. Paint / body / welds
7. Engine bay / cold start

FarmFax accepts photos and short videos. It samples selected video frames, runs local browser checks for rust-tone pixels, wet/leak-like regions, and paint variance, renders overlays on real submitted media, and turns the evidence into a buyer risk report.

The report is intentionally more like a vehicle-history report than a chatbot answer: a condition score, evidence status, risk categories, photo/video references, reasoning, seller questions, unsupported claims, and an open export.

## Current implementation

- React + TypeScript + Vite static app.
- GitHub Pages deployment.
- Phone-installable PWA.
- Capture slots with `accept="image/*,video/*"` and `capture="environment"`.
- Browser-side photo analysis for rust-tone, wet/leak-like, and paint-variance signals.
- Browser-side video-frame sampling with selected-frame guardrail.
- Real-photo analysis overlay connected to submitted/sample media.
- Deterministic **Run judge demo**, **Try sample video**, and **Load complete sample** flows.
- Buyer risk report with condition score, deal posture, risk cards, evidence summary, buyer questions, and missing-proof copy.
- Standalone `sample-report.html` showing the intended Carfax-style report format with photo/video evidence and reasoning.
- JSON export containing `input_sources`, `demo_truth`, `unsupported_claims`, `visual_analysis`, `risk_summary`, and `buyer_questions`.
- Print/PDF path.
- QR/share block for phone viewing.
- Stripe-style hosted report modal showing planned paid reports, verified listings, and inspector/agent payouts.
- CI verification through `npm run verify:demo`.

## Demo path

1. Open https://primetimeindy.github.io/farmfax-demo/.
2. Click **Run judge demo** or **Load complete sample**.
3. Show the real-photo condition overlay under **Visible condition signals**.
4. Click **Try sample video** and show `4 frames checked`, the frame thumbnails, and the “selected frames only” guardrail.
5. Scroll to **Buyer risk report** and show **Evidence checked**, risk cards, next move, and buyer questions.
6. Show **Judge proof** and **For judges: demo trace**.
7. Click **Download JSON report** and point to `input_sources`, `demo_truth`, and `unsupported_claims`.
8. Open the standalone sample report: https://primetimeindy.github.io/farmfax-demo/sample-report.html.
9. Open **Save hosted report** to show the simulated Stripe-hosted workflow while emphasizing that JSON/PDF export stays free/open.

## Why it matters for Nous Research / Hermes

FarmFax demonstrates Hermes as an agentic operations layer for a real business workflow. In production, Hermes would coordinate capture completeness, evidence routing, overclaim challenges, OCR/CV checks, provenance, report generation, export, payment handoff, and follow-up tasks for sellers, buyers, mechanics, or inspectors. The demo labels this honestly: browser checks are implemented; Hermes orchestration is a planned backend seam.

## Why it matters for NVIDIA / NIM

FarmFax is a multimodal inspection workload: photos, selected video frames, defect crops, serial/hour OCR, segmentation overlays, structured reasoning, and evidence-grounded report writing. The current browser heuristics are a prototype layer; NVIDIA NIM is the production trust gate for condition, completeness, visible damage, missing proof, and accelerated inspection at scale.

## Why it matters for Stripe

Stripe is the planned commerce rail for monetizing the trust workflow without creating a data prison. The demo shows a simulated hosted-report checkout seam for future inspection reports, verified listings, hosted report links, seller share pages, dealer/shop branding, expert mechanic review, auction/dealer subscriptions, and Connect payouts for inspectors or agents. The core JSON/PDF report remains buyer-owned before payment.

## Open-source angle

FarmFax is strongest when inspectable:

- open report schema;
- transparent scoring/risk categories;
- local-first capture path;
- evidence-linked reasoning;
- export-first record ownership;
- clear unsupported-claims list;
- deterministic sample scenarios for demo and testing;
- `input_sources` and `demo_truth` metadata so judges/users can see what is implemented, planned, or simulated.

## What FarmFax does not claim

FarmFax is not a certified mechanic inspection, title/lien/theft search, appraisal, repair estimate, warranty, safety certification, or full-video inspection. It is a screening aid that says what visible submitted evidence suggests, what proof is missing, what questions to ask, and what needs human/dealer/mechanic verification.

Unknowns stay unknown.

## Moat

The moat is guided evidence capture plus an open equipment-report standard. Better captures create better model inputs; every report creates structured examples of machine type, evidence quality, visible issues, confidence, missing proof, seller questions, and verification outcomes.

The wedge starts with buyer trust before deposit. The expansion is dealer workflows, auction reports, seller-hosted reports, mechanic review, lender/insurer proof packets, and consent-based training data from real equipment media.

## Winning narrative

Farm equipment commerce runs on trust gaps. Listings are messy, repairs are expensive, and records live in silos. FarmFax starts where the buyer already is — phone in hand, standing next to a machine or looking at a listing — and turns that moment into a trust workflow with explicitly labeled payment seams.

## Final closing line

FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.
