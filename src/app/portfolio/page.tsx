import type { Metadata } from 'next'
import { PortfolioClient } from './PortfolioClient'

export const metadata: Metadata = {
  title: 'Portfolio Scanner — Bitcoin Quantum Exposure Scanner',
  description:
    'Upload a CSV of Bitcoin addresses to scan your entire portfolio for quantum exposure risk. Identify which addresses need immediate migration.',
}

/**
 * Portfolio page — `/portfolio`
 *
 * Statically rendered shell page that mounts the `PortfolioClient` interactive
 * orchestrator. The page itself performs no server-side data fetching; all
 * scanning logic lives in the client component which communicates with
 * `POST /api/v1/portfolio/stream` via SSE.
 *
 * ### Layout
 * - Page heading and description explaining the CSV upload workflow and the
 *   1,000-address limit.
 * - `PortfolioClient` — full interactive state machine managing the upload →
 *   preview → scanning → results lifecycle.
 *
 * @remarks
 * Metadata is exported for SEO. No `revalidate` is set because there is no
 * server-side dynamic data on this page — it is fully static HTML.
 */
export default function PortfolioPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-stamp text-ink-dark text-5xl">Portfolio Scanner</h1>
        <p className="font-form text-ink-mid mt-2 text-sm">
          Upload a CSV of up to 1,000 Bitcoin addresses. We&apos;ll classify
          each one for quantum exposure and generate a risk dashboard across
          three CRQC timeline scenarios.
        </p>
      </div>
      <PortfolioClient />
    </main>
  )
}
