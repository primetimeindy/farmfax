# FarmFax — Deploy Notes

## Current app

- Framework: React + TypeScript + Vite.
- Entry: `src/App.tsx`.
- Static build output: `dist/`.
- Public source repo: https://github.com/primetimeindy/farmfax
- Public demo: https://primetimeindy.github.io/farmfax-demo/
- No required backend or credentials for the hackathon demo.
- Stripe checkout is represented by a local hosted-report modal in the current prototype.

## Local setup

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Verification

```bash
npm run verify:demo
```

This runs lint, production build, and `scripts/verify-demo.mjs`. GitHub Actions runs the same command on push and pull request.

## Production build

```bash
npm run build
```

Static output:

```text
dist/
```

The Vite config uses `base: './'` so the app works from the GitHub Pages subpath `/farmfax-demo/`. Static asset references for sample video and QR use `import.meta.env.BASE_URL`.

## GitHub Pages deployment used

The current deployment is a static push of `dist/` to the `gh-pages` branch of `primetimeindy/farmfax-demo`.

Commands pattern:

```bash
npm run verify:demo
rm -rf /tmp/farmfax-pages
cp -R dist /tmp/farmfax-pages
touch /tmp/farmfax-pages/.nojekyll
cp /tmp/farmfax-pages/index.html /tmp/farmfax-pages/404.html
cd /tmp/farmfax-pages
git init
git add .
git commit -m 'deploy FarmFax demo'
git branch -M gh-pages
git remote add origin https://github.com/primetimeindy/farmfax-demo.git
git push -f origin gh-pages
```

Verify Pages:

```bash
gh api repos/primetimeindy/farmfax-demo/pages --jq '{html_url:.html_url,status:.status,source:.source}'
curl -L -sS -o /tmp/farmfax-live.html -w '%{http_code}\n' https://primetimeindy.github.io/farmfax-demo/
grep -q 'FarmFax' /tmp/farmfax-live.html
```

Current verified result:

```text
status: built
HTTP: 200
```

## Static hosting alternatives

Any static host can serve `dist/`:

- GitHub Pages: current deployment.
- Vercel: build command `npm run build`; output directory `dist`.
- Netlify: build command `npm run build`; publish directory `dist`.
- Cloudflare Pages / S3: upload or deploy `dist/`.

## Demo verification checklist after deploy

1. Page title says `FarmFax — Open Equipment Condition Reports`.
2. Hero shows FarmFax equipment-check copy.
3. `Run judge demo` and `Load complete sample` buttons exist.
4. `Try sample video` runs the bundled video fixture.
5. Guided capture cards render on desktop/mobile.
6. Image/video upload input accepts `image/*,video/*` and uses camera on mobile where supported.
7. Uploaded image triggers local analysis and overlays rust/wet/paint mask cells.
8. Sample video renders `4 frames checked` and selected-frame thumbnails.
9. Report section shows visible-condition score, risk cards, deal posture, buyer questions, missing evidence, and **Evidence checked**.
10. **Judge proof** and **For judges: demo trace** are visible.
11. `Download JSON report` downloads a `.json` file containing `input_sources` and `demo_truth`.
12. `Print / save PDF` opens browser print flow.
13. QR/share block points to https://primetimeindy.github.io/farmfax-demo/.
14. `Save hosted report` opens the hosted-report modal.
15. Browser console has no uncaught JavaScript errors.

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

The deployed GitHub Pages demo remains intentionally static for hackathon reliability, but the repo now includes a working local FarmFax backend contract:

```bash
npm run backend:dev
npm run verify:backend
```

Implemented backend endpoints:

- `GET /health` — service readiness and endpoint inventory.
- `POST /api/analyze` — validates a FarmFax report and returns a risk/action summary.
- `POST /api/reports` — validates and persists a report to local JSON storage.
- `GET /api/reports/:id` — retrieves a stored hosted-report payload and summary.

The backend preserves the frontend report shape and is ready to become the hosted-report/API seam. Future production backend work can add:

- OCR for serial/PIN plate and hour meter.
- NVIDIA-accelerated CV for rust, leaks, paint mismatch, wear, weld repairs, missing guards, and deformation.
- Nemotron-style structured multi-image and selected-video-frame reasoning.
- Hermes/OpenEye-style visual session tracking for pass/fail/uncertain checklist verification.
- Durable cloud storage for hosted report links.
- Seller response and mechanic/dealer review workflow.

## Legal/safety deployment copy

Keep this disclaimer visible in submission materials and report UI:

> FarmFax is an AI-assisted screening aid, not a certified mechanic inspection, title/lien search, theft determination, appraisal, safety certification, warranty, repair estimate, or full-video inspection. Findings must be verified with the seller, service records, and a qualified mechanic before purchase or operation.
