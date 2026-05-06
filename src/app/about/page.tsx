import type { Metadata } from 'next'
import Link from 'next/link'
import { GitFork, BookOpen, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — Bitcoin Quantum Exposure Scanner',
  description:
    'About the Bitcoin Quantum Exposure Scanner: motivation, methodology reference, open-source license, and author.',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-stamp text-ink-dark text-6xl">About</h1>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="font-stamp text-ink-dark border-tag-edge mb-4 border-b-2 border-dashed pb-1 text-2xl">
            Why This Tool Exists
          </h2>
          <p className="font-form text-ink-mid text-sm leading-relaxed">
            The Bitcoin ecosystem lacks a simple, public tool that surfaces{' '}
            <em>which specific addresses</em> are quantum-vulnerable — not just
            whether the threat is theoretical. Most quantum-risk discussions are
            abstract; this scanner makes them concrete by classifying each
            address against on-chain data.
          </p>
          <p className="font-form text-ink-mid mt-3 text-sm leading-relaxed">
            This project was built to support a Substack research series on
            Bitcoin&apos;s quantum transition. The goal is to give individual
            holders and institutional custodians the information they need to
            prioritize migration work before a cryptographically-relevant
            quantum computer (CRQC) arrives.
          </p>
        </section>

        <section>
          <h2 className="font-stamp text-ink-dark border-tag-edge mb-4 border-b-2 border-dashed pb-1 text-2xl">
            Methodology Reference
          </h2>
          <div className="bg-manila border-tag-edge rounded-xl border-2 p-4">
            <p className="font-form text-ink-dark text-sm leading-relaxed">
              Ray, A., Gautam, K., &amp; Ryan, M. (2026).{' '}
              <em>
                Quantum Threat Assessment for Public-Key Cryptographic
                Infrastructure.
              </em>{' '}
              Proceedings of the IEEE Symposium on Security and Privacy.
            </p>
            <p className="font-form text-ink-faint mt-2 text-xs leading-relaxed">
              The CRQC timeline scenarios and risk score formula in this tool
              are based on the framework formalized in this paper. This tool is
              independent research and is not endorsed by the paper&apos;s
              authors.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-stamp text-ink-dark border-tag-edge mb-4 border-b-2 border-dashed pb-1 text-2xl">
            Technical Stack
          </h2>
          <ul className="font-form text-ink-mid space-y-1.5 text-sm">
            {[
              'Next.js App Router · TypeScript · Tailwind CSS',
              'shadcn/ui components · Recharts for portfolio charts',
              'Papa Parse for CSV handling · bitcoin-address-validation for type detection',
              'mempool.space primary API · Blockstream Esplora fallback',
              'CoinGecko for BTC/USD price · Vercel KV for live counters',
              'Vitest + Testing Library · Playwright E2E',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-ink-faint select-none">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-stamp text-ink-dark border-tag-edge mb-4 border-b-2 border-dashed pb-1 text-2xl">
            Open Source
          </h2>
          <p className="font-form text-ink-mid text-sm leading-relaxed">
            This project is released under the MIT License. Contributions, bug
            reports, and pull requests are welcome.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="font-stamp border-tag-edge bg-manila text-ink-mid hover:text-ink-dark hover:border-ink-mid inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs tracking-wider transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitFork className="h-4 w-4" />
              View on GitHub
            </a>
            <Link
              href="/methodology"
              className="font-stamp border-tag-edge bg-manila text-ink-mid hover:text-ink-dark hover:border-ink-mid inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs tracking-wider transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Read the Methodology
            </Link>
            <Link
              href="/scan"
              className="font-stamp bg-ink-dark text-parchment hover:bg-ink-mid inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs tracking-wider transition-colors"
            >
              <Tag className="h-4 w-4" />
              Scan an Address
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-stamp text-ink-dark border-tag-edge mb-4 border-b-2 border-dashed pb-1 text-2xl">
            Disclaimer
          </h2>
          <p className="font-form text-ink-mid text-xs leading-relaxed">
            This tool is provided for informational purposes only. It is not
            financial advice. Classifications and risk scores are based on
            publicly available on-chain data and probabilistic models of CRQC
            development timelines. No warranty is made regarding accuracy.
            Always verify critical decisions with a qualified security
            professional.
          </p>
          <p className="font-form text-ink-faint mt-3 text-xs tracking-wider">
            MIT License · Copyright 2026 Rahil Bhavan
          </p>
        </section>
      </div>
    </main>
  )
}
