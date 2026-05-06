import { BaggageTag } from '@/components/ui/BaggageTag'
import { RiskScoreToggle } from './RiskScoreToggle'
import { HighReuseBadge } from './HighReuseBadge'
import type { AddressResult } from '@/lib/api/resolve-address'

/** Props for {@link ExposedCard}. */
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
 * Result card shown when an address is classified as EXPOSED.
 *
 * Warns the user that their public key is visible on the Bitcoin blockchain,
 * making the private key derivable via Shor's algorithm once a sufficiently
 * powerful quantum computer (CRQC) exists. Renders distinct explanatory copy
 * for Taproot (P2TR) addresses — where the x-only pubkey is embedded in the
 * output script and is exposed from the moment funds arrive — versus legacy
 * spend-exposed addresses. Also shows balance, optional USD value, a
 * high-reuse warning, the three-scenario risk score, and urgent next steps.
 */
export function ExposedCard({ result }: Props) {
  // HIGH_REUSE signals the address appeared in 100+ transactions.
  const hasHighReuse = result.flags.includes('HIGH_REUSE')
  // P2TR (Taproot) addresses embed the x-only public key directly in the
  // output script, so exposure begins at first receipt — no spend required.
  const isP2tr = result.type === 'P2TR'

  return (
    <BaggageTag
      variant="exposed"
      destination="Exposed"
      subLabel="Quantum Risk"
      badge="Priority"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-stamp text-tag-exposed text-2xl leading-none">
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

        {isP2tr ? (
          <p className="font-form text-ink-mid text-xs leading-relaxed">
            This is a Taproot (P2TR) address. The x-only public key is embedded
            in the output script and is visible on-chain from the moment funds
            were received — no spend required for exposure.
          </p>
        ) : (
          <p className="font-form text-ink-mid text-xs leading-relaxed">
            Your public key appeared on the Bitcoin blockchain
            {result.lastSpend ? ` on ${result.lastSpend}` : ''}. A sufficiently
            powerful quantum computer could derive your private key from this
            public key using Shor&apos;s algorithm.
          </p>
        )}

        <RiskScoreToggle scores={result.riskScore} />

        <div className="perforation font-form space-y-1.5 pt-3 text-xs">
          <p className="font-stamp text-ink-dark text-xs tracking-wider">
            What this means:
          </p>
          <ul className="space-y-1">
            <li className="text-tag-exposed flex gap-2">
              <span aria-hidden>✗</span>
              This address is NOT protected by hash commitments
            </li>
            <li className="text-tag-exposed flex gap-2">
              <span aria-hidden>✗</span>
              Once a CRQC exists, this private key can be computed in hours
            </li>
            <li className="text-tag-exposed flex gap-2">
              <span aria-hidden>✗</span>
              The &ldquo;turnstile&rdquo; migration does NOT apply here
            </li>
          </ul>
        </div>

        <div className="perforation font-form text-ink-mid space-y-1.5 pt-3 text-xs">
          <p className="font-stamp text-ink-dark text-xs tracking-wider">
            Next steps:
          </p>
          <ul className="space-y-1">
            <li>☐ Move funds to a new address never spent from</li>
            <li>☐ Never sign from the new address until migrating to PQC</li>
            <li>☐ Track the QBIP Phase A timeline — migrate before CRQC</li>
          </ul>
        </div>
      </div>
    </BaggageTag>
  )
}
