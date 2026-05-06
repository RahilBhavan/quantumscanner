import { ScanForm } from '@/components/scan/ScanForm'
import { LimitationsFooter } from '@/components/shared/LimitationsFooter'

// searchParams vary per request — opt out of static generation so
// shareable /scan?address=... links pre-populate correctly.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Scan Address — Bitcoin Quantum Exposure Scanner',
  description:
    'Check if your Bitcoin address is vulnerable to a quantum computer. Free, open-source, no data stored.',
}

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>
}) {
  const { address } = await searchParams
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-stamp text-ink-dark mb-1 text-5xl">Issue Scan Tag</h1>
      <p className="font-form text-ink-mid mb-8 text-sm">
        Enter any mainnet Bitcoin address to check its quantum exposure
        classification, current balance, and CRQC risk score.
      </p>
      <ScanForm initialAddress={address} />
      <LimitationsFooter />
    </main>
  )
}
