import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AddressResult } from '@/lib/api/resolve-address'

interface Props {
  result: AddressResult
}

export function EmptyCard({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <span aria-hidden>⚪</span>
          <span>Empty — No funds at risk</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono truncate">{result.address}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This address has no UTXO balance. Classification is shown for completeness.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Address type: <strong>{result.type}</strong> &middot;{' '}
          {result.pubkeyExposed
            ? 'Public key has been exposed on-chain.'
            : 'Public key has not been exposed.'}
        </p>
      </CardContent>
    </Card>
  )
}
