# ParcelProof Live Integrations

## Integrated now

### OpenStreetMap / Nominatim
- Live geocoding from address / map-link text to coordinates.
- No API key.
- Used in the live source trail.

### OpenStreetMap / Overpass
- Live context scan for roads, waterways, buildings, and amenities near the resolved coordinate.
- No API key.
- Used in the summary score and source trail.

### FEMA NFHL flood hazard layer
- Public ArcGIS REST query against FEMA NFHL MapServer layer 28.
- Point-intersects the resolved coordinate.
- Returns flood zone, SFHA flag, risk class, and human-verification warning.
- Falls back safely if FEMA blocks/times out.

### USDA NRCS Soil Data Access
- Uses USDA SDA `SDA_Get_Mukey_from_intersection_with_WktWgs84` point lookup.
- Fetches dominant map unit details where available.
- Returns mukey, map unit name, drainage, farmland class, and Web Soil Survey verification warning.
- Falls back safely if SDA blocks/times out.

### PDF report export
- `Print / PDF` calls browser print with print-specific CSS.
- This gives a no-dependency PDF export path for hackathon/demo.

## Wired as configurable handoffs

### County/parcel provider API
The frontend now exposes a provider abstraction.

Optional env:

```bash
VITE_PARCEL_PROVIDER_URL=
VITE_REGRID_API_KEY=
```

Important: do not expose paid/secret provider API keys in a Vite frontend build. Use `VITE_PARCEL_PROVIDER_URL` for a backend proxy or public handoff URL.

### Real Stripe Checkout
Optional env:

```bash
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/...
```

If set, clicking **Unlock report** redirects to the real Stripe hosted Checkout/Payment Link. If unset, the app falls back to the local Stripe test modal so demos never break.

## Current production-readiness status

- Live public data: enabled.
- Paid parcel-provider API: interface ready, provider key/backend proxy needed.
- Stripe: real hosted Checkout ready via env URL, account/payment link needed.
- Legal/safety: still positioned as screening, not legal/survey/engineering/tax advice.
