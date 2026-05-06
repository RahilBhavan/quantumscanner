// KV counter reads/writes gated by NEXT_PUBLIC_LIVE_COUNTER_ENABLED.
// Only aggregated integers are stored — no addresses ever.

export interface ScanCounters {
  totalScanned: number
  exposedCount: number
}

let kv: typeof import('@vercel/kv') | null = null

async function getKv() {
  if (kv) return kv
  try {
    kv = await import('@vercel/kv')
    return kv
  } catch {
    return null
  }
}

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
