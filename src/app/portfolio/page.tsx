import type { Metadata } from 'next'
import { PortfolioClient } from './PortfolioClient'

export const metadata: Metadata = {
  title: 'Portfolio Scanner — Bitcoin Quantum Exposure Scanner',
  description:
    'Upload a CSV of Bitcoin addresses to scan your entire portfolio for quantum exposure risk. Identify which addresses need immediate migration.',
}

export default function PortfolioPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Scanner</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a CSV of up to 1,000 Bitcoin addresses. We&apos;ll classify each one for quantum
          exposure and generate a risk dashboard across three CRQC timeline scenarios.
        </p>
      </div>
      <PortfolioClient />
    </main>
  )
}
