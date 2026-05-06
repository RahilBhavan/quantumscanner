// KV counter reads/writes gated by NEXT_PUBLIC_LIVE_COUNTER_ENABLED.
// Only aggregated integers are stored — no addresses ever.

/**
 * Aggregate scan counters stored in Vercel KV.
 *
 * **KV key schema:**
 * | Key                   | Type    | Description                                         |
 * |-----------------------|---------|-----------------------------------------------------|
 * | `total_btc_scanned`   | integer | Cumulative number of Bitcoin addresses ever scanned |
 * | `exposed_btc_scanned` | integer | Subset of the above that were classified as exposed |
 *
 * Both keys are created automatically on first `INCRBY` and default to `0`
 * when not yet present (KV returns `null` for missing keys).
 */
export interface ScanCounters {
  /** Cumulative total of Bitcoin addresses scanned across all users and sessions. */
  totalScanned: number
  /** Subset of `totalScanned` that were classified as quantum-exposed. */
  exposedCount: number
}

/**
 * Lazily-initialised reference to the `@vercel/kv` module.
 * `null` means either the module has not been loaded yet or it is unavailable
 * in the current runtime (e.g. local development without KV credentials).
 *
 * @internal
 */
let kv: typeof import('@vercel/kv') | null = null

/**
 * Lazily imports the `@vercel/kv` module and caches the reference.
 *
 * Using a dynamic import here serves two purposes:
 * 1. **Tree-shaking in test environments** — unit tests don't need the KV
 *    module and should not fail if `@vercel/kv` is not installed.
 * 2. **Graceful degradation** — if the import throws (missing env vars, module
 *    not installed), we return `null` and all counter operations become no-ops
 *    rather than crashing the server.
 *
 * @returns The `@vercel/kv` module, or `null` if it cannot be loaded.
 * @internal
 */
async function getKv() {
  if (kv) return kv
  try {
    kv = await import('@vercel/kv')
    return kv
  } catch {
    return null
  }
}

/**
 * Reads the current scan counters from Vercel KV.
 *
 * Both keys are fetched in parallel with `Promise.all` to minimise latency.
 * A `null` value from KV (key does not exist yet) is normalised to `0`.
 *
 * Falls back to `{ totalScanned: 0, exposedCount: 0 }` in three scenarios:
 * - `@vercel/kv` module is unavailable (local dev, CI, test environments).
 * - KV is reachable but throws (transient network error, auth failure).
 * - This ensures counter unavailability never blocks an API response.
 *
 * @returns Current counter values, defaulting to zeros on any failure.
 */
export async function readCounters(): Promise<ScanCounters> {
  const client = await getKv()
  if (!client) return { totalScanned: 0, exposedCount: 0 }
  try {
    const [totalScanned, exposedCount] = await Promise.all([
      client.kv.get<number>('total_btc_scanned'),
      client.kv.get<number>('exposed_btc_scanned'),
    ])
    return { totalScanned: totalScanned ?? 0, exposedCount: exposedCount ?? 0 }
  } catch {
    return { totalScanned: 0, exposedCount: 0 }
  }
}

/**
 * Atomically increments the scan counters in Vercel KV using `INCRBY`.
 *
 * Both increments are issued in parallel.  `INCRBY` is atomic at the KV level,
 * so concurrent requests cannot corrupt the counters even without distributed
 * locking.
 *
 * This function is intentionally fire-and-forget: errors are silently swallowed
 * so a KV outage never degrades the primary scan experience.  The counter
 * display on the landing page is cosmetic and eventually-consistent — a missed
 * increment is acceptable.
 *
 * @param opts.scannedCount - Number of addresses that were successfully scanned
 *                            in this batch (added to `total_btc_scanned`).
 * @param opts.newExposed   - Number of newly-discovered exposed addresses in
 *                            this batch (added to `exposed_btc_scanned`).
 */
export async function incrementCounters(opts: {
  scannedCount: number
  newExposed: number
}): Promise<void> {
  const client = await getKv()
  if (!client) return
  try {
    await Promise.all([
      client.kv.incrby('total_btc_scanned', opts.scannedCount),
      client.kv.incrby('exposed_btc_scanned', opts.newExposed),
    ])
  } catch {
    // Fire-and-forget; never throw
  }
}
