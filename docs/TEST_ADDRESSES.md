# Test Addresses

A reference set of real Bitcoin addresses covering every script type and exposure scenario the scanner classifies. Useful for manual testing, demos, and verifying scanner output.

## Coverage Matrix

| Address | Type | Exposure | Expected Result |
|---------|------|----------|-----------------|
| `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` | P2PKH | Safe | SAFE — pubkey never on-chain |
| `12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX` | P2PKH | Exposed | EXPOSED — pubkey revealed by spend |
| `1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF` | P2PKH | Exposed | EXPOSED — large dormant balance |
| `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy` | P2SH | Varies | Tests P2SH classification |
| `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` | P2WPKH | Safe at rest | Tests native SegWit classification |
| `bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297` | P2TR | Always exposed | EXPOSED — Taproot pubkey visible from first receipt |

## Details

### `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` — Genesis block
The coinbase output from block 0, created by Satoshi Nakamoto. Has received thousands of tribute transactions but has **never spent**, so the public key has never appeared on-chain. Should return a near-zero risk score across all three threat timelines.

### `12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX` — Hal Finney
Received the first-ever Bitcoin transaction (10 BTC from Satoshi, January 2009). Has been spent from, permanently exposing the public key. The canonical test case for a P2PKH EXPOSED result.

### `1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF` — Large dormant P2PKH
One of the largest known dormant wallets (~79,957 BTC as of 2024). Useful for testing risk score display at high USD values. Has transaction history that exposes the public key.

### `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy` — P2SH example
Commonly cited P2SH address. Tests the scanner's P2SH script type detection. The redeem script is not revealed until spend, so classification depends on whether it has been spent from.

### `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` — P2WPKH (native SegWit)
Standard bech32 address. Tests the P2WPKH classification path. Like P2PKH, the public key is only exposed on spend.

### `bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297` — P2TR (Taproot)
Taproot key-path output. P2TR addresses always embed the tweaked public key directly in the output script, so the public key is visible from the moment funds are **received** — not just when spent. Should be flagged EXPOSED regardless of spend history.

## Core Validation Pair

The most useful smoke test is the first two addresses:

```
1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  →  SAFE
12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX  →  EXPOSED
```

If these two return the correct results, the classification and public-key detection logic is working end-to-end.
