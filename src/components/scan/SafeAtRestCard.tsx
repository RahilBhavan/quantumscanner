import { BaggageTag } from '@/components/ui/BaggageTag'
import { RiskScoreToggle } from './RiskScoreToggle'
import { HighReuseBadge } from './HighReuseBadge'
import type { AddressResult } from '@/lib/api/resolve-address'

/** Props for {@link SafeAtRestCard}. */
interface Props {
  /** The resolved scan result for the address being displayed. */
  result: AddressResult
}

/**
 * Formats a BTC amount with 4–8 decimal places using the user's locale
 * conventions for digit grouping.
 */
function formatBtc(btc: number) {
  return btc.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  })
}

/**
 * Formats a USD amount as a locale-aware currency string with no decimal
 * places (whole dollars only).
 */
function formatUsd(usd: number) {
  return usd.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

/**
 * Result card shown when an address is classified as SAFE_AT_REST.
 *
 * Explains to the user that their public key has never appeared on-chain,
 * so a quantum computer cannot extract the private key from the address
 * alone. Displays the current BTC balance, optional USD equivalent, a
 * high-reuse warning badge when applicable, a P2SH ambiguity notice when
 * relevant, the three-scenario risk score toggle, and actionable next steps.
 */
export function SafeAtRestCard({ result }: Props) {
  // HIGH_REUSE flag means the address has been used in 100+ transactions,
  // which increases on-chain footprint and makes metadata correlation easier.
  const hasHighReuse = result.flags.includes('HIGH_REUSE')
  // P2SH_AMBIGUOUS indicates the address wraps an unknown script type;
  // multisig or non-standard scripts may have different exposure characteristics.
  const hasP2shNote = result.notes.includes('P2SH_AMBIGUOUS')

  return (
    <BaggageTag variant="safe" destination="Safe" subLabel="Safe at Rest">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-stamp text-tag-safe text-2xl leading-none">
              {formatBtc(result.balanceBtc)} BTC
            </p>
            {result.balanceUsd !== null && (
              <p className="font-form text-ink-faint mt-0.5 text-xs">
                {formatUsd(result.balanceUsd)}
              </p>
            )}
          </div>
          {hasHighReuse && <HighReuseBadge />}
        </div>

        <p className="font-form text-ink-dark border-tag-edge/40 truncate border-b border-dashed pb-2 text-xs">
          {result.address}
        </p>

        <p className="font-form text-ink-mid text-xs leading-relaxed">
          Your public key has never appeared on the Bitcoin blockchain. A
          quantum computer cannot extract your private key from your address
          alone. Your funds are protected by hash preimage resistance.
        </p>

        {hasP2shNote && (
          <p className="font-form text-ink-mid border-tag-error/40 bg-tag-error-bg rounded border p-2 text-xs leading-relaxed">
            Note: This is a P2SH address. If it wraps a multisig or non-standard
            script, exposure classification may differ. See{' '}
            <a href="/methodology" className="underline">
              methodology
            </a>
            .
          </p>
        )}

        <RiskScoreToggle scores={result.riskScore} />

        <div className="perforation font-form space-y-1.5 pt-3 text-xs">
          <p className="font-stamp text-ink-dark text-xs tracking-wider">
            What this means:
          </p>
          <ul className="text-ink-mid space-y-1">
            <li className="flex gap-2">
              <span aria-hidden className="text-tag-safe">
                ✓
              </span>
              Funds are currently safe from quantum attack
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-tag-safe">
                ✓
              </span>
              Turnstile migration can recover coins without exposing your key
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-tag-error">
                ⚠
              </span>
              Do not spend before migrating to a post-quantum scheme
            </li>
          </ul>
        </div>

        <div className="perforation font-form text-ink-mid space-y-1.5 pt-3 text-xs">
          <p className="font-stamp text-ink-dark text-xs tracking-wider">
            Next steps:
          </p>
          <ul className="space-y-1">
            <li>☐ Monitor BIP-360 and QBIP Phase A activation</li>
            <li>☐ Ensure your seed phrase is backed up securely</li>
            <li>☐ Do not reuse this address</li>
          </ul>
        </div>
      </div>
    </BaggageTag>
  )
}
