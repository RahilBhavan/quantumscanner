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

export function SafeAtRestCard({ result }: Props) {
  const hasHighReuse = result.flags.includes('HIGH_REUSE')
  const hasP2shNote = result.notes.includes('P2SH_AMBIGUOUS')

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <span aria-hidden>🟢</span>
          <span>Safe at Rest</span>
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

        <p className="text-sm">
          Your public key has never appeared on the Bitcoin blockchain. A quantum
          computer cannot extract your private key from your address alone. Your funds
          are protected by hash preimage resistance.
        </p>

        {hasP2shNote && (
          <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200">
            Note: This is a P2SH address. If it wraps a multisig or non-standard script,
            exposure classification may differ. See{' '}
            <a href="/methodology" className="underline">methodology</a>.
          </p>
        )}

        <RiskScoreToggle scores={result.riskScore} />

        <div className="space-y-1 text-sm">
          <p className="font-medium">What this means for you:</p>
          <ul className="space-y-1 list-none">
            <li className="flex gap-2"><span aria-hidden>✓</span> Your funds are currently safe from quantum attack</li>
            <li className="flex gap-2"><span aria-hidden>✓</span> A "turnstile" migration can recover coins without exposing your public key</li>
            <li className="flex gap-2 text-amber-600"><span aria-hidden>⚠</span> Do not spend from this address before migrating to a post-quantum scheme</li>
          </ul>
        </div>

        <div className="space-y-1 text-sm border-t pt-3">
          <p className="font-medium">Next steps:</p>
          <ul className="space-y-1">
            <li>☐ Monitor BIP-360 and QBIP Phase A activation</li>
            <li>☐ Ensure your seed phrase is backed up securely</li>
            <li>☐ Do not reuse this address</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
