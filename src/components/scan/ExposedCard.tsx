import { BaggageTag } from '@/components/ui/BaggageTag'
import { RiskScoreToggle } from './RiskScoreToggle'
import { HighReuseBadge } from './HighReuseBadge'
import type { AddressResult } from '@/lib/api/resolve-address'

interface Props {
  result: AddressResult
}

function formatBtc(btc: number) {
  return btc.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  })
}

function formatUsd(usd: number) {
  return usd.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function ExposedCard({ result }: Props) {
  const hasHighReuse = result.flags.includes('HIGH_REUSE')
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
            <p className="font-stamp text-2xl text-tag-exposed leading-none">
              {formatBtc(result.balanceBtc)} BTC
            </p>
            {result.balanceUsd !== null && (
              <p className="font-form text-xs text-ink-faint mt-0.5">
                {formatUsd(result.balanceUsd)}
              </p>
            )}
          </div>
          {hasHighReuse && <HighReuseBadge />}
        </div>

        <p className="font-form text-xs text-ink-dark truncate border-b border-dashed border-tag-edge/40 pb-2">
          {result.address}
        </p>

        {isP2tr ? (
          <p className="font-form text-xs text-ink-mid leading-relaxed">
            This is a Taproot (P2TR) address. The x-only public key is embedded
            in the output script and is visible on-chain from the moment funds
            were received — no spend required for exposure.
          </p>
        ) : (
          <p className="font-form text-xs text-ink-mid leading-relaxed">
            Your public key appeared on the Bitcoin blockchain
            {result.lastSpend ? ` on ${result.lastSpend}` : ''}. A
            sufficiently powerful quantum computer could derive your private key
            from this public key using Shor&apos;s algorithm.
          </p>
        )}

        <RiskScoreToggle scores={result.riskScore} />

        <div className="space-y-1.5 perforation pt-3 text-xs font-form">
          <p className="font-stamp text-xs tracking-wider text-ink-dark">
            What this means:
          </p>
          <ul className="space-y-1">
            <li className="flex gap-2 text-tag-exposed">
              <span aria-hidden>✗</span>
              This address is NOT protected by hash commitments
            </li>
            <li className="flex gap-2 text-tag-exposed">
              <span aria-hidden>✗</span>
              Once a CRQC exists, this private key can be computed in hours
            </li>
            <li className="flex gap-2 text-tag-exposed">
              <span aria-hidden>✗</span>
              The &ldquo;turnstile&rdquo; migration does NOT apply here
            </li>
          </ul>
        </div>

        <div className="space-y-1.5 perforation pt-3 text-xs font-form text-ink-mid">
          <p className="font-stamp text-xs tracking-wider text-ink-dark">
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
