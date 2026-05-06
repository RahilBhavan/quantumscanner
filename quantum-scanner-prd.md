# PRD: Bitcoin Quantum Exposure Scanner
**Version:** 1.0 — May 2026  
**Author:** Rahil Bhavan  
**Status:** Draft  
**Repository:** TBD (open-source, MIT License)

---

## 1. Overview

### 1.1 Problem Statement

Most Bitcoin holders — retail and institutional — cannot answer a simple question: *is my Bitcoin vulnerable to a quantum computer?*

The answer depends entirely on whether the public key behind an address has ever appeared on-chain. Addresses that have never signed a transaction are quantum-safe at rest (protected by hash preimage resistance). Addresses that have signed are exposed — a future cryptographically relevant quantum computer (CRQC) can derive the private key from the visible public key via Shor's algorithm.

This distinction is not surfaced anywhere in the current Bitcoin ecosystem. No wallet, no explorer, no custody platform shows it. The Anchorage Digital paper (Ray, Gautam, Ryan — March 2026) formalizes the classification logic and threat model. This tool makes it accessible to everyone.

### 1.2 Solution

A free, open-source Bitcoin Quantum Exposure Scanner with two distinct user flows:

- **Retail flow** — single address lookup, plain-language risk explanation, action checklist
- **Institutional flow** — CSV bulk upload, portfolio-level dashboard with charts, exportable view

Both flows surface the same underlying data: address type, spend history, exposure classification, USD value at risk, and a CRQC timeline risk score mapped to three named scenarios.

### 1.3 Goals

| Goal | Metric |
|------|--------|
| Educate the Bitcoin community on quantum exposure | 10k+ address lookups in first 30 days |
| Provide institutional-grade portfolio analysis | Used in at least one treasury / research report |
| Establish credibility as a crypto infrastructure builder | GitHub stars, citations in research, inbound DMs |
| Support the Substack article launch | Embedded in the article, linked as the "practical project" |

### 1.4 Non-Goals

- This tool does **not** perform private key management, signing, or migration
- This tool does **not** support chains other than Bitcoin (v1 scope)
- This tool does **not** require user accounts, authentication, or data storage
- This tool does **not** make financial recommendations

---

## 2. Users

### 2.1 Retail User

**Who they are:** Individual Bitcoin holder. May hold on a hardware wallet, a CEX, or self-custody. Technically literate enough to find their own address, but does not know what P2PKH means.

**What they want:** To know if their Bitcoin is at risk and what to do about it.

**What they know:** Their Bitcoin address(es). Possibly their seed phrase situation. Not the cryptographic details.

**Pain points:**
- Can't interpret block explorer data in quantum security terms
- No actionable guidance exists anywhere
- Doesn't know the difference between receiving and spending an address

**Success looks like:** User pastes their address, gets a clear verdict in under 10 seconds, and knows their next action.

---

### 2.2 Institutional User

**Who they are:** Treasury manager, crypto fund analyst, DeFi protocol risk officer, or researcher analyzing custodial Bitcoin exposure. May be evaluating their own holdings or building a report for stakeholders.

**What they want:** A portfolio-level view of quantum exposure across many addresses, with charts they can drop into a deck or report.

**What they know:** Their address list. Possibly labeled by wallet, counterparty, or asset class. Familiar with CSV workflows.

**Pain points:**
- No tooling exists to quantify quantum exposure at portfolio scale
- Institutions need defensible methodology, not hand-waving
- Risk reporting requires visual assets, not just raw numbers

**Success looks like:** Upload 500 addresses, get a dashboard showing safe vs. exposed breakdown by BTC value, with scenario-weighted risk and per-address action items. Screenshot it, send it to the risk committee.

---

## 3. Classification Logic

This is the core engine of the product. Everything else is UI around it.

### 3.1 Address Type Detection

| Address Format | Output Type | Public Key Exposure |
|----------------|-------------|-------------------|
| Starts with `1` | P2PKH | Hidden behind HASH160 |
| Starts with `3` | P2SH (may wrap P2WPKH) | Hidden until spend |
| Starts with `bc1q` (20-byte program) | P2WPKH | Hidden behind HASH160 |
| Starts with `bc1q` (32-byte program) | P2WSH | Hidden — script revealed at spend |
| Starts with `bc1p` | P2TR (Taproot) | **X-only pubkey exposed at receipt** |
| Legacy P2PK (rare, no address) | P2PK | **Full pubkey embedded in scriptPubKey** |

### 3.2 Spend History Check

For P2PKH, P2SH-P2WPKH, and P2WPKH addresses (where the pubkey is hidden at rest): query the address's transaction history. If any transaction has **spent from** this address, the public key was revealed in the scriptSig or witness at that moment.

**Rule:** If `address.tx_count > 0 AND address.has_outgoing_tx == true` → pubkey is exposed.

### 3.3 Exposure Classification

| Classification | Condition | Meaning |
|----------------|-----------|---------|
| **SAFE AT REST** 🟢 | P2PKH/P2WPKH/P2SH-P2WPKH, never spent from | Quantum computer cannot extract private key; turnstile migration available post-freeze |
| **EXPOSED** 🔴 | Any address that has signed a transaction, OR P2TR key-path, OR P2PK | Public key is on-chain; Shor's algorithm can derive private key from a CRQC |
| **EMPTY** ⚪ | Address has no UTXO balance | No funds at risk; classification still shown for completeness |
| **UNRESOLVABLE** ⚠️ | Address format not recognized, or API error | Manual review required |

### 3.4 CRQC Scenario Definitions

Source: Global Risk Institute 2024 Quantum Threat Timeline Report (cited as [3] in the Anchorage paper).

| Scenario | CRQC Arrival Window | Probability Basis |
|----------|--------------------|--------------------|
| **Conservative** | 2040+ | Low-end expert estimates; assumes major hardware obstacles |
| **Base** | 2033–2037 | IBM roadmap + GRI median survey; ~30–50% by 2034 |
| **Aggressive** | 2029–2032 | Accelerated progress; nation-state investment; top-end GRI estimate |

**Composite Risk Score (0–100):**

```
risk_score = (exposed_btc_value / total_btc_value) × 100
             × scenario_weight
             × (1 / years_to_crqc)^0.5
```

Displayed as a single integer with a label: LOW / MODERATE / HIGH / CRITICAL.

For retail: show only the Base scenario score with a toggle to see Conservative/Aggressive.  
For institutional: show all three scenarios as a grouped bar chart.

---

## 4. Product Structure

### 4.1 Information Architecture

```
/ (Landing)
├── /scan (Retail flow — single address)
├── /portfolio (Institutional flow — CSV upload + dashboard)
├── /api/v1/address/:address (Public JSON API)
├── /api/v1/portfolio (POST — accepts array of addresses)
├── /methodology (Explainer: classification logic, data sources, limitations)
└── /about (Project, paper citation, author)
```

### 4.2 Landing Page

Single-purpose: establish credibility and route users to the right flow.

**Above the fold:**
- Headline: "Is your Bitcoin quantum-safe?"
- Subheadline: Two sentences explaining the exposure problem
- Two CTAs: "Check an address" (retail) / "Scan a portfolio" (institutional)
- Live counter: total BTC scanned, % exposed (aggregate, no individual data stored)

**Below the fold:**
- Three-panel explainer: The Threat / The Classification / The Action
- "Based on research by Anchorage Digital (March 2026)" with paper link
- GitHub badge + star count

---

## 5. Retail Flow

### 5.1 User Journey

1. User arrives at `/scan`
2. Pastes a Bitcoin address into the input field
3. Tool resolves: address type → spend history → classification → current BTC balance → USD value
4. Result card renders with:
   - Classification badge (SAFE AT REST / EXPOSED)
   - Current balance + USD value at risk
   - Risk score (Base scenario) with Conservative/Aggressive toggle
   - Plain-language explanation (one paragraph, no jargon)
   - Action checklist
5. User can paste another address (stateless, no history saved)

### 5.2 Result States

**SAFE AT REST**
```
🟢 SAFE AT REST
0.4821 BTC — $32,783 USD

Your public key has never appeared on the Bitcoin blockchain.
A quantum computer cannot extract your private key from your address alone.
Your funds are protected by hash preimage resistance — a property
that even quantum computers cannot efficiently break.

Base scenario risk score: 12 / 100

What this means for you:
✓ Your funds are currently safe from quantum attack
✓ If Bitcoin disables classical signatures (ECDSA), a "turnstile"
  migration mechanism would let you recover your coins — no public
  key exposure required
⚠ Do not spend from this address before migrating to a
  post-quantum scheme

Next steps:
□ Monitor BIP-360 and QBIP Phase A activation
□ Ensure you have your seed phrase backed up securely
□ Do not reuse this address
```

**EXPOSED**
```
🔴 EXPOSED
2.1043 BTC — $143,092 USD

Your public key appeared on the Bitcoin blockchain on [date of first spend].
A sufficiently powerful quantum computer could derive your private key
from this public key using Shor's algorithm.

Base scenario risk score: 71 / 100

What this means for you:
✗ This address is NOT protected by hash commitments
✗ Once a CRQC exists, this private key can be computed in hours
✗ The "turnstile" migration mechanism does NOT apply to this address

Next steps:
□ Move funds to a new P2PKH address that has never been spent from
□ Never sign another transaction from the new address until migrating
  to a post-quantum scheme
□ Track the QBIP Phase A timeline — proactive migration must happen
  before a CRQC exists
```

### 5.3 Edge Cases

| Case | Handling |
|------|----------|
| P2TR address | Classified as EXPOSED immediately (x-only pubkey embedded) with explanation |
| Address with zero balance | Show classification anyway with "No funds currently at risk" note |
| Address with 100+ transactions | Flag as "high reuse — multiple exposure events" |
| Invalid address format | Inline validation error before API call |
| API timeout / rate limit | Graceful error state, retry button, note about using mempool.space directly |

---

## 6. Institutional Flow

### 6.1 User Journey

1. User arrives at `/portfolio`
2. Either pastes CSV content or uploads a `.csv` file
3. CSV format: `address, label (optional), wallet (optional)`
4. Tool validates addresses, shows preview of first 5 rows with detected types
5. User clicks "Scan Portfolio" — batch API calls with progress indicator
6. Dashboard renders when complete

### 6.2 Dashboard Components

**Portfolio Summary Bar (top)**
- Total addresses scanned
- Total BTC across portfolio
- Total USD value
- % SAFE AT REST vs. % EXPOSED (by count and by BTC value)

**Exposure Breakdown Chart**
- Stacked bar: BTC value by classification (SAFE / EXPOSED / EMPTY)
- Color coded: green / red / gray
- Hover tooltip showing address count per category

**CRQC Risk Score Panel**
- Three scenario cards side by side: Conservative / Base / Aggressive
- Each shows: composite risk score (0–100), risk label, estimated window
- Brief one-line explanation of scenario assumption

**Address-Level Table**
- Columns: Address (truncated), Label, Wallet, Type, Classification, Balance (BTC), Balance (USD), Risk Score, Recommended Action
- Sortable by any column
- Filterable by classification
- Row color coding (green = safe, red = exposed)

**Recommended Actions Summary**
- Aggregated action list: "X addresses (Y BTC) should be migrated immediately", etc.
- Links out to methodology for each recommendation

### 6.3 CSV Format Spec

```csv
address,label,wallet
1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf,Genesis block,Cold Storage
bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq,Treasury address 1,Multisig
3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy,Exchange deposit,Binance
```

**Validation rules:**
- Max 1,000 addresses per upload (MVP)
- Label and wallet columns optional
- Duplicate addresses flagged but not removed (institutional may intentionally track same address across wallets)
- Malformed addresses flagged inline before scan begins

---

## 7. Public API

The scanner exposes a clean public JSON API so other tools can consume the classification logic.

### 7.1 Single Address

```
GET /api/v1/address/:address

Response:
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf",
  "type": "P2PKH",
  "classification": "SAFE_AT_REST",
  "pubkey_exposed": false,
  "first_seen": "2009-01-03",
  "last_spend": null,
  "balance_btc": 50.0,
  "balance_usd": 3400000,
  "risk_score": {
    "conservative": 4,
    "base": 11,
    "aggressive": 28
  },
  "recommended_action": "MONITOR",
  "data_source": "mempool.space",
  "methodology_url": "https://[domain]/methodology"
}
```

### 7.2 Batch Portfolio

```
POST /api/v1/portfolio
Body: { "addresses": ["addr1", "addr2", ...] }  // max 100 per call

Response:
{
  "summary": {
    "total_addresses": 100,
    "total_btc": 142.3,
    "safe_at_rest_btc": 98.1,
    "exposed_btc": 44.2,
    "risk_score_base": 31
  },
  "addresses": [ ...same structure as single address... ]
}
```

**Rate limiting:** 60 requests/minute per IP for single address; 10 requests/minute for batch. Headers follow standard `X-RateLimit-*` convention.

---

## 8. Tech Stack Recommendation

### 8.1 Why Next.js 14 + TypeScript

- **API routes** handle blockchain data fetching server-side, avoiding CORS issues with public mempool APIs and keeping your requests from being blocked in-browser
- **SSR / SSG** means the landing page and methodology pages are indexed by search engines — critical for a public good that needs organic discovery
- **Vercel deployment** is one command, free tier handles substantial traffic, custom domain is trivial to add later
- **TypeScript** enforces type safety on address parsing and classification logic — the place you least want a runtime bug
- **No backend infrastructure needed** — stateless by design, no database, no auth

### 8.2 Full Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | SSR, API routes, Vercel-native |
| Language | TypeScript | Type-safe address parsing |
| Styling | Tailwind CSS | Fast, consistent, no CSS files |
| Charts | Recharts | React-native, no D3 complexity |
| UI Components | shadcn/ui | Unstyled, accessible, customizable |
| Blockchain API | mempool.space (primary), Blockstream Esplora (fallback) | Both free, no API key, reliable |
| CSV Parsing | Papa Parse | Battle-tested browser CSV library |
| Deployment | Vercel | Zero-config, free tier, instant previews |
| Repository | GitHub (MIT License) | Open-source, portfolio-visible |

### 8.3 Data Flow

```
User Input (address / CSV)
    ↓
Address Validation (regex + checksum, client-side)
    ↓
Next.js API Route (/api/v1/address)
    ↓
mempool.space API → address type + tx history + balance
    ↓
Classification Engine (TypeScript pure function)
    ↓
Risk Score Calculation
    ↓
JSON Response → React UI renders result
```

No database. No user data persisted. Every request is stateless.

---

## 9. Methodology Page

This is non-negotiable for institutional credibility. The methodology page documents:

1. **Address type detection** — how each output type is identified, what it means for exposure
2. **Spend history lookup** — what API is called, what "exposed" means technically
3. **Classification rules** — exact decision tree with code reference (link to GitHub)
4. **CRQC scenario definitions** — source (GRI 2024), exact probability bands, how scenarios map to the risk score formula
5. **Risk score formula** — written out explicitly, with inputs defined
6. **Limitations** — fork chain exposure can't be detected; off-chain pubkey disclosure can't be detected; P2SH multisig complexity; API data freshness
7. **Primary source** — full citation of the Anchorage Digital paper with link

---

## 10. Limitations (Documented In-Product)

These must be surfaced to users, not buried in a footnote:

| Limitation | Where Shown |
|------------|-------------|
| Fork chain exposure (BCH, BTG spends expose pubkey on Bitcoin too) | Methodology page + tooltip on SAFE AT REST results |
| Off-chain disclosure (signed messages, PoR schemes) | Methodology page |
| P2SH-wrapped multisig complexity | Shown on any P2SH result that isn't clearly P2SH-P2WPKH |
| API data is from public mempool nodes, not a full node | Footer + methodology |
| USD prices are spot, not time-weighted | Balance display tooltip |
| Max 1,000 addresses per portfolio scan | Shown on upload screen |

---

## 11. MVP Scope vs. v2

### v1 (MVP — target: 2 weeks)

- [x] Landing page with routing
- [x] Retail single-address scan flow
- [x] Classification engine (all address types)
- [x] CRQC risk score (3 scenarios)
- [x] Result states (SAFE / EXPOSED / EMPTY / UNRESOLVABLE)
- [x] Institutional CSV upload + dashboard
- [x] Portfolio summary + exposure chart + address table
- [x] Public API (single address + batch)
- [x] Methodology page
- [x] GitHub README with paper citation
- [x] Vercel deployment

### v2 (post-launch)

- [ ] xpub / zpub input for HD wallet scanning (derives child addresses automatically)
- [ ] Ethereum support (Keccak-committed addresses, never-sent subset)
- [ ] Shareable report URLs (hash of address set, no PII)
- [ ] Embeddable widget (`<iframe>` or web component)
- [ ] API key system for high-volume institutional users
- [ ] Email alerts: "notify me when QBIP Phase A activates"
- [ ] Historical analysis: track exposure of an address set over time

---

## 12. Open Questions

| Question | Decision Needed By |
|----------|--------------------|
| Domain name — standalone (quantumcheck.io, btcquantum.xyz, etc.) vs. subdomain of rahilbhavan.com | Before launch |
| Include Ethereum in v1 or strict Bitcoin-only? | Before dev start |
| Live BTC price feed (CoinGecko API) or static fallback? | Before dev start |
| How to handle mempool.space rate limits during institutional bulk scans — queue with progress bar, or batch with delay? | During development |
| Attribution — cite Anchorage paper prominently; reach out to authors before launch? | Before launch |

---

## 13. Success Metrics

| Metric | Target (30 days post-launch) |
|--------|------------------------------|
| Unique addresses scanned | 10,000+ |
| GitHub stars | 100+ |
| Inbound citations / mentions | 3+ (research, newsletters, social) |
| API calls (external) | 1,000+ |
| Substack article reads (linked tool) | Top 10% of series |
