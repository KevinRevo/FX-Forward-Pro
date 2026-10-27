# FX Forward Pro | Interbank CIP & Window Forward Analytics

A high-precision institutional FX Forward analytics engine and interactive pricing platform. Supports **Fixed Forwards**, **Broken Dates**, and **Window Forwards** (flexible delivery) with full bidirectional pair quotation (**EUR:USD** and **USD:EUR**).

---

## 🌟 Key Capabilities

### 1. Bidirectional Quoting (EUR:USD $\longleftrightarrow$ USD:EUR)
- Seamlessly invert quoting direction for any pair with 1 click or direct symbol input (`EURUSD`, `USDEUR`, `GBPUSD`, `USDGBP`, `USDJPY`, `JPYUSD`, etc.).
- Exact mathematical parity:
  $$F_{\text{mid}}(Q/B) = \frac{1}{F_{\text{mid}}(B/Q)}$$
  $$F_{\text{bid}}(Q/B) = \frac{1}{F_{\text{ask}}(B/Q)}, \quad F_{\text{ask}}(Q/B) = \frac{1}{F_{\text{bid}}(B/Q)}$$
  $$\text{Swap Points}(Q/B) = \frac{F(Q/B) - S(Q/B)}{\text{Pip Size}(Q/B)}$$

### 2. Fixed Forward Pricing (Standard & Broken Dates)
- Full tenor ladder: `ON, TN, SN, 1W, 2W, 3W, 1M, 2M, 3M, 6M, 9M, 1Y, 2Y, 3Y, 5Y`.
- Single custom contractual maturity dates (e.g. 47 days, 134 days) with smooth cubic zero-curve interpolation.
- Adheres to standard ISDA market calendar conventions: **$T+2$** ($T+1$ for CAD), **Modified Following**, and **End-of-Month (EOM)** rolling rules.

### 3. Window Forward Pricing (Flexible Delivery)
- Interbank pricing for American-style delivery forwards executable on any business day between a **Window Start Date** and a **Window End Date**.
- Applies the **Conservative Interbank Boundary Principle** (eliminating adverse selection for the client and bank):
  - In a **Forward Premium** regime ($F_{\text{end}} > F_{\text{start}}$):
    - *Client Buys Base / Sells Quote*: Priced at Window End ($F_{\text{end}}$).
    - *Client Sells Base / Buys Quote*: Priced at Window Start ($F_{\text{start}}$).
  - In a **Forward Discount** regime ($F_{\text{end}} < F_{\text{start}}$):
    - *Client Buys Base / Sells Quote*: Priced at Window Start ($F_{\text{start}}$).
    - *Client Sells Base / Buys Quote*: Priced at Window End ($F_{\text{end}}$).
- Automatically calculates:
  - Guaranteed Window Rate & Window Points
  - Flexibility Carry Cost vs Fixed Expiry (in pips and settlement cashflow)
  - Full delivery rate corridor schedule across the window duration.

### 4. Dual-Curve Covered Interest Rate Parity (CIP) Engine
- Money-market simple interest for tenors $\le 1\text{ year}$:
  $$F = S \times \frac{1 + (r_{\text{quote}} + \text{XCCY}) \times \frac{d_{\text{quote}}}{\text{Base}_{\text{quote}}}}{1 + r_{\text{base}} \times \frac{d_{\text{base}}}{\text{Base}_{\text{base}}}}$$
- Multi-year annual compounding for tenors $> 1\text{ year}$.
- Dynamic Cross-Currency Basis (XCCY) spread curves across the term structure.

### 5. Historical Curve Comparison & Time Series
- Side-by-side forward curve comparison across any two historical dates with full delta metrics ($\Delta$ Outright, $\Delta$ Swap Points in pips, and $\Delta$ Rate Differential in bps).
- Visual interactive SVG charts for term structure and historical tenor evolution.

---

## 🚀 Quick Start

### 1. Web Application
Start the local server:
```bash
npm start
```
Then navigate to **`http://localhost:3000`** in your browser.
*(Or access the deployed web app on GitHub Pages)*.

### 2. Command-Line Interface (CLI)

```bash
# Standard forward ladder (EUR/USD as of Oct 15, 2023):
node cli.js EURUSD --date 2023-10-15

# Inverted quoting direction (USD/EUR as of Oct 15, 2023):
node cli.js USDEUR --date 2023-10-15

# Price a Window Forward (Flexible delivery between Nov 15, 2023 and Jan 15, 2024):
node cli.js EURUSD --window 2023-11-15 2024-01-15 --direction BUY --date 2023-10-15
node cli.js USDEUR --window 2023-11-15 2024-01-15 --direction BUY --date 2023-10-15

# Price a Fixed Forward on a broken date:
node cli.js EURUSD --broken 2024-02-28 --date 2023-10-15

# Compare two historical forward curves side-by-side:
node cli.js EURUSD --compare 2023-10-15 2024-09-15

# Historical time series for 3M forward points:
node cli.js EURUSD --history 3M --from 2023-01-01 --to 2024-09-15
```
