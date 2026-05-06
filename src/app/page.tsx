import type { Metadata } from 'next'
import Link from 'next/link'
import { GitFork } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { BaggageTag } from '@/components/ui/BaggageTag'
import { LiveCounter } from '@/components/marketing/LiveCounter'
import { readCounters } from '@/lib/kv/counters'
import { env } from '@/config/env'
import { GITHUB_URL } from '@/config/site'

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

/**
 * Homepage — `/`
 *
 * Marketing landing page for the Bitcoin Quantum Exposure Scanner. Rendered
 * as a Next.js Async Server Component and ISR-revalidated every 30 seconds so
 * the live counter stays fresh without sacrificing static delivery.
 *
 * ### Sections
 * 1. **Hero** — headline `BaggageTag` with CTAs to `/scan` and `/portfolio`,
 *    and a GitHub open-source link sourced from `GITHUB_URL`.
 * 2. **Departure Board** — animated `LiveCounter` showing aggregate scan
 *    totals pulled from Vercel KV. Only rendered when
 *    `NEXT_PUBLIC_LIVE_COUNTER_ENABLED` is `true` and `getCounters()` returns
 *    data.
 * 3. **How It Works** — three `BaggageTag` explainer panels covering the
 *    quantum threat, address coverage, and risk scoring methodology.
 * 4. **Bottom CTA** — repeat call-to-action linking to `/scan`, `/portfolio`,
 *    and `/methodology`.
 *
 * @remarks
 * Open Graph metadata is set at module level via the exported `metadata`
 * object. The canonical URL is sourced from `env.NEXT_PUBLIC_CANONICAL_URL`.
 */
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
            <p className="font-form text-ink-mid mb-6 text-sm leading-relaxed">
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
                  'font-stamp border-dashed tracking-wider'
                )}
              >
                Scan Portfolio
              </Link>
            </div>
            <div className="mt-4">
              <a
                href={GITHUB_URL}
                className="font-form text-ink-faint hover:text-ink-mid inline-flex items-center gap-1.5 text-xs transition-colors"
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
            <h2 className="font-stamp text-ink-faint mb-6 text-center text-sm tracking-[0.25em]">
              Departure Board
            </h2>
            <LiveCounter counters={counters} />
          </div>
        </section>
      )}

      {/* Explainer panels */}
      <section className="perforation py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="font-stamp text-ink-dark mb-10 text-center text-4xl">
            How It Works
          </h2>
          <div className="grid justify-items-center gap-8 sm:grid-cols-3">
            {EXPLAINER_TAGS.map((tag) => (
              <BaggageTag
                key={tag.destination}
                variant={tag.variant}
                destination={tag.destination}
                subLabel={tag.subLabel}
                size="sm"
              >
                <p className="font-form text-ink-mid text-xs leading-relaxed">
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
          <h2 className="font-stamp text-ink-dark text-4xl">
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
                'font-stamp border-dashed tracking-wider'
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
