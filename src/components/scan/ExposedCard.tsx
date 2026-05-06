import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  return usd.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function ExposedCard({ result }: Props) {
  const hasHighReuse = result.flags.includes('HIGH_REUSE')
  const isP2tr = result.type === 'P2TR'

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <span aria-hidden>🔴</span>
          <span>Exposed</span>
          {hasHighReuse && <HighReuseBadge />}
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono truncate">{result.address}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-bold">{formatBtc(result.balanceBtc)} BTC</p>
          {result.balanceUsd !== null && (
            <p className="text-muted-foreground">{formatUsd(result.balanceUsd)}</p>
          )}
        </div>

        {isP2tr ? (
          <p className="text-sm">
            This is a Taproot (P2TR) address. The x-only public key is embedded in
            the output script and is visible on-chain from the moment funds were
            received — no spend required for exposure.
          </p>
        ) : (
          <p className="text-sm">
            Your public key appeared on the Bitcoin blockchain
            {result.lastSpend ? ` on ${result.lastSpend}` : ''}.
            A sufficiently powerful quantum computer could derive your private key
            from this public key using Shor&apos;s algorithm.
          </p>
        )}

        <RiskScoreToggle scores={result.riskScore} />

        <div className="space-y-1 text-sm">
          <p className="font-medium">What this means for you:</p>
          <ul className="space-y-1">
            <li className="flex gap-2 text-red-600"><span aria-hidden>✗</span> This address is NOT protected by hash commitments</li>
            <li className="flex gap-2 text-red-600"><span aria-hidden>✗</span> Once a CRQC exists, this private key can be computed in hours</li>
            <li className="flex gap-2 text-red-600"><span aria-hidden>✗</span> The "turnstile" migration does NOT apply to this address</li>
          </ul>
        </div>

        <div className="space-y-1 text-sm border-t pt-3">
          <p className="font-medium">Next steps:</p>
          <ul className="space-y-1">
            <li>☐ Move funds to a new address that has never been spent from</li>
            <li>☐ Never sign another transaction from the new address until migrating to a post-quantum scheme</li>
            <li>☐ Track the QBIP Phase A timeline — proactive migration must happen before a CRQC exists</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
