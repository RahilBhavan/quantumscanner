import type { Metadata } from 'next'
import Link from 'next/link'
import { CRQC_SCENARIOS } from '@/lib/risk/scenarios'
import { BaggageTag, type TagVariant } from '@/components/ui/BaggageTag'

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

const RECOMMENDED_ACTIONS: {
  action: string
  variant: TagVariant
  desc: string
}[] = [
  {
    action: 'MIGRATE_IMMEDIATELY',
    variant: 'exposed',
    desc: 'Move funds to a quantum-resistant address type (P2WPKH or P2TR key-path-only used once). The pubkey is on-chain and the balance is non-zero.',
  },
  {
    action: 'MONITOR',
    variant: 'error',
    desc: 'The pubkey is exposed but the address currently holds zero balance. Set up alerts for any incoming transactions.',
  },
  {
    action: 'NO_ACTION_NEEDED',
    variant: 'safe',
    desc: 'The pubkey has never been revealed. No quantum risk today; continue monitoring as CRQC timelines evolve.',
  },
  {
    action: 'MANUAL_REVIEW',
    variant: 'empty',
    desc: 'Address type is ambiguous (complex P2SH script) or could not be resolved. Investigate manually.',
  },
]

const SCENARIO_VARIANTS: TagVariant[] = ['empty', 'error', 'exposed']

/**
 * Methodology page — `/methodology`
 *
 * Statically rendered long-form documentation page explaining how the scanner
 * classifies addresses, computes risk scores, and derives recommended actions.
 * All content is hard-coded; no data fetching occurs at render time.
 *
 * ### Sections (table of contents)
 * 1. **Overview** — explains the ECDSA/Schnorr vulnerability and Shor's
 *    algorithm threat model.
 * 2. **Address Classification** — maps Bitcoin address prefixes (P2PKH, P2SH,
 *    P2WPKH, P2WSH, P2TR, P2PK) to their pubkey exposure behaviour.
 * 3. **Pubkey Exposure Logic** — truth table mapping address type × transaction
 *    history × balance to a `classification` and `recommendedAction`.
 * 4. **Risk Score Formula** — documents the
 *    `clamp(exposureRatio × 100 × weight × (1/yearsToMid)^0.5, 0, 100)` formula
 *    and its risk bands (LOW / MODERATE / HIGH / CRITICAL).
 * 5. **CRQC Timeline Scenarios** — displays the three scenarios
 *    (Conservative / Base / Aggressive) sourced from `CRQC_SCENARIOS`.
 * 6. **Recommended Actions** — explains `MIGRATE_IMMEDIATELY`, `MONITOR`,
 *    `NO_ACTION_NEEDED`, and `MANUAL_REVIEW`.
 * 7. **Data Sources & Privacy** — documents mempool.space + Blockstream Esplora
 *    fallback, CoinGecko price feed, and the no-persistence privacy model.
 *
 * @remarks
 * Scenario cards are rendered from the `CRQC_SCENARIOS` constant so the page
 * automatically reflects any changes to scenario definitions. The methodology
 * reference is Ray, Gautam & Ryan (2026); this tool is independent and not
 * endorsed by the paper's authors.
 */
export default function MethodologyPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-stamp text-ink-dark text-6xl">Methodology</h1>
      <p className="font-form text-ink-faint mt-1 text-xs tracking-wider">
        Last updated: May 2026 · Based on the framework from{' '}
        <em>Ray, Gautam &amp; Ryan (2026)</em>
      </p>

      {/* Table of contents */}
      <nav
        aria-label="Table of contents"
        className="border-tag-edge bg-manila my-8 rounded-xl border-2 p-5"
      >
        <p className="font-stamp text-ink-faint mb-3 text-xs tracking-[0.2em]">
          Contents
        </p>
        <ol className="space-y-1.5">
          {TOC.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="font-form text-ink-mid hover:text-ink-dark text-sm underline transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12">
        {/* 1 */}
        <section id="overview">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            1. Overview
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            Bitcoin addresses rely on either elliptic-curve cryptography (ECDSA)
            or Schnorr signatures to authorize spending. A sufficiently powerful
            quantum computer running Shor&apos;s algorithm can derive the
            private key from a public key in polynomial time. This scanner
            determines whether each address has revealed its public key on-chain
            and, if so, how urgently funds should be migrated under three
            possible CRQC arrival timelines.
          </p>
        </section>

        {/* 2 */}
        <section id="classification">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            2. Address Classification
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            We detect address type using the{' '}
            <code className="font-form bg-manila border-tag-edge rounded border px-1.5 py-0.5 text-xs">
              bitcoin-address-validation
            </code>{' '}
            library, mapped to the following types:
          </p>
          <div className="border-tag-edge mt-4 overflow-x-auto rounded-xl border-2">
            <table className="w-full text-sm">
              <thead className="bg-manila">
                <tr className="perforation-b">
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Prefix / Pattern
                  </th>
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Type
                  </th>
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Pubkey exposed when spent?
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    '1…',
                    'P2PKH',
                    'Yes — ECDSA signature reveals full public key',
                  ],
                  ['3…', 'P2SH', 'Ambiguous — depends on redeem script'],
                  [
                    'bc1q… (20 byte)',
                    'P2WPKH',
                    'Yes — SegWit v0, pubkey in witness',
                  ],
                  [
                    'bc1q… (32 byte)',
                    'P2WSH',
                    'Script-dependent; treated as ambiguous',
                  ],
                  [
                    'bc1p…',
                    'P2TR',
                    'Key path spends expose the key; EXPOSED automatically',
                  ],
                  [
                    'Pay-to-PubKey',
                    'P2PK',
                    'Always exposed — pubkey in scriptPubKey',
                  ],
                ].map(([pattern, type, note]) => (
                  <tr
                    key={type}
                    className="border-tag-edge/30 hover:bg-manila/60 border-t"
                  >
                    <td className="font-form text-ink-dark px-4 py-2.5 font-mono text-xs">
                      {pattern}
                    </td>
                    <td className="font-stamp text-ink-dark px-4 py-2.5 text-sm">
                      {type}
                    </td>
                    <td className="font-form text-ink-mid px-4 py-2.5 text-xs">
                      {note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-form text-ink-mid mt-3 text-xs">
            Each address is then classified as <strong>SAFE_AT_REST</strong>,{' '}
            <strong>EXPOSED</strong>, <strong>EMPTY</strong>, or{' '}
            <strong>UNRESOLVABLE</strong> based on the logic in §3.
          </p>
        </section>

        {/* 3 */}
        <section id="exposure">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            3. Pubkey Exposure Logic
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            An address is classified <strong>EXPOSED</strong> when its public
            key is knowable by an adversary. The truth table:
          </p>
          <div className="border-tag-edge mt-4 overflow-x-auto rounded-xl border-2">
            <table className="w-full text-sm">
              <thead className="bg-manila">
                <tr className="perforation-b">
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Condition
                  </th>
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Classification
                  </th>
                  <th className="font-stamp text-ink-faint px-4 py-2.5 text-left text-xs tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'P2TR or P2PK, balance > 0',
                    'EXPOSED',
                    'MIGRATE_IMMEDIATELY',
                  ],
                  ['P2TR or P2PK, balance = 0', 'EMPTY (exposed)', 'MONITOR'],
                  [
                    'Any type, has outgoing tx, balance > 0',
                    'EXPOSED',
                    'MIGRATE_IMMEDIATELY',
                  ],
                  [
                    'Any type, no outgoing tx, balance > 0',
                    'SAFE_AT_REST',
                    'NO_ACTION_NEEDED',
                  ],
                  [
                    'Any type, no outgoing tx, balance = 0',
                    'EMPTY',
                    'NO_ACTION_NEEDED',
                  ],
                  ['UNKNOWN type', 'UNRESOLVABLE', 'MANUAL_REVIEW'],
                  [
                    'txCount > 100 (any)',
                    '+ HIGH_REUSE flag',
                    'Consider consolidation',
                  ],
                ].map(([cond, cls, action]) => (
                  <tr
                    key={cond}
                    className="border-tag-edge/30 hover:bg-manila/60 border-t"
                  >
                    <td className="font-form text-ink-mid px-4 py-2.5 text-xs">
                      {cond}
                    </td>
                    <td className="font-form text-ink-dark px-4 py-2.5 font-mono text-xs font-semibold">
                      {cls}
                    </td>
                    <td className="font-form text-ink-mid px-4 py-2.5 text-xs">
                      {action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 */}
        <section id="risk-formula">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            4. Risk Score Formula
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            The risk score (0–100) for each CRQC scenario is computed as:
          </p>
          <div className="font-form bg-manila border-tag-edge text-ink-dark my-4 rounded-xl border-2 p-4 font-mono text-xs leading-relaxed">
            score = clamp(exposureRatio × 100 × weight × (1 / yearsToMid)^0.5,
            0, 100)
          </div>
          <p className="font-form text-ink-mid text-xs">Where:</p>
          <ul className="font-form text-ink-mid mt-2 list-none space-y-1.5 text-xs">
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span>
                <strong className="text-ink-dark">exposureRatio</strong> =
                exposedBtc / totalBtc
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span>
                <strong className="text-ink-dark">weight</strong> = scenario
                urgency weight (see §5)
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span>
                <strong className="text-ink-dark">yearsToMid</strong> = max(1,
                scenarioMidYear − currentYear)
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span>
                Square-root decay reflects diminishing marginal risk reduction
                as the threat recedes
              </span>
            </li>
          </ul>
          <p className="font-form text-ink-faint mt-4 text-xs tracking-wider">
            Risk bands: 0–24 LOW · 25–49 MODERATE · 50–74 HIGH · 75–100 CRITICAL
          </p>
        </section>

        {/* 5 */}
        <section id="scenarios">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            5. CRQC Timeline Scenarios
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            We model three CRQC arrival scenarios derived from the GRI 2024
            quantum threat ranges as formalized in Ray, Gautam &amp; Ryan
            (2026). We make no claim of endorsement by the paper&apos;s authors.
          </p>
          <div className="mt-6 grid justify-items-center gap-6 sm:grid-cols-3">
            {CRQC_SCENARIOS.map((s, i) => (
              <BaggageTag
                key={s.id}
                variant={SCENARIO_VARIANTS[i]}
                destination={s.label}
                subLabel={s.windowLabel}
                size="sm"
                showString={false}
                showHole={false}
              >
                <div className="font-form text-ink-mid space-y-1 text-xs">
                  <p>
                    Mid-year:{' '}
                    <strong className="text-ink-dark">{s.crqcMidYear}</strong>
                  </p>
                  <p>
                    Weight:{' '}
                    <strong className="text-ink-dark">{s.weight}</strong>
                  </p>
                </div>
              </BaggageTag>
            ))}
          </div>
        </section>

        {/* 6 */}
        <section id="recommended-actions">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            6. Recommended Actions
          </h2>
          <div className="mt-4 space-y-3">
            {RECOMMENDED_ACTIONS.map(({ action, variant, desc }) => (
              <div
                key={action}
                className="border-tag-edge bg-manila rounded-xl border-2 p-4"
              >
                <p
                  className={`font-stamp text-sm tracking-wider ${
                    variant === 'exposed'
                      ? 'text-tag-exposed'
                      : variant === 'error'
                        ? 'text-tag-error'
                        : variant === 'safe'
                          ? 'text-tag-safe'
                          : 'text-tag-empty'
                  }`}
                >
                  {action}
                </p>
                <p className="font-form text-ink-mid mt-1.5 text-xs leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7 */}
        <section id="data-sources">
          <h2 className="font-stamp text-ink-dark border-tag-edge border-b-2 border-dashed pb-1 text-3xl">
            7. Data Sources &amp; Privacy
          </h2>
          <p className="font-form text-ink-mid mt-4 text-sm leading-relaxed">
            On-chain data is fetched from{' '}
            <strong className="text-ink-dark">mempool.space</strong> (primary)
            with automatic fallback to{' '}
            <strong className="text-ink-dark">Blockstream Esplora</strong> on
            429 or 5xx responses. BTC/USD price is fetched from CoinGecko and
            cached in-process for 60 seconds.
          </p>
          <p className="font-form text-ink-mid mt-3 text-sm leading-relaxed">
            <strong className="text-ink-dark">Privacy:</strong> No addresses,
            results, or user identifiers are persisted. No personal data is
            transmitted or stored.
          </p>
          <p className="font-form text-ink-mid mt-3 text-sm leading-relaxed">
            The scanner is{' '}
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="hover:text-ink-dark underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              fully open-source (MIT)
            </a>
            . You can run it locally against your own mempool node.
          </p>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="perforation mt-12 pt-8 text-center">
        <p className="font-form text-ink-faint text-sm">Ready to scan?</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/scan"
            className="font-stamp bg-ink-dark text-parchment hover:bg-ink-mid rounded-lg px-4 py-2 text-sm tracking-wider transition-colors"
          >
            Scan an Address
          </Link>
          <Link
            href="/about"
            className="font-stamp border-tag-edge text-ink-mid hover:bg-manila rounded-lg border-2 px-4 py-2 text-sm tracking-wider transition-colors"
          >
            About this Project
          </Link>
        </div>
      </div>
    </main>
  )
}
