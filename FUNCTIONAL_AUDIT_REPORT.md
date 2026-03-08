# BondScope — Functional Readiness Audit Report

**Audit type:** Product functionality (full system)  
**Scope:** Repository-wide (README, docs, APIs, services, UI, config, scripts)

---

## 1. PROJECT PURPOSE

**BondScope** is a **bond and equity portfolio dashboard** delivered as a monorepo:

- **Frontend:** Next.js (App Router) + TypeScript at http://localhost:3000  
- **Backend:** FastAPI + SQLite (SQLAlchemy) at http://localhost:8000  
- **Proxy:** Next.js rewrites `/api/*` → backend so the app uses `fetch("/api/...")`.

Declared capabilities:

- Track **trades** (equity positions) and **bonds** (manual entry).
- Show **stock prices** via external source (Stooq), with caching.
- Compute **bond metrics**: YTM (bisection), current yield, duration (ACT/365), cashflows.
- **Watchlist** of tickers with current price and a simple status signal.
- **AI** (Mistral): portfolio report and Q&A on app data only; no investment advice, disclaimer always shown.

---

## 2. EXPECTED FEATURES

Derived from README, structure, and APIs:

| # | Feature | Source |
|---|--------|--------|
| 1 | Monorepo: single `npm run dev` runs frontend + backend | README, package.json |
| 2 | Dashboard: total value (stocks at current price + bonds at entered price) | README, UI |
| 3 | Dashboard: allocation (stocks vs bonds) and top positions | README, UI |
| 4 | Portfolio: add trade (ticker, qty, buy_price, buy_date) | README, API + UI |
| 5 | Portfolio: table of trades, delete trade | README, API + UI |
| 6 | Portfolio: aggregate by ticker — avg cost, current price, PnL | README, UI |
| 7 | Bonds: add bond (name, face, coupon_rate, coupon_freq, price, maturity_date) | README, API + UI |
| 8 | Bonds: table of bonds, delete bond | README, API + UI |
| 9 | Bonds: on select — metrics (YTM, current yield, duration) + cashflows table | README, API + UI |
| 10 | Bond math: cashflows, YTM bisection, current yield, duration (ACT/365) | README, bonds_math.py |
| 11 | Watchlist: add ticker, list tickers, delete | README, API + UI |
| 12 | Watchlist: current price per ticker; signal "ok" / "price unavailable" | README, UI |
| 13 | Stock prices: server fetch (Stooq), 60s cache, 4xx when no data | README, main.py |
| 14 | AI report: generate report (summary, bullets, risks, questions, disclaimer) | README, AI section |
| 15 | AI chat: Q&A on portfolio/bonds/watchlist data; disclaimer | README, AI section |
| 16 | AI: no buy/sell/short advice; no price prediction; facts-only | README, prompts |
| 17 | AI: 501 when MISTRAL_API_KEY unset; rate limit 20/min | README, main.py |
| 18 | Persistence: SQLite (trades, bonds, watchlist) | README, database.py, models |
| 19 | API proxy /api/* → backend | README, next.config.js |
| 20 | Global nav: Dashboard, Portfolio, Bonds, Watchlist, AI | layout.tsx |
| 21 | 404 page with link back to Dashboard | not-found.tsx |
| 22 | Backend validation (Pydantic) and CORS | schemas.py, main.py |
| 23 | Backend tests (API, bonds_math, facts) | README, tests/ |

---

## 3. IMPLEMENTED FEATURES

| # | Feature | Implementation |
|---|--------|----------------|
| 1 | Monorepo, `npm run dev` | Root package.json: `concurrently` runs frontend (3000) and backend (8000). |
| 2 | Dashboard total value | page.tsx: trades → positions by ticker; fetches /api/prices; stocks = Σ(qty×price); bonds = Σ(bond.price). |
| 3 | Dashboard allocation + top positions | Bar (stocks % / bonds %), table of top 10 positions (name, type, value). |
| 4–6 | Portfolio: add trade, table, delete, aggregate (avg cost, current price, PnL) | GET/POST/DELETE /trades; UI form + table; positions from trades + /api/prices; delete button. |
| 7–9 | Bonds: add, list, delete, metrics on click | GET/POST/DELETE /bonds; GET /bonds/{id}/metrics (ytm, current_yield, duration, cashflows); UI form, table, expand. |
| 10 | Bond math | bonds_math.py: cashflows, ytm_from_price_bisection, current_yield, macaulay_duration, modified_duration (ACT/365). |
| 11–12 | Watchlist: add, list, delete, price + signal | GET/POST/DELETE /watchlist; UI fetches /api/prices per ticker; signal "ok" or "price unavailable". |
| 13 | Stock prices | Stooq CSV fetch in main.py; 60s in-memory cache; 400/404 on missing/invalid ticker. |
| 14–17 | AI report + chat, constraints, 501, rate limit | POST /ai/report, /ai/chat; prompts (facts-only, no advice); 501 + message when no key; in-memory 20 req/min. |
| 18 | SQLite persistence | database.py (yielddesk.sqlite), models (Trade, Bond, Watch), init_db on startup. |
| 19 | API proxy | next.config.js: /api/:path* → http://127.0.0.1:8000/:path*. |
| 20 | Global nav | layout.tsx: links to /, /portfolio, /bonds, /watchlist, /ai. |
| 21 | 404 page | app/not-found.tsx: "Page not found" + link to Dashboard. |
| 22 | Validation + CORS | schemas.py: Field constraints, coupon_freq in (1,2,4,12); main.py: CORSMiddleware for localhost:3000. |
| 23 | Backend tests | tests/: test_api (health, CRUD, prices mock, AI 501), test_bonds_math, test_facts; pytest, in-memory DB. |

---

## 4. PARTIALLY IMPLEMENTED FEATURES

| # | Feature | Gap |
|---|--------|-----|
| **AI report timeframe** | ReportRequest has optional `timeframe`; it is only concatenated into the user prompt as text. No server-side filtering of trades/bonds by date range. Model may interpret it loosely. |
| **Dashboard total when price fails** | If /api/prices fails for a ticker (e.g. Stooq down or unknown symbol), that position contributes 0 to stocks value. Total can understate; no explicit "price unavailable" in the total. |
| **Facts total_value** | get_facts() uses stocks cost (Σ qty×buy_price) + bonds value. So "total_value" in facts is cost-based for stocks, not mark-to-market. Report may say "total value" while facts are cost-based for equity. |

---

## 5. MISSING FEATURES

- **Export:** No CSV/PDF export of portfolio, bonds, watchlist, or AI report. Not promised in README; optional for MVP.
- **Notifications / alerts:** No email or in-app alerts (e.g. watchlist price thresholds). Not in README.
- **Authentication:** No login or user accounts. Single-user, local use only. Not in README.
- **Multi-portfolio / tags:** Single set of trades/bonds/watchlist; no tagging or multiple books.
- **Historical prices for portfolio:** Only current price from Stooq; no historical series for charts or historical PnL.

---

## 6. USER FLOWS STATUS

### Flow 1: Data ingestion — trades

- **Input:** User enters ticker, qty, buy_price, buy_date on /portfolio → Submit.  
- **Processing:** POST /api/trades → Pydantic validation → SQLite insert.  
- **Storage:** trades table (id, ticker, quantity, buy_price, buy_date).  
- **Output:** Table updates; positions recomputed (avg cost, current price from /api/prices, PnL).  
- **Status:** End-to-end working.

### Flow 2: Data ingestion — bonds

- **Input:** User enters name, face, coupon %, freq, price, maturity on /bonds → Add.  
- **Processing:** POST /api/bonds (coupon % → decimal in UI) → validation → SQLite insert.  
- **Storage:** bonds table.  
- **Output:** Bond appears in table; click → GET /bonds/{id}/metrics → YTM, duration, cashflows.  
- **Status:** End-to-end working.

### Flow 3: Data ingestion — watchlist

- **Input:** User enters ticker on /watchlist → Add.  
- **Processing:** POST /api/watchlist → SQLite insert.  
- **Storage:** watchlist table.  
- **Output:** Row with ticker; price from /api/prices; signal ok/unavailable.  
- **Status:** End-to-end working.

### Flow 4: Stock price fetch

- **Input:** Request for price (Dashboard, Portfolio positions, Watchlist).  
- **Processing:** GET /api/prices?ticker=X → cache check → Stooq CSV fetch → parse latest Close.  
- **Storage:** In-memory cache 60s; no DB.  
- **Output:** { ticker, price, cached } or 404.  
- **Status:** Working; 404 and cache behavior correct. External dependency (Stooq) can make price "unavailable".

### Flow 5: Bond metrics (analysis logic)

- **Input:** Bond id (from UI click).  
- **Processing:** GET /bonds/{id}/metrics → bonds_math (cashflows, YTM bisection, current_yield, macaulay_duration, modified_duration).  
- **Storage:** No new storage; read from bonds table.  
- **Output:** JSON: ytm, current_yield, duration, cashflows[].  
- **Status:** End-to-end working.

### Flow 6: Dashboard aggregation

- **Input:** Page load /.  
- **Processing:** GET /trades, GET /bonds; for each ticker in trades, GET /api/prices; compute stocks value, bonds value, top positions.  
- **Storage:** Read-only.  
- **Output:** Total value, allocation bar, top positions table.  
- **Status:** Working. Stocks value can be understated if any price request fails.

### Flow 7: AI report

- **Input:** User clicks Generate on /ai (Report tab).  
- **Processing:** POST /ai/report → get_facts(db) → Mistral with system + report instructions + facts (+ optional timeframe text) → parse JSON → ReportResponse.  
- **Storage:** Read from DB for facts; no write.  
- **Output:** summary_md, bullets, risks, questions_to_check, disclaimer; rendered with ReactMarkdown.  
- **Status:** End-to-end when MISTRAL_API_KEY set. 501 and rate limit behave as documented.

### Flow 8: AI chat

- **Input:** User types message on /ai (Chat tab) → Send.  
- **Processing:** POST /ai/chat → get_facts(db) → Mistral with chat instructions + facts + message → parse JSON → ChatResponse.  
- **Storage:** Read from DB.  
- **Output:** answer_md + disclaimer; appended to chat history; markdown rendered.  
- **Status:** End-to-end when API key set. Chat history is in-memory only (lost on refresh).

### Flow 9: Error / not found

- **Input:** Navigate to unknown path (e.g. /foo).  
- **Processing:** Next.js renders not-found.tsx.  
- **Output:** 404 message + "Back to Dashboard".  
- **Status:** Working.

---

## 7. FUNCTIONAL GAPS

1. **AI report "timeframe":** Accepted but not used to filter data; only passed as text to the model. Consider filtering trades/bonds by date when timeframe is provided.  
2. **Facts "total_value" semantics:** Facts use cost for stocks; AI may describe it as "total value". Consider renaming to "total_cost" for stocks or adding a note in prompts.  
3. **Dashboard when price fails:** No explicit indication that some positions have no price (e.g. "Part of total uses cost").  
4. **Chat history persistence:** Chat is session-only; no DB or local storage.  
5. **No export path:** Cannot export portfolio or report for external use (optional).  
6. **Database filename:** Still `yielddesk.sqlite` in code; product name is BondScope (cosmetic).

---

## 8. FINAL PRODUCT READINESS

**Verdict:** The product is **functionally ready for the described MVP**: bond and equity portfolio dashboard with manual data entry, live stock prices (Stooq), bond metrics, watchlist with simple signal, and AI report/chat with guardrails. All advertised user flows work end-to-end. Gaps are either partial (timeframe, facts wording, dashboard when price fails) or out-of-scope (export, notifications, auth). Tests cover backend API, bond math, and facts collection.

**Recommendation:** Ship for single-user/local use. Before broader use: (1) clarify or implement report timeframe handling, (2) optionally add export, (3) consider persisting or documenting chat history behavior.

---

## 9. CHECKLIST

| Feature | Status |
|--------|--------|
| Monorepo, one-command run (npm run dev) | ✔ Feature fully working |
| Dashboard: total value (stocks + bonds) | ✔ Feature fully working |
| Dashboard: allocation (stocks vs bonds) bar | ✔ Feature fully working |
| Dashboard: top positions | ✔ Feature fully working |
| Portfolio: add trade (form + API) | ✔ Feature fully working |
| Portfolio: table of trades | ✔ Feature fully working |
| Portfolio: delete trade | ✔ Feature fully working |
| Portfolio: positions by ticker (avg cost, current price, PnL) | ✔ Feature fully working |
| Bonds: add bond (form + API) | ✔ Feature fully working |
| Bonds: table + delete | ✔ Feature fully working |
| Bonds: metrics on click (YTM, duration, cashflows) | ✔ Feature fully working |
| Bond math (cashflows, YTM, current yield, duration) | ✔ Feature fully working |
| Watchlist: add/list/delete ticker | ✔ Feature fully working |
| Watchlist: current price + signal (ok / unavailable) | ✔ Feature fully working |
| Stock prices: Stooq fetch, 60s cache, 4xx handling | ✔ Feature fully working |
| AI report (summary, bullets, risks, questions, disclaimer) | ✔ Feature fully working |
| AI chat (Q&A on data, disclaimer) | ✔ Feature fully working |
| AI: no advice, facts-only, 501 without key, rate limit | ✔ Feature fully working |
| SQLite persistence (trades, bonds, watchlist) | ✔ Feature fully working |
| API proxy /api/* → backend | ✔ Feature fully working |
| Global navigation (Dashboard, Portfolio, Bonds, Watchlist, AI) | ✔ Feature fully working |
| 404 page | ✔ Feature fully working |
| Backend validation (Pydantic) | ✔ Feature fully working |
| CORS for frontend origin | ✔ Feature fully working |
| Backend tests | ✔ Feature fully working |
| AI report optional timeframe | ⚠ Feature partially implemented (passed as text only) |
| Dashboard when price unavailable for a ticker | ⚠ Feature partially implemented (position = 0, no explicit notice) |
| Facts total_value (stocks = cost) | ⚠ Feature partially implemented (naming/semantics) |
| Export (CSV/PDF) | ✘ Feature missing (not in scope) |
| Notifications / alerts | ✘ Feature missing (not in scope) |
| Authentication | ✘ Feature missing (not in scope) |
