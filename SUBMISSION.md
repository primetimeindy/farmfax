# FarmFax — Hackathon Submission Brief

## Submission title

FarmFax: Open Equipment Condition Reports from a Phone Walkthrough

## Short description

FarmFax is an open-source AI-assisted pre-purchase condition report for used farm equipment. A buyer captures guided phone photos of a tractor or implement; FarmFax analyzes visible rust, leak/wetness, paint variance, serial/PIN evidence, hour-meter evidence, missing views, and safety/leverage risk; then it exports an open JSON/PDF buyer risk report while offering Stripe-hosted sharing and review workflows without data lock-in.

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

The demo flow:

1. Buyer opens FarmFax on a phone or desktop.
2. FarmFax guides required captures: walkaround, serial/PIN, hour meter, hydraulics, tires/tracks, paint/body, and engine bay.
3. Local CV heuristics flag rust-tone pixels, wet/leak-like regions, and paint variance, then render evidence overlays.
4. Identity/hour evidence is scored conservatively with explicit confidence and user-confirmation requirements.
5. A FarmFax buyer risk report summarizes visible condition, identity/fraud risk, safety/structural risk, evidence completeness, and negotiation leverage.
6. The buyer exports open JSON/PDF.
7. Stripe powers optional hosted report links, seller share pages, dealer/shop branding, and review workflows — while export remains open.

## Why it matters for Nous Research / Hermes

FarmFax shows Hermes as an orchestration layer for physical-world AI workflows, not just chat. Hermes can coordinate capture completeness, CV/OCR tools, Nemotron-style reasoning, report generation, provenance, export, and payment handoffs into one governed workflow.

## Why it matters for NVIDIA / Nemotron

FarmFax is naturally multimodal and vision-heavy: multi-image evidence, defect crops, segmentation overlays, serial/hour OCR, checklist completeness, and structured report reasoning. Nemotron can turn visual findings into transparent buyer reports; NVIDIA acceleration becomes more valuable as the detector set grows from browser heuristics to robust CV pipelines.

## Why it matters for Stripe

Stripe monetizes trust workflow without becoming a data prison: hosted report links, seller share pages, dealer/shop branding, expert mechanic review, auction/dealer subscriptions, and paid verification. The core report still exports as JSON/PDF.

## Open-source angle

FarmFax is strongest when inspectable:

- Open report schema.
- Transparent scoring rubric.
- Local-first capture and CV path.
- Export-first record ownership.
- Self-hostable core.
- Prompt/checklist/detector improvements that compound into a shared inspection standard.

## Demo path

- Show the hero: “Scan the machine before you buy the story.”
- Explain the controlled sample and guardrail: visible evidence only; unknowns stay unknown.
- Run through the guided capture slots.
- Upload/capture at least one image if available, or use sample evidence to show overlays.
- Show rust/wet/paint CV summary and evidence hotspots.
- Show serial/PIN and hour-meter panel.
- Show buyer risk report: score, risk strip, deal posture, buyer leverage questions, limits/missing evidence, evidence ledger.
- Export JSON and print/save PDF.
- Open Stripe checkout demo and emphasize that export stays free/open.

## Current implementation

- React + TypeScript + Vite prototype.
- Phone-first capture slots with `accept="image/*"` and `capture="environment"`.
- Local browser image analysis for rust-tone, wet/leak-like, and paint-variance heuristics.
- Evidence overlay masks on uploaded photos.
- Typed in-app FarmFax report object with schema version `farmfax.report.v0.1-open`.
- Buyer risk summary: identity/fraud, safety/structural, evidence completeness, and negotiation leverage.
- JSON report export and print/PDF path.
- Stripe-style hosted report modal.
- Production build verified with `npm run build`.

## What is intentionally not claimed

FarmFax does not certify mechanical condition, title status, lien status, theft status, safety, market value, or repair cost. It is an evidence-backed screening aid that tells buyers what visible evidence suggests, what is missing, and what to verify with a seller, mechanic, dealer, or records provider.

## Moat

The moat is guided evidence capture plus an open inspection record standard. Better captures create better model inputs; every report generates structured examples of machine type, evidence quality, visible defects, confidence, buyer questions, and downstream verification outcomes.

## Winning narrative

Farm equipment commerce runs on trust gaps. Listings are messy, inspections are inconsistent, and records live in silos. FarmFax starts where the buyer already is — phone in hand, standing next to a machine — and turns that moment into a portable, evidence-backed buyer risk report. It is practical enough for a hackathon demo, open enough for the community to extend, and commercial enough for Stripe-powered hosted reports and dealer workflows.

## Final closing line

FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.
