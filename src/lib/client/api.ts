import type { ApiResponse } from '@/lib/api/envelope'
import type { AddressResult } from '@/lib/api/resolve-address'

/**
 * Scans a single Bitcoin address by calling the server-side address resolution
 * endpoint and returning the typed result.
 *
 * This is the primary browser-side entry point for single-address scans (used
 * by the `/scan` page).  The function performs the `fetch`, unwraps the
 * standard `ApiResponse` envelope, and either returns the payload or throws a
 * descriptive `Error` so UI error boundaries can display a human-readable
 * message without parsing raw HTTP responses.
 *
 * The address is percent-encoded in the URL path so that any character that
 * would otherwise be misinterpreted by the router (e.g. `+` in bech32
 * addresses) is safely escaped.
 *
 * @param address - The Bitcoin address to scan (P2PKH, P2SH, or bech32).
 * @returns The fully resolved `AddressResult` containing classification,
 *          balance, risk score, and recommended action.
 * @throws {Error} When the API returns a non-success envelope (`ok: false`),
 *                 with the message taken directly from `json.error.message`.
 * @throws {TypeError} On network-level failures (no connectivity, DNS error).
 */
export async function scanAddress(address: string): Promise<AddressResult> {
  const res = await fetch(`/api/v1/address/${encodeURIComponent(address)}`)
  const json: ApiResponse<AddressResult> = await res.json()

  if (!json.ok) {
    throw new Error(json.error.message)
  }
  return json.data
}
