# FarmFax MVP Technical Architecture

> Static React/Vite demo architecture for pivoting the existing ParcelProof-style proof-packet app into FarmFax: a phone-first farm-equipment inspection report prototype.

## Goal

Build a hackathon-grade web prototype that feels like “Carfax for farm equipment”: a buyer opens the app on a phone, follows guided capture prompts, sees simulated/open-source computer-vision findings for rust/paint/leaks/wear plus serial/hour-meter extraction, reviews a make/model visual catalog guess, and exports a consolidated FarmFax report. The MVP must work as a static frontend demo and leave clear seams for a future backend.

## Existing App Fit

Current repo shape is intentionally simple:

- `src/App.tsx`: single-page React app with state, analysis stages, report UI, export actions, sponsor positioning, and fixture/live fallbacks.
- `src/proofPacket.ts`: typed report schema, scores, sponsor stack, packet builder, markdown export.
- `src/App.css`: visual system.
- `package.json`: React 19 + Vite + TypeScript, no heavy runtime dependencies.

FarmFax should preserve this pattern for speed:

- Keep the proof-packet/report architecture.
- Replace land parcel concepts with equipment inspection concepts.
- Use deterministic fixtures and client-side heuristics for demo reliability.
- Add optional dynamic imports or future API adapters for real CV/OCR later.

## MVP Architecture

### Runtime Topology

```text
Phone browser / desktop demo
  └─ React/Vite static app
      ├─ Guided capture state machine
      ├─ Fixture/sample inspection loader
      ├─ Client-side simulated CV pipeline
      │   ├─ Rust/corrosion heuristic
      │   ├─ Paint mismatch heuristic
      │   ├─ Leak/wetness heuristic
      │   ├─ Tire/track wear heuristic
      │   └─ OCR fixture/manual extraction adapter
      ├─ Equipment visual catalog matcher
      ├─ FarmFax report builder
      ├─ Evidence gallery + overlays
      ├─ Markdown/JSON/print export
      └─ Sponsor/positioning panel

Optional future backend
  ├─ Image upload/storage
  ├─ GPU CV inference workers
  ├─ OCR service
  ├─ Nemotron/vision reasoning endpoint
  ├─ Hermes orchestration workflow
  └─ Stripe checkout + report-share links
```

### MVP Constraint

The prototype should be shippable as a static Vite build. Do not require camera permissions, backend auth, external model keys, Stripe keys, or GPU services for the core demo path. All paid/API/model functionality should degrade to staged/test UI.

## Product Flow

1. **Landing / positioning**
   - Headline: “FarmFax shows what the machine is telling you right now.”
   - User chooses equipment type: tractor, skid steer, UTV/ATV, trailer, implement.
   - User can either start inspection or load a seeded sample.

2. **Phone input / guided capture**
   - Six required capture slots:
     - front
     - left/right side
     - rear / hitch / PTO
     - engine bay / hydraulics
     - tires/tracks/undercarriage
     - serial plate + dashboard/hour meter
   - Each slot accepts `input type="file" accept="image/*" capture="environment"`.
   - Demo-safe path includes seeded thumbnails if user skips upload.
   - Completion gate shows missing shots instead of blocking all exploration.

3. **Simulated/open-source CV analysis**
   - Per image, run deterministic analysis producing bounding boxes/masks, confidence, severity, and evidence notes.
   - If uploaded image pixels are accessible, optional lightweight heuristics can run in browser via `<canvas>`:
     - rust: orange/brown HSV clusters + roughness/noise score
     - paint mismatch: dominant color variance across coarse grid cells
     - leak: dark glossy/low-value blobs in engine/hydraulic slots
     - wear: tread/track slot heuristic plus fixture model
   - If browser analysis is not implemented yet, seeded fixtures drive believable overlays.

4. **Serial/hour-meter extraction**
   - MVP static path:
     - seeded sample returns known `serialNumber`, `hourMeter`, and OCR confidence.
     - uploaded images show “manual confirm” fields with prefilled OCR-like extraction when demo text is selected.
   - Optional frontend OCR path:
     - future dynamic import of `tesseract.js` for local OCR, gated behind a “try local OCR” button to avoid build/demo risk.
   - Future backend path:
     - upload crop to OCR/Nemotron pipeline.

5. **Make/model visual catalog**
   - Static catalog JSON maps brands/models to visual cues:
     - color family
     - logo/decal hints
     - silhouette/class
     - common serial plate location
     - expected hour-meter style
   - MVP matching is explainable and conservative:
     - equipment type + color + user-entered decal text + seeded fixture tags.
   - Output: `makeModelCandidates[]` with confidence and why.

6. **Report generation**
   - Consolidate evidence into a FarmFax report:
     - condition score
     - confidence score
     - red/yellow/green flags
     - missing evidence
     - buyer questions
     - negotiation leverage
     - maintenance follow-up
     - sponsor stack
     - provenance ledger
   - Export JSON, Markdown, and browser print/PDF.

7. **Sponsor positioning**
   - NVIDIA: accelerated visual inspection pipeline, edge-to-GPU inference, segmentation/OCR workloads.
   - Nemotron: structured reasoning over multi-image evidence and maintenance risk summaries.
   - Hermes/Nous: orchestration, completeness gates, provenance, report generation.
   - Stripe: paid report unlock, dealer/buyer share link, expert inspection upsell.

## Recommended File Layout

Keep the MVP small but split domain logic out of `App.tsx`.

```text
src/
  App.tsx                         # page composition/state orchestration
  App.css                         # existing visual system, extended for FarmFax
  farmfax/
    types.ts                      # shared TypeScript domain schema
    fixtures.ts                   # sample equipment inspections + seeded detections
    equipmentCatalog.ts           # visual catalog and make/model candidates
    detectors.ts                  # browser-safe heuristic/simulated CV adapters
    report.ts                     # score aggregation + markdown/json report builder
    checklist.ts                  # guided capture steps and completeness gates
    sponsorStack.ts               # NVIDIA/Nemotron/Hermes/Stripe positioning
    components/
      EquipmentSelector.tsx
      CaptureChecklist.tsx
      CaptureSlot.tsx
      AnalysisTimeline.tsx
      EvidenceOverlay.tsx
      DetectionSummary.tsx
      SerialHourMeterPanel.tsx
      MakeModelCatalog.tsx
      FarmFaxReport.tsx
      SponsorPositioning.tsx
```

For an ultra-fast hackathon implementation, components can be added incrementally while `App.tsx` continues to own top-level state.

## Component Responsibilities

### `EquipmentSelector`

- Inputs: current `equipmentType`, `sampleId`.
- Outputs: selected type/sample.
- Renders equipment categories and “Load demo tractor/skid steer/trailer” buttons.

### `CaptureChecklist`

- Inputs: `captureSlots`, completion state.
- Outputs: updated image/file per slot.
- Renders six guided cards with instructions and evidence quality hints.
- Gate: marks missing required views.

### `CaptureSlot`

- Uses mobile-friendly file input:

```tsx
<input
  type="file"
  accept="image/*"
  capture="environment"
  onChange={(event) => onSelect(event.currentTarget.files?.[0] ?? null)}
/>
```

- Creates object URLs for previews.
- Allows reverting to seeded demo image.

### `AnalysisTimeline`

Stages:

1. Validate required views.
2. Detect rust/corrosion.
3. Detect paint mismatch/repaint zones.
4. Detect leaks/wetness.
5. Assess tires/tracks/wear.
6. Extract serial/hour meter.
7. Match make/model catalog.
8. Build FarmFax report.

### `EvidenceOverlay`

- Inputs: image preview URL, `Detection[]` for that image.
- Renders `<img>` with absolutely positioned normalized bounding boxes.
- Colors:
  - red: severe safety/structural/leak flag
  - yellow: needs verification
  - green/blue: extracted identity/normal evidence

### `DetectionSummary`

- Groups findings by category and severity.
- Shows confidence and “why flagged” explanations.

### `SerialHourMeterPanel`

- Shows OCR crops or slot preview.
- Lets user confirm/edit:
  - serial/PIN
  - hour meter
  - model decal text
- Flags conflicts, e.g. “hour meter unreadable” or “serial missing.”

### `MakeModelCatalog`

- Shows top candidates:
  - make
  - model/family
  - equipment class
  - confidence
  - evidence cues
- Conservatively labels uncertain guesses.

### `FarmFaxReport`

- Uses `buildFarmFaxReport()` to render/export the same schema.
- Includes disclaimers: inspection aid, not certified appraisal/mechanic report/title history.

### `SponsorPositioning`

- Replaces current land sponsor cards with FarmFax-specific sponsor proof.

## Data Schema

Put these in `src/farmfax/types.ts`.

```ts
export type EquipmentType = 'tractor' | 'skid_steer' | 'utv_atv' | 'trailer' | 'implement'

export type CaptureView =
  | 'front'
  | 'side'
  | 'rear_hitch_pto'
  | 'engine_hydraulics'
  | 'tires_tracks'
  | 'serial_hour_meter'

export type Severity = 'green' | 'yellow' | 'red'
export type ConfidenceLabel = 'verified' | 'screened' | 'needs-human-verification'

export type CaptureAsset = {
  id: string
  view: CaptureView
  label: string
  required: boolean
  instructions: string
  fileName?: string
  previewUrl: string
  source: 'uploaded' | 'fixture'
  capturedAtIso: string
}

export type DetectionCategory =
  | 'rust'
  | 'paint_mismatch'
  | 'leak'
  | 'wear'
  | 'crack_or_weld'
  | 'frame_bent'
  | 'missing_guard'
  | 'serial_ocr'
  | 'hour_meter_ocr'
  | 'make_model_cue'
  | 'missing_view'

export type BoundingBox = {
  x: number // 0..1 normalized left
  y: number // 0..1 normalized top
  w: number // 0..1 normalized width
  h: number // 0..1 normalized height
}

export type Detection = {
  id: string
  assetId: string
  category: DetectionCategory
  severity: Severity
  title: string
  finding: string
  evidence: string
  confidence: number // 0..1
  confidenceLabel: ConfidenceLabel
  bbox?: BoundingBox
  detector: 'fixture' | 'canvas_heuristic' | 'ocr_manual' | 'future_backend'
}

export type OcrExtraction = {
  serialNumber: string | null
  hourMeter: number | null
  modelText: string | null
  confidence: number
  source: 'fixture' | 'manual_confirmed' | 'local_ocr' | 'future_backend'
  notes: string[]
}

export type MakeModelCandidate = {
  make: string
  modelFamily: string
  equipmentType: EquipmentType
  confidence: number
  cues: string[]
  catalogImageHint?: string
}

export type FarmFaxScore = {
  label: string
  score: number
  severity: Severity
  finding: string
  nextAction: string
}

export type FarmFaxReport = {
  reportId: string
  product: 'FarmFax'
  schemaVersion: '0.1.0'
  generatedAtIso: string
  equipment: {
    type: EquipmentType
    makeModelGuess: string | null
    serialNumber: string | null
    hourMeter: number | null
  }
  conditionScore: number
  confidenceScore: number
  verdict: 'STRONG_BUY' | 'NEGOTIATE' | 'INSPECT_FIRST' | 'WALK'
  scores: FarmFaxScore[]
  flags: Detection[]
  makeModelCandidates: MakeModelCandidate[]
  ocr: OcrExtraction
  captureAssets: CaptureAsset[]
  missingEvidence: CaptureView[]
  buyerQuestions: string[]
  negotiationNotes: string[]
  maintenanceFollowUps: string[]
  sponsorStack: SponsorProof[]
  ledger: string[]
  disclaimer: string
}

export type SponsorProof = {
  sponsor: 'NVIDIA' | 'Nemotron' | 'Nous Research / Hermes' | 'Stripe'
  lane: string
  primitive: string
  proof: string
  value: string
}
```

## Scoring Model

Implement in `src/farmfax/report.ts` as transparent rules, not black-box magic.

### Score Inputs

- Start at 82 for complete sample inspection.
- Subtract severity-weighted detections:
  - red: -14 to -24 depending on category
  - yellow: -4 to -10
  - green: no penalty or +1 for verified evidence
- Missing required view: -8 each.
- Missing/unreadable serial: -12.
- Missing/unreadable hour meter: -8.
- Confirmed low-confidence make/model: no penalty, but lower confidence score.
- Severe leak + engine/hydraulic slot: force verdict no better than `INSPECT_FIRST`.
- Frame/crack/weld red flag: force verdict no better than `WALK` or `INSPECT_FIRST`.

### Verdict Thresholds

```ts
if (hasSevereStructuralFlag || conditionScore < 45) return 'WALK'
if (hasSevereLeak || missingSerial || conditionScore < 65) return 'INSPECT_FIRST'
if (conditionScore < 82) return 'NEGOTIATE'
return 'STRONG_BUY'
```

### Confidence Score

- 100 base.
- -10 per missing required view.
- -15 if serial/hour slot missing.
- -10 if all detections are fixture-only and no upload/manual confirmation.
- -5 to -20 for low OCR/catalog confidence.

## Detector Design

Implement in `src/farmfax/detectors.ts`.

### Common Interface

```ts
export async function analyzeInspection(input: {
  equipmentType: EquipmentType
  assets: CaptureAsset[]
  ocr: OcrExtraction
  mode: 'fixture' | 'canvas'
}): Promise<Detection[]> {
  // MVP: merge deterministic fixture detections with optional canvas heuristic detections.
}
```

### Rust v0

- Target slots: front, side, rear, engine/hydraulics, tires/tracks.
- Canvas heuristic:
  - sample pixels on a coarse grid.
  - flag hue roughly 10–45 degrees, saturation > 0.25, value > 0.15.
  - ignore if broad uniform orange/red paint covers too much of the whole image.
  - group into rough normalized boxes by grid cell clusters.
- Fixture fallback:
  - seeded detections for known samples.

### Paint Mismatch v0

- Target slots: front, side, rear.
- Canvas heuristic:
  - divide image into 4x4 regions.
  - compute region average hue/lightness.
  - flag a panel if it differs substantially from neighboring body regions and is not just sky/ground.
- Explain uncertainty: lighting, dust, shadow, factory panel variation.

### Leak v0

- Target slot: engine/hydraulics.
- Canvas heuristic:
  - detect low-value/dark blobs with local shine/contrast.
  - only count in engine/hydraulics view.
- Fixture fallback:
  - “hydraulic seep near left loader cylinder” style finding.

### Wear v0

- Target slot: tires/tracks.
- MVP fixture-first.
- Optional canvas heuristic:
  - flag low-contrast tread crop or visible cracking zones, but keep low confidence.
- Reasoning copy should say “screening cue,” not certified tire-depth measurement.

### OCR v0

- MVP: manual confirmation fields + fixture extraction.
- Do not add heavy OCR dependency unless time allows.
- Future local OCR adapter:

```ts
export async function runLocalOcr(asset: CaptureAsset): Promise<OcrExtraction> {
  // dynamic import('tesseract.js') only after user clicks, not core bundle.
}
```

## Fixtures

Create `src/farmfax/fixtures.ts` with 2–3 demo inspections.

### Recommended seeded demos

1. **2014 John Deere 5075E tractor**
   - Yellow findings:
     - surface rust on loader bucket edge
     - mild hydraulic seep
     - rear tire wear moderate
   - OCR:
     - serial: `1PY5075EEDR123456`
     - hours: `2184`
   - Verdict: `NEGOTIATE`

2. **Bobcat S650 skid steer**
   - Red/yellow findings:
     - repaint mismatch near rear panel
     - oil residue in engine bay
     - track wear heavy
   - OCR:
     - serial present
     - hours uncertain
   - Verdict: `INSPECT_FIRST`

3. **Utility trailer / implement**
   - Findings:
     - frame rust
     - missing guard/reflector
     - serial plate unreadable
   - Verdict: `WALK` or `INSPECT_FIRST`

Use local SVG/CSS placeholders if real photos are not available. Overlays can still render on stylized equipment cards for the hackathon demo.

## Make/Model Visual Catalog

Create `src/farmfax/equipmentCatalog.ts`.

```ts
export const equipmentCatalog = [
  {
    make: 'John Deere',
    modelFamily: '5E Utility Tractor',
    equipmentType: 'tractor',
    colorCues: ['green body', 'yellow wheels'],
    decalCues: ['5075E', '5055E', '5065E'],
    serialPrefixes: ['1PY', '1LV'],
    commonSerialLocations: ['right frame rail', 'rear axle housing', 'dash plate'],
  },
  {
    make: 'Bobcat',
    modelFamily: 'S-series skid steer',
    equipmentType: 'skid_steer',
    colorCues: ['white body', 'orange wheels/arms'],
    decalCues: ['S650', 'S570', 'T650'],
    serialPrefixes: ['A3NV', 'ALJ8'],
    commonSerialLocations: ['inside cab frame', 'rear frame plate'],
  },
]
```

Match candidates from equipment type, OCR/model text, serial prefix, fixture tags, and user-confirmed make/model.

## Report Copy Requirements

The MVP must avoid overclaiming.

Use:

- “screened”
- “suspect”
- “needs verification”
- “evidence suggests”
- “ask seller/mechanic to verify”

Avoid:

- “certified”
- “guaranteed”
- “accident history proven”
- “title history verified”
- “mechanic approved”

Default disclaimer:

> FarmFax is an AI-assisted equipment inspection aid, not a certified mechanic inspection, appraisal, title report, lien search, warranty, or safety certification. Verify findings with the seller, service records, and a qualified mechanic before purchase.

## Sponsor Stack Content

Use in `src/farmfax/sponsorStack.ts`.

- **NVIDIA / Accelerated Vision**
  - Primitive: GPU-accelerated segmentation, OCR, image embeddings, future edge inference.
  - Proof: multi-view equipment evidence becomes structured defects and overlays.
  - Value: physical-economy inspection workload that scales with acceleration.

- **Nemotron / Structured Reasoning**
  - Primitive: multi-image defect reasoning, report synthesis, conservative uncertainty language.
  - Proof: converts detections + OCR + missing views into buyer-readable risk notes.
  - Value: turns raw CV output into trusted decision support.

- **Nous Research / Hermes Orchestration**
  - Primitive: workflow routing, capture completeness, provenance ledger, report builder.
  - Proof: every finding maps to an image, detector, confidence, and next action.
  - Value: transparent agentic workflow rather than magic black-box scoring.

- **Stripe / Commerce Rail**
  - Primitive: paid report unlock, dealer subscription, expert review upsell.
  - Proof: staged `$19 FarmFax Report` checkout and printable/exportable artifact.
  - Value: credible revenue path for hackathon judges.

## Implementation Plan

### Phase 1: Static pivot skeleton

Files:

- Modify `src/App.tsx`
- Modify `src/App.css`
- Create `src/farmfax/types.ts`
- Create `src/farmfax/fixtures.ts`
- Create `src/farmfax/report.ts`
- Create `src/farmfax/sponsorStack.ts`

Tasks:

1. Add FarmFax types and sponsor stack.
2. Add fixture inspections with capture assets and detections.
3. Add `buildFarmFaxReport()` and `farmFaxReportToMarkdown()`.
4. Replace ParcelProof copy in `App.tsx` with FarmFax hero, capture checklist, analysis timeline, evidence summary, and report export.
5. Keep Stripe behavior as staged checkout if `VITE_STRIPE_CHECKOUT_URL` is absent.
6. Run `npm run build`.

### Phase 2: Evidence overlay demo

Files:

- Create `src/farmfax/components/EvidenceOverlay.tsx`
- Modify `src/App.css`

Tasks:

1. Render image/placeholder per capture slot.
2. Overlay normalized bounding boxes from fixture detections.
3. Add severity classes.
4. Verify overlays render for seeded demos.

### Phase 3: Guided capture UX

Files:

- Create `src/farmfax/checklist.ts`
- Create `src/farmfax/components/CaptureChecklist.tsx`
- Create `src/farmfax/components/CaptureSlot.tsx`

Tasks:

1. Define required views and instructions.
2. Add mobile file inputs with preview object URLs.
3. Add missing-evidence gate.
4. Keep fixture fallback button visible.

### Phase 4: Catalog + OCR confirmation

Files:

- Create `src/farmfax/equipmentCatalog.ts`
- Create `src/farmfax/components/SerialHourMeterPanel.tsx`
- Create `src/farmfax/components/MakeModelCatalog.tsx`

Tasks:

1. Add static catalog.
2. Add editable OCR fields.
3. Match candidates from OCR/model text + fixture tags.
4. Include candidates in report.

### Phase 5: Optional canvas heuristics

Files:

- Create `src/farmfax/detectors.ts`

Tasks:

1. Implement `analyzeInspection()` using fixture detections by default.
2. Add optional `analyzeImageCanvas()` for uploaded images.
3. Add conservative detections only when confidence clears threshold.
4. Verify build and no browser crashes on unsupported images.

## Verification Gates

### Static build gate

Run:

```bash
npm run build
```

Expected:

- TypeScript passes.
- Vite builds production assets.
- No missing imports.

### Smoke-test gate

Run:

```bash
npm run dev
```

Open local Vite URL and verify:

- App loads without console errors.
- Seeded demo can be loaded without uploads.
- Six capture views are visible.
- Analysis timeline reaches complete state.
- Evidence overlays render on at least one image/card.
- Report shows condition score, verdict, flags, buyer questions, and sponsor stack.
- JSON and Markdown exports download.
- Print/PDF opens browser print.
- Stripe unlock opens staged modal or configured URL.

### Data integrity gate

Inspect exported JSON and verify:

- Every non-missing `Detection` has `assetId` matching a `CaptureAsset.id`.
- Every detection has category, severity, confidence, and evidence text.
- `missingEvidence` reflects required views not supplied.
- OCR serial/hour values appear in `equipment` and `ocr` sections.
- Sponsor stack includes NVIDIA, Nemotron, Hermes, and Stripe.

### UX/demo gate

Manual judge-demo script must complete in under 90 seconds:

1. Choose “Tractor.”
2. Load sample John Deere inspection.
3. Show six guided shots.
4. Run analysis.
5. Point to rust/leak/wear overlays.
6. Confirm serial/hour meter extraction.
7. Show make/model candidates.
8. Export FarmFax report.
9. Click Stripe unlock.
10. Explain NVIDIA/Nemotron/Hermes/Stripe stack.

### Safety/trust gate

Before demo submission, confirm:

- No title/history/legal claims.
- No “certified mechanic” language.
- Confidence and missing evidence are visible.
- Red/yellow/green findings link to evidence.
- Disclaimer appears in report and export.

## Future Backend Seam

When moving beyond static demo, add `src/farmfax/api.ts` behind the same client interfaces:

```ts
export type FarmFaxBackend = {
  createInspection(input: { equipmentType: EquipmentType }): Promise<{ inspectionId: string }>
  uploadAsset(input: { inspectionId: string; view: CaptureView; file: File }): Promise<CaptureAsset>
  analyzeInspection(input: { inspectionId: string }): Promise<Detection[]>
  runOcr(input: { inspectionId: string; assetId: string }): Promise<OcrExtraction>
  generateReport(input: { inspectionId: string }): Promise<FarmFaxReport>
  createCheckout(input: { reportId: string }): Promise<{ url: string }>
}
```

Suggested backend modules:

- Storage: S3/R2/Supabase Storage.
- DB: Postgres/Supabase for inspections, assets, detections, reports.
- CV worker: Python + OpenCV + YOLO/Segment Anything/Florence-style open models.
- OCR: PaddleOCR/EasyOCR/Tesseract first, cloud OCR later if needed.
- Reasoning: Nemotron-compatible structured JSON prompt.
- Orchestration: Hermes workflow validates completeness, calls CV/OCR/reasoning, builds report.
- Payments: Stripe Checkout + webhook stores `report_unlocked`.

## Definition of Done

FarmFax MVP is demo-ready when:

- Static Vite build succeeds.
- User can complete the app with seeded data and no external services.
- Phone capture UI exists and can preview uploaded images.
- At least rust, paint mismatch, leak, wear, serial OCR, and hour meter appear as detections/extractions.
- Make/model candidates appear with visual/serial/decal cues.
- Consolidated report exports JSON + Markdown + print/PDF.
- Sponsor positioning is explicit and credible.
- Verification gates above pass.
