import type { AddressResult } from '@/lib/api/resolve-address'

export type StreamEvent =
  | { type: 'progress'; completed: number; total: number }
  | { type: 'result'; data: AddressResult }
  | { type: 'summary'; total: number; exposed: number; safe: number; empty: number; unresolvable: number }
  | { type: 'error'; message: string }

export interface StreamOptions {
  addresses: string[]
  onEvent: (event: StreamEvent) => void
  onDone: () => void
  onError: (err: Error) => void
}

export function streamPortfolioScan(opts: StreamOptions): () => void {
  const { addresses, onEvent, onDone, onError } = opts

  const controller = new AbortController()

  fetch('/api/v1/portfolio/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses }),
    signal: controller.signal,
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Stream request failed: ${res.status}`)
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            onDone()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
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
    .catch(err => {
      if (err instanceof Error && err.name === 'AbortError') return
      onError(err instanceof Error ? err : new Error(String(err)))
    })

  return () => controller.abort()
}
