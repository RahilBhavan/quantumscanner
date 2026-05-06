import { fetchAddressFacts, type FetchedAddressFacts } from './mempool-client'
import { UpstreamError, RateLimitError } from './errors'

interface AddressSourceOptions {
  mempoolBase: string
  esploraBase: string
}

function isFallbackTrigger(err: unknown): boolean {
  return (
    err instanceof RateLimitError ||
    (err instanceof UpstreamError && (err.statusCode ?? 0) >= 500)
  )
}

export async function fetchAddressWithFallback(
  address: string,
  { mempoolBase, esploraBase }: AddressSourceOptions
): Promise<FetchedAddressFacts> {
  try {
    return await fetchAddressFacts(address, mempoolBase, 'mempool.space')
  } catch (primaryErr) {
    if (!isFallbackTrigger(primaryErr)) throw primaryErr

    try {
      return await fetchAddressFacts(address, esploraBase, 'blockstream.info')
    } catch (fallbackErr) {
      throw new UpstreamError(
        `Both providers failed for ${address}. Primary: ${primaryErr}. Fallback: ${fallbackErr}`
      )
    }
  }
}
