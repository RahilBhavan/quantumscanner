import type { Metadata } from 'next'
import Link from 'next/link'
import { CRQC_SCENARIOS } from '@/lib/risk/scenarios'
import { RISK_BANDS } from '@/lib/risk/config'

export const metadata: Metadata = {
  title: 'Methodology — Bitcoin Quantum Exposure Scanner',
  description:
    'How we classify Bitcoin addresses for quantum exposure, compute risk scores, and map results to recommended actions.',
}

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'classification', label: '2. Address Classification' },
  { id: 'exposure', label: '3. Pubkey Exposure Logic' },
  { id: 'risk-formula', label: '4. Risk Score Formula' },
  { id: 'scenarios', label: '5. CRQC Timeline Scenarios' },
  { id: 'recommended-actions', label: '6. Recommended Actions' },
  { id: 'data-sources', label: '7. Data Sources & Privacy' },
]

export default function MethodologyPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Methodology</h1>
      <p className="mt-2 text-muted-foreground">
        Last updated: May 2026 · Based on the framework from{' '}
        <em>Ray, Gautam &amp; Ryan (2026)</em>
      </p>

      {/* Table of contents */}
      <nav aria-label="Table of contents" className="my-8 rounded-lg border p-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contents
        </p>
        <ol className="space-y-1">
          {TOC.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-primary hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
        {/* 1 */}
        <section id="overview">
          <h2 className="text-2xl font-bold">1. Overview</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Bitcoin addresses rely on either elliptic-curve cryptography (ECDSA) or Schnorr
            signatures to authorize spending. A sufficiently powerful quantum computer running
            Shor&apos;s algorithm can derive the private key from a public key in polynomial
            time. This scanner determines whether each address has revealed its public key
            on-chain and, if so, how urgently funds should be migrated under three possible
            CRQC arrival timelines.
          </p>
        </section>

        {/* 2 */}
        <section id="classification">
          <h2 className="text-2xl font-bold">2. Address Classification</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We detect address type using the{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">
              bitcoin-address-validation
            </code>{' '}
            library, mapped to the following types:
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Prefix / Pattern</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Pubkey exposed when spent?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1…', 'P2PKH', 'Yes — ECDSA signature reveals full public key'],
                  ['3…', 'P2SH', 'Ambiguous — depends on redeem script (P2SH-P2WPKH exposes; multisig may not)'],
                  ['bc1q… (20 byte)', 'P2WPKH', 'Yes — SegWit v0, pubkey revealed in witness'],
                  ['bc1q… (32 byte)', 'P2WSH', 'Script-dependent; treated as ambiguous (P2SH_AMBIGUOUS note)'],
                  ['bc1p…', 'P2TR', 'Key path spends expose the key; classified EXPOSED automatically'],
                  ['Pay-to-PubKey', 'P2PK', 'Always exposed — pubkey in scriptPubKey'],
                ].map(([pattern, type, note]) => (
                  <tr key={type} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{pattern}</td>
                    <td className="px-4 py-2 font-semibold">{type}</td>
                    <td className="px-4 py-2 text-muted-foreground">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Each address is then classified as <strong>SAFE_AT_REST</strong>,{' '}
            <strong>EXPOSED</strong>, <strong>EMPTY</strong>, or{' '}
            <strong>UNRESOLVABLE</strong> based on the logic in §3.
          </p>
        </section>

        {/* 3 */}
        <section id="exposure">
          <h2 className="text-2xl font-bold">3. Pubkey Exposure Logic</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            An address is classified <strong>EXPOSED</strong> when its public key is knowable
            by an adversary. The truth table:
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Condition</th>
                  <th className="px-4 py-2 text-left font-semibold">Classification</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['P2TR or P2PK, balance > 0', 'EXPOSED', 'MIGRATE_IMMEDIATELY'],
                  ['P2TR or P2PK, balance = 0', 'EMPTY (exposed)', 'MONITOR'],
                  ['Any type, has outgoing tx, balance > 0', 'EXPOSED', 'MIGRATE_IMMEDIATELY'],
                  ['Any type, no outgoing tx, balance > 0', 'SAFE_AT_REST', 'NO_ACTION_NEEDED'],
                  ['Any type, no outgoing tx, balance = 0', 'EMPTY', 'NO_ACTION_NEEDED'],
                  ['UNKNOWN type', 'UNRESOLVABLE', 'MANUAL_REVIEW'],
                  ['txCount > 100 (any)', '+ HIGH_REUSE flag', 'Consider consolidation'],
                ].map(([cond, cls, action]) => (
                  <tr key={cond} className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">{cond}</td>
                    <td className="px-4 py-2 font-semibold font-mono text-xs">{cls}</td>
                    <td className="px-4 py-2">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 */}
        <section id="risk-formula">
          <h2 className="text-2xl font-bold">4. Risk Score Formula</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The risk score (0–100) for each CRQC scenario is computed as:
          </p>
          <div className="my-4 rounded-lg border bg-muted/30 p-4 font-mono text-sm">
            score = clamp(exposureRatio × 100 × weight × (1 / yearsToMid)^0.5, 0, 100)
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Where:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li><strong>exposureRatio</strong> = exposedBtc / totalBtc</li>
            <li><strong>weight</strong> = scenario urgency weight (see §5)</li>
            <li><strong>yearsToMid</strong> = max(1, scenarioMidYear − currentYear)</li>
            <li>The square-root decay reflects diminishing marginal risk reduction as the threat recedes</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Risk bands: 0–24 LOW · 25–49 MODERATE · 50–74 HIGH · 75–100 CRITICAL
          </p>
        </section>

        {/* 5 */}
        <section id="scenarios">
          <h2 className="text-2xl font-bold">5. CRQC Timeline Scenarios</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We model three CRQC arrival scenarios derived from the GRI 2024 quantum threat
            ranges as formalized in Ray, Gautam &amp; Ryan (2026). We make no claim of endorsement
            by the paper&apos;s authors.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {CRQC_SCENARIOS.map(s => (
              <div key={s.id} className="rounded-lg border p-4">
                <p className="font-semibold">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.windowLabel}</p>
                <p className="mt-2 text-xs text-muted-foreground">Mid-year: {s.crqcMidYear}</p>
                <p className="text-xs text-muted-foreground">Weight: {s.weight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 */}
        <section id="recommended-actions">
          <h2 className="text-2xl font-bold">6. Recommended Actions</h2>
          <div className="mt-4 space-y-3">
            {[
              ['MIGRATE_IMMEDIATELY', 'red', 'Move funds to a quantum-resistant address type (P2WPKH or P2TR key-path-only used once). The pubkey is on-chain and the balance is non-zero.'],
              ['MONITOR', 'amber', 'The pubkey is exposed but the address currently holds zero balance. Set up alerts for any incoming transactions.'],
              ['NO_ACTION_NEEDED', 'emerald', 'The pubkey has never been revealed. No quantum risk today; continue monitoring as CRQC timelines evolve.'],
              ['MANUAL_REVIEW', 'slate', 'Address type is ambiguous (complex P2SH script) or could not be resolved. Investigate manually.'],
            ].map(([action, color, desc]) => (
              <div key={action} className="rounded-lg border p-4">
                <p className={`font-mono text-sm font-semibold text-${color}-600 dark:text-${color}-400`}>
                  {action}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7 */}
        <section id="data-sources">
          <h2 className="text-2xl font-bold">7. Data Sources &amp; Privacy</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            On-chain data is fetched from{' '}
            <strong>mempool.space</strong> (primary) with automatic fallback to{' '}
            <strong>Blockstream Esplora</strong> on 429 or 5xx responses. BTC/USD price is
            fetched from CoinGecko and cached in-process for 60 seconds.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            <strong>Privacy:</strong> No addresses, results, or user identifiers are persisted.
            The optional live counter stores only two aggregate integers
            (<em>total_btc_scanned</em> and <em>exposed_btc_scanned</em>) in Vercel KV.
            No personal data is transmitted or stored.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The scanner is{' '}
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              fully open-source (MIT)
            </a>
            . You can run it locally against your own mempool node.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-8 text-center">
        <p className="text-muted-foreground">Ready to scan?</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/scan"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Scan an Address
          </Link>
          <Link
            href="/about"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            About this Project
          </Link>
        </div>
      </div>
    </main>
  )
}
