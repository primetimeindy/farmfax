# ParcelProof

**Know what land can actually do before you buy.**

ParcelProof is a hackathon prototype for a retail-safe land decision copilot. It helps everyday buyers, homesteaders, families inheriting land, and small farmers understand whether a parcel fits their real-life goal before they waste money, sign a contract, or inherit hidden risk.

Most map tools show parcel boundaries and ownership. ParcelProof turns parcel facts, map layers, policy context, and buyer goals into a plain-English **Land Decision Packet**.

## Core thesis

> Hermes orchestrates. NVIDIA accelerates geospatial reasoning. Stripe powers paid reports. ParcelProof helps regular people avoid bad land decisions.

## What it demonstrates

A buyer enters a parcel/listing and chooses what they want the land to become. The system screens the parcel against practical real-life constraints:

1. **PRIME** translates the buyer goal into a land-use hypothesis.
2. **ATLAS** identifies the parcel, county, acreage, and map context.
3. **SCOUT** checks access, flood, wetland, soil, and land-use risk layers.
4. **WATER** explains well/septic feasibility and due-diligence costs.
5. **POLICY** surfaces ag/timber valuation and USDA/FSA/NRCS opportunities.
6. **LEDGER** issues a buy / negotiate / walk / research-more verdict.
7. **RAILS** stages a Stripe test checkout for a paid report or expert review.
8. ParcelProof exports a JSON/Markdown **Land Decision Packet**.

## Sponsor-native value

### Nous Research / Hermes
Hermes becomes the orchestration layer for real-life decision support: it coordinates parcel facts, user goals, public records, policy questions, and proof packets.

### NVIDIA
Land decisions are geospatial, visual, document-heavy, and simulation-heavy: satellite imagery, vegetation/soil analysis, flood/fire risk, zoning OCR, and scenario scoring are natural accelerated-inference workloads.

### Stripe
Stripe powers a clear consumer/business model: $19 Land Reality Check reports, $99 due-diligence packets, expert-review checkout, and subscriptions for land brokers/realtors.

## Current prototype

The app includes:

- Retail-first hero and parcel/listing input.
- Goal templates: homestead, cabin, farm, inherited land, income potential.
- Interactive parcel visualizer with layer toggles.
- Risk scorecards for buildability, access, water/septic, flood/wetland, soil/ag, policy/programs, and income.
- Due-diligence cost panel.
- Stripe test checkout modal.
- Sponsor proof section.
- Source trail and exportable Land Decision Packet.

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Open:

```text
http://127.0.0.1:5177
```

## Build

```bash
npm run build
```

## Key files

- `src/App.tsx` — ParcelProof interactive prototype.
- `src/App.css` — premium geospatial command-center styling.
- `src/proofPacket.ts` — typed Land Decision Packet builder and Markdown serializer.
- `PARCELPROOF_FULL_SPECS.md` — full product/hackathon specs.
- `LAND_HACKATHON_PIVOT_STRATEGY.md` — strategic pivot memo.

## Important disclaimer

ParcelProof is a screening and due-diligence assistant, not legal, survey, engineering, tax, lending, or insurance advice. Findings must be verified with county offices and licensed professionals before buying land.
