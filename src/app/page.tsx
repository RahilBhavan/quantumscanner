import type { Metadata } from 'next'
import Link from 'next/link'
import { GitFork } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { BaggageTag } from '@/components/ui/BaggageTag'
import { LiveCounter } from '@/components/marketing/LiveCounter'
import { readCounters } from '@/lib/kv/counters'
import { env } from '@/config/env'

export const metadata: Metadata = {
  title: 'Bitcoin Quantum Exposure Scanner',
  description:
    'Free, open-source tool to check whether your Bitcoin addresses are vulnerable to future quantum computers. Identify P2PKH, P2SH, and P2TR exposure before CRQC threats arrive.',
  openGraph: {
    title: 'Bitcoin Quantum Exposure Scanner',
    description:
      'Check your Bitcoin addresses for quantum computer vulnerability.',
    url: env.NEXT_PUBLIC_CANONICAL_URL,
    type: 'website',
  },
}

export const revalidate = 30

async function getCounters() {
  if (!env.NEXT_PUBLIC_LIVE_COUNTER_ENABLED) return null
  return readCounters()
}

const EXPLAINER_TAGS = [
  {
    variant: 'exposed' as const,
    destination: 'Threat',
    subLabel: 'Quantum Risk',
    body: "A cryptographically-relevant quantum computer (CRQC) running Shor's algorithm could derive a Bitcoin private key from any exposed public key in hours. Addresses that have ever signed a transaction have their public key on-chain — permanently.",
  },
  {
    variant: 'safe' as const,
    destination: 'Coverage',
    subLabel: 'What We Check',
    body: 'We classify each address by type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), look up its transaction history on-chain, and determine whether the public key has been revealed. Addresses with non-zero balance and an exposed pubkey are flagged EXPOSED.',
  },
  {
    variant: 'empty' as const,
    destination: 'Scoring',
    subLabel: 'How Risk Is Rated',
    body: 'Our risk formula — based on the framework from Ray, Gautam & Ryan (2026) — weights your exposure ratio against three CRQC timeline scenarios: Conservative (2040+), Base (2033–37), and Aggressive (2029–32). No personal data is stored.',
  },
]

export default async function HomePage() {
  const counters = await getCounters()

  return (
    <main className="bg-parchment">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto max-w-xl px-4">
          <BaggageTag
            variant="neutral"
            destination="Bitcoin Quantum"
            subLabel="Exposure Scanner"
            size="lg"
          >
            <p className="font-form text-ink-mid text-sm leading-relaxed mb-6">
              Enter a Bitcoin address or upload a portfolio CSV to instantly
              check quantum exposure risk — free, open-source, no sign-up
              required.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/scan"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'font-stamp tracking-wider'
                )}
              >
                Issue Scan Tag →
              </Link>
              <Link
                href="/portfolio"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'font-stamp tracking-wider border-dashed'
                )}
              >
                Scan Portfolio
              </Link>
            </div>
            <div className="mt-4">
              <a
                href="https://github.com/rahil1206/quantum-scanner"
                className="font-form inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-mid transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitFork className="h-3.5 w-3.5" />
                Open source on GitHub
              </a>
            </div>
          </BaggageTag>
        </div>
      </section>

      {/* Live counter — Departure Board */}
      {counters && (
        <section className="bg-aged perforation py-10">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="font-stamp text-sm text-ink-faint tracking-[0.25em] text-center mb-6">
              Departure Board
            </h2>
            <LiveCounter counters={counters} />
          </div>
        </section>
      )}

      {/* Explainer panels */}
      <section className="py-16 perforation">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="font-stamp text-4xl text-center text-ink-dark mb-10">
            How It Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3 justify-items-center">
            {EXPLAINER_TAGS.map((tag) => (
              <BaggageTag
                key={tag.destination}
                variant={tag.variant}
                destination={tag.destination}
                subLabel={tag.subLabel}
                size="sm"
              >
                <p className="font-form text-xs text-ink-mid leading-relaxed">
                  {tag.body}
                </p>
              </BaggageTag>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-manila perforation py-16 text-center">
        <div className="container mx-auto max-w-xl px-4">
          <h2 className="font-stamp text-4xl text-ink-dark">
            Ready to check your addresses?
          </h2>
          <p className="font-form text-ink-mid mt-2 text-sm">
            No account needed. Results are computed on demand and never stored.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/scan"
              className={cn(buttonVariants(), 'font-stamp tracking-wider')}
            >
              Scan a Single Address
            </Link>
            <Link
              href="/portfolio"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'font-stamp tracking-wider border-dashed'
              )}
            >
              Upload Portfolio CSV
            </Link>
            <Link
              href="/methodology"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'font-stamp tracking-wider'
              )}
            >
              Read the Methodology
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
