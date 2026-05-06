import { z } from 'zod'

/**
 * Validates the `address` path parameter for the single-address scan endpoint.
 *
 * Length bounds (26–62 characters) cover all current mainnet address formats:
 * - Minimum 26: shortest valid P2PKH address
 * - Maximum 62: longest valid Bech32m (P2TR) address
 *
 * Structural validation (checksum, network) is performed downstream by
 * {@link detectAddressType} once the parameter is confirmed non-empty.
 */
export const AddressParamSchema = z.object({
  address: z.string().min(26).max(62),
})

/**
 * Validates the request body for the portfolio batch endpoint (`POST /api/v1/portfolio`).
 *
 * The batch endpoint processes all addresses synchronously and returns a single
 * JSON response — capped at 100 addresses to bound response latency and upstream
 * API load. For larger portfolios use {@link PortfolioStreamBodySchema}.
 */
export const PortfolioBodySchema = z.object({
  addresses: z
    .array(z.string().min(26).max(62))
    .min(1)
    .max(100, 'Maximum 100 addresses per batch request'),
})

/**
 * Validates the request body for the portfolio streaming endpoint
 * (`POST /api/v1/portfolio/stream`).
 *
 * The stream endpoint emits NDJSON results as each address is resolved, so it
 * can handle larger portfolios (up to 1,000 addresses) without hitting request
 * timeout limits. Results arrive incrementally rather than all at once.
 */
export const PortfolioStreamBodySchema = z.object({
  addresses: z
    .array(z.string().min(26).max(62))
    .min(1)
    .max(1000, 'Maximum 1000 addresses per stream request'),
})
