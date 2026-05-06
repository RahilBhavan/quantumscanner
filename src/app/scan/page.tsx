import { ScanForm } from '@/components/scan/ScanForm'
import { LimitationsFooter } from '@/components/shared/LimitationsFooter'

export const metadata = {
  title: 'Scan Address — Bitcoin Quantum Exposure Scanner',
  description:
    'Check if your Bitcoin address is vulnerable to a quantum computer. Free, open-source, no data stored.',
}

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Scan a Bitcoin address
      </h1>
      <p className="text-muted-foreground mb-8">
        Enter any mainnet Bitcoin address to check its quantum exposure
        classification, current balance, and CRQC risk score.
      </p>
      <ScanForm />
      <LimitationsFooter />
    </main>
  )
}
