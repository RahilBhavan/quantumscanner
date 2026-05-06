# Architecture Guide

**Last Updated:** 2026-05-06

This document explains the system architecture, data flow, and design patterns used in Quantum Scanner.

## Table of Contents

1. [System Overview](#system-overview)
2. [Classification Pipeline](#classification-pipeline)
3. [Risk Scoring Model](#risk-scoring-model)
4. [Data Layer](#data-layer)
5. [API Design](#api-design)
6. [CSV Processing Pipeline](#csv-processing-pipeline)
7. [Server-Sent Events (SSE) Streaming](#server-sent-events-sse-streaming)
8. [Rate Limiting](#rate-limiting)
9. [Type System](#type-system)

---

## System Overview

Quantum Scanner analyzes Bitcoin addresses for quantum computing exposure risk. The system consists of three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: scan, portfolio, about, methodology          │   │
│  │  Components: ScanForm, CsvDropzone, ResultCards      │   │
│  │  Client: SSE streaming, address search               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GET  /api/v1/address/:address    (single scan)      │   │
│  │  POST /api/v1/portfolio            (batch scan)      │   │
│  │  POST /api/v1/portfolio/stream     (SSE stream)      │   │
│  │  GET  /api/v1/health               (health check)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │ Classification     │  │ Rate Limiting                │   │
│  │ ├─ detect-type     │  │ ├─ Token bucket             │   │
│  │ ├─ classify        │  │ ├─ Vercel KV (primary)      │   │
│  │ ├─ score           │  │ ├─ LRU cache (fallback)     │   │
│  │ └─ recommended     │  │ └─ Per-IP tracking          │   │
│  │    action          │  └──────────────────────────────┘   │
│  └────────────────────┘                                      │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │ Data Access        │  │ CSV Processing               │   │
│  │ ├─ mempool-client  │  │ ├─ parse.ts                 │   │
│  │ ├─ price-client    │  │ ├─ validate.ts              │   │
│  │ ├─ address-source  │  │ └─ deduplicate              │   │
│  │ └─ error handling  │  └──────────────────────────────┘   │
│  └────────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   External Data Sources                      │
│  ├─ Mempool.space API (primary) ──→ Blockchain data         │
│  ├─ Blockstream Esplora API (fallback)                      │
│  └─ CoinGecko API ──→ BTC/USD price                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Classification Pipeline

The core algorithm determines quantum exposure risk in three stages:

### Stage 1: Address Type Detection

**File:** `src/lib/classification/detect-type.ts`

Uses the `bitcoin-address-validation` library to identify script type:

```
Input: Bitcoin address string
  ↓
validate(address)  [Zod + library]
  ↓
getAddressInfo(address)
  ├─ Extract network (mainnet only)
  ├─ Detect script type
  └─ Return type enum
  ↓
Output: AddressType
  ├─ P2PKH (Pay to Public Key Hash) - Legacy, starts with "1"
  ├─ P2SH (Pay to Script Hash) - Legacy, starts with "3"
  ├─ P2WPKH (Pay to Witness PK Hash) - SegWit, starts with "bc1q"
  ├─ P2WSH (Pay to Witness Script Hash) - SegWit, starts with "bc1q"
  ├─ P2TR (Pay to Taproot) - Taproot, starts with "bc1p"
  ├─ P2PK (Pay to Public Key) - Rare historical
  └─ UNKNOWN (Invalid or testnet)
```

**Key Insight:** Script type determines pubkey exposure mechanism:

| Type | Public Key Exposed | When |
|------|-------------------|------|
| P2PKH | NO | Only after first spend |
| P2SH | NO | Depends on inner script (ambiguous) |
| P2WPKH | NO | Only after first spend |
| P2WSH | NO | Only after first spend |
| P2TR | YES | Always on-chain (Schnorr signature) |
| P2PK | YES | Always on-chain (original Bitcoin) |

### Stage 2: Risk Classification

**File:** `src/lib/classification/classify.ts`

Determines the risk category based on type and transaction history:

```typescript
interface AddressFacts {
  type: AddressType           // From stage 1
  txCount: number             // Number of transactions
  hasOutgoingTx: boolean      // Has spent funds?
  balanceSat: number          // Current balance in satoshis
}

// Classification logic:
if (type === 'UNKNOWN') {
  classification = 'UNRESOLVABLE'
}
else if (type === 'P2TR' || type === 'P2PK') {
  // Always exposed (pubkey always on-chain)
  classification = balanceSat === 0 ? 'EMPTY' : 'EXPOSED'
}
else {
  // P2PKH, P2SH, P2WPKH, P2WSH
  pubkeyExposed = hasOutgoingTx  // Exposed only after spending
  
  if (balanceSat === 0 && !hasOutgoingTx) {
    classification = 'EMPTY'
  } else if (pubkeyExposed) {
    classification = 'EXPOSED'
  } else {
    classification = 'SAFE_AT_REST'
  }
}
```

**Classification Categories:**

| Classification | Condition | Risk | Action |
|---|---|---|---|
| **SAFE_AT_REST** | Balance > 0, no outgoing tx | Low | Monitor |
| **EXPOSED** | Balance > 0, pubkey exposed | Critical | Migrate immediately |
| **EMPTY** | Balance = 0 | None | No action needed |
| **UNRESOLVABLE** | Invalid address | Unknown | Manual review |

**Flags:**

- `HIGH_REUSE` - Address with >100 transactions (suggests exchange/mixer activity)

### Stage 3: Risk Scoring

**File:** `src/lib/risk/score.ts`

Computes quantum exposure score based on:
1. Exposure ratio: `exposedBtc / totalBtc`
2. CRQC scenario (timeline + weight)
3. Time decay formula

```
Score = ExposureRatio × 100 × ScenarioWeight × TimeDecayFactor
Range: 0–100
```

**CRQC Scenarios:**

| Scenario | CRQC Mid-Year | Weight | Timeline | Interpretation |
|---|---|---|---|---|
| Conservative | 2042 | 0.60 | 2040+ | Quantum threat very far off |
| Base | 2035 | 0.85 | 2033–2037 | Moderate near-term threat |
| Aggressive | 2030 | 1.00 | 2029–2032 | Near-term critical threat |

**Time Decay Formula:**

```
YearsToMid = max(1, crqcMidYear - currentYear)
TimeDecay = 1 / sqrt(YearsToMid)

Example (current year 2026):
- Conservative: 1 / sqrt(16) = 0.25
- Base:        1 / sqrt(9)  = 0.33
- Aggressive:  1 / sqrt(4)  = 0.50
```

**Complete Example:**

```
Address:
- Type: P2WPKH
- Has outgoing tx: true
- Balance: 2 BTC
- Total portfolio: 5 BTC

Classification: EXPOSED (pubkey exposed due to outgoing tx)
Exposure ratio: 2 / 5 = 0.4

Risk Scores (Year 2026):
- Conservative: 0.4 × 100 × 0.60 × 0.25 = 6.0 (LOW)
- Base:         0.4 × 100 × 0.85 × 0.33 = 11.2 (LOW)
- Aggressive:   0.4 × 100 × 1.00 × 0.50 = 20.0 (LOW)
```

**Risk Bands:**

```typescript
const RISK_BANDS = {
  LOW:       { min: 0,  max: 24 },
  MODERATE:  { min: 25, max: 49 },
  HIGH:      { min: 50, max: 74 },
  CRITICAL:  { min: 75, max: 100 },
} as const
```

---

## Risk Scoring Model

### Model Assumptions

1. **CRQC Timeline Uncertainty:** Three scenarios reflect uncertainty about when CRQC becomes viable
2. **Exposure = Risk:** Any exposed pubkey is quantum vulnerable
3. **Portfolio Risk:** Aggregated from individual addresses (linear summation)
4. **No Mitigation:** Model assumes no migration or key rotation happens

### Model Limitations

- Conservative scenarios may underestimate risk (actual CRQC timeline unknown)
- P2SH ambiguity: Cannot determine if inner script exposes pubkey
- Historical transactions: Assumes no key reuse outside blockchain
- Price volatility: USD values are point-in-time snapshots

### Recommended Migration Thresholds

Based on scenario:

| Scenario | Score 50+ | Score 75+ |
|---|---|---|
| Conservative | 2035 | 2030 |
| Base | 2028 | 2023 |
| Aggressive | 2023 | 2018 |

---

## Data Layer

The data layer fetches blockchain address information with automatic fallback.

### Primary Data Source: Mempool.space

**Endpoint:** `GET https://mempool.space/api/address/{address}`

**Response Schema:**

```json
{
  "address": "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
  "chain_stats": {
    "tx_count": 15,
    "funded_txo_sum": 500000000,
    "spent_txo_sum": 499999999
  },
  "mempool_stats": {
    "tx_count": 0,
    "funded_txo_sum": 0,
    "spent_txo_sum": 0
  }
}
```

**Validation:** Zod schema in `src/lib/data/mempool-client.ts`

```typescript
const MempoolAddressSchema = z.object({
  address: z.string(),
  chain_stats: z.object({
    tx_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
  mempool_stats: z.object({
    tx_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
})
```

**Derived Fields:**

```typescript
balanceSat = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum
txCount = chain_stats.tx_count
hasOutgoingTx = chain_stats.spent_txo_sum > 0
```

### Fallback Data Source: Blockstream Esplora

**Endpoint:** `GET https://blockstream.info/api/address/{address}`

**When Triggered:**

```typescript
function isFallbackTrigger(err: unknown): boolean {
  return (
    err instanceof RateLimitError ||
    (err instanceof UpstreamError && (err.statusCode ?? 0) >= 500)
  )
}
```

Triggers on:
- HTTP 429 (rate limit)
- HTTP 5xx (server errors)

**Same schema as Mempool** ensures data consistency.

### Error Handling

**Error Types:**

```typescript
export class UpstreamError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message)
  }
}

export class RateLimitError extends Error {}

export class NotFoundError extends Error {}
```

**Error Flow:**

```
Fetch Mempool
  ├─ 404 NOT_FOUND → throw NotFoundError (no fallback)
  ├─ 429 RATE_LIMITED → trigger fallback
  ├─ 5xx SERVER_ERROR → trigger fallback
  ├─ Malformed JSON → throw UpstreamError
  ├─ Invalid schema → throw UpstreamError
  └─ Network timeout → trigger fallback
       ↓
   Fetch Esplora
     ├─ Success → return result
     └─ Error → throw combined error
```

### Price Data

**Endpoint:** `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`

**Schema:**

```json
{
  "bitcoin": {
    "usd": 65500.50
  }
}
```

**Graceful Degradation:** Returns `null` on any error (price optional in response).

---

## API Design

### Response Envelope

All responses use a consistent envelope structure:

```typescript
interface ApiSuccess<T> {
  ok: true
  data: T
}

interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

**Benefits:**

1. **Predictable:** Frontend always checks `ok` flag
2. **Type-safe:** TypeScript discriminated union types
3. **Versioning:** Can add new envelope fields without breaking changes
4. **Error details:** Structured error information for debugging

### Single Address Endpoint

**Route:** `GET /api/v1/address/[address]`

**Implementation Path:**

```
Request: GET /api/v1/address/1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP
  ↓
Extract address from dynamic route params
  ↓
Rate limit check (60 per 60s)
  ↓
Detect address type
  ├─ UNKNOWN → 400 INVALID_ADDRESS
  └─ Valid → continue
  ↓
Fetch BTC price (CoinGecko)
  ↓
Resolve address (core pipeline):
  1. Fetch facts (Mempool → Esplora fallback)
  2. Detect address type
  3. Classify risk
  4. Compute risk score
  5. Get recommended action
  ↓
Return AddressResult envelope
  ├─ Status 200: Success
  ├─ Status 404: NotFoundError
  ├─ Status 502: UpstreamError
  └─ Status 500: Unexpected error
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "address": "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
    "type": "P2PKH",
    "classification": "SAFE_AT_REST",
    "pubkeyExposed": false,
    "balanceBtc": 0.5,
    "balanceUsd": 32750,
    "riskScore": {
      "conservative": 0,
      "base": 0,
      "aggressive": 2
    },
    "recommendedAction": "MONITOR",
    "dataSource": "mempool.space",
    "flags": [],
    "notes": [],
    "firstSeen": null,
    "lastSpend": null
  }
}
```

### Batch Endpoint

**Route:** `POST /api/v1/portfolio`

**Request Body:**

```json
{
  "addresses": [
    "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy"
  ]
}
```

**Validation:**

```typescript
const PortfolioBodySchema = z.object({
  addresses: z.array(z.string()).max(5000),
})
```

**Implementation:**

```
Request: POST /api/v1/portfolio
  ↓
Validate request body
  ├─ Invalid JSON → 400 INVALID_BODY
  ├─ Invalid schema → 400 INVALID_BODY
  └─ Valid → continue
  ↓
Validate addresses (detect-type)
  ├─ Any UNKNOWN → 400 INVALID_ADDRESSES
  └─ All valid → continue
  ↓
Fetch BTC price (once)
  ↓
Resolve addresses in parallel:
  - p-limit with BULK_CONCURRENCY (default 6)
  - Each address goes through resolve pipeline
  - Errors handled per-address
  ↓
Aggregate results:
  - Filter successful addresses
  - Sum totalBtc and exposedBtc
  - Calculate safeAtRestBtc
  ↓
Return summary + individual results
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalAddresses": 3,
      "totalBtc": 5.25,
      "exposedBtc": 2.0,
      "safeAtRestBtc": 3.25
    },
    "addresses": [
      { /* AddressResult */ },
      { /* AddressResult */ },
      { /* AddressResult */ }
    ]
  }
}
```

---

## CSV Processing Pipeline

### Parse Stage

**File:** `src/lib/csv/parse.ts`

```
File Upload
  ↓
FileReader.readAsText()
  ├─ Encoding: UTF-8
  ├─ Remove BOM: ﻿
  └─ Normalize line endings: \r\n → \n
  ↓
Detect format:
  ├─ First line looks like Bitcoin address?
  │   └─ No header: split by newlines
  └─ Contains header row?
      └─ Use papaparse (PapaParse library)
  ↓
Address column detection:
  ├─ Priority: address, addr, btc_address, bitcoin_address
  ├─ Fallback: first column
  └─ Extract addresses
  ↓
Parse result:
  - Cap at MAX_ROWS (1000)
  - Deduplicate addresses
  - Mark duplicates with flag
  ↓
Return ParseResult
  ├─ rows: ParsedRow[] (normalized addresses)
  └─ errors: string[] (warnings like "exceeded max rows")
```

**Regex Pattern:**

```typescript
const BITCOIN_ADDRESS_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/
```

Matches:
- `1...` (P2PKH, 26–35 chars)
- `3...` (P2SH, 26–35 chars)
- `bc1...` (SegWit, 42–62 chars)

### Validate Stage

**File:** `src/lib/csv/validate.ts`

```
ParsedRow[]
  ↓
For each row:
  ├─ Detect address type
  ├─ Mark valid if type !== UNKNOWN
  └─ Attach type to row
  ↓
Return ValidatedRow[]
  ├─ type: AddressType
  ├─ isValid: boolean
  └─ isDuplicate: boolean (from parse stage)
```

### Upload Flow

```
User selects CSV
  ↓
Preview in CsvPreviewTable
  ├─ Show parsed rows
  ├─ Highlight invalid addresses
  ├─ Show duplicate warning
  └─ Display line numbers
  ↓
User clicks "Scan"
  ↓
Filter to valid addresses only
  ↓
Send to /api/v1/portfolio/stream
  ├─ Real-time SSE stream
  ├─ Progress events
  └─ Individual results
```

---

## Server-Sent Events (SSE) Streaming

### Server Implementation

**Route:** `POST /api/v1/portfolio/stream`

**Event Types:**

```typescript
type StreamEvent =
  | { type: 'progress'; completed: number; total: number }
  | { type: 'result'; data: AddressResult }
  | {
      type: 'summary'
      total: number
      exposed: number
      safe: number
      empty: number
      unresolvable: number
    }
  | { type: 'error'; message: string }
```

**Server-Side Flow:**

```
POST request with addresses
  ↓
Set response headers:
  - Content-Type: text/event-stream
  - Cache-Control: no-cache
  - Connection: keep-alive
  ↓
For each address:
  ├─ Emit: { type: 'progress', completed: i, total: n }
  ├─ Resolve address
  ├─ Emit: { type: 'result', data: AddressResult }
  └─ Track stats (exposed, safe, empty, unresolvable)
  ↓
Emit final summary:
  ├─ type: 'summary'
  ├─ total: count
  ├─ exposed: count
  ├─ safe: count
  ├─ empty: count
  └─ unresolvable: count
  ↓
Close response
```

**SSE Frame Format:**

```
event: data
data: {"type": "progress", "completed": 1, "total": 100}

event: data
data: {"type": "result", "data": {...AddressResult...}}

event: data
data: {"type": "summary", "total": 100, "exposed": 15, "safe": 85, ...}
```

### Client Implementation

**File:** `src/lib/client/portfolio-stream.ts`

```typescript
function streamPortfolioScan(opts: StreamOptions): () => void {
  const { addresses, onEvent, onDone, onError } = opts
  const controller = new AbortController()

  fetch('/api/v1/portfolio/stream', {
    method: 'POST',
    body: JSON.stringify({ addresses }),
    signal: controller.signal,
  })
    .then((res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            onDone()
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const json = line.slice(5).trim()
              try {
                const event = JSON.parse(json) as StreamEvent
                onEvent(event)
              } catch {
                // Ignore malformed JSON
              }
            }
          }

          return pump()
        })
      }

      return pump()
    })
    .catch(onError)

  return () => controller.abort()  // Cleanup function
}
```

**Client-Side Event Handling:**

```
Receive progress event
  ↓
Update ScanProgressBar (1/100, 2/100, ...)
  ↓
Receive result event
  ↓
Add row to AddressTable
  ↓
Receive summary event
  ↓
Update SummaryBar (totals, percentages)
  ↓
Display ExposureChart
```

---

## Rate Limiting

### Token Bucket Algorithm

**File:** `src/lib/api/rate-limit.ts`

**Limits per Endpoint:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Single address | 60 | 60s |
| Portfolio batch | 10 | 60s |
| Portfolio stream | 5 | 60s |
| Health check | Unlimited | — |

**Implementation:**

```typescript
interface TokenBucket {
  count: number
  resetAt: number
}

// Per endpoint, per IP
const cache = new LRUCache<string, TokenBucket>({ max: 10_000 })

function checkLimit(ip: string, limit: number): RateLimitResult {
  const now = Date.now()
  const existing = cache.get(ip)

  if (!existing || existing.resetAt <= now) {
    // Window expired, reset counter
    const resetAt = now + WINDOW_MS
    cache.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    // Limit exceeded
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  // Increment counter
  const updated = { count: existing.count + 1, resetAt: existing.resetAt }
  cache.set(ip, updated)
  return { allowed: true, remaining: limit - updated.count, resetAt: updated.resetAt }
}
```

### Fallback Strategy

**Primary:** Vercel KV (Redis)
```typescript
const key = `rl:${type}:${ip}`
const count = await kv.incr(key)
if (count === 1) await kv.expire(key, WINDOW_S)
```

**Fallback:** In-Memory LRU Cache
```typescript
const cache = new LRUCache<string, TokenBucket>({ max: 10_000 })
```

**Why Hybrid?**

1. **Development:** LRU works offline without infrastructure
2. **Serverless:** Each function instance gets own cache
3. **Edge:** Edge Runtime doesn't support KV; falls back to LRU
4. **Graceful:** KV unavailability doesn't crash API

### Response Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1620000000
Retry-After: 30  (only on 429)
```

**Reset Time:** Unix timestamp in seconds (not milliseconds)

---

## Type System

### Core Types

**Classification Types** (`src/lib/classification/types.ts`):

```typescript
type AddressType = 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR' | 'P2PK' | 'UNKNOWN'

type Classification = 'SAFE_AT_REST' | 'EXPOSED' | 'EMPTY' | 'UNRESOLVABLE'

type RecommendedAction = 'MONITOR' | 'MIGRATE_IMMEDIATELY' | 'NO_ACTION_NEEDED' | 'MANUAL_REVIEW'

type ClassificationFlag = 'HIGH_REUSE'

type ClassificationNote = 'P2SH_AMBIGUOUS'
```

### Address Result Type

**File:** `src/lib/api/resolve-address.ts`

```typescript
interface AddressResult {
  address: string
  type: AddressType
  classification: Classification
  pubkeyExposed: boolean
  firstSeen: string | null
  lastSpend: string | null
  balanceBtc: number
  balanceUsd: number | null
  riskScore: {
    conservative: number
    base: number
    aggressive: number
  }
  recommendedAction: RecommendedAction
  dataSource: string
  flags: ClassificationFlag[]
  notes: ClassificationNote[]
}
```

### API Response Types

**File:** `src/lib/api/envelope.ts`

```typescript
interface ApiSuccess<T> {
  ok: true
  data: T
}

interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

**Type Guard:**

```typescript
// TypeScript discriminated union
if (response.ok) {
  // response.data is available
  console.log(response.data)
} else {
  // response.error is available
  console.error(response.error.message)
}
```

### Risk Score Types

**File:** `src/lib/risk/config.ts`

```typescript
type RiskBand = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

interface RiskScores {
  conservative: number  // 0–100
  base: number          // 0–100
  aggressive: number    // 0–100
}
```

---

## Data Flow Diagrams

### Single Address Flow

```
User Input: "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP"
      ↓
GET /api/v1/address/:address
      ↓
Rate limit check
      ├─ Allowed → continue
      └─ Blocked → 429 response
      ↓
Detect type (P2PKH, P2WPKH, etc.)
      ├─ UNKNOWN → 400 INVALID_ADDRESS
      └─ Valid → continue
      ↓
Fetch BTC price (async)
      ├─ Success → use for USD conversion
      └─ Fail → return null
      ↓
Resolve address:
  1. Fetch facts (Mempool → Esplora)
  2. Classify (SAFE_AT_REST, EXPOSED, etc.)
  3. Compute risk score (3 scenarios)
  4. Get recommended action
      ↓
Return AddressResult
      ├─ 200: Success
      ├─ 404: Not found
      ├─ 502: Upstream error
      └─ 500: Unexpected error
```

### Portfolio Upload Flow

```
User uploads CSV file
      ↓
Parse CSV:
  ├─ Detect format (header vs no-header)
  ├─ Extract addresses
  ├─ Deduplicate
  └─ Cap at 1000 rows
      ↓
Preview in UI:
  ├─ Show parsed rows
  ├─ Mark invalid addresses
  ├─ Show duplicates
      ↓
User clicks "Scan"
      ↓
Filter to valid addresses
      ↓
POST /api/v1/portfolio
      ├─ Validate body
      ├─ Validate all addresses
      ├─ Fetch BTC price
      ├─ Resolve in parallel (p-limit)
      ├─ Aggregate summary
      └─ Return batch results
      ↓
Display AddressTable
      ├─ Sortable columns
      ├─ Classification badges
      └─ Risk scores
      ↓
Display ExposureChart
      ├─ Portfolio visualization
      └─ Safe vs exposed breakdown
```

---

## Performance Considerations

### Concurrency Limits

**Portfolio Endpoint:**
- `BULK_CONCURRENCY` env var (default: 6)
- Uses `p-limit` to queue address resolutions
- Prevents overwhelming APIs or machine

**Example:** 1000 addresses with concurrency 6
- Batches of 6 in parallel
- ~167 batches total
- Each batch ~1-2 seconds
- Total time: ~3-5 minutes

### Caching

**In-Memory:**
- Rate limit buckets (LRU, max 10k IPs)
- BTC price (fetch once per request batch)

**No Persistent Cache:**
- Address data fetched fresh each time
- Ensures latest balance/transaction info
- Trade-off: Slightly slower for repeated addresses

### Data Transfer

**CSV Upload Limit:** 1000 rows max (enforced server-side)

**Batch Response Size:** ~500 addresses per minute
- Each AddressResult ~500 bytes JSON
- 500 addresses ~250 KB payload
- Within HTTP limits

---

## Security Considerations

### Input Validation

1. **Address validation:** `bitcoin-address-validation` library + regex
2. **Mainnet only:** Reject testnet addresses
3. **CSV bounds:** Max 1000 rows, max 5000 batch addresses
4. **Rate limiting:** Per-IP token bucket

### Data Safety

1. **No private keys:** System never handles keys
2. **No persistence:** No address data stored
3. **No analytics:** No tracking of scanned addresses
4. **No authentication:** Public API (rate-limited)

### Error Information

- **User errors:** Clear, actionable error messages
- **Server errors:** Generic messages, detailed logs server-side
- **Upstream errors:** Transparent about data source issues

---

## Testing Strategy

### Unit Tests

**Classification Pipeline:**
- `detect-type.test.ts` - Address type detection
- `classify.test.ts` - Risk classification logic
- `score.test.ts` - Risk score computation

**CSV Processing:**
- `parse.test.ts` - CSV parsing edge cases
- `validate.test.ts` - Address validation

**Data Layer:**
- `mempool-client.test.ts` - API response parsing
- `address-source.test.ts` - Fallback logic
- `price-client.test.ts` - Price fetching

### Integration Tests

**API Endpoints:**
- Rate limiting (bucket behavior)
- Error handling (404, 5xx, timeout)
- Response envelope format

### E2E Tests (Playwright)

**Critical Flows:**
- Landing page loads
- Single address scan (happy path)
- Portfolio CSV upload and scanning
- Error states and recovery

---

## Deployment Considerations

### Environment

- **Node.js 20+** required
- **Edge Runtime:** Vercel Edge (streaming may be limited)
- **Node Runtime:** Vercel Serverless (full support)

### Configuration

**Required:**
- `MEMPOOL_API_URL`
- `ESPLORA_API_URL`
- `COINGECKO_API_URL`

**Optional:**
- `VERCEL_KV_REST_API_URL` (for distributed rate limiting)
- `BULK_CONCURRENCY` (default: 6)

### Monitoring

- **Health check:** `GET /api/v1/health`
- **Rate limit headers:** Track remaining quota
- **Error logs:** Monitor upstream API failures
- **Response times:** Portfolio scans should be <30s for 100 addresses

---

**Last Updated:** 2026-05-06  
**Version:** 1.0
