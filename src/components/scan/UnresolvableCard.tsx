'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  address: string
  onRetry: () => void
}

export function UnresolvableCard({ address, onRetry }: Props) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <span aria-hidden>⚠️</span>
          <span>Unresolvable</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono truncate">{address}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          This address format was not recognized, or blockchain data could not be
          fetched. Manual review is required.
        </p>
        <p className="text-xs text-muted-foreground">
          If this persists, you can check directly on{' '}
          <span className="underline">mempool.space</span> or{' '}
          <span className="underline">blockstream.info</span>.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
