# ParcelProof — Hackathon Winning Specs

## One-line thesis
**ParcelProof is a retail-safe land decision copilot: paste a parcel/listing, choose what you want the land to become, and get a plain-English risk, policy, income, and due-diligence packet before you buy.**

## Winning frame
Not another map. Not another listing site. ParcelProof is the **Carfax for land decisions**.

Most parcel tools answer: “Where is the land and who owns it?”
ParcelProof answers: **“Can this land actually do what I want, what can go wrong, and what should I do next?”**

## Target user
- First-time rural land buyers.
- Homesteaders and small farmers.
- Families inheriting land.
- Realtors helping non-technical buyers.
- Landowners exploring ag exemption, grazing, hunting lease, timber, solar, conservation, or USDA programs.

## Demo persona
A family finds a 12.4-acre parcel listed for $89,000 outside a growing county. They want to build a small home, keep goats, drill a well, and qualify for an ag/timber exemption. They are not technical and do not know what parcel layers mean.

## Core product promise
1. Paste a parcel/listing/address/APN.
2. Pick a life goal: build, homestead, farm, lease, inherit, conserve.
3. ParcelProof scans risk layers and policy/program context.
4. It produces a **Land Decision Packet** with:
   - Fit score.
   - Red flags.
   - Estimated due-diligence costs.
   - County/seller/lender questions.
   - Program opportunities.
   - Verdict: buy / negotiate / walk / research more.
5. Stripe powers the paid report or expert-review checkout.
6. Hermes produces a proof/source trail showing what was checked and what remains unverified.

## Sponsor-native story

### Nous / Hermes
Hermes orchestrates the land research workflow: parcel identity, map layers, policy retrieval, risk scoring, questions, and packet export.

### NVIDIA
The workload is geospatial, document-heavy, visual, and simulation-heavy: satellite imagery, soil/vegetation, flood/fire risk, zoning OCR, and scenario scoring.

### Stripe
Stripe monetizes retail-safe decision packets and expert follow-up:
- $19 Land Reality Check.
- $99 buyer due-diligence packet.
- $249 realtor/broker subscription.
- Expert review / permit pre-check checkout.

## MVP scope for hackathon
Build a polished interactive prototype, not a full GIS backend.

### Must-have UX
- Retail hero: “Before you buy land, know what it can actually become.”
- Parcel input/search box.
- Goal selector with non-technical templates.
- Cool visual land map: parcel polygon, layers, risk overlays, soil/water/access markers.
- Scorecards: buildability, access, water/septic, flood/wetlands, soil/ag, policy/programs, income.
- Land Decision Packet panel.
- Source trail/proof log.
- Stripe-style checkout modal for report unlock.
- Export JSON/Markdown packet.

### Demo data fixture
Use a fictional but realistic parcel:
- “12.4 acres · Caldwell County, TX · APN R-18422 · $89,000”
- Goal: homestead + goats + small home.
- Green: low flood risk, pasture-suitable soils, good sun exposure.
- Yellow: road access easement unclear, septic needs perc test, ag exemption possible but not automatic.
- Red: none fatal, but legal access must be verified before offer.
- Verdict: **Negotiate / research more**.

## Data sources to mention / architect around
- County parcel/APN records.
- FEMA flood data.
- USDA NRCS soil data.
- USGS elevation/water context.
- NWI wetlands.
- State wildfire risk.
- County zoning/permitting docs.
- USDA/FSA/NRCS program summaries.
- Listing text extraction.
- Satellite/land-cover analysis.

## Risk-safe language
Do not promise legal certainty.
Use:
- “screening”
- “risk flag”
- “needs county verification”
- “ask before buying”
- “not legal, engineering, lending, or survey advice”

## Visual direction
Premium rural-tech command center:
- dark satellite-map base
- neon contour lines
- parcel polygon in electric green
- amber/red risk chips
- topographic grid
- “source trail” terminal
- friendly plain-English cards

It should feel like **Acres + Carfax + ArcGIS + TurboTax for land buyers**.

## Product names considered
- ParcelProof — preferred
- Land Reality Check
- GroundTruth Land Copilot
- PlotWise
- Homestead Scout
- Acresmith

## Final tagline
**Before you buy land, know what it can actually become.**

## What Easton needs for a real version
For hackathon demo: nothing else. We can use a fixture and proof architecture.

For real product after hackathon:
1. Parcel data provider/API: Regrid, Acres partnership/export, county GIS, ReportAll, Landgrid, or ATTOM.
2. Geospatial layers: FEMA, USDA NRCS, NWI wetlands, wildfire, elevation, land cover.
3. Policy corpus: county zoning/permitting docs, state ag-exemption rules, USDA/FSA/NRCS programs.
4. Stripe account for paid reports.
5. Optional expert network: land broker, surveyor, septic/well, ag extension, attorney.

## Done definition for hackathon prototype
- App builds cleanly.
- Hero instantly explains consumer value.
- User can select goals and see scores change.
- Visual parcel dashboard looks cool enough for demo video.
- Packet export works.
- Stripe modal appears.
- Sponsor story is obvious without explanation.
