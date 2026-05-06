import type { Metadata } from 'next'
import Link from 'next/link'
import { GitFork, BookOpen, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — Bitcoin Quantum Exposure Scanner',
  description:
    'About the Bitcoin Quantum Exposure Scanner: motivation, methodology reference, open-source license, and author.',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Why This Tool Exists</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The Bitcoin ecosystem lacks a simple, public tool that surfaces <em>which specific
            addresses</em> are quantum-vulnerable — not just whether the threat is theoretical.
            Most quantum-risk discussions are abstract; this scanner makes them concrete by
            classifying each address against on-chain data.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            This project was built to support a Substack research series on Bitcoin&apos;s
            quantum transition. The goal is to give individual holders and institutional custodians
            the information they need to prioritize migration work before a cryptographically-relevant
            quantum computer (CRQC) arrives.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Methodology Reference</h2>
          <div className="mt-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Ray, A., Gautam, K., &amp; Ryan, M. (2026).{' '}
              <em>Quantum Threat Assessment for Public-Key Cryptographic Infrastructure.</em>{' '}
              Proceedings of the IEEE Symposium on Security and Privacy.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The CRQC timeline scenarios and risk score formula in this tool are based on the
              framework formalized in this paper. This tool is independent research and is not
              endorsed by the paper&apos;s authors.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Technical Stack</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Next.js App Router · TypeScript · Tailwind CSS</li>
            <li>shadcn/ui components · Recharts for portfolio charts</li>
            <li>Papa Parse for CSV handling · bitcoin-address-validation for type detection</li>
            <li>mempool.space primary API · Blockstream Esplora fallback</li>
            <li>CoinGecko for BTC/USD price · Vercel KV for live counters</li>
            <li>Vitest + Testing Library (91 unit tests, ≥80% coverage) · Playwright E2E</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Open Source</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            This project is released under the MIT License. Contributions, bug reports, and
            pull requests are welcome.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitFork className="h-4 w-4" />
              View on GitHub
            </a>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              Read the Methodology
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              <Shield className="h-4 w-4" />
              Scan an Address
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Disclaimer</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            This tool is provided for informational purposes only. It is not financial advice.
            Classifications and risk scores are based on publicly available on-chain data and
            probabilistic models of CRQC development timelines. No warranty is made regarding
            accuracy. Always verify critical decisions with a qualified security professional.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            MIT License · Copyright 2026 Rahil Bhavan
          </p>
        </section>
      </div>
    </main>
  )
}
