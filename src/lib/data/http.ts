/**
 * Wraps the native `fetch` API with an automatic abort-on-timeout mechanism.
 *
 * Node's built-in `fetch` (and most browser environments) do not natively
 * enforce a per-request timeout, so long-running upstream calls would otherwise
 * block the event loop indefinitely.  This wrapper wires an `AbortController`
 * to a `setTimeout` so any request that exceeds `timeoutMs` is cancelled and
 * the resulting `AbortError` propagates to the caller as a rejected promise.
 *
 * The timer is always cleared in a `finally` block to prevent memory leaks when
 * a response arrives before the deadline.
 *
 * @param url       - Fully-qualified URL to request.
 * @param opts      - Standard `RequestInit` options forwarded verbatim to
 *                    `fetch` (headers, method, body, etc.).  The `signal`
 *                    property is overwritten by this function.
 * @param timeoutMs - Maximum milliseconds to wait for the response to begin.
 *                    Defaults to 4 000 ms (4 seconds), chosen to stay well
 *                    within the 10 s Vercel Edge function limit while still
 *                    tolerating occasional upstream latency spikes.
 * @returns The raw `Response` object on success.
 * @throws {DOMException} With `name === 'AbortError'` when the timeout fires.
 * @throws {TypeError}    On network errors (DNS failure, connection refused).
 */
export async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 4000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    // Always clear the timer — whether the fetch succeeded, failed, or threw —
    // to prevent a dangling timer keeping the process alive.
    clearTimeout(timer)
  }
}
