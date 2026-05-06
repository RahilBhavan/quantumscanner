import { ScanForm } from '@/components/scan/ScanForm'
import { LimitationsFooter } from '@/components/shared/LimitationsFooter'

export const metadata = {
  title: 'Scan Address — Bitcoin Quantum Exposure Scanner',
  description:
    'Check if your Bitcoin address is vulnerable to a quantum computer. Free, open-source, no data stored.',
}

/**
 * Scan page — `/scan`
 *
 * Statically rendered shell page that hosts the `ScanForm` client component.
 * The page itself performs no data fetching; all blockchain I/O is triggered
 * client-side through `ScanForm` calling `GET /api/v1/address/[address]`.
 *
 * ### Layout
 * - Heading and subtitle introducing the single-address scan workflow.
 * - `ScanForm` — controlled input + submit, renders result cards inline
 *   (`ExposedCard`, `SafeAtRestCard`, `EmptyCard`, `UnresolvableCard`).
 * - `LimitationsFooter` — disclaimer about P2SH ambiguity and data sources.
 *
 * @remarks
 * Static metadata is exported for SEO. The `loading.tsx` sibling provides a
 * skeleton placeholder and `error.tsx` provides the error boundary, both
 * handled automatically by the Next.js App Router.
 */
export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-stamp text-ink-dark mb-1 text-5xl">Issue Scan Tag</h1>
      <p className="font-form text-ink-mid mb-8 text-sm">
        Enter any mainnet Bitcoin address to check its quantum exposure
        classification, current balance, and CRQC risk score.
      </p>
      <ScanForm />
      <LimitationsFooter />
    </main>
  )
}
