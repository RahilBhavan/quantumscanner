<div align="center">

# ⚡ Quantum Scanner

**Find your Bitcoin before quantum computers do.**

Scan any Bitcoin address or upload a portfolio CSV to get an instant quantum exposure risk assessment — identifying which addresses have exposed public keys and quantifying risk across three CRQC threat timelines.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-qs.rahilbhavan.com-black?style=for-the-badge&logo=vercel)](https://qs.rahilbhavan.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## The Problem

Once a Cryptographically Relevant Quantum Computer (CRQC) becomes operational, Bitcoin addresses with exposed public keys become vulnerable to private key recovery via Shor's algorithm. This isn't theoretical — it's a matter of timeline.

The catch: most Bitcoin holders don't know which of their addresses are at risk, or how urgently they should act.

Quantum Scanner answers both questions.

---

## Demo

> **Try it live:** [qs.rahilbhavan.com](https://qs.rahilbhavan.com)

**Single address scan:**

```
/scan?address=1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf
```

**Portfolio scan:** Upload a CSV with up to 1000 addresses and get real-time risk scores streamed back via SSE.

---

## Features

| Feature | Details |
|---------|---------|
| **Script Type Detection** | Classifies P2PKH, P2WPKH, P2SH, P2WSH, P2TR, and P2PK |
| **Risk Classification** | EXPOSED · SAFE_AT_REST · EMPTY · UNRESOLVABLE |
| **Three Threat Scenarios** | Conservative (2040+) · Base (2033–37) · Aggressive (2029–32) |
| **Portfolio Analysis** | Bulk scan up to 1000 addresses via CSV upload |
| **Real-time Streaming** | SSE stream for live portfolio scan progress |
| **Dual Data Sources** | Mempool.space with automatic Blockstream Esplora failover |
| **Rate Limiting** | Per-IP token bucket (Vercel KV + in-memory LRU fallback) |
| **Shareable Scan URLs** | `/scan?address=...` pre-populates and auto-scans |
| **CSV Export** | Download portfolio results as CSV |

---

## Quick Start

```bash
git clone https://github.com/RahilBhavan/quantumscanner.git
cd quantumscanner
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys required for development. The scanner uses public blockchain data from Mempool.space and Blockstream Esplora out of the box.

---

## API

All endpoints return a consistent envelope: `{ ok, data, error }`.

### Scan a single address

```bash
curl 'https://qs.rahilbhavan.com/api/v1/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf'
```

```json
{
  "ok": true,
  "data": {
    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf",
    "scriptType": "P2PKH",
    "classification": "SAFE_AT_REST",
    "balanceSats": 6844009327,
    "hasSpent": false,
    "riskScores": {
      "conservative": 12,
      "base": 0,
      "aggressive": 0
    }
  }
}
```

**Rate limit:** 60 requests / 60s per IP

### Batch scan a portfolio

```bash
curl -X POST 'https://qs.rahilbhavan.com/api/v1/portfolio' \
  -H 'Content-Type: application/json' \
  -d '{"addresses": ["1A1zP1...", "bc1q..."]}'
```

**Rate limit:** 10 requests / 60s per IP · Max 100 addresses per request

### Stream a portfolio scan

```
GET /api/v1/portfolio/stream
```

Server-Sent Events stream — one JSON result per address as it resolves.

**Rate limit:** 10 requests / 60s per IP · Max 1000 addresses

### Health check

```bash
curl 'https://qs.rahilbhavan.com/api/v1/health'
```

Full API reference: [docs/API.md](docs/API.md)

---

## How It Works

### 1. Script Type Detection

The address format determines whether the public key is inherently exposed:

| Script Type | Public Key Exposure |
|-------------|-------------------|
| P2PK | Always exposed (key is the scriptPubKey) |
| P2TR (Taproot) | Always exposed (key is tweaked into address) |
| P2PKH, P2WPKH | Exposed only after the first outgoing spend |
| P2SH, P2WSH | Exposed only after the first outgoing spend |

### 2. Risk Classification

```
address + tx history
        │
        ▼
  ┌─────────────────┐
  │  Has balance?   │──No──► EMPTY
  └────────┬────────┘
           │ Yes
           ▼
  ┌─────────────────┐
  │  Public key     │──No──► SAFE_AT_REST
  │  exposed?       │
  └────────┬────────┘
           │ Yes
           ▼
        EXPOSED
```

### 3. Quantum Risk Score

Three CRQC threat scenarios produce a 0–100 score:

| Scenario | Timeline | Weight |
|----------|----------|--------|
| Conservative | 2040+ | 60% |
| Base | 2033–2037 | 85% |
| Aggressive | 2029–2032 | 100% |

**Formula:** `Score = (ExposedBTC / TotalBTC) × 100 × Weight × (1 / YearsToMidpoint)^0.5`

**Risk bands:** LOW (0–24) · MODERATE (25–49) · HIGH (50–74) · CRITICAL (75–100)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical breakdown.

---

## Environment Variables

```bash
# .env.local

# Blockchain data sources (public APIs — no key required)
MEMPOOL_API_URL=https://mempool.space/api
ESPLORA_API_URL=https://blockstream.info/api

# Price data
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Portfolio scanning concurrency (1–20, default 6)
BULK_CONCURRENCY=6

# Site configuration
NEXT_PUBLIC_CANONICAL_URL=https://qs.rahilbhavan.com
```

Optional Vercel KV environment variables (`KV_URL`, `KV_REST_API_URL`, etc.) enable persistent rate limiting across serverless instances. Without them, the scanner falls back to an in-memory LRU cache that resets per instance.

---

## Project Structure

```
src/
├── app/
│   ├── api/v1/
│   │   ├── address/[address]/   # Single address scan
│   │   ├── portfolio/           # Batch scan (JSON body)
│   │   │   └── stream/          # SSE streaming scan
│   │   └── health/
│   ├── scan/                    # Single address scanner page
│   ├── portfolio/               # Portfolio dashboard page
│   ├── methodology/             # Risk model explanation
│   └── about/
│
├── components/
│   ├── scan/                    # ScanForm, ResultCards, RiskScoreToggle
│   └── portfolio/               # CsvDropzone, AddressTable, ExposureChart
│
└── lib/
    ├── classification/          # detect-type.ts, classify.ts
    ├── risk/                    # score.ts, scenarios.ts
    ├── data/                    # mempool-client.ts, address-source.ts
    ├── csv/                     # parse.ts, validate.ts
    └── api/                     # resolve-address.ts, rate-limit.ts
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 strict |
| UI | React 19 · Tailwind CSS 4 · shadcn/ui |
| Validation | Zod 4 |
| Testing | Vitest 4 · Playwright 1.59 |
| Blockchain data | Mempool.space · Blockstream Esplora |
| Price data | CoinGecko |
| Rate limiting | Vercel KV (Redis) · in-memory LRU fallback |
| Concurrency | p-limit |

---

## Testing

```bash
npm test                # unit tests (watch)
npm run test:run        # unit tests (single run)
npm run test:coverage   # coverage report (target: 80%+)
npm run test:e2e        # Playwright E2E tests
npm run typecheck       # TypeScript strict check
npm run lint            # ESLint
```

Test addresses for all script types and exposure scenarios: [docs/TEST_ADDRESSES.md](docs/TEST_ADDRESSES.md)

---

## Deploy

### Vercel (one-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RahilBhavan/quantumscanner)

Set `NEXT_PUBLIC_CANONICAL_URL` to your deployment URL. All other variables have sensible defaults.

### Self-hosted

```bash
npm run build
npm start
```

The scanner works without any external accounts. Vercel KV is optional.

---

## Limitations

- **P2SH and P2WSH wrapped scripts** — cannot determine inner script type from chain data alone; conservatively classified as potentially exposed after first spend
- **Multisig addresses** — treated as single-key for scoring purposes
- **Coinbase outputs** — not flagged separately; classified by script type like any other address
- **Lightning channels** — off-chain balances are not visible or scanned

---

## Contributing

1. Fork and clone
2. `npm install && npm run dev`
3. Write tests first (`npm test`)
4. Implement the change
5. Verify `npm run typecheck && npm run test:run` both pass
6. Open a pull request

Bug reports and feature requests welcome via [GitHub Issues](https://github.com/RahilBhavan/quantumscanner/issues).

---

## Resources

- [NIST Post-Quantum Cryptography Standards](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Bitcoin Script Types Reference](https://bitcoin.org/en/developer-reference#transactions)
- [Mempool.space API](https://mempool.space/docs)
- [Shor's Algorithm — Wikipedia](https://en.wikipedia.org/wiki/Shor%27s_algorithm)

---

## License

MIT — see [LICENSE](LICENSE)
