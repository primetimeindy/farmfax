# Hackathon Pivot Strategy — Land Decision Copilot

## Strategic call
Scrap the generic Revenue Forge concept. The stronger idea is a land/agriculture decision assistant for everyday people who are considering buying, inheriting, leasing, or improving rural land.

The product should not be another GIS map. Acres, LandGlide, Regrid, OnX, county GIS, and Zillow already show parcels. The gap is: everyday users do not know what the parcel facts mean or what to do next.

## Winning frame
**Land Reality Check:** an AI copilot that tells regular people whether a parcel is actually usable for their goal before they waste money, sign a contract, or inherit a hidden problem.

One-line pitch:
**Paste a land listing or parcel, say what you want to do with it, and get a plain-English reality check: buildability, water, access, soil, flood/fire risk, taxes, grants, income potential, and the exact questions to ask before buying.**

## Why this is more valuable
People make expensive, emotional land decisions with fragmented information:
- Can I build here?
- Can I put a tiny home, cabin, RV, mobile home, barn, well, septic, or solar?
- Is there legal road access?
- Is it in a floodplain, wildfire zone, wetland, or protected habitat?
- Is the soil good for crops, cattle, orchard, timber, or bees?
- Are there tax exemptions, USDA programs, conservation programs, or local policy incentives?
- What would insurance, utilities, driveway, well, septic, fencing, and permitting likely cost?
- Can the land produce income?
- What red flags should I ask the seller/county/lender about?

The app turns messy public records + map layers + policy into a buyer-safe decision packet.

## Target users
1. First-time rural land buyers.
2. Families inheriting land and deciding whether to keep, lease, sell, or improve it.
3. Small farmers / homesteaders.
4. Veterans or young families looking for affordable acreage.
5. Landowners exploring ag exemption, conservation income, solar lease, hunting lease, timber, grazing, hay, or farm stand uses.
6. Real estate agents who serve non-technical land buyers.

## Sponsor value

### Hermes / Nous
Hermes becomes the orchestration layer for real-life decision support: gather parcel facts, ask the right agencies, explain tradeoffs, produce a trusted next-action packet.

### NVIDIA
Geospatial and agriculture workloads create a natural accelerated AI story: satellite imagery, soil/vegetation analysis, wildfire/flood risk, document OCR, map-layer reasoning, scenario simulation.

### Stripe
Stripe powers the consumer/business model:
- $9–$29 Land Reality Check report.
- $99 buyer due-diligence packet.
- Paid expert review upsell.
- Agent-assisted records request / permit pre-check checkout.
- Realtor/land broker subscription.

Stripe also appears in the demo as the safe payment rail for ordering a report or paying for an expert follow-up.

## Product concept

### Name options
- Land Reality Check
- ParcelProof
- Homestead Scout
- Acresmith
- GroundTruth Land Copilot
- PlotWise
- Farmstead Finder

Preferred hackathon name: **ParcelProof**
Plain-English subtitle: **Know what land can actually do before you buy.**

## Core UX

### Step 1 — User goal
Ask:
- “What do you want to do with this land?”
Templates:
- Build a home / cabin
- Start a homestead
- Run cattle / goats / horses
- Grow crops / orchard / vineyard
- Build RV/tiny-home retreat
- Lease for hunting / recreation
- Explore solar / conservation / timber income
- Understand inherited family land

### Step 2 — Parcel input
Accept:
- Listing URL
- Address
- Parcel/APN
- County/state
- Draw or paste coordinates
- Screenshot/map link from Acres-like parcel tools

### Step 3 — Reality Check
The agent produces simple ratings:
- Buildability
- Access
- Water/septic feasibility
- Flood/wetland/fire risk
- Soil/ag suitability
- Tax/program opportunities
- Income potential
- Deal risk

Each rating has:
- Green/yellow/red status
- Why it matters
- Data source used
- Questions to verify
- Next action

### Step 4 — Buyer packet
Output a printable/simple packet:
- Parcel summary
- Goal fit score
- Red flags
- Estimated due-diligence costs
- County call script
- Seller questions
- Lender/insurance questions
- USDA/FSA/local program leads
- “Buy / negotiate / walk / research more” verdict

### Step 5 — Optional paid action
Use Stripe test checkout in demo:
- Buy full report
- Request expert review
- Order permit pre-check
- Start land improvement plan

## Demo persona
A non-technical family sees a 12-acre parcel listed for $89,000 and wants to know if they can build a small home, keep goats, drill a well, and get an ag exemption.

Demo flow:
1. Paste parcel/listing.
2. Choose goal: homestead + goats + small home.
3. Agent checks parcel data and map layers.
4. It flags: road access unclear, soil suitable for pasture, septic likely needs percolation test, flood zone low risk, ag exemption possible but requires county criteria.
5. It generates a buyer packet and county call script.
6. User pays $19 via Stripe test checkout for the full PDF packet.
7. Proof packet shows what sources were checked and what assumptions remain unverified.

## What makes it novel
Most map tools answer: “Who owns this parcel and where are boundaries?”

ParcelProof answers: **“Should I buy this land for my actual life plan, and what can go wrong?”**

That is a decision assistant, not a map viewer.

## MVP data sources for hackathon
Use mock/fixture data if necessary, but structure the system around real sources:
- Parcel boundary / county / APN
- FEMA flood maps
- USDA NRCS soils / Web Soil Survey
- USGS water / elevation where available
- EPA wetlands / protected areas
- State/county zoning/permitting notes
- USDA/FSA program summaries
- Census/rural broadband/utility proxies
- Listing description extraction
- Satellite/land-cover placeholder analysis

## Prototype architecture
Reuse current React/Vite proof-packet architecture, but replace revenue forge narrative.

Screens:
1. Landing hero: “Can this land actually do what you want?”
2. Parcel input + goal templates.
3. Land Reality Check dashboard.
4. Risk cards: access, water/septic, flood, soil, policy, income.
5. Buyer Packet export.
6. Stripe test checkout: “Unlock full due-diligence packet.”
7. Proof log: sources checked, assumptions, unresolved questions.

## Proof artifact
Rename proof packet to **Land Decision Packet**.

Packet sections:
- Parcel identity
- User goal
- Fit score
- Red flags
- Data sources checked
- County/seller questions
- Estimated next-step costs
- Policy/program opportunities
- Buy / negotiate / walk / research verdict

## Strategic moat
The moat is not parcel data alone. Parcel data is commodity.

The moat is the decision graph connecting:
**parcel facts → user goal → local rules → risk → cost → program opportunity → next action.**

Over time, every user goal/outcome teaches which parcels are actually usable for specific real-life plans.

## Scope recommendation
Build the hackathon prototype as a guided demo with one excellent parcel scenario and 3 selectable goals. Do not try to build a full nationwide GIS app.

Core demo must work without tech knowledge:
- User pastes a parcel/listing.
- User picks a goal.
- App outputs a plain-English packet.
- Stripe test checkout monetizes it.
- Proof log makes sponsor value obvious.

## 10-star version
ParcelProof becomes the “Carfax for land decisions.”

Before buying, financing, inheriting, or improving land, people run a ParcelProof report to understand buildability, access, water, soil, risks, programs, and next actions.

## Kill list
- Do not build a full map viewer.
- Do not compete with Acres on GIS tools.
- Do not make it only for real estate professionals.
- Do not lead with compliance language.
- Do not overpromise legal/zoning certainty. Phrase as risk screening and due-diligence guidance.

## Winning tagline
**Before you buy land, know what it can actually become.**
