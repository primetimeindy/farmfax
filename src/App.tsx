import { useMemo, useState } from 'react'
import { baseScores, buildProofPacket, proofPacketToMarkdown, sponsorStack } from './proofPacket'
import './App.css'

type GoalKey = 'homestead' | 'build' | 'farm' | 'inherit' | 'income'
type LayerKey = 'access' | 'soil' | 'water' | 'flood' | 'policy'
type Status = 'idle' | 'loading' | 'ready' | 'error'

type Goal = { key: GoalKey; label: string; prompt: string; boost: number }
type Layer = { key: LayerKey; label: string; status: 'green' | 'yellow' | 'red'; summary: string; proof: string }
type LiveParcel = {
  query: string
  displayName: string
  lat: number
  lon: number
  county: string
  state: string
  boundingBox?: string[]
  source: 'live' | 'fixture'
}
type FeatureCount = { roads: number; waterways: number; buildings: number; amenities: number }
type FloodData = { source: 'live' | 'fallback'; zone: string; subtype: string; sfha: string; risk: 'low' | 'moderate' | 'high'; note: string }
type SoilData = { source: 'live' | 'fallback'; mukey: string; mapunit: string; drainage: string; farmland: string; note: string }
type ParcelProvider = { provider: string; status: 'configured' | 'missing-key' | 'fallback'; message: string; url: string }
type ParcelBoundary = { source: 'live' | 'fallback'; propId: string; oldPropId: string; objectId: number | null; areaSqFt: number | null; perimeterFt: number | null; rings: number[][][]; note: string }
type AnalysisStep = { agent: string; label: string; detail: string }

const goals: Goal[] = [
  { key: 'homestead', label: 'Homestead + goats', prompt: 'Build a small home, keep goats, drill a well, and qualify for an ag valuation.', boost: 2 },
  { key: 'build', label: 'Build a cabin', prompt: 'Build a weekend cabin with driveway, septic, well, and power access.', boost: -1 },
  { key: 'farm', label: 'Small farm', prompt: 'Grow pasture, orchard rows, and a farm stand without over-improving the land.', boost: 7 },
  { key: 'inherit', label: 'Inherited land', prompt: 'Decide whether to keep, lease, improve, or sell family land safely.', boost: 4 },
  { key: 'income', label: 'Income paths', prompt: 'Evaluate grazing, hunting, solar, timber, conservation, and short-stay income paths.', boost: -3 },
]

const layers: Layer[] = [
  { key: 'access', label: 'Access', status: 'yellow', summary: 'Road context is visible, but recorded access/easement still needs title verification.', proof: 'Live map context + human title check required.' },
  { key: 'soil', label: 'Soil', status: 'green', summary: 'Pasture/homestead suitability is plausible; production connects USDA NRCS soil series.', proof: 'Fixture soil model; NRCS integration next.' },
  { key: 'water', label: 'Water + septic', status: 'yellow', summary: 'Well/septic path is a pre-close cost risk. Perc test and well quote remain unresolved.', proof: 'County + septic pro verification required.' },
  { key: 'flood', label: 'Flood / wetlands', status: 'green', summary: 'No fatal flood/wetland flag in this screen; production connects FEMA + NWI layers.', proof: 'Risk screen, not survey certainty.' },
  { key: 'policy', label: 'Policy', status: 'green', summary: 'Ag valuation, EQIP, grazing, and conservation programs may apply if local criteria are met.', proof: 'County appraisal + FSA/NRCS call script generated.' },
]

const analysisSteps: AnalysisStep[] = [
  { agent: 'ATLAS', label: 'Geocode parcel', detail: 'Live lookup of address / APN / map text into coordinates.' },
  { agent: 'SCOUT', label: 'Road + access context', detail: 'OpenStreetMap road/building/water context around the parcel.' },
  { agent: 'FEMA', label: 'Flood hazard layer', detail: 'NFHL ArcGIS point query for flood zone / SFHA flags.' },
  { agent: 'USDA', label: 'NRCS soil data', detail: 'Soil Data Access lookup for map unit, drainage, and farmland class.' },
  { agent: 'PARCEL', label: 'County provider', detail: 'Provider abstraction for Regrid/Acres/county parcel APIs.' },
  { agent: 'STRIPE', label: 'Checkout + PDF', detail: 'Checkout handoff and printable PDF report export.' },
  { agent: 'LEDGER', label: 'Decision packet', detail: 'Buyer verdict, costs, questions, exports, and source trail.' },
]

const fixtureParcel: LiveParcel = {
  query: '12.4 acres near Lockhart, TX',
  displayName: 'Lockhart, Caldwell County, Texas, United States',
  lat: 29.8849,
  lon: -97.669999,
  county: 'Caldwell County',
  state: 'Texas',
  source: 'fixture',
}

const initialFeatureCounts: FeatureCount = { roads: 3, waterways: 1, buildings: 2, amenities: 0 }
const initialFlood: FloodData = { source: 'fallback', zone: 'X', subtype: 'Area of minimal flood hazard', sfha: 'OUT', risk: 'low', note: 'Fallback screen; live FEMA query runs after analysis.' }
const initialSoil: SoilData = { source: 'fallback', mukey: 'demo', mapunit: 'Pasture-suitable loam fixture', drainage: 'Moderately well drained', farmland: 'Farmland of statewide importance', note: 'Fallback soil model; live USDA SDA query runs after analysis.' }
const initialBoundary: ParcelBoundary = {
  source: 'fallback',
  propId: 'R-18422-DEMO',
  oldPropId: 'fixture',
  objectId: null,
  areaSqFt: null,
  perimeterFt: null,
  rings: [[[-97.67358, 29.88314], [-97.67322, 29.88320], [-97.67316, 29.88290], [-97.67358, 29.88283], [-97.67367, 29.88326], [-97.67358, 29.88314]]],
  note: 'Demo parcel polygon; live Caldwell CAD boundary query runs after analysis.',
}

function parcelProviderFor(parcel: LiveParcel): ParcelProvider {
  const apiKey = import.meta.env.VITE_REGRID_API_KEY as string | undefined
  const providerBase = import.meta.env.VITE_PARCEL_PROVIDER_URL as string | undefined
  const q = encodeURIComponent(`${parcel.lat},${parcel.lon}`)
  if (providerBase) {
    return { provider: 'Configured parcel API', status: 'configured', message: 'Custom county/parcel provider URL configured via VITE_PARCEL_PROVIDER_URL.', url: `${providerBase}${providerBase.includes('?') ? '&' : '?'}lat=${parcel.lat}&lon=${parcel.lon}` }
  }
  if (apiKey) {
    return { provider: 'Regrid-compatible', status: 'configured', message: 'Regrid key detected. Wire backend proxy before exposing secret keys client-side.', url: `https://app.regrid.com/us#b=admin&q=${q}` }
  }
  return { provider: 'Caldwell CAD public ArcGIS + Regrid handoff', status: 'configured', message: 'Live Caldwell CAD parcel boundary layer enabled; owner name not exposed by this public layer, so ownership links to CAD/Regrid handoff.', url: `https://app.regrid.com/us#b=admin&q=${q}` }
}

function statusLabel(status: 'green' | 'yellow' | 'red') {
  if (status === 'green') return 'Clear'
  if (status === 'yellow') return 'Verify'
  return 'Stop'
}

function extractPlace(input: string) {
  const cleaned = input
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/parcel=[^\s·]+/gi, ' ')
    .replace(/[·|]/g, ' ')
    .replace(/\$[\d,]+/g, ' ')
    .replace(/\bAPN\b|\bparcel\b|DEMO/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (/lockhart/i.test(cleaned)) return 'Lockhart, Caldwell County, Texas'
  if (cleaned.length > 8) return cleaned
  return 'Lockhart, Caldwell County, Texas'
}

async function geocodePlace(query: string): Promise<LiveParcel> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', query)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6500)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`)
    const results = await response.json() as Array<{ lat: string; lon: string; display_name: string; boundingbox?: string[]; address?: Record<string, string> }>
    const first = results[0]
    if (!first) throw new Error('No geocoder result')
    return {
      query,
      displayName: first.display_name,
      lat: Number(first.lat),
      lon: Number(first.lon),
      county: first.address?.county ?? first.address?.state_district ?? 'County unknown',
      state: first.address?.state ?? first.address?.region ?? 'State unknown',
      boundingBox: first.boundingbox,
      source: 'live',
    }
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchFeatureCounts(lat: number, lon: number): Promise<FeatureCount> {
  const query = `
    [out:json][timeout:5];
    (
      way(around:1800,${lat},${lon})["highway"];
      way(around:1800,${lat},${lon})["waterway"];
      way(around:1800,${lat},${lon})["building"];
      node(around:1800,${lat},${lon})["amenity"];
    );
    out tags 80;
  `
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6500)
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Overpass returned ${response.status}`)
    const data = await response.json() as { elements?: Array<{ tags?: Record<string, string> }> }
    const elements = data.elements ?? []
    return {
      roads: elements.filter((item) => item.tags?.highway).length,
      waterways: elements.filter((item) => item.tags?.waterway).length,
      buildings: elements.filter((item) => item.tags?.building).length,
      amenities: elements.filter((item) => item.tags?.amenity).length,
    }
  } catch {
    return initialFeatureCounts
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchFemaFlood(lat: number, lon: number): Promise<FloodData> {
  const url = new URL('https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query')
  url.searchParams.set('f', 'json')
  url.searchParams.set('geometry', `${lon},${lat}`)
  url.searchParams.set('geometryType', 'esriGeometryPoint')
  url.searchParams.set('inSR', '4326')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set('outFields', 'FLD_ZONE,ZONE_SUBTY,SFHA_TF')
  url.searchParams.set('returnGeometry', 'false')
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 7000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`FEMA returned ${response.status}`)
    const data = await response.json() as { features?: Array<{ attributes?: Record<string, string> }> }
    const attrs = data.features?.[0]?.attributes
    if (!attrs) return { ...initialFlood, source: 'live', note: 'FEMA NFHL returned no intersecting flood hazard polygon at this point.' }
    const zone = attrs.FLD_ZONE ?? 'Unknown'
    const sfha = attrs.SFHA_TF ?? 'Unknown'
    const risk: FloodData['risk'] = sfha === 'T' || ['A', 'AE', 'AH', 'AO', 'VE', 'V'].includes(zone) ? 'high' : zone === 'X' ? 'low' : 'moderate'
    return { source: 'live', zone, subtype: attrs.ZONE_SUBTY ?? 'n/a', sfha, risk, note: 'Live FEMA NFHL point intersection; verify with official panel before closing.' }
  } catch (error) {
    return { ...initialFlood, note: `FEMA live layer unavailable; fallback used. ${error instanceof Error ? error.message : ''}` }
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchUsdaSoil(lat: number, lon: number): Promise<SoilData> {
  const point = `point(${lon} ${lat})`
  const mukeyQuery = `SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${point}')`
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  try {
    const mukeyResp = await fetch('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mukeyQuery, format: 'JSON' }),
      signal: controller.signal,
    })
    if (!mukeyResp.ok) throw new Error(`USDA mukey returned ${mukeyResp.status}`)
    const mukeyData = await mukeyResp.json() as { Table?: string[][] }
    const mukey = mukeyData.Table?.[0]?.[0]
    if (!mukey) throw new Error('No USDA mukey for point')

    const detailQuery = `SELECT TOP 1 mapunit.mukey, muname, drainagecl, farmlndcl FROM mapunit LEFT JOIN component ON component.mukey = mapunit.mukey WHERE mapunit.mukey = '${mukey}' ORDER BY comppct_r DESC`
    const detailResp = await fetch('https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: detailQuery, format: 'JSON' }),
      signal: controller.signal,
    })
    if (!detailResp.ok) throw new Error(`USDA details returned ${detailResp.status}`)
    const detailData = await detailResp.json() as { Table?: string[][] }
    const row = detailData.Table?.[0]
    return { source: 'live', mukey, mapunit: row?.[1] ?? 'USDA map unit found', drainage: row?.[2] ?? 'Drainage not returned', farmland: row?.[3] ?? 'Farmland class not returned', note: 'Live USDA Soil Data Access result; validate with Web Soil Survey for parcel-scale report.' }
  } catch (error) {
    return { ...initialSoil, note: `USDA live soil unavailable; fallback used. ${error instanceof Error ? error.message : ''}` }
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchCaldwellParcelBoundary(lat: number, lon: number): Promise<ParcelBoundary> {
  const url = new URL('https://services.arcgis.com/rVxY74DxxIDrDbc0/arcgis/rest/services/Caldwell_CAD_Parcel_Map/FeatureServer/1/query')
  url.searchParams.set('f', 'json')
  url.searchParams.set('geometry', `${lon},${lat}`)
  url.searchParams.set('geometryType', 'esriGeometryPoint')
  url.searchParams.set('inSR', '4326')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set('outFields', 'OBJECTID,OLDPROPID,Prop_ID,Shape__Area,Shape__Length')
  url.searchParams.set('returnGeometry', 'true')
  url.searchParams.set('outSR', '4326')
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 7500)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Caldwell CAD returned ${response.status}`)
    const data = await response.json() as { features?: Array<{ attributes?: Record<string, number | string>; geometry?: { rings?: number[][][] } }> }
    const feature = data.features?.[0]
    if (!feature?.geometry?.rings?.length) throw new Error('No parcel polygon at point')
    const attrs = feature.attributes ?? {}
    return {
      source: 'live',
      propId: String(attrs.Prop_ID ?? 'unknown'),
      oldPropId: String(attrs.OLDPROPID ?? 'unknown'),
      objectId: typeof attrs.OBJECTID === 'number' ? attrs.OBJECTID : null,
      areaSqFt: typeof attrs.Shape__Area === 'number' ? attrs.Shape__Area : null,
      perimeterFt: typeof attrs.Shape__Length === 'number' ? attrs.Shape__Length : null,
      rings: feature.geometry.rings,
      note: 'Live Caldwell CAD parcel polygon. Public layer exposes Prop_ID/OLDPROPID/boundary but not owner name; verify owner in CAD/property records.',
    }
  } catch (error) {
    return { ...initialBoundary, note: `Caldwell CAD parcel boundary unavailable; fallback used. ${error instanceof Error ? error.message : ''}` }
  } finally {
    window.clearTimeout(timeout)
  }
}

function boundaryToSvgPoints(boundary: ParcelBoundary) {
  const ring = boundary.rings[0]
  if (!ring?.length) return '210,110 470,70 595,205 510,348 260,372 145,235'
  const xs = ring.map(([x]) => x)
  const ys = ring.map(([, y]) => y)
  const minX = Math.min(...xs); const maxX = Math.max(...xs)
  const minY = Math.min(...ys); const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 0.000001)
  const height = Math.max(maxY - minY, 0.000001)
  return ring.map(([x, y]) => {
    const sx = 150 + ((x - minX) / width) * 430
    const sy = 78 + (1 - ((y - minY) / height)) * 285
    return `${sx.toFixed(1)},${sy.toFixed(1)}`
  }).join(' ')
}

function openStripeCheckout() {
  const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL as string | undefined
  if (checkoutUrl) {
    window.location.href = checkoutUrl
    return true
  }
  return false
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function App() {
  const [selectedGoal, setSelectedGoal] = useState<GoalKey>('homestead')
  const [activeLayer, setActiveLayer] = useState<LayerKey>('access')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [query, setQuery] = useState('https://www.acres.com/plat-map/map?parcel=R-18422-DEMO · 12.4 acres near Lockhart, TX · $89,000')
  const [status, setStatus] = useState<Status>('idle')
  const [stage, setStage] = useState(0)
  const [liveParcel, setLiveParcel] = useState<LiveParcel>(fixtureParcel)
  const [features, setFeatures] = useState<FeatureCount>(initialFeatureCounts)
  const [flood, setFlood] = useState<FloodData>(initialFlood)
  const [soil, setSoil] = useState<SoilData>(initialSoil)
  const [parcelProvider, setParcelProvider] = useState<ParcelProvider>(parcelProviderFor(fixtureParcel))
  const [boundary, setBoundary] = useState<ParcelBoundary>(initialBoundary)
  const [liveNote, setLiveNote] = useState('Ready to geocode via OpenStreetMap/Nominatim. Falls back to the Lockhart demo fixture if a live service times out.')

  const goal = goals.find((item) => item.key === selectedGoal) ?? goals[0]
  const layer = layers.find((item) => item.key === activeLayer) ?? layers[0]
  const isReady = status === 'ready'

  const ledgerLines = useMemo(() => [
    `[live] parcel input: ${query}`,
    `[live] geocoder source: ${liveParcel.source === 'live' ? 'OpenStreetMap / Nominatim' : 'Lockhart fixture fallback'}`,
    `[live] coordinates: ${liveParcel.lat.toFixed(5)}, ${liveParcel.lon.toFixed(5)}`,
    `[live] OSM context: ${features.roads} roads · ${features.waterways} waterways · ${features.buildings} buildings · ${features.amenities} amenities`,
    `[fema] ${flood.source} zone ${flood.zone} · SFHA ${flood.sfha} · risk ${flood.risk}`,
    `[usda] ${soil.source} mukey ${soil.mukey} · ${soil.mapunit}`,
    `[parcel] ${boundary.source} Prop_ID ${boundary.propId} · old ${boundary.oldPropId} · area ${boundary.areaSqFt ? Math.round(boundary.areaSqFt).toLocaleString() + ' sqft' : 'n/a'}`,
    `[provider] ${parcelProvider.provider} · ${parcelProvider.status}`,
    `[screen] active layer: ${layer.label}`,
    checkoutOpen ? '[stripe] $19 test checkout staged' : '[stripe] paid report locked until user approval',
  ], [boundary, checkoutOpen, features, flood, layer.label, liveParcel, parcelProvider, query, soil])

  const packet = useMemo(() => buildProofPacket({
    goal: goal.prompt,
    activeLayer: layer.label,
    checkoutOpen,
    ledgerLines,
    scoreBoost: goal.boost,
  }), [checkoutOpen, goal.boost, goal.prompt, layer.label, ledgerLines])

  const markdown = useMemo(() => proofPacketToMarkdown(packet), [packet])

  async function runAnalysis() {
    if (status === 'loading') return
    setStatus('loading')
    setStage(0)
    setLiveNote('Running live geocode + OSM context scan…')

    const ticker = window.setInterval(() => {
      setStage((current) => Math.min(analysisSteps.length, current + 1))
    }, 380)

    try {
      const place = extractPlace(query)
      const geocoded = await geocodePlace(place)
      setLiveParcel(geocoded)
      setParcelProvider(parcelProviderFor(geocoded))
      const [counts, floodData, soilData, boundaryData] = await Promise.all([
        fetchFeatureCounts(geocoded.lat, geocoded.lon),
        fetchFemaFlood(geocoded.lat, geocoded.lon),
        fetchUsdaSoil(geocoded.lat, geocoded.lon),
        fetchCaldwellParcelBoundary(geocoded.lat, geocoded.lon),
      ])
      setFeatures(counts)
      setFlood(floodData)
      setSoil(soilData)
      setBoundary(boundaryData)
      setLiveNote(`Live geocode resolved: ${geocoded.displayName}`)
      setStage(analysisSteps.length)
      setStatus('ready')
    } catch (error) {
      setLiveParcel(fixtureParcel)
      setParcelProvider(parcelProviderFor(fixtureParcel))
      setFeatures(initialFeatureCounts)
      setFlood(initialFlood)
      setSoil(initialSoil)
      setBoundary(initialBoundary)
      setLiveNote(`Live service unavailable, using controlled demo fixture. ${error instanceof Error ? error.message : ''}`)
      setStage(analysisSteps.length)
      setStatus('ready')
    } finally {
      window.clearInterval(ticker)
    }
  }

  const fitScore = packet.fit_score
  const liveReport = { ...packet, liveParcel, features, flood, soil, boundary, parcelProvider }
  const exportJson = () => downloadFile('ParcelProof_LiveDecisionPacket.json', JSON.stringify(liveReport, null, 2), 'application/json')
  const exportMarkdown = () => downloadFile('ParcelProof_LiveDecisionPacket.md', `${markdown}\n\n## Live Data Layers\n- ${liveParcel.displayName}\n- Coordinates: ${liveParcel.lat}, ${liveParcel.lon}\n- OSM context: ${features.roads} roads, ${features.waterways} waterways, ${features.buildings} buildings, ${features.amenities} amenities\n- FEMA: zone ${flood.zone}, SFHA ${flood.sfha}, risk ${flood.risk}\n- USDA: ${soil.mapunit}, drainage ${soil.drainage}, farmland ${soil.farmland}\n- Parcel boundary: Prop_ID ${boundary.propId}, OLDPROPID ${boundary.oldPropId}, area ${boundary.areaSqFt ? Math.round(boundary.areaSqFt).toLocaleString() + ' sqft' : 'n/a'}\n- Parcel provider: ${parcelProvider.provider} (${parcelProvider.status})\n`, 'text/markdown')
  const exportPdf = () => window.print()
  const startCheckout = () => {
    if (!openStripeCheckout()) setCheckoutOpen(true)
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="live-dot" /> ParcelProof
        </div>
        <nav>
          <a href="#analysis">Live screen</a>
          <a href="#packet">Packet</a>
          <a href="#sponsors">Sponsors</a>
        </nav>
      </section>

      <section className="hero-card">
        <div className="hero-copy-block">
          <p className="eyebrow">Carfax for land decisions</p>
          <h1>Know what land can become before you buy.</h1>
          <p className="lede">Paste a parcel, address, APN, or Acres-style map link. ParcelProof runs a live map lookup, screens land-use risk, and generates a buyer-ready decision packet.</p>
          <div className="search-row">
            <textarea value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Parcel input" />
            <button onClick={runAnalysis}>{status === 'loading' ? 'Analyzing…' : isReady ? 'Re-run live screen' : 'Analyze live'}</button>
          </div>
          <p className="live-note">{liveNote}</p>
        </div>
        <div className="summary-card">
          <span>Fit score</span>
          <strong>{fitScore}</strong>
          <p>{packet.verdict.replace('_', ' ')} · {liveParcel.source === 'live' ? 'live geocode' : 'demo fixture'}</p>
          <div className="mini-stats">
            <b>{features.roads}</b><span>roads</span>
            <b>{features.waterways}</b><span>water</span>
            <b>{features.buildings}</b><span>buildings</span>
          </div>
        </div>
      </section>

      <section className="goal-bar">
        {goals.map((item) => (
          <button key={item.key} className={item.key === selectedGoal ? 'active' : ''} onClick={() => setSelectedGoal(item.key)}>
            <b>{item.label}</b>
            <span>{item.prompt}</span>
          </button>
        ))}
      </section>

      <section id="analysis" className="analysis-layout">
        <div className="panel map-panel">
          <div className="section-label">Live visualization</div>
          <div className={`live-map layer-${activeLayer}`}>
            <svg viewBox="0 0 700 430" role="img" aria-label="Live parcel visualization">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" /></pattern>
                <linearGradient id="parcelGlow" x1="0" x2="1"><stop stopColor="#9cff7d" stopOpacity=".55"/><stop offset="1" stopColor="#6ef7c2" stopOpacity=".15"/></linearGradient>
              </defs>
              <rect width="700" height="430" fill="url(#grid)" />
              <path d="M0 330 C140 280 220 360 350 300 S560 190 700 240 L700 430 L0 430Z" fill="rgba(61,119,255,.18)" />
              <path d="M-20 330 L200 260 L520 220 L730 140" stroke="rgba(255,202,103,.72)" strokeWidth="18" />
              <path d="M-20 330 L200 260 L520 220 L730 140" stroke="rgba(20,16,11,.92)" strokeWidth="11" />
              <polygon points={boundaryToSvgPoints(boundary)} fill="url(#parcelGlow)" stroke="#9cff7d" strokeWidth="4" />
              <circle cx="390" cy="188" r="10" fill="#9cff7d" /><text x="405" y="193">homesite</text>
              <circle cx="275" cy="292" r="10" fill="#7db8ff" /><text x="292" y="297">well?</text>
              <circle cx="190" cy="246" r="10" fill="#ffca67" /><text x="206" y="251">gate</text>
              <text x="30" y="45" className="map-title">{liveParcel.displayName.split(',').slice(0, 3).join(', ')}</text>
              <text x="30" y="74" className="map-sub">{liveParcel.lat.toFixed(4)}, {liveParcel.lon.toFixed(4)} · OSM live context</text>
            </svg>
          </div>
          <div className="layer-tabs">
            {layers.map((item) => (
              <button key={item.key} className={item.key === activeLayer ? `active ${item.status}` : item.status} onClick={() => setActiveLayer(item.key)}>{item.label}</button>
            ))}
          </div>
          <div className="live-layer-grid">
            <article><span>FEMA NFHL</span><b>Zone {flood.zone}</b><small>{flood.risk} risk · SFHA {flood.sfha}</small></article>
            <article><span>USDA NRCS</span><b>{soil.mapunit}</b><small>{soil.drainage} · {soil.farmland}</small></article>
            <article><span>Parcel boundary</span><b>Prop {boundary.propId}</b><small>{boundary.source} · {boundary.areaSqFt ? Math.round(boundary.areaSqFt).toLocaleString() + ' sqft' : 'area pending'}</small></article>
          </div>
        </div>

        <div className="panel compact-panel">
          <div className="section-label">AI due diligence</div>
          <h2>{status === 'loading' ? 'Running live screen…' : isReady ? 'Decision packet ready' : 'Run the land screen'}</h2>
          <div className="steps-list">
            {analysisSteps.map((step, index) => {
              const done = index < stage
              const active = status === 'loading' && index === stage
              return <article key={step.label} className={done ? 'done' : active ? 'active' : ''}><b>{step.agent}</b><span>{step.label}</span><small>{step.detail}</small></article>
            })}
          </div>
        </div>

        <div className="panel verdict-panel">
          <div className="section-label">Current verdict</div>
          <h2>{packet.verdict.replace('_', ' ')}</h2>
          <p>Do not write an offer until legal access and septic feasibility are verified.</p>
          <div className={`status-pill ${layer.status}`}>{statusLabel(layer.status)} · {layer.label}</div>
          <p className="muted">{layer.summary}</p>
          <button onClick={exportJson}>Export JSON</button>
          <button className="ghost" onClick={exportMarkdown}>Export Markdown</button>
          <button className="ghost" onClick={exportPdf}>Export PDF</button>
          <a className="provider-link" href={parcelProvider.url} target="_blank" rel="noreferrer">Open parcel provider</a>
        </div>
      </section>

      <section className="score-strip">
        {baseScores.map((score) => (
          <article key={score.label} className={score.status}>
            <b>{score.score}</b>
            <span>{score.label}</span>
            <small>{score.nextAction}</small>
          </article>
        ))}
      </section>

      <section id="packet" className="packet-layout">
        <div className="panel packet-panel">
          <div className="section-label">Land Decision Packet</div>
          <h2>{liveParcel.county || 'Caldwell County'} land screen</h2>
          <p>{goal.prompt}</p>
          <div className="question-grid">
            <div><b>Ask seller</b>{packet.seller_questions.slice(0, 3).map((q) => <p key={q}>• {q}</p>)}</div>
            <div><b>Ask county</b>{packet.county_questions.slice(0, 3).map((q) => <p key={q}>• {q}</p>)}</div>
          </div>
          <div className="data-disclosures">
            <p><b>FEMA:</b> {flood.note}</p>
            <p><b>USDA:</b> {soil.note}</p>
            <p><b>Parcel boundary:</b> {boundary.note}</p>
            <p><b>Ownership:</b> Public Caldwell layer exposes parcel IDs/boundary, not owner name; use CAD/Regrid handoff for owner verification.</p>
            <p><b>Provider:</b> {parcelProvider.message}</p>
          </div>
        </div>
        <div className="panel commerce-panel">
          <div className="section-label">Stripe rail</div>
          <h2>$19</h2>
          <p>Real Checkout handoff when VITE_STRIPE_CHECKOUT_URL is configured; otherwise local test modal for demo reliability.</p>
          <button onClick={startCheckout}>Unlock report</button>
          <button className="ghost" onClick={exportPdf}>Print / PDF</button>
        </div>
      </section>

      <section id="sponsors" className="sponsor-row">
        {sponsorStack.map((sponsor) => (
          <article key={sponsor.sponsor} className="panel">
            <span>{sponsor.lane}</span>
            <h3>{sponsor.sponsor}</h3>
            <p>{sponsor.value}</p>
          </article>
        ))}
      </section>

      <section className="panel source-trail">
        <div className="section-label">Source trail</div>
        {ledgerLines.map((line) => <p key={line}>{line}</p>)}
      </section>

      {checkoutOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="stripe-modal">
            <div className="modal-topline"><span>Stripe test checkout</span><button className="ghost" onClick={() => setCheckoutOpen(false)}>Close</button></div>
            <div className="stripe-word">stripe</div>
            <h2>Unlock Land Reality Check</h2>
            <p>Demo checkout for the complete ParcelProof packet, source trail, and expert-review upsell.</p>
            <div className="receipt"><span>Product</span><b>ParcelProof Report</b><span>Mode</span><b>Test</b><span>Total</span><b>$19.00</b></div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
