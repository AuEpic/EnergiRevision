/**
 * bridge_client.ts — Centralised tailnet-aware bridge fetcher for EnergiRevision.
 *
 * Priority order for bridge URL resolution:
 *  1. BRIDGE_URL env var (single explicit URL)
 *  2. BRIDGE_URLS env var (comma-separated, health-probed in order)
 *  3. http://localhost:8001 (local dev fallback)
 */

const PROBE_TIMEOUT_MS = 1500

async function _probe(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, {
      signal: controller.signal,
    })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

/** Read an env var that works in both Vite (import.meta.env) and Node (process.env). */
function _env(key: string, viteKey: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (globalThis as any).__VITE_ENV__ ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = typeof (globalThis as any).process !== 'undefined' ? (globalThis as any).process.env : {}
  return meta[viteKey] ?? proc[key] ?? ''
}

/** Return the first reachable bridge base URL (no trailing slash). */
export async function resolveBridgeUrl(): Promise<string> {
  const single = _env('BRIDGE_URL', 'VITE_BRIDGE_URL')
  if (single) return single.replace(/\/$/, '')

  const multi = _env('BRIDGE_URLS', 'VITE_BRIDGE_URLS')
  if (multi) {
    const candidates = multi
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const u of candidates) {
      if (await _probe(u)) return u.replace(/\/$/, '')
    }
  }

  return 'http://localhost:8001'
}

/**
 * Perform a fetch against the bridge, using the resolved URL.
 * Throws on network errors; callers handle HTTP status.
 */
export async function bridgeFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const base = await resolveBridgeUrl()
  const endpoint = `${base}/${path.replace(/^\//, '')}`
  return fetch(endpoint, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}
