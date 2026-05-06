export function LimitationsFooter() {
  return (
    <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground space-y-1">
      <p>
        <strong>Limitations:</strong> This tool queries public mempool nodes, not a
        full node. Fork-chain spends (BCH, BTG) may expose a pubkey on Bitcoin but
        are not detected here. Off-chain pubkey disclosure (signed messages, PoR
        schemes) is not detected. P2SH results may be ambiguous.
      </p>
      <p>USD prices are spot, not time-weighted. Data may lag by minutes.</p>
      <p>
        <a href="/methodology" className="underline hover:text-foreground">
          Full methodology
        </a>{' '}
        &middot; Data from mempool.space and blockstream.info &middot; MIT License
      </p>
    </footer>
  )
}
