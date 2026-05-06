/**
 * Persistent disclaimer footer rendered on the scan and portfolio result pages.
 *
 * Communicates the known limitations of the tool to set accurate user
 * expectations:
 * - Data comes from public mempool nodes, not a full Bitcoin node.
 * - Cross-chain spends (BCH, BTG fork-chain replay) that expose a pubkey on
 *   the Bitcoin UTXO set are not detected.
 * - Off-chain pubkey disclosures (signed messages, proof-of-reserves schemes)
 *   are out of scope.
 * - P2SH results may be ambiguous without script pre-image data.
 * - USD prices are spot rates and may lag by minutes.
 *
 * Also surfaces a link to the full methodology page and attribution for the
 * underlying data sources.
 */
export function LimitationsFooter() {
  return (
    <footer className="text-muted-foreground mt-12 space-y-1 border-t pt-6 text-xs">
      <p>
        <strong>Limitations:</strong> This tool queries public mempool nodes,
        not a full node. Fork-chain spends (BCH, BTG) may expose a pubkey on
        Bitcoin but are not detected here. Off-chain pubkey disclosure (signed
        messages, PoR schemes) is not detected. P2SH results may be ambiguous.
      </p>
      <p>USD prices are spot, not time-weighted. Data may lag by minutes.</p>
      <p>
        <a href="/methodology" className="hover:text-foreground underline">
          Full methodology
        </a>{' '}
        &middot; Data from mempool.space and blockstream.info &middot; MIT
        License
      </p>
    </footer>
  )
}
