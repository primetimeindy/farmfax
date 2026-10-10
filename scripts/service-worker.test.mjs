import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')

// Execute the shipped worker with in-memory browser adapters: no server/network.
function worker({ network = async () => new Response('online'), installError } = {}) {
  const listeners = new Map()
  const stores = new Map()
  const effects = { skipped: 0, claimed: 0, fetched: [], added: [] }
  const key = (request) => typeof request === 'string' ? request : request.url
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)
      return {
        async addAll(urls) {
          if (installError) throw installError
          effects.added.push(...urls)
        },
        async put(request, response) { store.set(key(request), response) },
      }
    },
    async keys() { return [...stores.keys()] },
    async delete(name) { return stores.delete(name) },
    async match(request) {
      for (const store of stores.values()) {
        if (store.has(key(request))) return store.get(key(request)).clone()
      }
    },
  }
  vm.runInNewContext(source, {
    URL, caches,
    fetch(request) { effects.fetched.push(request.url); return network(request) },
    self: {
      location: { origin: 'https://farmfax.test' },
      addEventListener(name, callback) { listeners.set(name, callback) },
      skipWaiting() { effects.skipped++ },
      clients: { claim() { effects.claimed++ } },
    },
  })
  return {
    stores, effects,
    async lifecycle(name) {
      let completion
      listeners.get(name)({ waitUntil(promise) { completion = promise } })
      await completion
    },
    async request(url, { method = 'GET', mode = 'cors' } = {}) {
      let response
      let intercepted = false
      listeners.get('fetch')({
        request: { url, method, mode },
        respondWith(promise) { intercepted = true; response = promise },
      })
      const result = await response
      // Drain queued cache.put callbacks before checking the next operation.
      await Promise.resolve()
      return { intercepted, response: result }
    },
  }
}

test('install precaches the shell; failed precache must not activate early', async () => {
  const good = worker()
  await good.lifecycle('install')
  assert.deepEqual(good.effects.added, ['./manifest.webmanifest', './farmfax-video-fixture.mp4', './farmfax-qr.svg'])
  assert.equal(good.effects.skipped, 1)
  const broken = worker({ installError: new Error('offline') })
  await assert.rejects(broken.lifecycle('install'), /offline/)
  assert.equal(broken.effects.skipped, 0)
})

test('activation retires old cache versions and preserves the installed shell repeatedly', async () => {
  const app = worker()
  await app.lifecycle('install')
  const [current] = app.stores.keys()
  const shell = app.stores.get(current)
  shell.set('./', new Response('current shell'))
  app.stores.set('farmfax-phone-app-v6', new Map())
  await app.lifecycle('activate')
  await app.lifecycle('activate')
  assert.deepEqual([...app.stores.keys()], [current])
  assert.equal(await shell.get('./').text(), 'current shell')
  assert.equal(app.effects.claimed, 2)
})

test('cross-origin and non-GET requests bypass both fetch and cache interception', async () => {
  const app = worker()
  for (const [url, method] of [
    ['https://farmfax.test/api/reports', 'POST'],
    ['https://farmfax.test/asset', 'HEAD'],
    ['https://elsewhere.test/asset', 'GET'],
  ]) {
    assert.equal((await app.request(url, { method })).intercepted, false)
  }
  assert.deepEqual(app.effects.fetched, [])
  assert.equal(app.stores.size, 0)
})

test('repeated navigation prefers fresh responses and falls back to the latest root shell offline', async () => {
  let revision = 0
  let offline = false
  const app = worker({ network: async () => {
    if (offline) throw new Error('offline')
    return new Response(`revision-${++revision}`)
  } })
  for (const expected of ['revision-1', 'revision-2']) {
    const result = await app.request('https://farmfax.test/report', { mode: 'navigate' })
    assert.equal(result.intercepted, true)
    assert.equal(await result.response.text(), expected)
  }
  offline = true
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await app.request('https://farmfax.test/other', { mode: 'navigate' })
    assert.equal(await result.response.text(), 'revision-2')
  }
  assert.equal(app.effects.fetched.length, 4)
})

test('asset fallback is keyed by request and does not substitute unrelated cached content', async () => {
  let offline = false
  const app = worker({ network: async () => {
    if (offline) throw new Error('offline')
    return new Response('asset bytes')
  } })
  assert.equal(await (await app.request('https://farmfax.test/a.js')).response.text(), 'asset bytes')
  offline = true
  assert.equal(await (await app.request('https://farmfax.test/a.js')).response.text(), 'asset bytes')
  assert.equal((await app.request('https://farmfax.test/missing.js')).response, undefined)
})
