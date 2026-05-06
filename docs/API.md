# API Documentation

**Last Updated:** 2026-05-06

Complete reference for the Quantum Scanner API endpoints, request/response formats, and error codes.

## Base URL

```
https://quantum-scanner.vercel.app/api/v1
```

All endpoints return JSON responses in the consistent envelope format:

```typescript
// Success response
{
  "ok": true,
  "data": { /* endpoint-specific data */ }
}

// Error response
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional context */ }
  }
}
```

---

## Endpoints

### 1. GET `/address/:address`

Scan a single Bitcoin address for quantum computing exposure risk.

#### Request

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Bitcoin mainnet address (P2PKH, P2SH, P2WPKH, P2WSH, P2TR, or P2PK) |

**Examples:**

```bash
# P2PKH (legacy)
curl 'https://quantum-scanner.vercel.app/api/v1/address/1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP'

# P2WPKH (SegWit)
curl 'https://quantum-scanner.vercel.app/api/v1/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'

# P2TR (Taproot)
curl 'https://quantum-scanner.vercel.app/api/v1/address/bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grwdj'
```

#### Response

**Success (200):**

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
    "firstSeen": "2010-01-12T13:30:00Z",
    "lastSpend": null
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | The queried address (echo) |
| `type` | string | Script type: P2PKH, P2SH, P2WPKH, P2WSH, P2TR, P2PK |
| `classification` | string | Risk category: SAFE_AT_REST, EXPOSED, EMPTY, UNRESOLVABLE |
| `pubkeyExposed` | boolean | Is public key exposed on blockchain? |
| `balanceBtc` | number | Current balance in BTC |
| `balanceUsd` | number \| null | Current balance in USD (null if price unavailable) |
| `riskScore` | object | Risk scores across three CRQC scenarios (0–100) |
| `riskScore.conservative` | number | 2040+ timeline (60% weight) |
| `riskScore.base` | number | 2033–2037 timeline (85% weight) |
| `riskScore.aggressive` | number | 2029–2032 timeline (100% weight) |
| `recommendedAction` | string | Action guidance: MONITOR, MIGRATE_IMMEDIATELY, NO_ACTION_NEEDED, MANUAL_REVIEW |
| `dataSource` | string | Which API provided data: mempool.space, blockstream.info |
| `flags` | array | Flags: HIGH_REUSE (>100 transactions) |
| `notes` | array | Notes: P2SH_AMBIGUOUS (cannot determine inner script) |
| `firstSeen` | string \| null | ISO timestamp of first transaction |
| `lastSpend` | string \| null | ISO timestamp of last spending transaction |

#### Error Responses

**400 Bad Request (Invalid Address):**

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "\"abcd1234\" is not a valid mainnet Bitcoin address."
  }
}
```

**404 Not Found:**

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Address not found on blockchain."
  }
}
```

**429 Too Many Requests (Rate Limited):**

```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please slow down."
  }
}
```

**502 Bad Gateway (Upstream API Error):**

```json
{
  "ok": false,
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "Blockchain data temporarily unavailable. Please try again."
  }
}
```

**500 Internal Server Error:**

```json
{
  "ok": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

#### Rate Limiting

**Limit:** 60 requests per 60 seconds per IP

**Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1620000000
```

**When Rate Limited (429):**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1620000060
Retry-After: 30
```

---

### 2. POST `/portfolio`

Batch scan multiple addresses and get portfolio-level summary.

#### Request

**Content-Type:** `application/json`

**Body Schema:**

```json
{
  "addresses": [
    "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy"
  ]
}
```

**Constraints:**

- `addresses` must be an array
- Maximum 5000 addresses per request
- All addresses must be valid mainnet Bitcoin addresses

**Example:**

```bash
curl -X POST 'https://quantum-scanner.vercel.app/api/v1/portfolio' \
  -H 'Content-Type: application/json' \
  -d '{
    "addresses": [
      "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    ]
  }'
```

#### Response

**Success (200):**

```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalAddresses": 2,
      "totalBtc": 2.5,
      "exposedBtc": 0.8,
      "safeAtRestBtc": 1.7
    },
    "addresses": [
      {
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
        "firstSeen": "2010-01-12T13:30:00Z",
        "lastSpend": null
      },
      {
        "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        "type": "P2WPKH",
        "classification": "EXPOSED",
        "pubkeyExposed": true,
        "balanceBtc": 2.0,
        "balanceUsd": 131000,
        "riskScore": {
          "conservative": 10,
          "base": 25,
          "aggressive": 40
        },
        "recommendedAction": "MIGRATE_IMMEDIATELY",
        "dataSource": "mempool.space",
        "flags": ["HIGH_REUSE"],
        "notes": [],
        "firstSeen": "2015-03-20T10:45:00Z",
        "lastSpend": "2024-01-15T08:20:00Z"
      }
    ]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `summary.totalAddresses` | number | Total addresses in request |
| `summary.totalBtc` | number | Sum of all balances |
| `summary.exposedBtc` | number | Sum of exposed address balances |
| `summary.safeAtRestBtc` | number | Sum of safe address balances |
| `addresses` | array | Individual address results (same as single endpoint) |

#### Error Responses

**400 Bad Request (Invalid Body):**

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_BODY",
    "message": "Request body must be valid JSON."
  }
}
```

**400 Bad Request (Invalid Schema):**

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_BODY",
    "message": "Invalid request body.",
    "details": {
      "fieldErrors": {
        "addresses": ["Expected an array"]
      }
    }
  }
}
```

**400 Bad Request (Invalid Addresses):**

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_ADDRESSES",
    "message": "One or more addresses are invalid.",
    "details": {
      "invalid": ["invalid123", "testnet1testnet1testnet1testnet1"]
    }
  }
}
```

**429 Too Many Requests (Rate Limited):**

```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many batch requests. Please slow down."
  }
}
```

**502 Bad Gateway (Upstream Error):**

```json
{
  "ok": false,
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "Blockchain data temporarily unavailable. Please try again."
  }
}
```

#### Rate Limiting

**Limit:** 10 requests per 60 seconds per IP

**Headers:** Same as single address endpoint

#### Performance Notes

- Response time depends on number of addresses and concurrency setting
- 100 addresses: ~5–10 seconds (concurrent)
- 1000 addresses: ~30–60 seconds (concurrent)
- Addresses are resolved in parallel with `BULK_CONCURRENCY` setting (default: 6)

---

### 3. POST `/portfolio/stream`

Batch scan addresses with real-time Server-Sent Events (SSE) streaming.

#### Request

**Content-Type:** `application/json`

**Body Schema:** Same as `/portfolio` endpoint

```json
{
  "addresses": [
    "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
  ]
}
```

**Example:**

```bash
curl -X POST 'https://quantum-scanner.vercel.app/api/v1/portfolio/stream' \
  -H 'Content-Type: application/json' \
  -d '{
    "addresses": [
      "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    ]
  }'
```

#### Response

**Success (200):** SSE stream

**Response Headers:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Transfer-Encoding: chunked
```

**Event Stream (NDJSON):**

```
event: data
data: {"type": "progress", "completed": 0, "total": 2}

event: data
data: {"type": "result", "data": {"address": "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP", ...}}

event: data
data: {"type": "progress", "completed": 1, "total": 2}

event: data
data: {"type": "result", "data": {"address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", ...}}

event: data
data: {"type": "summary", "total": 2, "exposed": 1, "safe": 1, "empty": 0, "unresolvable": 0}
```

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

| Event Type | Fields | Description |
|-----------|--------|-------------|
| `progress` | `completed`, `total` | Real-time progress (updated after each address) |
| `result` | `data` | Individual address result (same as batch endpoint) |
| `summary` | `total`, `exposed`, `safe`, `empty`, `unresolvable` | Final summary with classification counts |
| `error` | `message` | Error event (address-level failures) |

#### Error Responses

**Same error codes as `/portfolio` endpoint**

But errors are typically sent as events within the stream:

```
event: data
data: {"type": "error", "message": "Failed to fetch data for address ..."}
```

#### Rate Limiting

**Limit:** 5 requests per 60 seconds per IP

**Headers:** Same as other endpoints

#### Client Implementation

**JavaScript/TypeScript:**

```typescript
import { streamPortfolioScan } from '@/lib/client/portfolio-stream'

const addresses = ['1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP', '...']

const cancel = streamPortfolioScan({
  addresses,
  onEvent: (event) => {
    if (event.type === 'progress') {
      console.log(`${event.completed}/${event.total}`)
    } else if (event.type === 'result') {
      console.log(event.data.address, event.data.classification)
    } else if (event.type === 'summary') {
      console.log(`Exposed: ${event.exposed}, Safe: ${event.safe}`)
    }
  },
  onDone: () => console.log('Complete'),
  onError: (err) => console.error(err),
})

// Cancel stream if needed
// cancel()
```

---

### 4. GET `/health`

Health check endpoint for monitoring and uptime verification.

#### Request

**No parameters required:**

```bash
curl 'https://quantum-scanner.vercel.app/api/v1/health'
```

#### Response

**Success (200):**

```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-05-06T18:30:00.000Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` for health check |
| `status` | string | Status: healthy |
| `timestamp` | string | ISO timestamp of check time |

#### Rate Limiting

**Limit:** None (unlimited)

#### Usage

Monitor service health and availability:

```bash
# Simple uptime check
curl -s 'https://quantum-scanner.vercel.app/api/v1/health' | jq '.ok'

# With monitoring tool (e.g., healthchecks.io)
curl --fail 'https://quantum-scanner.vercel.app/api/v1/health'
```

---

## Rate Limiting Reference

### Per-IP Token Bucket

Three separate buckets track requests:

```
┌─────────────────────────────────────────┐
│ Single Address (/address/:address)      │
│ Limit: 60 per 60 seconds                │
│ Storage: Vercel KV + LRU fallback       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Batch Portfolio (/portfolio)            │
│ Limit: 10 per 60 seconds                │
│ Storage: Vercel KV + LRU fallback       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Streaming Portfolio (/portfolio/stream) │
│ Limit: 5 per 60 seconds                 │
│ Storage: Vercel KV + LRU fallback       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Health Check (/health)                  │
│ Limit: Unlimited (monitoring exempt)    │
└─────────────────────────────────────────┘
```

### Reset Behavior

**60-second sliding window:**

```
Time: 12:00:00 → First request accepted (1/60)
Time: 12:00:30 → Second request accepted (2/60)
Time: 12:00:59 → Third request accepted (3/60)
Time: 12:01:00 → Window expires, counter resets (1/60)
```

### Checking Rate Limit Status

All successful responses include headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1620000000
```

**Calculation:**

```javascript
const resetTimestamp = parseInt(headers['X-RateLimit-Reset'])
const resetDate = new Date(resetTimestamp * 1000)
const secondsUntilReset = resetTimestamp - Math.floor(Date.now() / 1000)
```

### Handling 429 Responses

When rate limited, response includes `Retry-After` header:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Reset: 1620000060
```

**Recommended backoff:**

```javascript
const retryAfter = parseInt(response.headers['Retry-After'])
setTimeout(() => {
  // Retry request
}, retryAfter * 1000)
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_ADDRESS` | 400 | Address is not a valid mainnet Bitcoin address |
| `INVALID_BODY` | 400 | Request body is invalid JSON or fails schema validation |
| `INVALID_ADDRESSES` | 400 | One or more addresses in batch are invalid |
| `NOT_FOUND` | 404 | Address not found on blockchain |
| `RATE_LIMITED` | 429 | Too many requests; check `Retry-After` header |
| `UPSTREAM_ERROR` | 502 | Blockchain API unavailable; retry later |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Data Types

### AddressType

```typescript
type AddressType = 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR' | 'P2PK' | 'UNKNOWN'
```

| Type | Name | Network | Pubkey Exposure |
|------|------|---------|-----------------|
| P2PKH | Pay to Public Key Hash | Legacy | After spending |
| P2SH | Pay to Script Hash | Legacy | Ambiguous |
| P2WPKH | Pay to Witness PK Hash | SegWit | After spending |
| P2WSH | Pay to Witness Script Hash | SegWit | After spending |
| P2TR | Pay to Taproot | Taproot | Always |
| P2PK | Pay to Public Key | Legacy | Always |
| UNKNOWN | Invalid address | — | N/A |

### Classification

```typescript
type Classification = 'SAFE_AT_REST' | 'EXPOSED' | 'EMPTY' | 'UNRESOLVABLE'
```

| Category | Condition | Risk Level |
|----------|-----------|-----------|
| SAFE_AT_REST | Balance > 0, no spending | Low |
| EXPOSED | Balance > 0, pubkey exposed | Critical |
| EMPTY | Balance = 0 | None |
| UNRESOLVABLE | Invalid address | Unknown |

### RecommendedAction

```typescript
type RecommendedAction = 'MONITOR' | 'MIGRATE_IMMEDIATELY' | 'NO_ACTION_NEEDED' | 'MANUAL_REVIEW'
```

| Action | When | Notes |
|--------|------|-------|
| MONITOR | SAFE_AT_REST | Keep watching, migrate if balance increases |
| MIGRATE_IMMEDIATELY | EXPOSED + balance > 0 | Urgent: move funds to safe address |
| NO_ACTION_NEEDED | EMPTY or UNRESOLVABLE | No risk or insufficient information |
| MANUAL_REVIEW | UNRESOLVABLE | Address invalid; check with explorer |

---

## Examples

### Example 1: Check a Single Address

```bash
curl 'https://quantum-scanner.vercel.app/api/v1/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "type": "P2WPKH",
    "classification": "EXPOSED",
    "pubkeyExposed": true,
    "balanceBtc": 1.5,
    "balanceUsd": 98250,
    "riskScore": {
      "conservative": 18,
      "base": 42,
      "aggressive": 60
    },
    "recommendedAction": "MIGRATE_IMMEDIATELY",
    "dataSource": "mempool.space",
    "flags": [],
    "notes": [],
    "firstSeen": "2016-01-01T00:00:00Z",
    "lastSpend": "2024-03-15T10:30:00Z"
  }
}
```

### Example 2: Batch Scan Multiple Addresses

```bash
curl -X POST 'https://quantum-scanner.vercel.app/api/v1/portfolio' \
  -H 'Content-Type: application/json' \
  -d '{
    "addresses": [
      "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
      "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    ]
  }'
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalAddresses": 3,
      "totalBtc": 5.0,
      "exposedBtc": 1.5,
      "safeAtRestBtc": 3.5
    },
    "addresses": [
      {
        "address": "1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP",
        "type": "P2PKH",
        "classification": "SAFE_AT_REST",
        "pubkeyExposed": false,
        "balanceBtc": 3.5,
        "balanceUsd": null,
        "riskScore": {"conservative": 0, "base": 0, "aggressive": 0},
        "recommendedAction": "MONITOR",
        "dataSource": "mempool.space",
        "flags": [],
        "notes": [],
        "firstSeen": null,
        "lastSpend": null
      },
      {
        "address": "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy",
        "type": "P2SH",
        "classification": "SAFE_AT_REST",
        "pubkeyExposed": false,
        "balanceBtc": 0.0,
        "balanceUsd": 0,
        "riskScore": {"conservative": 0, "base": 0, "aggressive": 0},
        "recommendedAction": "NO_ACTION_NEEDED",
        "dataSource": "mempool.space",
        "flags": [],
        "notes": ["P2SH_AMBIGUOUS"],
        "firstSeen": null,
        "lastSpend": null
      },
      {
        "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        "type": "P2WPKH",
        "classification": "EXPOSED",
        "pubkeyExposed": true,
        "balanceBtc": 1.5,
        "balanceUsd": 98250,
        "riskScore": {"conservative": 18, "base": 42, "aggressive": 60},
        "recommendedAction": "MIGRATE_IMMEDIATELY",
        "dataSource": "mempool.space",
        "flags": [],
        "notes": [],
        "firstSeen": "2016-01-01T00:00:00Z",
        "lastSpend": "2024-03-15T10:30:00Z"
      }
    ]
  }
}
```

### Example 3: Streaming Portfolio Scan (JavaScript)

```javascript
const addresses = [
  '1A1z7agoat24EjMkLvceaf8cGQtCMjjxeP',
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  // ... more addresses
]

const response = await fetch('/api/v1/portfolio/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ addresses }),
})

const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? ''

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const json = line.slice(5).trim()
      const event = JSON.parse(json)

      if (event.type === 'progress') {
        console.log(`Progress: ${event.completed}/${event.total}`)
      } else if (event.type === 'result') {
        console.log(`${event.data.address}: ${event.data.classification}`)
      } else if (event.type === 'summary') {
        console.log(`Summary: ${event.exposed} exposed, ${event.safe} safe`)
      }
    }
  }
}
```

---

## Best Practices

### Rate Limit Handling

```javascript
async function fetchWithRetry(url, options = {}) {
  let attempt = 0
  const maxAttempts = 3

  while (attempt < maxAttempts) {
    const response = await fetch(url, options)

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers['Retry-After']) || 60
      console.log(`Rate limited. Waiting ${retryAfter}s...`)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      attempt++
      continue
    }

    return response
  }

  throw new Error('Max retries exceeded')
}
```

### Batch Requests

For scanning many addresses, use batch endpoint with appropriate concurrency:

```javascript
// Good: Single batch request
const response = await fetch('/api/v1/portfolio', {
  method: 'POST',
  body: JSON.stringify({ addresses: allAddresses }),
})

// Avoid: Rapid sequential single-address requests
for (const address of allAddresses) {
  await fetch(`/api/v1/address/${address}`)
}
```

### Streaming for Large Portfolios

Use `/portfolio/stream` for real-time progress on large scans:

```javascript
const abortController = new AbortController()

streamPortfolioScan({
  addresses: largeAddressList,
  onEvent: (event) => updateUI(event),
  onDone: () => console.log('Done'),
  onError: (err) => handleError(err),
})

// Cancel if needed
// abortController.abort()
```

---

## Changelog

### Version 1.0 (2026-05-06)

- Initial API release
- Three endpoints: single address, batch, streaming
- Rate limiting with Vercel KV + LRU fallback
- Support for all Bitcoin address types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR, P2PK)
- Three CRQC threat scenarios for risk scoring

---

**Last Updated:** 2026-05-06  
**Status:** Production Ready
