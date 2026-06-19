# ParcelProof — Final Hackathon Submission Checklist

## Build status
- [x] React/Vite production build passes.
- [x] Browser loads ParcelProof title.
- [x] No browser JavaScript errors.
- [x] Main demo flow exists: paste parcel link → analyze parcel → agent run → dashboard → packet → Stripe test checkout.

## Required demo path
1. Open local app.
2. Show hero and tagline: **Before you buy land, know what it can actually become.**
3. Keep demo parcel URL in input.
4. Select **Homestead + goats**.
5. Click **Analyze parcel**.
6. Narrate agent run.
7. Click map layers.
8. Show scenario simulator.
9. Show buyer action path.
10. Show Land Decision Packet.
11. Click **Stage checkout** or **Unlock $19 report**.
12. Close on sponsor story.

## Sponsor proof points

### Nous / Hermes
- Orchestrates multiple specialized agents.
- Converts user intent into a concrete due-diligence workflow.
- Produces a source-trailed decision packet, not just chat.

### NVIDIA
- Natural production path for accelerated geospatial/visual/document inference.
- Parcel analysis involves map overlays, satellite/vegetation, OCR, flood/wetland/soil/risk layers, and scenario scoring.

### Stripe
- Paid reports and expert-review checkout are obvious and consumer-friendly.
- Demo has $19 Land Reality Check and $99+ due-diligence upsell path.

## Submission one-liner
ParcelProof is Carfax for land decisions: paste a parcel or listing, choose what you want the land to become, and get a plain-English reality check on buildability, access, water, soil, flood/wetland risk, policy programs, income potential, and the questions to ask before buying.

## Technical stack
- React + TypeScript + Vite.
- Fixture-backed parcel data for controlled hackathon demo.
- Typed Land Decision Packet builder.
- Markdown + JSON packet export.
- Stripe-style test checkout modal.
- Source trail / proof ledger.

## Safety copy
ParcelProof is a screening and due-diligence assistant. It is not legal, survey, engineering, tax, lending, insurance, or investment advice. Buyers must verify findings with county offices and licensed professionals before purchasing land.

## Product roadmap if asked
1. Connect parcel/APN provider: Regrid, Acres partnership/export, county GIS, ReportAll, ATTOM.
2. Add FEMA flood, USDA NRCS soils, NWI wetlands, USGS elevation, wildfire/land cover.
3. Add county permitting/zoning document retrieval and OCR.
4. Add report payments through Stripe Checkout.
5. Add expert-review marketplace: land brokers, surveyors, septic/well professionals, rural attorneys.
6. Add broker/realtor subscription.

## Killer closing line
Buying land is emotional. ParcelProof makes it evidence-based before the buyer signs.
