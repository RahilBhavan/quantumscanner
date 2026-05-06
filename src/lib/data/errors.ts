/**
 * Base application error that carries a machine-readable `code` alongside the
 * human-readable message.  All domain errors extend this class so callers can
 * do a single `instanceof AppError` guard and still branch on `code` when
 * needed.
 */
export class AppError extends Error {
  /**
   * @param message - Human-readable description of what went wrong.
   * @param code    - Machine-readable error identifier (e.g. `'NOT_FOUND'`).
   */
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Thrown when an upstream provider responds with HTTP 429 (Too Many Requests).
 *
 * Callers that implement retry logic should inspect `retryAfter` to determine
 * how long to wait before the next attempt.  When the upstream does not supply
 * a `Retry-After` header the field will be `undefined`.
 */
export class RateLimitError extends AppError {
  /**
   * @param retryAfter - Seconds to wait before retrying, if provided by the
   *                     upstream `Retry-After` header.
   */
  constructor(public readonly retryAfter?: number) {
    super('Rate limited by upstream provider', 'RATE_LIMITED')
    this.name = 'RateLimitError'
  }
}

/**
 * Thrown when an upstream data provider returns an unexpected error response
 * (non-2xx, malformed JSON, or a response that fails schema validation).
 *
 * Preserving `statusCode` lets callers distinguish a transient 5xx (retry-able)
 * from a permanent 4xx (not retry-able) without parsing the message string.
 */
export class UpstreamError extends AppError {
  /**
   * @param message    - Description of the upstream failure.
   * @param statusCode - HTTP status returned by the upstream, if applicable.
   */
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message, 'UPSTREAM_ERROR')
    this.name = 'UpstreamError'
  }
}

/**
 * Thrown when the upstream returns HTTP 404 for a Bitcoin address lookup,
 * indicating the address has no on-chain history and is therefore unknown to
 * the index provider.
 */
export class NotFoundError extends AppError {
  /**
   * @param address - The Bitcoin address that could not be found.
   */
  constructor(address: string) {
    super(`Address not found: ${address}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}
