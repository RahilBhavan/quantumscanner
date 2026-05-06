import { fetchAddressFacts, type FetchedAddressFacts } from './mempool-client'
import { UpstreamError, RateLimitError } from './errors'

/**
 * Configuration for the two-provider fallback strategy.
 */
interface AddressSourceOptions {
  /** Base URL for the primary mempool.space API (e.g. `'https://mempool.space/api'`). */
  mempoolBase: string
  /** Base URL for the Blockstream Esplora fallback API (e.g. `'https://blockstream.info/api'`). */
  esploraBase: string
}

/**
 * Determines whether a primary fetch error should trigger a fallback attempt.
 *
 * We only fall back on errors that are likely transient and provider-specific:
 * - `RateLimitError` (HTTP 429): we've been throttled; try the other provider.
 * - `UpstreamError` with a 5xx status: the provider is temporarily unhealthy.
 *
 * We do NOT fall back on `NotFoundError` (404) because both providers index the
 * same blockchain — if mempool.space says an address is unknown, Blockstream
 * would return the same 404.  Falling back would only add latency.
 *
 * @param err - The error thrown by the primary provider fetch.
 * @returns `true` if the fallback provider should be tried.
 *
 * @internal
 */
function isFallbackTrigger(err: unknown): boolean {
  return (
    err instanceof RateLimitError ||
    (err instanceof UpstreamError && (err.statusCode ?? 0) >= 500)
  )
}

/**
 * Fetches on-chain address facts with automatic failover between two providers.
 *
 * **Strategy:**
 * 1. Try mempool.space (primary) via `fetchAddressFacts`.
 * 2. If that fails with a rate-limit or 5xx error, try Blockstream Esplora
 *    (fallback).
 * 3. If both fail, throw an `UpstreamError` that bundles both failure messages
 *    so operators can diagnose which provider is degraded.
 *
 * Non-retriable errors (e.g. `NotFoundError`, network DNS failures) are
 * re-thrown immediately without attempting the fallback, preserving fast error
 * propagation for permanent failures.
 *
 * @param address - The Bitcoin address to look up.
 * @param options - Base URLs for the primary and fallback providers.
 * @returns `FetchedAddressFacts` tagged with the name of the provider that
 *          served the response.
 * @throws {NotFoundError}  When the primary returns 404 (not re-tried against
 *                          fallback).
 * @throws {UpstreamError}  When both providers fail, with a combined error
 *                          message identifying both failures.
 */
export async function fetchAddressWithFallback(
  address: string,
  { mempoolBase, esploraBase }: AddressSourceOptions
): Promise<FetchedAddressFacts> {
  try {
    return await fetchAddressFacts(address, mempoolBase, 'mempool.space')
  } catch (primaryErr) {
    // Re-throw immediately for errors that won't be resolved by switching
    // providers (e.g. address not found, invalid address format).
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
