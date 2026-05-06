import type { AddressResult } from '@/lib/api/resolve-address'

/**
 * Discriminated union of all event types emitted by the portfolio scan SSE
 * stream.  Each event carries a `type` discriminant that consumers should
 * switch on.
 *
 * **Stream lifecycle:**
 * ```
 * progress* → result* → summary → [stream ends]
 * ```
 * - Zero or more `progress` events fire as addresses are processed.
 * - One `result` event fires for each address after it has been resolved.
 * - One `summary` event fires as the last data event before the stream closes.
 * - An `error` event may fire at any point; it is terminal (no further events).
 */
export type StreamEvent =
  /** Periodic progress update indicating how many addresses have been processed so far. */
  | { type: 'progress'; completed: number; total: number }
  /** The resolved scan result for a single address. */
  | { type: 'result'; data: AddressResult }
  /**
   * Final aggregate summary emitted once all addresses have been scanned.
   * Counts are mutually exclusive: each address contributes to exactly one
   * of `exposed`, `safe`, `empty`, or `unresolvable`.
   */
  | {
      type: 'summary'
      /** Total number of addresses submitted for scanning. */
      total: number
      /** Addresses classified as quantum-exposed (have spent outputs). */
      exposed: number
      /** Addresses that have funds but no spending history (safe at rest). */
      safe: number
      /** Addresses with no on-chain history (zero balance, zero txns). */
      empty: number
      /** Addresses that could not be resolved (API errors, invalid format). */
      unresolvable: number
    }
  /** Terminal error event; the stream will not emit further events after this. */
  | { type: 'error'; message: string }

/**
 * Options for initiating a portfolio scan stream.
 */
export interface StreamOptions {
  /** List of Bitcoin addresses to scan. Must be non-empty. */
  addresses: string[]
  /**
   * Called once for each SSE event parsed from the stream.
   * Invocations are synchronous from within the read pump, so heavy work here
   * will block subsequent reads.
   */
  onEvent: (event: StreamEvent) => void
  /**
   * Called when the stream's `ReadableStream` is fully consumed (`done === true`).
   * This fires after the `summary` event has been delivered via `onEvent`.
   */
  onDone: () => void
  /**
   * Called when a non-abort error occurs (fetch failure, HTTP error, etc.).
   * The stream is implicitly terminated at this point — no further events will
   * arrive and `onDone` will NOT be called.
   */
  onError: (err: Error) => void
}

/**
 * Opens a Server-Sent Events (SSE) stream to the portfolio scan endpoint and
 * processes incoming events through the provided callbacks.
 *
 * **SSE protocol details:**
 * The server sends newline-delimited SSE frames.  This client handles the
 * standard `data:` prefix lines and silently skips `event:` type lines (the
 * payload `type` field in the JSON is sufficient for routing).  Malformed
 * `data:` lines (invalid JSON) are silently discarded to keep the stream alive.
 *
 * **Buffering strategy:**
 * The `TextDecoder` is used in streaming mode (`{ stream: true }`) so
 * multi-byte UTF-8 characters split across chunk boundaries are reassembled
 * correctly.  Partial lines at the end of each chunk are held in `buffer`
 * until the next chunk completes them.
 *
 * **Cancellation:**
 * The returned function aborts the underlying fetch via `AbortController`.
 * `AbortError` rejections are silently swallowed so callers don't need to
 * distinguish intentional cancellation from genuine errors.
 *
 * @param opts - Stream configuration including the address list and callbacks.
 * @returns A `cancel` function that, when called, aborts the stream cleanly.
 *          Call this in a React `useEffect` cleanup or when the user navigates
 *          away to prevent memory leaks from orphaned stream readers.
 *
 * @example
 * ```ts
 * const cancel = streamPortfolioScan({
 *   addresses: ['bc1q...', '1A1z...'],
 *   onEvent: (e) => dispatch(e),
 *   onDone: () => setLoading(false),
 *   onError: (err) => setError(err.message),
 * })
 * // Later, e.g. in useEffect cleanup:
 * return () => cancel()
 * ```
 */
export function streamPortfolioScan(opts: StreamOptions): () => void {
  const { addresses, onEvent, onDone, onError } = opts

  const controller = new AbortController()

  fetch('/api/v1/portfolio/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Stream request failed: ${res.status}`)
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      /**
       * Recursive read pump.  Each iteration reads one chunk from the
       * `ReadableStream`, appends it to `buffer`, splits on newlines, and
       * dispatches complete lines.  The last element after `split('\n')` is
       * always kept in `buffer` because it may be a partial line that will be
       * completed by the next chunk.
       */
      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            onDone()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          // Retain any trailing partial line for the next chunk.
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('event:')) continue
            if (line.startsWith('data:')) {
              const json = line.slice(5).trim()
              if (!json) continue
              try {
                const parsed = JSON.parse(json) as StreamEvent
                onEvent(parsed)
              } catch {
                // skip malformed SSE data lines
              }
            }
          }
          return pump()
        })
      }

      return pump()
    })
    .catch((err) => {
      // AbortError is expected when the caller invokes cancel(); treat it as a
      // no-op rather than surfacing an error to the UI.
      if (err instanceof Error && err.name === 'AbortError') return
      onError(err instanceof Error ? err : new Error(String(err)))
    })

  // Return a cancel handle so callers can tear down the stream.
  return () => controller.abort()
}
