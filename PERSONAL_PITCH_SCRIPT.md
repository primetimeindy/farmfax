# FarmFax — Personal Founder Pitch Script

## Version to practice: 4 minutes

### 0:00 — Personal hook

Say:

> I grew up around a family farm, so this problem is not abstract to me. When you are buying farm equipment, you are not buying a shiny listing photo. You are buying whether that machine starts, whether it leaks, whether the hours make sense, whether the serial plate matches the paperwork, and whether a surprise repair is going to wipe out the deal.

> A tractor can be the difference between getting work done and losing a season. And the weird thing is: for something this expensive, the buying process is still mostly trust, screenshots, and a handshake.

### 0:35 — Market / TAM frame

Say:

> The market is huge. The U.S. agricultural machinery market alone is estimated around $30 billion annually and growing toward the $40 billion-plus range over the next several years. USDA counts roughly 1.9 million farms in the U.S., and every one of those operations depends on machines that are expensive, specialized, and hard to inspect remotely.

> And that is just new machinery. Used equipment is where the trust gap gets worse: auctions, Facebook listings, dealer lots, estate sales, neighbors selling to neighbors, cross-state purchases, and buyers trying to decide whether to wire money or drive six hours based on a few photos.

> FarmFax starts with that pain: before money moves, help the buyer see what the machine is actually telling them.

### 1:15 — Industry pain / right-to-repair angle

Say:

> There is also a bigger structural problem in this industry. Farmers do not always fully control the machines they buy. Repairs can get routed through specific dealers, diagnostic tools can be locked down, and parts access can be restricted. The right-to-repair fight around companies like John Deere exists because farmers know what it feels like to own equipment but not fully control its repair path.

> That creates a second-order problem for used equipment. If a buyer misses a hydraulic leak, an emissions issue, a serial mismatch, or signs of a previous repair, they are not just paying for a fix. They may be forced into a narrow repair channel, waiting on dealer access, proprietary diagnostics, or parts they cannot easily buy themselves.

> So FarmFax is not anti-dealer. It is pro-buyer evidence. It gives farmers, small operators, and rural buyers a better starting point before they commit.

### 2:00 — Product thesis

Say:

> Carfax tells you what paperwork says happened to a car. FarmFax shows you what the machine is telling you right now.

> The wedge is simple: use the phone the buyer already has to capture the evidence a smart mechanic would ask for — walkaround, serial plate, hour meter, hydraulics, tires or tracks, paint and welds, and engine bay or cold start.

> Then FarmFax turns those photos and short videos into a buyer risk report: visible condition, missing proof, confidence, seller questions, and an open JSON/PDF record the buyer can keep.

### 2:40 — Demo walkthrough

Action:

Open:

```text
https://primetimeindy.github.io/farmfax-demo/
```

Click **Run judge demo** or **Load complete sample**.

Say:

> This is the live prototype. The capture flow is phone-first. It guides the user through the seven views that reduce blind spots. It supports photos and short videos.

Point to visible analysis panel.

Say:

> This section now shows a real submitted photo with analysis overlays, not just a concept graphic. It anchors the finding to the media.

Click **Try sample video** if needed.

Say:

> For video, FarmFax samples selected frames. That is important: we do not claim to inspect every second of a video. We show the sampled frames and keep that limitation visible.

Scroll to report.

Say:

> The output is not a chatbot answer. It is a buyer risk report: condition score, missing evidence, safety and repair risk, paperwork risk, hour plausibility, and buyer leverage questions.

### 3:30 — Sponsor / implementation truth

Say:

> In this hackathon prototype, the browser photo checks, real-photo overlays, video-frame sampling, scoring, JSON export, PDF print flow, QR share, and phone-installable app are live.

> Hermes is the operations layer we would use in production: capture completeness, model routing, overclaim challenges, provenance, export, payment handoff, and follow-up tasks. NVIDIA NIM is the natural trust gate for photos, defect crops, OCR, missing proof, and structured inspection notes. Stripe powers the business rail — paid reports, verified listings, seller links, expert review, subscriptions, and inspector/agent payouts — without locking up the buyer’s core JSON/PDF report.

### 4:10 — Guardrails / close

Say:

> The most important product decision is what FarmFax refuses to claim. It is not a mechanic certification. It does not verify title, lien, theft, warranty, appraisal, repair estimate, or full-video inspection. Unknowns stay unknown.

> That is why I think this matters. Farm equipment is too expensive, too critical, and too locked down for buyers to rely on vibes and listing photos. FarmFax gives them evidence before they buy the story.

Final line:

> FarmFax does not ask buyers to trust an AI. It asks them to trust evidence, confidence, missing proof, and an open report they can take anywhere.

## 60-second cutdown

> I grew up around a family farm, so I know buying equipment is not like buying a normal used good. A tractor can look fine in a listing and still hide leaks, repaint, bad hours, missing paperwork, or repairs that force you into narrow dealer-controlled channels.
>
> The U.S. agricultural machinery market is tens of billions of dollars, with roughly 1.9 million farms depending on expensive machines. Used equipment transactions happen through auctions, dealers, neighbors, and online listings — and too often the buyer is making a major decision from a few photos.
>
> FarmFax turns guided phone photos and short videos into an evidence-backed buyer risk report. It checks the views that matter: walkaround, serial plate, hour meter, hydraulics, tires, paint and welds, and engine bay. It shows visible condition signals, missing proof, buyer questions, and exports an open JSON/PDF report.
>
> We are careful about claims. FarmFax is not a mechanic certification or title check. Unknowns stay unknown. But before a farmer wires money, drives six hours, or inherits someone else’s repair problem, FarmFax helps them slow down the deal and ask better questions.
>
> FarmFax does not ask buyers to trust AI. It asks them to trust evidence.

## If challenged on right-to-repair

Say:

> I would not make this a partisan or anti-manufacturer pitch. The point is practical: when repairs require proprietary diagnostics, limited dealer access, or hard-to-source parts, the buyer’s downside risk increases. FarmFax helps identify visible issues and missing proof before that risk becomes the buyer’s problem.

## If challenged on TAM

Say:

> I am using the new-equipment market as a conservative anchor because it is measurable — U.S. agricultural machinery is roughly a $30B-plus annual market. Used equipment is the wedge where trust is worse and software is weaker. The first business is paid reports and hosted sharing; the expansion is dealer, auction, mechanic, lender, and fleet workflows.
