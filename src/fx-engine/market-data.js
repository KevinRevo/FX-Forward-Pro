/**
 * Market Data & Historical Yield Curve Provider
 * Provides:
 * - Historical & Real-time FX Spot rates (with Yahoo Finance fetcher & disk cache)
 * - Benchmark Risk-Free & OIS Curves across time (SOFR, €STR, SONIA, TONAR, SARON, CORRA, AONIA)
 * - Historical Cross-Currency Basis (XCCY) spreads
 * - Smooth term structure interpolation
 */

const fs = require('fs');
const path = require('path');
const { PAIRS, CURRENCIES } = require('./conventions');

const CACHE_DIR = path.join(__dirname, '..', '..', '.data-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Built-in historical benchmark rate regimes (Annualized %)
// Key dates representing historical market shifts (Pre-COVID, COVID, Fed Hikes, Peak, Easing cycle)
const HISTORICAL_REGIMES = [
  {
    date: '2019-10-15',
    rates: {
      USD: { ON: 1.85, '1M': 1.80, '3M': 1.95, '6M': 1.90, '1Y': 1.70, '2Y': 1.60, '3Y': 1.62, '5Y': 1.65 },
      EUR: { ON: -0.45, '1M': -0.44, '3M': -0.41, '6M': -0.38, '1Y': -0.35, '2Y': -0.30, '3Y': -0.25, '5Y': -0.15 },
      GBP: { ON: 0.70, '1M': 0.72, '3M': 0.78, '6M': 0.85, '1Y': 0.88, '2Y': 0.90, '3Y': 0.95, '5Y': 1.05 },
      JPY: { ON: -0.06, '1M': -0.07, '3M': -0.08, '6M': -0.10, '1Y': -0.12, '2Y': -0.15, '3Y': -0.16, '5Y': -0.20 },
      CHF: { ON: -0.75, '1M': -0.75, '3M': -0.73, '6M': -0.70, '1Y': -0.65, '2Y': -0.60, '3Y': -0.55, '5Y': -0.45 },
      CAD: { ON: 1.75, '1M': 1.75, '3M': 1.78, '6M': 1.80, '1Y': 1.75, '2Y': 1.65, '3Y': 1.65, '5Y': 1.70 },
      AUD: { ON: 0.75, '1M': 0.78, '3M': 0.85, '6M': 0.90, '1Y': 0.90, '2Y': 0.85, '3Y': 0.90, '5Y': 1.05 }
    },
    basisBps: { EURUSD: -18, GBPUSD: -8, USDJPY: -35, USDCHF: -12, USDCAD: -4, AUDUSD: -6 }
  },
  {
    date: '2020-04-15', // COVID Liquidity Crisis
    rates: {
      USD: { ON: 0.05, '1M': 0.15, '3M': 0.25, '6M': 0.30, '1Y': 0.35, '2Y': 0.45, '3Y': 0.55, '5Y': 0.75 },
      EUR: { ON: -0.50, '1M': -0.48, '3M': -0.40, '6M': -0.32, '1Y': -0.25, '2Y': -0.20, '3Y': -0.15, '5Y': 0.00 },
      GBP: { ON: 0.08, '1M': 0.12, '3M': 0.20, '6M': 0.28, '1Y': 0.35, '2Y': 0.40, '3Y': 0.48, '5Y': 0.65 },
      JPY: { ON: -0.05, '1M': -0.05, '3M': -0.04, '6M': -0.03, '1Y': -0.02, '2Y': -0.01, '3Y': 0.01, '5Y': 0.05 },
      CHF: { ON: -0.75, '1M': -0.75, '3M': -0.72, '6M': -0.70, '1Y': -0.65, '2Y': -0.60, '3Y': -0.55, '5Y': -0.45 },
      CAD: { ON: 0.25, '1M': 0.30, '3M': 0.40, '6M': 0.45, '1Y': 0.50, '2Y': 0.55, '3Y': 0.65, '5Y': 0.85 },
      AUD: { ON: 0.25, '1M': 0.25, '3M': 0.28, '6M': 0.32, '1Y': 0.38, '2Y': 0.45, '3Y': 0.55, '5Y': 0.75 }
    },
    basisBps: { EURUSD: -38, GBPUSD: -20, USDJPY: -65, USDCHF: -25, USDCAD: -8, AUDUSD: -12 }
  },
  {
    date: '2022-06-15', // Aggressive Fed Tightening Starts
    rates: {
      USD: { ON: 1.58, '1M': 1.65, '3M': 2.10, '6M': 2.80, '1Y': 3.25, '2Y': 3.40, '3Y': 3.45, '5Y': 3.40 },
      EUR: { ON: -0.50, '1M': -0.45, '3M': -0.15, '6M': 0.35, '1Y': 0.95, '2Y': 1.35, '3Y': 1.50, '5Y': 1.65 },
      GBP: { ON: 1.18, '1M': 1.30, '3M': 1.65, '6M': 2.20, '1Y': 2.65, '2Y': 2.80, '3Y': 2.85, '5Y': 2.75 },
      JPY: { ON: -0.04, '1M': -0.03, '3M': -0.02, '6M': 0.01, '1Y': 0.05, '2Y': 0.08, '3Y': 0.10, '5Y': 0.22 },
      CHF: { ON: -0.70, '1M': -0.65, '3M': -0.35, '6M': 0.05, '1Y': 0.45, '2Y': 0.85, '3Y': 1.05, '5Y': 1.20 },
      CAD: { ON: 1.50, '1M': 1.65, '3M': 2.25, '6M': 2.90, '1Y': 3.30, '2Y': 3.45, '3Y': 3.45, '5Y': 3.35 },
      AUD: { ON: 0.85, '1M': 1.15, '3M': 1.75, '6M': 2.45, '1Y': 3.10, '2Y': 3.35, '3Y': 3.45, '5Y': 3.55 }
    },
    basisBps: { EURUSD: -22, GBPUSD: -12, USDJPY: -45, USDCHF: -15, USDCAD: -5, AUDUSD: -7 }
  },
  {
    date: '2023-10-15', // Peak Rates Cycle
    rates: {
      USD: { ON: 5.32, '1M': 5.35, '3M': 5.45, '6M': 5.50, '1Y': 5.45, '2Y': 5.10, '3Y': 4.90, '5Y': 4.75 },
      EUR: { ON: 3.90, '1M': 3.92, '3M': 3.97, '6M': 4.02, '1Y': 3.95, '2Y': 3.45, '3Y': 3.20, '5Y': 2.95 },
      GBP: { ON: 5.19, '1M': 5.22, '3M': 5.30, '6M': 5.40, '1Y': 5.35, '2Y': 4.95, '3Y': 4.70, '5Y': 4.55 },
      JPY: { ON: -0.01, '1M': 0.01, '3M': 0.03, '6M': 0.08, '1Y': 0.15, '2Y': 0.28, '3Y': 0.38, '5Y': 0.58 },
      CHF: { ON: 1.70, '1M': 1.72, '3M': 1.75, '6M': 1.78, '1Y': 1.70, '2Y': 1.50, '3Y': 1.40, '5Y': 1.30 },
      CAD: { ON: 5.00, '1M': 5.05, '3M': 5.15, '6M': 5.25, '1Y': 5.15, '2Y': 4.75, '3Y': 4.50, '5Y': 4.30 },
      AUD: { ON: 4.10, '1M': 4.15, '3M': 4.25, '6M': 4.40, '1Y': 4.45, '2Y': 4.35, '3Y': 4.30, '5Y': 4.40 }
    },
    basisBps: { EURUSD: -25, GBPUSD: -14, USDJPY: -52, USDCHF: -18, USDCAD: -6, AUDUSD: -8 }
  },
  {
    date: '2024-09-15', // Global Easing Cycle Underway
    rates: {
      USD: { ON: 4.85, '1M': 4.82, '3M': 4.70, '6M': 4.50, '1Y': 4.15, '2Y': 3.85, '3Y': 3.75, '5Y': 3.70 },
      EUR: { ON: 3.50, '1M': 3.45, '3M': 3.35, '6M': 3.15, '1Y': 2.90, '2Y': 2.50, '3Y': 2.40, '5Y': 2.35 },
      GBP: { ON: 5.00, '1M': 4.95, '3M': 4.85, '6M': 4.65, '1Y': 4.40, '2Y': 4.05, '3Y': 3.95, '5Y': 3.90 },
      JPY: { ON: 0.23, '1M': 0.25, '3M': 0.28, '6M': 0.35, '1Y': 0.45, '2Y': 0.60, '3Y': 0.70, '5Y': 0.85 },
      CHF: { ON: 1.20, '1M': 1.15, '3M': 1.10, '6M': 1.00, '1Y': 0.90, '2Y': 0.75, '3Y': 0.70, '5Y': 0.70 },
      CAD: { ON: 4.25, '1M': 4.15, '3M': 4.00, '6M': 3.75, '1Y': 3.50, '2Y': 3.20, '3Y': 3.15, '5Y': 3.15 },
      AUD: { ON: 4.35, '1M': 4.35, '3M': 4.35, '6M': 4.30, '1Y': 4.15, '2Y': 3.95, '3Y': 3.90, '5Y': 4.00 }
    },
    basisBps: { EURUSD: -19, GBPUSD: -10, USDJPY: -42, USDCHF: -14, USDCAD: -5, AUDUSD: -7 }
  },
  {
    date: '2026-01-15', // Stabilized Neutral Rates
    rates: {
      USD: { ON: 3.85, '1M': 3.80, '3M': 3.75, '6M': 3.70, '1Y': 3.65, '2Y': 3.70, '3Y': 3.75, '5Y': 3.85 },
      EUR: { ON: 2.50, '1M': 2.48, '3M': 2.45, '6M': 2.40, '1Y': 2.40, '2Y': 2.45, '3Y': 2.50, '5Y': 2.65 },
      GBP: { ON: 4.00, '1M': 3.95, '3M': 3.90, '6M': 3.85, '1Y': 3.80, '2Y': 3.85, '3Y': 3.90, '5Y': 4.05 },
      JPY: { ON: 0.50, '1M': 0.52, '3M': 0.55, '6M': 0.65, '1Y': 0.78, '2Y': 0.95, '3Y': 1.10, '5Y': 1.30 },
      CHF: { ON: 1.00, '1M': 1.00, '3M': 1.00, '6M': 0.98, '1Y': 0.95, '2Y': 0.95, '3Y': 1.00, '5Y': 1.10 },
      CAD: { ON: 3.25, '1M': 3.25, '3M': 3.20, '6M': 3.15, '1Y': 3.15, '2Y': 3.25, '3Y': 3.35, '5Y': 3.50 },
      AUD: { ON: 3.75, '1M': 3.75, '3M': 3.70, '6M': 3.70, '1Y': 3.70, '2Y': 3.80, '3Y': 3.90, '5Y': 4.10 }
    },
    basisBps: { EURUSD: -16, GBPUSD: -9, USDJPY: -38, USDCHF: -12, USDCAD: -4, AUDUSD: -6 }
  }
];

// Fallback spot rate database for popular historical dates (in case offline)
const BASELINE_SPOTS = {
  EURUSD: [
    { date: '2019-10-15', rate: 1.1030 },
    { date: '2020-04-15', rate: 1.0910 },
    { date: '2021-01-05', rate: 1.2295 },
    { date: '2022-06-15', rate: 1.0440 },
    { date: '2022-09-27', rate: 0.9595 }, // Parity trough
    { date: '2023-07-18', rate: 1.1230 },
    { date: '2023-10-15', rate: 1.0515 },
    { date: '2024-01-15', rate: 1.0950 },
    { date: '2024-06-15', rate: 1.0705 },
    { date: '2024-09-15', rate: 1.1080 },
    { date: '2025-01-15', rate: 1.0420 },
    { date: '2026-01-15', rate: 1.0650 },
    { date: '2026-10-27', rate: 1.0825 }
  ],
  GBPUSD: [
    { date: '2019-10-15', rate: 1.2780 },
    { date: '2020-04-15', rate: 1.2510 },
    { date: '2022-09-26', rate: 1.0350 }, // UK mini-budget trough
    { date: '2023-10-15', rate: 1.2140 },
    { date: '2024-09-15', rate: 1.3125 },
    { date: '2026-10-27', rate: 1.2980 }
  ],
  USDJPY: [
    { date: '2019-10-15', rate: 108.85 },
    { date: '2020-04-15', rate: 107.50 },
    { date: '2022-06-15', rate: 134.20 },
    { date: '2023-10-15', rate: 149.50 },
    { date: '2024-07-11', rate: 161.75 }, // JPY peak weakness
    { date: '2024-09-15', rate: 140.80 },
    { date: '2026-10-27', rate: 151.30 }
  ],
  USDCHF: [
    { date: '2019-10-15', rate: 0.9980 },
    { date: '2020-04-15', rate: 0.9660 },
    { date: '2023-10-15', rate: 0.9020 },
    { date: '2024-09-15', rate: 0.8490 },
    { date: '2026-10-27', rate: 0.8650 }
  ],
  USDCAD: [
    { date: '2019-10-15', rate: 1.3200 },
    { date: '2020-04-15', rate: 1.4110 },
    { date: '2023-10-15', rate: 1.3650 },
    { date: '2024-09-15', rate: 1.3580 },
    { date: '2026-10-27', rate: 1.3850 }
  ],
  AUDUSD: [
    { date: '2019-10-15', rate: 0.6750 },
    { date: '2020-04-15', rate: 0.6320 },
    { date: '2023-10-15', rate: 0.6300 },
    { date: '2024-09-15', rate: 0.6710 },
    { date: '2026-10-27', rate: 0.6580 }
  ]
};

// In-memory cache for fast repeated queries
const memoryCache = {
  spots: new Map(),
  curves: new Map()
};

/**
 * Fetch historical or latest Spot rate for a pair on a given date.
 */
async function getSpotRate(pairKey, dateStr) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const cacheKey = `${pairKey}_${dateStr}`;

  if (memoryCache.spots.has(cacheKey)) {
    return memoryCache.spots.get(cacheKey);
  }

  // 1. Check local disk cache
  const diskCacheFile = path.join(CACHE_DIR, `spot_${pairKey}.json`);
  let cachedData = {};
  if (fs.existsSync(diskCacheFile)) {
    try {
      cachedData = JSON.parse(fs.readFileSync(diskCacheFile, 'utf8'));
      if (cachedData[dateStr]) {
        memoryCache.spots.set(cacheKey, cachedData[dateStr]);
        return cachedData[dateStr];
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Fetch from Yahoo Finance if online
  let fetchedRate = null;
  try {
    const targetDate = new Date(dateStr);
    const startPeriod = Math.floor(targetDate.getTime() / 1000) - (86400 * 7); // 7 days window
    const endPeriod = Math.floor(targetDate.getTime() / 1000) + (86400 * 2);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair.yahooTicker}?period1=${startPeriod}&period2=${endPeriod}&interval=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const json = await res.json();
      const result = json.chart?.result?.[0];
      if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;

        // Find closest closing price before or on dateStr
        for (let i = timestamps.length - 1; i >= 0; i--) {
          const tDate = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
          if (tDate <= dateStr && closes[i] != null) {
            fetchedRate = parseFloat(closes[i].toFixed(pair.quoteDecimals));
            cachedData[tDate] = fetchedRate;
            break;
          }
        }
      }
    }
  } catch (err) {
    // network failure or timeout, fallback to interpolation
  }

  // 3. Fallback to baseline interpolation if not found via Yahoo
  if (!fetchedRate) {
    fetchedRate = interpolateHistoricalSpot(pairKey, dateStr);
  }

  // Save to cache
  cachedData[dateStr] = fetchedRate;
  try {
    fs.writeFileSync(diskCacheFile, JSON.stringify(cachedData, null, 2));
  } catch (e) {}

  memoryCache.spots.set(cacheKey, fetchedRate);
  return fetchedRate;
}

/**
 * Interpolate spot rate from known regime dates if online source fails
 */
function interpolateHistoricalSpot(pairKey, dateStr) {
  const list = BASELINE_SPOTS[pairKey] || BASELINE_SPOTS.EURUSD;
  const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (dateStr <= sorted[0].date) return sorted[0].rate;
  if (dateStr >= sorted[sorted.length - 1].date) return sorted[sorted.length - 1].rate;

  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = new Date(sorted[i].date).getTime();
    const d2 = new Date(sorted[i + 1].date).getTime();
    const cur = new Date(dateStr).getTime();

    if (cur >= d1 && cur <= d2) {
      const alpha = (cur - d1) / (d2 - d1);
      const val = sorted[i].rate + alpha * (sorted[i + 1].rate - sorted[i].rate);
      const pair = PAIRS[pairKey] || PAIRS.EURUSD;
      return parseFloat(val.toFixed(pair.quoteDecimals));
    }
  }

  return sorted[sorted.length - 1].rate;
}

/**
 * Get the full interest rate yield curve for a given currency on a historical date.
 * Returns { ON, 1W, 1M, 2M, 3M, 6M, 9M, 1Y, 2Y, 3Y, 5Y } as annualized percentages.
 */
function getYieldCurve(currency, dateStr) {
  const ccy = currency.toUpperCase();
  const sortedRegimes = [...HISTORICAL_REGIMES].sort((a, b) => new Date(a.date) - new Date(b.date));

  let curvePoints = null;

  if (dateStr <= sortedRegimes[0].date) {
    curvePoints = sortedRegimes[0].rates[ccy] || sortedRegimes[0].rates.USD;
  } else if (dateStr >= sortedRegimes[sortedRegimes.length - 1].date) {
    curvePoints = sortedRegimes[sortedRegimes.length - 1].rates[ccy] || sortedRegimes[sortedRegimes.length - 1].rates.USD;
  } else {
    // Linear time interpolation between the two nearest regime dates
    for (let i = 0; i < sortedRegimes.length - 1; i++) {
      const t1 = new Date(sortedRegimes[i].date).getTime();
      const t2 = new Date(sortedRegimes[i + 1].date).getTime();
      const tCur = new Date(dateStr).getTime();

      if (tCur >= t1 && tCur <= t2) {
        const weight = (tCur - t1) / (t2 - t1);
        const r1 = sortedRegimes[i].rates[ccy] || sortedRegimes[i].rates.USD;
        const r2 = sortedRegimes[i + 1].rates[ccy] || sortedRegimes[i + 1].rates.USD;

        curvePoints = {};
        for (const k of ['ON', '1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y']) {
          curvePoints[k] = r1[k] + weight * (r2[k] - r1[k]);
        }
        break;
      }
    }
  }

  // Derive intermediate points (1W, 2W, 2M, 9M)
  return enrichCurve(curvePoints);
}

function enrichCurve(raw) {
  const curve = { ...raw };
  // 1W ~ ON + 0.35 * (1M - ON)
  curve['1W'] = raw['1W'] || (raw.ON + 0.35 * (raw['1M'] - raw.ON));
  // 2W ~ ON + 0.65 * (1M - ON)
  curve['2W'] = raw['2W'] || (raw.ON + 0.65 * (raw['1M'] - raw.ON));
  // 2M ~ 1M + 0.5 * (3M - 1M)
  curve['2M'] = raw['2M'] || (raw['1M'] + 0.5 * (raw['3M'] - raw['1M']));
  // 9M ~ 6M + 0.5 * (1Y - 6M)
  curve['9M'] = raw['9M'] || (raw['6M'] + 0.5 * (raw['1Y'] - raw['6M']));
  return curve;
}

/**
 * Get Cross-Currency Basis (XCCY) spread in basis points (bps) for a pair on a date.
 */
function getCrossCurrencyBasisBps(pairKey, dateStr, tenor = '3M') {
  const sortedRegimes = [...HISTORICAL_REGIMES].sort((a, b) => new Date(a.date) - new Date(b.date));
  let basis = -20; // default -20 bps

  if (dateStr <= sortedRegimes[0].date) {
    basis = sortedRegimes[0].basisBps[pairKey] ?? -15;
  } else if (dateStr >= sortedRegimes[sortedRegimes.length - 1].date) {
    basis = sortedRegimes[sortedRegimes.length - 1].basisBps[pairKey] ?? -15;
  } else {
    for (let i = 0; i < sortedRegimes.length - 1; i++) {
      const t1 = new Date(sortedRegimes[i].date).getTime();
      const t2 = new Date(sortedRegimes[i + 1].date).getTime();
      const tCur = new Date(dateStr).getTime();

      if (tCur >= t1 && tCur <= t2) {
        const weight = (tCur - t1) / (t2 - t1);
        const b1 = sortedRegimes[i].basisBps[pairKey] ?? -15;
        const b2 = sortedRegimes[i + 1].basisBps[pairKey] ?? -15;
        basis = b1 + weight * (b2 - b1);
        break;
      }
    }
  }

  // Term structure adjustment for basis spread (basis is usually more negative on longer tenors)
  const tenorMultiplier = {
    ON: 0.2, TN: 0.2, SN: 0.2, '1W': 0.4, '2W': 0.6, '1M': 0.8,
    '2M': 0.9, '3M': 1.0, '6M': 1.15, '9M': 1.25, '1Y': 1.35, '2Y': 1.45, '3Y': 1.5, '5Y': 1.5
  };

  const mult = tenorMultiplier[tenor] || 1.0;
  return basis * mult;
}

/**
 * Interpolate the zero rate for any arbitrary day count (d days) along the curve.
 */
function interpolateRateForDays(curve, days) {
  // Tenor day anchors (approximate)
  const anchors = [
    { days: 1, rate: curve.ON },
    { days: 7, rate: curve['1W'] },
    { days: 14, rate: curve['2W'] },
    { days: 30, rate: curve['1M'] },
    { days: 60, rate: curve['2M'] },
    { days: 91, rate: curve['3M'] },
    { days: 182, rate: curve['6M'] },
    { days: 273, rate: curve['9M'] },
    { days: 365, rate: curve['1Y'] },
    { days: 730, rate: curve['2Y'] },
    { days: 1095, rate: curve['3Y'] },
    { days: 1825, rate: curve['5Y'] }
  ];

  if (days <= anchors[0].days) return anchors[0].rate;
  if (days >= anchors[anchors.length - 1].days) return anchors[anchors.length - 1].rate;

  for (let i = 0; i < anchors.length - 1; i++) {
    if (days >= anchors[i].days && days <= anchors[i + 1].days) {
      const alpha = (days - anchors[i].days) / (anchors[i + 1].days - anchors[i].days);
      return anchors[i].rate + alpha * (anchors[i + 1].rate - anchors[i].rate);
    }
  }

  return curve['3M'];
}

module.exports = {
  getSpotRate,
  getYieldCurve,
  getCrossCurrencyBasisBps,
  interpolateRateForDays,
  HISTORICAL_REGIMES
};
