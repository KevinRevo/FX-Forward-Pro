# Bloomberg-Style Interbank FX Forward Terminal & CIP Engine

An interbank FX Forward rate analytics and historical comparison platform built to replicate Bloomberg terminal functions (**`FRD`**, **`COMP`**, **`FXFA`**, **`HIST`**).

---

## 🌟 Key Features

1. **FRD (Forward Rate Display)**
   - Displays the full interbank tenor ladder: `ON, TN, SN, 1W, 2W, 3W, 1M, 2M, 3M, 6M, 9M, 1Y, 2Y, 3Y, 5Y`.
   - Real-world settlement dates adhering to **$T+2$** (or **$T+1$** for USD/CAD), **Modified Following**, and **End-of-Month (EOM)** conventions.
   - Quotation breakdown: Base Rate, Quote Rate, Rate Differential, Cross-Currency Basis (XCCY), Forward Swap Points (Bid / Mid / Ask in pips), Outright Forward (Bid / Mid / Ask), and Annualized Premium/Discount.
   - Toggleable Cross-Currency Basis spread for pure CIP vs. real-world interbank pricing.

2. **COMP (Historical Curve Comparison)**
   - Side-by-side forward curve comparison between any two dates in history (e.g. Fed Peak Oct 2023 vs Easing Cycle Sep 2024).
   - Dynamic SVG Term Structure curve charting comparing forward points across all tenors.
   - Comprehensive delta metrics: $\Delta$ Spot, $\Delta$ Outright Forward, $\Delta$ Swap Points (in pips), and $\Delta$ Rate Differential (in bps).

3. **FXFA (FX Forward Analytics & Broken-Date Calculator)**
   - Price non-standard broken dates (e.g., custom contractual maturity dates like 47 days, 134 days, etc.).
   - Exact calendar day counting ($ACT/360$ vs $ACT/365$) and smooth cubic zero-curve interpolation.
   - Full cashflow settlement calculation based on trade notional.

4. **HIST (Historical Tenor Time Series)**
   - Track how any forward tenor (e.g. EUR/USD 3M or USD/JPY 1Y) evolved against spot over time.
   - Dual-chart visualization of Spot vs. Forward Outright and Swap Points evolution.

5. **Two Execution Modes**:
   - **Interactive Web Terminal UI**: Bloomberg dark/amber/cyan financial theme at `http://localhost:3000`.
   - **Command-Line Interface (CLI)**: High-speed ASCII Bloomberg terminal outputs directly in your shell.

---

## 🚀 Quick Start

### 1. Web Terminal
Start the local server:
```bash
npm start
```
Then navigate to: **`http://localhost:3000`** in your browser.

### 2. Command-Line Interface (CLI)
You can query rates and compare historical forward curves directly from the terminal:

* **View standard forward ladder (EUR/USD as of Oct 15, 2023)**:
  ```bash
  node cli.js EURUSD --date 2023-10-15
  ```

* **Compare two historical forward curves side-by-side (COMP)**:
  ```bash
  node cli.js EURUSD --compare 2023-10-15 2024-09-15
  ```

* **Price a custom broken date (FXFA)**:
  ```bash
  node cli.js EURUSD --broken 2024-02-28 --date 2023-10-15
  ```

* **Historical time series of 3M Forward Points**:
  ```bash
  node cli.js EURUSD --history 3M --from 2023-01-01 --to 2024-09-15
  ```

* **Query other currency pairs (USD/JPY, GBP/USD, USD/CAD, USD/CHF, AUD/USD)**:
  ```bash
  node cli.js USDJPY --date 2023-10-15
  ```

---

## 📐 Financial Methodology (CIP & Interbank Standards)

### 1. Covered Interest Rate Parity (CIP)
On the interbank market, forward rates are derived from interest rate differentials:

$$\text{Outright Forward} = S \times \frac{1 + (r_{\text{quote}} + \text{XCCY}) \times \frac{d_{\text{quote}}}{\text{Base}_{\text{quote}}}}{1 + r_{\text{base}} \times \frac{d_{\text{base}}}{\text{Base}_{\text{base}}}}$$

For tenors exceeding 1 year, multi-year compounding is applied:

$$\text{Outright Forward} = S \times \frac{\left(1 + r_{\text{quote}} + \text{XCCY}\right)^{\frac{d_{\text{quote}}}{\text{Base}_{\text{quote}}}}}{\left(1 + r_{\text{base}}\right)^{\frac{d_{\text{base}}}{\text{Base}_{\text{base}}}}}$$

### 2. Swap Points (Forward Points)
$$\text{Swap Points (in pips)} = \frac{\text{Outright Forward} - S}{\text{Pip Size}}$$
* For EUR/USD, GBP/USD, USD/CAD: $1 \text{ pip} = 0.0001$.
* For USD/JPY, EUR/JPY: $1 \text{ pip} = 0.01$.

### 3. Cross-Currency Basis (XCCY)
Post-2008 financial crisis, the pure textbook parity no longer holds due to balance-sheet constraints and USD funding premiums. The tool applies historical cross-currency basis spreads (e.g. -15 to -45 bps) across the term structure.
