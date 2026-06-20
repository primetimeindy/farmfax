# FarmFax Pivot Strategy

## Mode
Scope Expansion — the land/parcel project was useful, but the better hackathon wedge is a physical-world trust product: open-source Carfax for farm equipment using phone capture, computer vision, and verifiable inspection reports.

## Working Name
FarmFax / TractorFax / IronLedger

## One-liner
Open-source inspection reports for used farm equipment: scan a tractor, skid steer, baler, trailer, or implement with your phone; AI detects rust, paint mismatch, leaks, cracks, wear patterns, serial plates, and generates a transparent condition/history packet buyers can trust.

## The Real Objective
Turn a phone into the evidence-capture device for farm-equipment resale, then use open-source vision + Hermes orchestration to produce a credible buyer/seller inspection packet.

## Why This Beats ParcelProof for the Hackathon
- More visual: judges instantly understand phone camera -> equipment report.
- More visceral: rust, paint mismatch, leaks, cracks, tire wear, hour meter, serial plate.
- More defensible: dataset compounds over time; inspection workflows become the moat.
- More open-source-native: models, prompts, checklists, scoring rubric, and report generation can be transparent.
- Better NVIDIA angle: vision-heavy pipeline with Nemotron/vision reasoning/workflow orchestration.

## Core User
A buyer considering used farm equipment from Facebook Marketplace, auction, dealer lot, or private seller.

## Killer Demo Flow
1. User opens mobile web app.
2. App asks for a guided inspection: front, rear, left, right, engine bay, hydraulic lines, tires/tracks, hitch/PTO, cab, dashboard/hour meter, serial plate.
3. User captures photos/video.
4. Vision pipeline segments and classifies defects:
   - rust/corrosion
   - paint mismatch or repaint zones
   - cracks/weld repairs
   - oil/hydraulic leaks
   - tire/tread/track wear
   - bent frame/loader arms
   - missing guards/shields
   - serial plate/OCR
   - hour meter/OCR
5. Nemotron/LLM creates a buyer-readable inspection report.
6. Hermes orchestrates: evidence validation, scoring, report generation, checklist completeness, PDF/export, optional share link.
7. Output: FarmFax report with condition score, red flags, estimated negotiation leverage, and evidence thumbnails.

## System Boundary
Phone is the input device. Backend is the inspection brain. Report is the proof artifact.

### Phone Layer
- PWA/mobile web capture
- camera upload
- guided shot checklist
- optional AR overlay instructions: "move closer", "capture tire tread", "capture serial plate"

### Vision Layer
- rust/corrosion color + texture detector
- paint mismatch detector using color histograms / material segmentation
- OCR for serial plate and hour meter
- object/part detection: tires, hydraulic lines, PTO, hitch, engine bay, cab, bucket, tracks
- segmentation overlays for defect evidence

### Reasoning Layer
- Nemotron / NVIDIA model for structured inspection reasoning
- Hermes for orchestration, report generation, tool calls, routing, and provenance
- optional local/open-source CV stack for transparency

### Report Layer
- condition score: 0-100
- confidence score
- red/yellow/green flags
- negotiation notes
- maintenance questions to ask seller
- evidence gallery
- JSON + PDF export

## MVP Scope
Build the smallest demo that feels real:

1. Equipment type selector:
   - Tractor
   - Skid steer
   - UTV/ATV
   - Trailer
   - Implement

2. Guided mobile inspection:
   - Upload/capture 6 required shots
   - front, side, rear, engine/hydraulics, tires/tracks, serial/hour meter

3. Defect detectors:
   - Rust/corrosion heuristic detector
   - Paint mismatch heuristic detector
   - OCR extraction for serial/hour meter
   - LLM-generated inspection report

4. Evidence overlay:
   - highlight suspect rust zones
   - highlight paint variance zones
   - show OCR crops

5. Final report:
   - FarmFax score
   - risk flags
   - buyer questions
   - PDF/shareable report

## Kill / Keep / Add

### Kill
- Parcel/land workflow for this hackathon unless needed as a future adjacent product.
- Paid data provider dependency.
- Trying to solve actual title/ownership history on day one.
- Full model training. Use heuristics + zero-shot/segmentation first.

### Keep
- Proof packet/report architecture.
- Evidence-first UX.
- Hermes orchestration.
- PDF/export habit.
- Trust-focused copy.

### Add
- Phone-first capture UX.
- Computer-vision overlays.
- Equipment inspection checklist.
- Rust/paint/leak/wear detection.
- Serial/hour meter OCR.
- Open-source scoring rubric.

## Technical Pattern

### Rust detection v0
Use simple but explainable CV first:
- Convert image to HSV/LAB.
- Detect orange/brown hue clusters.
- Apply texture/noise filters to distinguish rust from painted orange equipment.
- Segment suspect zones.
- Score severity by area %, saturation, edge roughness, and location.

### Paint mismatch v0
- Segment equipment body panels or broad visible regions.
- Compute color distributions per region.
- Compare hue/brightness differences.
- Flag anomalous panel/patch zones.
- Ask LLM to interpret: repaint, repair, shadow, dirt, lighting uncertainty.

### Leak detection v0
- Detect dark glossy streaks near engine/hydraulic areas.
- Look for black/brown liquid patterns on hoses, cylinders, ground under equipment.
- Keep confidence conservative.

### Wear detection v0
- Tire/tread/tracks: use image crop + LLM/vision prompt first.
- Later: train classifier from labeled examples.

### OCR v0
- Use OCR for:
  - serial/VIN/PIN plate
  - hour meter
  - model number
  - decals

## Open Source Angle
Everything inspectable:
- scoring rubric in JSON
- defect detector code
- prompt templates
- sample inspection dataset
- report schema
- local-first mode

## NVIDIA / Nemotron Angle
- Use Nemotron for structured reasoning over multi-image evidence.
- Use GPU-accelerated CV pipeline for segmentation/defect overlays.
- Position as "AI inspection copilot for the physical economy."

## Hermes Angle
Hermes is the orchestration layer:
- manages multi-step inspection workflow
- routes images through CV/OCR/LLM modules
- enforces completeness gates
- generates final report
- creates audit trail/provenance
- optionally dispatches report to buyer/seller/dealer

## Report Schema
```json
{
  "equipment_type": "tractor",
  "make_model_guess": "string",
  "serial_number": "string|null",
  "hour_meter": "number|null",
  "condition_score": 0,
  "confidence": 0,
  "flags": [
    {
      "severity": "red|yellow|green",
      "category": "rust|paint|leak|wear|frame|ocr|missing_view",
      "finding": "string",
      "evidence_image_id": "string",
      "confidence": 0
    }
  ],
  "buyer_questions": [],
  "negotiation_notes": [],
  "missing_evidence": []
}
```

## MVP Done Definition
- Mobile upload flow works.
- At least 6 image slots.
- Rust and paint mismatch overlays render on uploaded images.
- OCR extracts serial/hour text from a sample.
- Report generates with condition score and flags.
- PDF/share view works.
- Demo uses 2-3 seeded farm-equipment examples.

## Risk Gates
- Do not claim legal title/history at MVP.
- Phrase as inspection aid, not certified appraisal.
- Confidence must be visible.
- Every finding must link to image evidence.
- Unknowns must be explicit.

## Strategic Tagline
Carfax tells you what paperwork says happened. FarmFax shows you what the machine is telling you right now.
