# ParcelProof — Hackathon Submission Brief

## Product
ParcelProof — Know what land can actually do before you buy.

## One-liner
ParcelProof is a retail-safe AI land decision copilot: paste a parcel or listing, choose your goal, and get a plain-English reality check on buildability, access, water, soil, flood/wetland risk, policy programs, income potential, and the exact questions to ask before buying.

## Problem
Millions of people browse rural land listings, inherit family land, or dream about homesteads and small farms. The data exists across maps, parcel records, FEMA, USDA soils, wetlands, county rules, tax programs, and listings — but everyday users do not know what it means.

A bad land decision can mean no legal access, failed septic, impossible permits, hidden flood/wetland risk, utility costs, tax surprises, or land that cannot support the buyer’s actual goal.

## Solution
ParcelProof turns fragmented parcel data into a **Land Decision Packet**:
- Fit score for the buyer’s goal.
- Green/yellow/red risks.
- Due-diligence cost ranges.
- Seller questions.
- County call script.
- USDA/FSA/NRCS and ag/timber program opportunities.
- Verdict: buy, negotiate, walk, or research more.
- Source trail showing what was checked and what remains unverified.

## Demo scenario
A non-technical family finds a 12.4-acre parcel near Lockhart, TX for $89,000. They want to build a small home, keep goats, drill a well, and qualify for ag valuation.

ParcelProof flags that flood/wetland risk and soil look favorable, but access and septic need verification before offer. It generates a decision packet, due-diligence costs, seller questions, county questions, and a Stripe test checkout for a $19 Land Reality Check report.

## Sponsor fit

### Nous Research / Hermes
Hermes orchestrates the full decision workflow: buyer goal → parcel identity → map/risk layers → policy questions → decision packet. This demonstrates Hermes as an operating system for real-life decision agents, not just chat.

### NVIDIA
The product category naturally scales into accelerated geospatial AI: satellite imagery, soil/vegetation analysis, flood/fire/wetland overlays, OCR of county rules, zoning documents, and scenario simulation.

### Stripe
Stripe powers paid reports and expert follow-up:
- $19 Land Reality Check.
- $99 due-diligence packet.
- Expert review checkout.
- Realtor / land broker subscriptions.

## Why it is novel
Parcel tools show boundaries and owners. Listing sites show price and photos. ParcelProof answers the decision question: **Can this land actually become what I want, and what can go wrong before I buy it?**

## Hackathon MVP
Built as a React/Vite prototype with:
- Retail-first parcel input.
- Goal templates.
- Visual parcel/risk dashboard.
- Layer toggles.
- Plain-English scorecards.
- Due-diligence cost panel.
- Stripe test checkout modal.
- Sponsor proof section.
- Exportable JSON/Markdown Land Decision Packet.

## Business model
- Consumer reports: $9–$29.
- Buyer due-diligence packet: $99.
- Expert review / permit pre-check: $149–$499.
- Realtor / broker subscription: $49–$249/month.
- Partner referrals: surveyors, well/septic, insurance, ag extension, land brokers.

## Safety posture
ParcelProof is a screening and due-diligence assistant, not legal/survey/engineering/tax/lending advice. It always gives verification questions and flags unresolved assumptions.

## Tagline
Before you buy land, know what it can actually become.
