# FarmFax — Final Hackathon Demo Script

## 0:00 — Hook

Say:

> “Buying used farm equipment is a trust problem. A tractor can look fine in a listing and still hide leaks, repaint, corrosion, missing safety evidence, questionable hours, or a serial plate you never checked. FarmFax turns a phone walkthrough into an open buyer risk report before you buy the story.”

Show the hero line: **Scan the machine before you buy the story.**

## 0:20 — Product thesis

Say:

> “Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now — with evidence, confidence, missing proof, and an open record the owner controls.”

Point to:

- Evidence-first.
- Open schema.
- Repair-friendly.
- No data hostage.

## 0:40 — Guided phone capture

Scroll to **phone-guided inspection**.

Say:

> “The phone is the input device, but guided capture is the moat. FarmFax asks for the exact evidence a buyer needs: walkaround, serial/PIN plate, hour meter, hydraulics, tires or tracks, paint/body panels, and engine bay.”

Action:

- Show the capture cards.
- If demo images are ready, upload/capture one image to trigger local CV.
- If not, point to the sample report badge and explain that sample evidence keeps the judge flow reliable.

Important line:

> “Better inputs beat fancier model claims. Missing evidence increases uncertainty instead of letting the AI guess.”

## 1:15 — Local CV and visual evidence

Show **browser CV + planned Nemotron layer** and the overlays.

Say:

> “This browser demo runs local image heuristics for rust-tone pixels, wet or leak-like regions, and paint variance. In production, NVIDIA-accelerated CV and Nemotron-style reasoning can upgrade these into multi-image defect crops and structured explanations.”

Point to:

- Rust / leak / paint / tread hotspots.
- Per-slot CV confidence.
- Evidence overlay masks if uploaded images are available.

Guardrail line:

> “FarmFax reports visible evidence. It is not pretending to certify internal mechanical condition.”

## 1:50 — Identity and hour risk

Scroll to **serial code + visual catalog**.

Say:

> “A buyer should not trust a listing until identity evidence is cross-checked. FarmFax treats serial/PIN plates, hour meters, model clues, dealer stock numbers, auction lots, and service records as evidence with confidence — not magic universal truth.”

Point to:

- OCR serial/PIN.
- Hour meter confidence.
- Make/model candidate list.
- Anti vendor lock-in panel.

## 2:20 — Buyer risk report

Scroll to **consolidated FarmFax report**.

Say:

> “The output is not a chatbot answer. It is a buyer risk report: visible condition score, identity risk, safety risk, evidence completeness, negotiation leverage, seller questions, missing evidence, and a ledger of what was actually analyzed.”

Point to these exact sections:

1. Visible-condition score.
2. Compact risk strip.
3. Deal posture.
4. Buyer leverage questions.
5. Missing evidence and guardrail.
6. Browser CV ledger.

Important line:

> “Unknowns stay unknown. If the engine bay or cold-start evidence is missing, FarmFax says so instead of inventing certainty.”

## 2:55 — Export and Stripe

Click **Download report JSON** and/or **Print / save PDF**.

Then click **Open Stripe checkout demo**.

Say:

> “The open record exports as JSON or PDF. Stripe monetizes hosted report links, seller share pages, dealer branding, and expert review — but export remains available without paying. The business model is workflow, not data captivity.”

## 3:20 — Sponsor close

Say:

> “For Hermes, FarmFax is physical-world workflow orchestration: capture, CV, reasoning, provenance, export, and commerce. For NVIDIA, it is a multimodal inspection workload. For Stripe, it is paid trust infrastructure for equipment commerce.”

## 3:40 — Final line

Say:

> “FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.”

## If judges ask: “Is this really Carfax?”

Answer:

> “It is Carfax-like in user value, not in claims. We are not claiming authoritative title, lien, theft, service, or ownership history yet. The hackathon wedge is visual condition plus portable evidence. Authoritative feeds can plug into the same open report later.”

## If judges ask: “What is live vs demo?”

Answer:

> “The current prototype is a local React/Vite demo. Capture slots, image upload, local rust/wet/paint heuristics, overlays, report scoring, JSON export, print/PDF, and Stripe-style checkout modal are implemented. OCR/model integrations are represented as confidence-gated report fields and are the next backend seam.”

## If judges ask: “What prevents AI slop?”

Answer:

> “Every finding needs evidence, confidence, and a limitation. Missing views lower certainty. The report explicitly avoids certification language. The scoring rubric is open and inspectable.”

## If judges ask: “How does it make money?”

Answer:

> “Free/open core reports create trust and adoption. Stripe powers paid hosted share links, dealer/shop branding, seller response workflows, expert mechanic review, and auction/dealer subscriptions. We monetize distribution and workflow, not ownership of the record.”
