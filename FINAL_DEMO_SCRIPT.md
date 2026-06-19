# ParcelProof — Final Hackathon Demo Script

## 0:00 — Hook
"Buying land looks romantic until you discover there is no legal access, septic fails, or the county will not let you build. ParcelProof is Carfax for land decisions. Before you buy land, know what it can actually become."

## 0:15 — User input
Show the hero.

Say:
"A family found a 12.4-acre parcel near Lockhart, Texas for $89,000. They want a small home, goats, a well, septic, and possibly ag valuation. They paste the Acres-style parcel link and select Homestead + goats."

Action:
- Keep the demo Acres-style URL in the input.
- Click **Analyze parcel**.

## 0:35 — Agent run
Show the AI due-diligence run.

Say:
"Hermes orchestrates specialized research agents: ATLAS reads the parcel, SCOUT checks access, HYDRO checks flood and wetlands, SOIL checks pasture fit, WATER checks well and septic risk, POLICY finds ag/USDA leads, and LEDGER generates a buyer packet."

Important line:
"This is fixture-backed for hackathon speed, but the product behavior is real: every green light includes what must still be verified by a human."

## 1:05 — Visual parcel dashboard
Show the parcel visualizer and click through layers:
- Access
- Soil
- Water + septic
- Flood / wetlands
- Policy + programs

Say:
"Most parcel tools stop at boundaries and ownership. ParcelProof turns map facts into buyer decisions. It flags that flood and soil look favorable, but legal access and septic are unresolved."

## 1:35 — Scenario simulator
Show scenarios:
- Small home + goats
- Grazing lease
- Solar / conservation

Say:
"The buyer can compare what the land can become. A homestead is possible but requires contingencies. A grazing lease is lower capex. Solar/conservation needs more research."

## 1:55 — Decision packet
Scroll to Land Decision Packet.

Say:
"The output is not a chatbot answer. It is a buyer packet: APN, county, fit score, due diligence costs, seller questions, county questions, and a buy/negotiate/walk verdict."

Point to:
- Ask the seller
- Ask the county
- Costs before closing

## 2:20 — Stripe monetization
Click **Stage checkout** or **Unlock $19 report**.

Say:
"Stripe powers the business model: $19 Land Reality Check, $99 due-diligence packet, and expert review. The demo is locked in test mode and requires human approval before any paid action."

## 2:40 — Sponsor close
Say:
"For Nous/Hermes, this is real-life agent orchestration. For NVIDIA, land decisions are geospatial, visual, and document-heavy — ideal for accelerated inference. For Stripe, paid trusted reports and expert review are the commerce layer."

## 2:55 — Final line
"ParcelProof helps regular people avoid expensive land mistakes before they fall in love with a parcel. Before you buy land, know what it can actually become."

## If judges ask about data
Answer:
"The hackathon demo uses a controlled fixture. Production would connect parcel boundaries/APN from Regrid/Acres/county GIS, FEMA flood, USDA NRCS soils, NWI wetlands, USGS elevation, county zoning/permitting PDFs, and USDA/FSA/NRCS program data. The wedge is not cloning a map — it is turning fragmented land data into decisions and verification scripts."

## If judges ask about liability
Answer:
"ParcelProof is a screening and due-diligence assistant, not legal, survey, engineering, tax, lending, or insurance advice. Every score includes what must still be verified by county offices or licensed professionals."
