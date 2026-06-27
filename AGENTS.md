# FarmFax Agent Instructions

FarmFax is a Hermes hackathon demo. Keep product narrative Hermes-only; do not introduce Pi in user-facing copy, submission copy, or judge framing.

## Product stance

- Evidence-bound screening aid, not mechanical certification.
- Buyer-owned proof packet: JSON/PDF export remains available without paid hosting.
- Unknowns stay unknown. Never imply title/lien/theft status, appraisal, warranty, repair estimate, safety certification, or hidden mechanical diagnosis.
- Non-running tractor status is valid evidence. Do not pretend the tractor runs; use engine bay/running-status proof and seller questions.
- Sponsor/backend seams should feel natural: workflow orchestration, multimodal reasoning, hosted report commerce. Avoid billboard-style sponsor copy.

## Engineering rules

- Run `npm run verify:demo` after UI/demo changes.
- Run `npm run verify:backend` after backend/API changes.
- Keep Vite static demo reliable on GitHub Pages with `base: './'`.
- Use small diffs. Preserve existing copy tone: premium, honest, farmer/buyer practical.
- Update `scripts/verify-demo.mjs` when adding judge-critical UI hooks or copy.
- Do not add required secrets or live external service dependencies to the hackathon path.

## Current live demo

- Source repo: https://github.com/primetimeindy/farmfax
- Public demo: https://primetimeindy.github.io/farmfax-demo/

## Deployment pattern

Build/verify:

```bash
npm run verify:demo
```

Deploy static `dist/` to `primetimeindy/farmfax-demo` `gh-pages` branch per `DEPLOY_NOTES.md`.
