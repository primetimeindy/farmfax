# FarmFax — Deploy Notes

## Current app

- Framework: React + TypeScript + Vite.
- Entry: `src/App.tsx`.
- Static build output: `dist/`.
- No required backend or credentials for the hackathon demo.
- Stripe checkout is represented by a local hosted-report modal in the current prototype.

## Local setup

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Open:

```text
http://127.0.0.1:5177
```

## Production build

```bash
npm run build
```

Verified on this workspace:

```text
vite v8.0.16 building client environment for production...
✓ 18 modules transformed.
dist/index.html                   0.49 kB │ gzip:  0.32 kB
dist/assets/index-DanT092c.css   17.91 kB │ gzip:  4.61 kB
dist/assets/index-C3yPHf5p.js   230.57 kB │ gzip: 72.70 kB
✓ built in 51ms
```

## Static hosting

Any static host can serve `dist/`:

- Vercel: project root is repository root; build command `npm run build`; output directory `dist`.
- Netlify: build command `npm run build`; publish directory `dist`.
- GitHub Pages / S3 / Cloudflare Pages: upload or deploy `dist/`.

## Demo verification checklist after deploy

1. Page title says `FarmFax — Open Equipment Condition Reports`.
2. Hero shows `Scan the machine before you buy the story.`
3. Navigation anchors work: Phone input, Serial catalog, Report.
4. Guided capture cards render on desktop/mobile.
5. Image upload/capture input accepts images and uses camera on mobile where supported.
6. Uploaded image triggers local analysis and overlays rust/wet/paint mask cells.
7. Report section shows visible-condition score, risk cards, deal posture, buyer questions, missing evidence, and CV ledger.
8. `Download report JSON` downloads a `.json` file.
9. `Print / save PDF` opens browser print flow.
10. `Open Stripe checkout demo` opens the hosted-report modal.
11. Browser console has no uncaught JavaScript errors.

## Stripe production seam

Current demo uses an in-app modal so it cannot fail during judging. For a real hosted checkout handoff, add an env-driven URL and redirect button behavior:

```bash
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/...
```

Rules for production copy:

- Paid hosting/share/review is allowed.
- Core JSON/PDF export must remain available without payment.
- Do not imply Stripe certifies the inspection.

## Backend/model seam

The frontend is intentionally static for hackathon reliability. The next backend can preserve the same report shape while adding:

- OCR for serial/PIN plate and hour meter.
- NVIDIA-accelerated CV for rust, leaks, paint mismatch, wear, weld repairs, missing guards, and deformation.
- Nemotron-style structured multi-image reasoning.
- Storage for hosted report links.
- Seller response and mechanic/dealer review workflow.

## Legal/safety deployment copy

Keep this disclaimer visible in submission materials and report UI:

> FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, theft determination, appraisal, safety certification, warranty, or repair estimate. Findings must be verified with the seller, service records, and a qualified mechanic before purchase or operation.
