/**
 * Discriminated union envelope for successful API responses.
 * The `ok: true` discriminant allows callers to narrow the type safely
 * without checking for the absence of an error field.
 *
 * @template T - Shape of the response payload.
 */
export interface ApiSuccess<T> {
  ok: true
  /** The response payload. Never `undefined` on success. */
  data: T
}

/**
 * Discriminated union envelope for API error responses.
 * All API routes return this shape (with an appropriate HTTP status code)
 * instead of throwing unstructured exceptions.
 */
export interface ApiError {
  ok: false
  error: {
    /** Machine-readable error code (e.g. `'INVALID_ADDRESS'`, `'RATE_LIMITED'`). */
    code: string
    /** Human-readable description safe to surface in the UI. */
    message: string
    /** Optional structured context for debugging; omitted from production responses. */
    details?: unknown
  }
}

/**
 * Top-level API response type used by all route handlers.
 * Consumers should narrow via `if (response.ok)` before accessing `.data`.
 *
 * @template T - Shape of the success payload.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/**
 * Constructs a typed {@link ApiSuccess} envelope around a response payload.
 *
 * @param data - The value to wrap.
 * @returns An `{ ok: true, data }` envelope.
 */
export function success<T>(data: T): ApiSuccess<T> {
  return { ok: true, data }
}

/**
 * Constructs an {@link ApiError} envelope with a structured error object.
 *
 * @param code    - Machine-readable error code string.
 * @param message - Human-readable description safe to return to clients.
 * @param details - Optional debugging context (omit in production-facing responses).
 * @returns An `{ ok: false, error: { code, message, details } }` envelope.
 */
export function failure(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return { ok: false, error: { code, message, details } }
}
