# FarmFax — Final Hackathon Demo Script

## 0:00 — Hook

Say:

> “Buying used farm equipment is a trust problem. A tractor can look fine in a listing and still hide leaks, repaint, corrosion, missing safety evidence, questionable hours, or a serial plate you never checked. FarmFax turns a phone walkthrough into an open buyer risk report before you buy the story.”

Open:

```text
https://primetimeindy.github.io/farmfax-demo/
```

## 0:20 — Product thesis

Say:

> “Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now — with evidence, confidence, missing proof, and an open record the owner controls.”

Point to:

- Phone-first capture.
- Evidence checked.
- Open JSON/PDF export.
- No data hostage.

## 0:40 — Deterministic judge demo

Click **Load complete sample**.

Say:

> “For judging, this button runs a deterministic sample inspection: it loads a complete tractor report and runs a short hydraulic video through the same browser video sampler.”

Point to:

- `4 frames checked`.
- `Frame to review`.
- Thumbnail strip.
- Guardrail: selected frames only.

Important line:

> “Video helps with motion, sound, smoke, and hydraulics, but FarmFax does not pretend to inspect every moment of the video.”

## 1:15 — Guided evidence capture

Scroll to **Capture these 7 views** if needed.

Say:

> “The phone is the input device, but guided capture is the moat. FarmFax asks for the exact evidence a buyer needs: walkaround, serial/PIN plate, hour meter, hydraulics, tires or tracks, paint/body panels, and engine bay.”

Point to:

- Photo/video inputs.
- `Try sample video`.
- Required evidence slots.
- Missing/retake states.

Important line:

> “Better inputs beat fancier model claims. Missing evidence increases uncertainty instead of letting the AI guess.”

## 1:50 — Buyer risk report

Scroll to **What to check before buying**.

Say:

> “The output is not a chatbot answer. It is a buyer risk report: visible condition score, paperwork risk, safety and repair risk, evidence completeness, hour plausibility, negotiation leverage, seller questions, and a record of what was actually checked.”

Point to:

1. Visible-condition score.
2. Recommended next step.
3. Compact risk strip.
4. **Evidence checked** summary.
5. Buyer questions.
6. Missing-proof and guardrail copy.

Important line:

> “Unknowns stay unknown. FarmFax reports submitted evidence and missing proof — not certification.”

## 2:35 — Judge proof and workflow trace

Scroll to **Judge proof** and **For judges: demo trace**.

Say:

> “This is where we keep the sponsor story honest. The browser photo and video checks are working in the demo. Hermes orchestration and NVIDIA NIM vision are labeled as planned backend seams. Stripe is represented by a simulated hosted-report modal. The JSON says the same thing.”

Point to:

- Live browser checks.
- Open report.
- Hermes path.
- Truth labels.
- Working demo / planned / simulated trace cards.

## 3:10 — Export and share

Click **Download JSON report**.

Say:

> “The open record exports as JSON or PDF. The JSON includes input sources and demo truth, so a judge or future integrator can see exactly what was implemented, planned, or simulated.”

Open technical details if useful and point to:

```text
input_sources
demo_truth
unsupported_claims
```

Then show:

- **Print / save PDF**.
- QR/share block.
- **Save hosted report** modal.

Say:

> “Stripe monetizes the business workflow: paid reports, verified listings, hosted report links, expert review, and inspector or agent payouts — but export remains available without paying. The model is trust infrastructure, not data captivity.”

## 3:45 — Sponsor close

Say:

> “For Hermes and Nous, FarmFax is an agent-run operations loop: capture, evidence checks, overclaim challenges, report generation, payment handoff, and follow-up tasks. For NVIDIA NIM, it is a vision trust gate. For Stripe, it is paid trust infrastructure for equipment commerce.”

## Final line

Say:

> “FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.”

## If judges ask: “Is this really Carfax?”

Answer:

> “It is Carfax-like in user value, not in claims. We are not claiming authoritative title, lien, theft, service, or ownership history yet. The hackathon wedge is visible condition plus portable evidence. Authoritative feeds can plug into the same open report later.”

## If judges ask: “What is live vs demo?”

Answer:

> “The live prototype is a deployed React/Vite app. Capture slots, image/video upload, browser rust/wet/paint checks, selected video-frame sampling, overlays, report scoring, JSON export, print/PDF, QR/share, and the hosted-report modal are implemented. Hermes orchestration and NVIDIA NIM vision are planned backend seams. Stripe checkout is simulated.”

## If judges ask: “What prevents AI slop?”

Answer:

> “Every finding needs evidence, confidence, and a limitation. Missing views lower certainty. The report explicitly avoids certification language. The exported JSON includes unsupported claims so the product cannot silently overstate what it knows.”

## If judges ask: “How does it make money?”

Answer:

> “Free/open core reports create trust and adoption. Stripe powers paid hosted share links, dealer/shop branding, seller response workflows, expert mechanic review, and auction/dealer subscriptions. We monetize distribution and workflow, not ownership of the record.”
