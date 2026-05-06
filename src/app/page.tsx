import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, AlertTriangle, BookOpen, GitFork } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { LiveCounter } from '@/components/marketing/LiveCounter'
import { readCounters } from '@/lib/kv/counters'
import { env } from '@/config/env'

export const metadata: Metadata = {
  title: 'Bitcoin Quantum Exposure Scanner',
  description:
    'Free, open-source tool to check whether your Bitcoin addresses are vulnerable to future quantum computers. Identify P2PKH, P2SH, and P2TR exposure before CRQC threats arrive.',
  openGraph: {
    title: 'Bitcoin Quantum Exposure Scanner',
    description: 'Check your Bitcoin addresses for quantum computer vulnerability.',
    url: env.NEXT_PUBLIC_CANONICAL_URL,
    type: 'website',
  },
}

export const revalidate = 30

async function getCounters() {
  if (!env.NEXT_PUBLIC_LIVE_COUNTER_ENABLED) return null
  return readCounters()
}

const EXPLAINER_PANELS = [
  {
    icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
    title: 'The Quantum Threat',
    body: "A cryptographically-relevant quantum computer (CRQC) running Shor's algorithm could derive a Bitcoin private key from any exposed public key in hours. Addresses that have ever signed a transaction have exposed their public key on-chain — permanently.",
  },
  {
    icon: <Shield className="h-6 w-6 text-emerald-500" />,
    title: 'What We Check',
    body: 'We classify each address by type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), look up its transaction history on-chain, and determine whether the public key has been revealed. Addresses with non-zero balance and an exposed pubkey are flagged EXPOSED.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    title: 'How Risk Is Scored',
    body: 'Our risk formula — based on the framework from Ray, Gautam & Ryan (2026) — weights your exposure ratio against three CRQC timeline scenarios: Conservative (2040+), Base (2033–37), and Aggressive (2029–32). No personal data is stored.',
  },
]

export default async function HomePage() {
  const counters = await getCounters()

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-20 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Is Your Bitcoin Safe from Quantum Computers?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Enter a Bitcoin address or upload a portfolio CSV to instantly check quantum exposure
            risk — free, open-source, and no sign-up required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/scan" className={cn(buttonVariants({ size: 'lg' }))}>
              Scan an Address
            </Link>
            <Link href="/portfolio" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Scan Portfolio CSV
            </Link>
          </div>
          <div className="mt-4">
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitFork className="h-4 w-4" />
              Open source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Live counter */}
      {counters && (
        <section className="py-10">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Live Scan Statistics
            </h2>
            <LiveCounter counters={counters} />
          </div>
        </section>
      )}

      {/* Explainer panels */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {EXPLAINER_PANELS.map(panel => (
              <div key={panel.title} className="rounded-xl border bg-card p-6">
                <div className="mb-3">{panel.icon}</div>
                <h3 className="mb-2 font-semibold">{panel.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{panel.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t py-16 text-center">
        <div className="container mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold">Ready to check your addresses?</h2>
          <p className="mt-2 text-muted-foreground">
            No account needed. Results are computed on demand and never stored.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/scan" className={cn(buttonVariants())}>
              Scan a Single Address
            </Link>
            <Link href="/portfolio" className={cn(buttonVariants({ variant: 'outline' }))}>
              Upload Portfolio CSV
            </Link>
            <Link href="/methodology" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Read the Methodology
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
