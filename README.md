# Quantum Scanner

A Bitcoin address quantum computing exposure risk scanner built with Next.js 15. Analyzes addresses across multiple script types (P2PKH, P2WPKH, P2SH, P2WSH, P2TR, P2PK) to quantify quantum vulnerability risk using CRQC (Cryptographically Relevant Quantum Computer) threat models.

**Live Demo:** [quantum-scanner.vercel.app](https://quantum-scanner.vercel.app)

## Project Overview

Quantum computers pose a theoretical but serious threat to Bitcoin's ECDSA security model. Once a CRQC becomes operational, publicly exposed Bitcoin public keys become vulnerable to key recovery attacks. This scanner identifies which addresses have exposed public keys and quantifies risk across three quantum threat scenarios (conservative 2040+, base 2033-2037, aggressive 2029-2032).

### Key Features

- **Single Address Scanning** - Analyze any mainnet Bitcoin address in real-time
- **Portfolio Analysis** - Upload CSV with up to 1000 addresses for bulk analysis
- **Script Type Detection** - Classifies P2PKH, P2WPKH, P2SH, P2WSH, P2TR, and P2PK addresses
- **Risk Scoring** - Three quantum threat scenarios with exposure ratios
- **Live Dashboard** - Real-time portfolio scanning with SSE streaming
- **Fallback Data Sources** - Automatic failover from Mempool.space to Blockstream Esplora
- **Rate Limiting** - Per-IP token bucket with Vercel KV + in-memory LRU fallback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16.2.4](https://nextjs.org) (App Router, server components) |
| Runtime | Node.js 20+ |
| Language | TypeScript 5 with strict mode |
| UI | React 19, Tailwind CSS 4, shadcn/ui components |
| Styling | Tailwind CSS with PostCSS, CSS animations |
| Validation | Zod 4.4 with schema inference |
| Testing | Vitest 4.1 (unit), Playwright 1.59 (E2E) |
| Data | Vercel KV (serverless Redis) |
| Blockchain Data | [Mempool.space API](https://mempool.space/docs) + [Blockstream Esplora API](https://blockstream.info/api) |
| Price Data | [CoinGecko API](https://www.coingecko.com/en/api) |
| CSV Parsing | papaparse 5.5 |
| Concurrency | p-limit 7.3 (with configurable concurrency) |

## Directory Structure

```
quantum-scanner/
├── src/
│   ├── app/                          # Next.js App Router pages & routes
│   │   ├── (auth)/                   # Not currently used
│   │   ├── api/v1/                   # API endpoints
│   │   │   ├── address/[address]/    # Single address resolution
│   │   │   ├── health/               # Health check
│   │   │   └── portfolio/            # Batch portfolio scanning
│   │   ├── page.tsx                  # Landing page
│   │   ├── scan/                     # Single address scanner page
│   │   ├── portfolio/                # Portfolio dashboard page
│   │   ├── about/                    # About page
│   │   ├── methodology/              # Methodology page
│   │   ├── layout.tsx                # Root layout
│   │   └── sitemap.ts                # SEO sitemap
│   │
│   ├── components/                   # React components
│   │   ├── scan/                     # Single address scanner UI
│   │   │   ├── ScanForm.tsx          # Address input form
│   │   │   ├── ResultCards.tsx       # Result display (SAFE/EXPOSED/etc)
│   │   │   ├── RiskScoreToggle.tsx   # Scenario switcher
│   │   │   └── *Card.tsx             # Classification cards
│   │   │
│   │   ├── portfolio/                # Portfolio scanner UI
│   │   │   ├── CsvDropzone.tsx       # File upload area
│   │   │   ├── CsvPreviewTable.tsx   # Parsed row preview
│   │   │   ├── AddressTable.tsx      # Results table
│   │   │   ├── ExposureChart.tsx     # Portfolio visualization
│   │   │   ├── ScanProgressBar.tsx   # Real-time progress
│   │   │   └── SummaryBar.tsx        # Portfolio totals
│   │   │
│   │   ├── marketing/                # Marketing components
│   │   │   ├── LiveCounter.tsx       # Live scanning stats
│   │   │   └── LimitationsFooter.tsx # Disclaimer footer
│   │   │
│   │   ├── shared/                   # Reusable components
│   │   ├── ui/                       # Base UI components (shadcn/ui)
│   │   └── layout/                   # Layout components
│   │
│   ├── lib/                          # Business logic & utilities
│   │   ├── classification/           # Address type & risk classification
│   │   │   ├── detect-type.ts        # Classify script type (P2PKH, etc)
│   │   │   ├── classify.ts           # Determine risk (EXPOSED, SAFE, etc)
│   │   │   ├── recommended-action.ts # Action guidance based on risk
│   │   │   ├── types.ts              # TypeScript types
│   │   │   └── *.test.ts             # Unit tests
│   │   │
│   │   ├── risk/                     # Quantum risk scoring
│   │   │   ├── score.ts              # Risk score computation
│   │   │   ├── scenarios.ts          # CRQC threat scenarios
│   │   │   ├── config.ts             # Risk bands & formula
│   │   │   └── *.test.ts             # Unit tests
│   │   │
│   │   ├── data/                     # Blockchain data access
│   │   │   ├── mempool-client.ts     # Mempool.space API client
│   │   │   ├── price-client.ts       # CoinGecko price fetching
│   │   │   ├── address-source.ts     # Fallback logic (mempool → esplora)
│   │   │   ├── errors.ts             # Error types
│   │   │   ├── http.ts               # Timeout utilities
│   │   │   └── *.test.ts             # Unit tests
│   │   │
│   │   ├── csv/                      # CSV upload & parsing
│   │   │   ├── parse.ts              # CSV parsing + deduplication
│   │   │   ├── validate.ts           # Address validation
│   │   │   └── *.test.ts             # Unit tests
│   │   │
│   │   ├── api/                      # API utilities
│   │   │   ├── resolve-address.ts    # Core address resolution pipeline
│   │   │   ├── rate-limit.ts         # Token bucket rate limiting
│   │   │   ├── envelope.ts           # API response format
│   │   │   ├── ip.ts                 # Client IP extraction
│   │   │   ├── schemas.ts            # Request/response validation
│   │   │   └── *.test.ts             # Unit tests
│   │   │
│   │   ├── client/                   # Client-side utilities
│   │   │   ├── portfolio-stream.ts   # SSE streaming client
│   │   │   └── *.ts                  # React hooks, utilities
│   │   │
│   │   └── utils.ts                  # General utilities
│   │
│   └── config/
│       └── env.ts                    # Environment variable schema
│
├── test/                             # Test infrastructure
│   ├── setup.ts                      # Vitest setup (jsdom, DOM matchers)
│   ├── render.tsx                    # Custom test render (with providers)
│   ├── msw/                          # Mock Service Worker handlers
│   └── fixtures/                     # Test data
│
├── public/                           # Static assets
├── docs/                             # Documentation
│
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS 4 configuration
├── tsconfig.json                     # TypeScript strict mode
├── package.json                      # Dependencies & scripts
├── vitest.config.ts                  # Unit test configuration
└── playwright.config.ts              # E2E test configuration
```

## API Endpoints

All endpoints follow a consistent envelope format with `ok` flag, `data` payload, and optional `error` object. See [docs/API.md](docs/API.md) for complete API documentation.

### GET `/api/v1/address/:address`

Scan a single Bitcoin address and get quantum exposure risk assessment.

```bash
curl 'https://quantum-scanner.vercel.app/api/v1/address/1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP'
```

**Limits:** 60 requests per 60 seconds per IP

### POST `/api/v1/portfolio`

Batch scan multiple addresses (up to 5000) and get portfolio-level summary.

**Limits:** 10 requests per 60 seconds per IP

### GET `/api/v1/health`

Health check endpoint for monitoring and uptime verification.

---

## Environment Variables

Configure via `.env.local` (development) or deployment platform (Vercel):

```bash
# Blockchain data sources
MEMPOOL_API_URL=https://mempool.space/api
ESPLORA_API_URL=https://blockstream.info/api

# Price data
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Portfolio scanning concurrency
BULK_CONCURRENCY=6  # 1-20, default 6

# Live counter widget
NEXT_PUBLIC_LIVE_COUNTER_ENABLED=false

# Site configuration
NEXT_PUBLIC_CANONICAL_URL=https://quantum-scanner.vercel.app
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/quantum-scanner.git
cd quantum-scanner

npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format
```

---

## How It Works

### Classification Engine

The scanner uses a three-stage pipeline to analyze Bitcoin addresses:

#### 1. Type Detection

Identifies the script type of a Bitcoin address (P2PKH, P2SH, P2WPKH, P2WSH, P2TR, P2PK).

Key insight: Script type determines if the public key is inherently exposed:
- P2TR and P2PK always expose the public key on-chain
- P2PKH, P2WPKH, P2WSH, P2SH expose the public key only after spending

#### 2. Risk Classification

Determines the risk category based on address type and transaction history:

- **SAFE_AT_REST** - Balance > 0 and no outgoing transactions
- **EXPOSED** - Balance > 0 and public key exposed
- **EMPTY** - Balance = 0 (spent or never received)
- **UNRESOLVABLE** - Invalid address; cannot determine risk

#### 3. Risk Scoring

Computes quantum exposure score across three CRQC threat scenarios:

- **Conservative** (2040+): 60% weight
- **Base** (2033–2037): 85% weight
- **Aggressive** (2029–2032): 100% weight

Formula: `Score = (ExposedBTC / TotalBTC) × 100 × Weight × (1 / YearsToMid)^0.5`

Risk Bands:
- LOW (0–24): Minimal quantum risk
- MODERATE (25–49): Moderate exposure
- HIGH (50–74): Significant exposure
- CRITICAL (75–100): Severe exposure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical explanation.

### Portfolio Scanning Flow

CSV Upload → Parse/Validate → Send to `/api/v1/portfolio` → Real-time SSE stream → Dashboard

**Concurrency Control:** Uses `p-limit` with `BULK_CONCURRENCY` env var (default: 6) to queue address resolutions.

---

## Vintage Baggage Tag Design System

The UI uses a distinctive "vintage baggage tag" aesthetic with rounded pill-shaped badges, monospace typography for numbers, muted earth tones, and animation effects for state transitions.

---

## Architecture Decisions

- **Envelope Format:** Consistent API response structure for predictable error handling
- **Zod Validation:** Type inference from schemas prevents code duplication
- **Fallback Data Sources:** Two independent blockchain APIs reduce single-point-of-failure
- **LRU + Vercel KV:** Works offline during development, scales in production

---

## Security & Rate Limiting

### Token Bucket Rate Limiting

Three separate buckets per IP:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Single address | 60 | 60s |
| Portfolio | 10 | 60s |
| Health check | Unlimited | — |

**Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

---

## Testing

### Coverage Target: 80%+

**Unit Tests:** Classification logic, CSV parsing, data clients
**Integration Tests:** API endpoints with MSW mocks, rate limiting
**E2E Tests:** Landing page, single address scan, portfolio CSV upload

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright tests
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables
3. Enable Vercel KV integration (optional)
4. Deploy

### Self-Hosted

```bash
npm run build
npm start
```

---

## Troubleshooting

**Address Returns "UNRESOLVABLE":** Invalid or testnet address. Check with blockchain explorer.

**Portfolio Scan Hangs:** Slow network or upstream outage. Check API status pages or increase `BULK_CONCURRENCY`.

**Rate Limit Errors (429):** Check `Retry-After` header. Stagger requests or use batch endpoint.

---

## Documentation

- [API Documentation](docs/API.md) - Complete API endpoint reference
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and data flow

---

## Contributing

1. Fork and clone the repo
2. Create feature branch
3. Write tests first (TDD)
4. Implement code
5. Ensure all tests pass: `npm test`
6. Format code: `npm run format`
7. Push and open a pull request

---

## License

MIT

---

## Resources

- [Bitcoin Script Types](https://bitcoin.org/en/developer-reference#transactions)
- [Mempool.space API](https://mempool.space/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS 4](https://tailwindcss.com)

---

**Last Updated:** 2026-05-06  
**Version:** 0.1.0
