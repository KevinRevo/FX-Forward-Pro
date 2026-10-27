/**
 * Institutional Interbank FX Forward Client Engine
 * Full client-side execution for GitHub Pages & offline operation.
 * Supports:
 * - Bidirectional quoting (EUR:USD, USD:EUR, etc.)
 * - Fixed Forwards & Broken Dates
 * - Window Forwards (Flexible delivery under conservative carry boundary)
 * - Historical CIP Parity
 */

const CIP_CLIENT = (() => {
  const CURRENCIES = {
    USD: { code: 'USD', name: 'US Dollar', dayCount: 360, benchmarkRate: 'SOFR', symbol: '$' },
    EUR: { code: 'EUR', name: 'Euro', dayCount: 360, benchmarkRate: '€STR', symbol: '€' },
    GBP: { code: 'GBP', name: 'British Pound', dayCount: 365, benchmarkRate: 'SONIA', symbol: '£' },
    JPY: { code: 'JPY', name: 'Japanese Yen', dayCount: 360, benchmarkRate: 'TONAR', symbol: '¥' },
    CHF: { code: 'CHF', name: 'Swiss Franc', dayCount: 360, benchmarkRate: 'SARON', symbol: 'CHF' },
    CAD: { code: 'CAD', name: 'Canadian Dollar', dayCount: 365, benchmarkRate: 'CORRA', symbol: 'C$' },
    AUD: { code: 'AUD', name: 'Australian Dollar', dayCount: 365, benchmarkRate: 'AONIA', symbol: 'A$' },
    NZD: { code: 'NZD', name: 'New Zealand Dollar', dayCount: 365, benchmarkRate: 'NZIONA', symbol: 'NZ$' }
  };

  const BASE_PAIRS = {
    EURUSD: { symbol: 'EURUSD', base: 'EUR', quote: 'USD', name: 'EUR / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    GBPUSD: { symbol: 'GBPUSD', base: 'GBP', quote: 'USD', name: 'GBP / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    USDJPY: { symbol: 'USDJPY', base: 'USD', quote: 'JPY', name: 'USD / JPY', spotLag: 2, pipSize: 0.01, quoteDecimals: 3, pipDecimals: 1 },
    USDCHF: { symbol: 'USDCHF', base: 'USD', quote: 'CHF', name: 'USD / CHF', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    USDCAD: { symbol: 'USDCAD', base: 'USD', quote: 'CAD', name: 'USD / CAD', spotLag: 1, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    AUDUSD: { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', name: 'AUD / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    NZDUSD: { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', name: 'NZD / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    EURGBP: { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', name: 'EUR / GBP', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1 },
    EURJPY: { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', name: 'EUR / JPY', spotLag: 2, pipSize: 0.01, quoteDecimals: 3, pipDecimals: 1 }
  };

  const TYPICAL_SPREADS = {
    EURUSD: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.8, '9M': 1.0, '1Y': 1.2, '2Y': 2.0, '3Y': 3.0, '5Y': 5.0 },
    GBPUSD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.1, '9M': 1.4, '1Y': 1.8, '2Y': 2.5, '3Y': 4.0, '5Y': 6.0 },
    USDJPY: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.9, '9M': 1.2, '1Y': 1.5, '2Y': 2.5, '3Y': 3.5, '5Y': 6.0 },
    USDCHF: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 },
    USDCAD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.2, '3Y': 4.5, '5Y': 7.0 },
    AUDUSD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 }
  };

  const PAIRS = {};
  Object.keys(BASE_PAIRS).forEach(key => {
    const std = BASE_PAIRS[key];
    PAIRS[key] = {
      ...std,
      typicalSpreadPips: TYPICAL_SPREADS[key] || TYPICAL_SPREADS.EURUSD,
      standardPairKey: key,
      isInverted: false
    };

    const invKey = `${std.quote}${std.base}`;
    let invPip = 0.0001;
    let invDec = 5;
    if (std.quote === 'JPY') { invPip = 0.000001; invDec = 6; }
    else if (std.base === 'JPY') { invPip = 0.01; invDec = 3; }

    PAIRS[invKey] = {
      symbol: invKey,
      base: std.quote,
      quote: std.base,
      name: `${std.quote} / ${std.base}`,
      spotLag: std.spotLag,
      pipSize: invPip,
      quoteDecimals: invDec,
      pipDecimals: 1,
      typicalSpreadPips: TYPICAL_SPREADS[key] || TYPICAL_SPREADS.EURUSD,
      standardPairKey: key,
      isInverted: true
    };
  });

  const STANDARD_TENORS = ['ON', 'TN', 'SN', '1W', '2W', '3W', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y', '3Y', '5Y'];

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
      date: '2020-04-15',
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
      date: '2022-06-15',
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
      date: '2023-10-15',
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
      date: '2024-09-15',
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
      date: '2026-10-27',
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

  const BASELINE_SPOTS = {
    EURUSD: [
      { date: '2019-10-15', rate: 1.1030 }, { date: '2020-04-15', rate: 1.0910 }, { date: '2022-06-15', rate: 1.0440 },
      { date: '2022-09-27', rate: 0.9595 }, { date: '2023-10-15', rate: 1.05216 }, { date: '2024-09-15', rate: 1.10884 },
      { date: '2026-10-27', rate: 1.0825 }
    ],
    GBPUSD: [
      { date: '2019-10-15', rate: 1.2780 }, { date: '2020-04-15', rate: 1.2510 }, { date: '2022-09-26', rate: 1.0350 },
      { date: '2023-10-15', rate: 1.2140 }, { date: '2024-09-15', rate: 1.3125 }, { date: '2026-10-27', rate: 1.2980 }
    ],
    USDJPY: [
      { date: '2019-10-15', rate: 108.85 }, { date: '2020-04-15', rate: 107.50 }, { date: '2022-06-15', rate: 134.20 },
      { date: '2023-10-15', rate: 149.50 }, { date: '2024-09-15', rate: 140.80 }, { date: '2026-10-27', rate: 151.30 }
    ],
    USDCHF: [
      { date: '2019-10-15', rate: 0.9980 }, { date: '2020-04-15', rate: 0.9660 }, { date: '2023-10-15', rate: 0.9020 },
      { date: '2024-09-15', rate: 0.8490 }, { date: '2026-10-27', rate: 0.8650 }
    ],
    USDCAD: [
      { date: '2019-10-15', rate: 1.3200 }, { date: '2020-04-15', rate: 1.4110 }, { date: '2023-10-15', rate: 1.3650 },
      { date: '2024-09-15', rate: 1.3580 }, { date: '2026-10-27', rate: 1.3850 }
    ],
    AUDUSD: [
      { date: '2019-10-15', rate: 0.6750 }, { date: '2020-04-15', rate: 0.6320 }, { date: '2023-10-15', rate: 0.6300 },
      { date: '2024-09-15', rate: 0.6710 }, { date: '2026-10-27', rate: 0.6580 }
    ]
  };

  function getSpotRate(pairKey, dateStr) {
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;
    const stdKey = pair.standardPairKey || 'EURUSD';
    const isInv = pair.isInverted;

    const list = BASELINE_SPOTS[stdKey] || BASELINE_SPOTS.EURUSD;
    const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    let baseVal = sorted[0].rate;
    if (dateStr >= sorted[sorted.length - 1].date) {
      baseVal = sorted[sorted.length - 1].rate;
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const d1 = new Date(sorted[i].date).getTime();
        const d2 = new Date(sorted[i + 1].date).getTime();
        const cur = new Date(dateStr).getTime();
        if (cur >= d1 && cur <= d2) {
          const alpha = (cur - d1) / (d2 - d1);
          baseVal = sorted[i].rate + alpha * (sorted[i + 1].rate - sorted[i].rate);
          break;
        }
      }
    }

    if (isInv) {
      return parseFloat((1 / baseVal).toFixed(pair.quoteDecimals));
    }
    return parseFloat(baseVal.toFixed(pair.quoteDecimals));
  }

  function getYieldCurve(ccy, dateStr) {
    const sorted = [...HISTORICAL_REGIMES].sort((a, b) => new Date(a.date) - new Date(b.date));
    let raw = sorted[0].rates[ccy] || sorted[0].rates.USD;
    if (dateStr >= sorted[sorted.length - 1].date) {
      raw = sorted[sorted.length - 1].rates[ccy] || sorted[sorted.length - 1].rates.USD;
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const t1 = new Date(sorted[i].date).getTime();
        const t2 = new Date(sorted[i + 1].date).getTime();
        const cur = new Date(dateStr).getTime();
        if (cur >= t1 && cur <= t2) {
          const w = (cur - t1) / (t2 - t1);
          const r1 = sorted[i].rates[ccy] || sorted[i].rates.USD;
          const r2 = sorted[i + 1].rates[ccy] || sorted[i + 1].rates.USD;
          raw = {};
          for (const k of ['ON', '1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y']) {
            raw[k] = r1[k] + w * (r2[k] - r1[k]);
          }
          break;
        }
      }
    }
    const c = { ...raw };
    c['1W'] = c.ON + 0.35 * (c['1M'] - c.ON);
    c['2W'] = c.ON + 0.65 * (c['1M'] - c.ON);
    c['2M'] = c['1M'] + 0.5 * (c['3M'] - c['1M']);
    c['9M'] = c['6M'] + 0.5 * (c['1Y'] - c['6M']);
    return c;
  }

  function getBasisBps(pairKey, dateStr, tenor) {
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;
    const stdKey = pair.standardPairKey || 'EURUSD';
    const isInv = pair.isInverted;

    const sorted = [...HISTORICAL_REGIMES].sort((a, b) => new Date(a.date) - new Date(b.date));
    let b = sorted[0].basisBps[stdKey] || -15;
    if (dateStr >= sorted[sorted.length - 1].date) {
      b = sorted[sorted.length - 1].basisBps[stdKey] || -15;
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const t1 = new Date(sorted[i].date).getTime();
        const t2 = new Date(sorted[i + 1].date).getTime();
        const cur = new Date(dateStr).getTime();
        if (cur >= t1 && cur <= t2) {
          const w = (cur - t1) / (t2 - t1);
          b = sorted[i].basisBps[stdKey] + w * (sorted[i + 1].basisBps[stdKey] - sorted[i].basisBps[stdKey]);
          break;
        }
      }
    }
    const mults = { ON: 0.2, TN: 0.2, SN: 0.2, '1W': 0.4, '2W': 0.6, '1M': 0.8, '2M': 0.9, '3M': 1.0, '6M': 1.15, '9M': 1.25, '1Y': 1.35, '2Y': 1.45, '3Y': 1.5, '5Y': 1.5 };
    const res = b * (mults[tenor] || 1.0);
    return isInv ? -res : res;
  }

  function interpolateRate(curve, days) {
    const a = [
      { d: 1, r: curve.ON }, { d: 7, r: curve['1W'] }, { d: 14, r: curve['2W'] }, { d: 30, r: curve['1M'] },
      { d: 60, r: curve['2M'] }, { d: 91, r: curve['3M'] }, { d: 182, r: curve['6M'] }, { d: 273, r: curve['9M'] },
      { d: 365, r: curve['1Y'] }, { d: 730, r: curve['2Y'] }, { d: 1095, r: curve['3Y'] }, { d: 1825, r: curve['5Y'] }
    ];
    if (days <= a[0].d) return a[0].r;
    if (days >= a[a.length - 1].d) return a[a.length - 1].r;
    for (let i = 0; i < a.length - 1; i++) {
      if (days >= a[i].d && days <= a[i + 1].d) {
        const alpha = (days - a[i].d) / (a[i + 1].d - a[i].d);
        return a[i].r + alpha * (a[i + 1].r - a[i].r);
      }
    }
    return curve['3M'];
  }

  function calculateOutright(spot, baseR, quoteR, days, baseBasis, quoteBasis, xccyBps = 0) {
    const rB = baseR / 100;
    const rQ = (quoteR / 100) + (xccyBps / 10000);
    const tB = days / baseBasis;
    const tQ = days / quoteBasis;
    if (days <= 365) {
      return spot * ((1 + rQ * tQ) / (1 + rB * tB));
    } else {
      return spot * (Math.pow(1 + rQ, tQ) / Math.pow(1 + rB, tB));
    }
  }

  function addBdays(d, days) {
    const cur = new Date(d);
    let added = 0;
    while (added < days) {
      cur.setUTCDate(cur.getUTCDate() + 1);
      const dow = cur.getUTCDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return cur;
  }

  function getSpotDate(tradeD, lag) {
    return addBdays(new Date(tradeD), lag || 2);
  }

  function getMaturityDate(spotD, tenor) {
    const d = new Date(spotD);
    if (tenor === 'ON' || tenor === 'TN' || tenor === 'SN') return addBdays(d, 1);
    const wm = tenor.match(/^(\d+)W$/);
    if (wm) { d.setUTCDate(d.getUTCDate() + parseInt(wm[1]) * 7); return d; }
    const mm = tenor.match(/^(\d+)M$/);
    if (mm) { d.setUTCMonth(d.getUTCMonth() + parseInt(mm[1])); return d; }
    const ym = tenor.match(/^(\d+)Y$/);
    if (ym) { d.setUTCFullYear(d.getUTCFullYear() + parseInt(ym[1])); return d; }
    return d;
  }

  function computeLadder(pairKey, tradeDateStr, applyXccy = true) {
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;
    const spot = getSpotRate(pairKey, tradeDateStr);
    const spotDate = getSpotDate(tradeDateStr, pair.spotLag);
    const spotDateStr = spotDate.toISOString().split('T')[0];

    const baseCcy = CURRENCIES[pair.base];
    const quoteCcy = CURRENCIES[pair.quote];
    const baseCurve = getYieldCurve(pair.base, tradeDateStr);
    const quoteCurve = getYieldCurve(pair.quote, tradeDateStr);

    const ladder = STANDARD_TENORS.map(tenor => {
      const mat = getMaturityDate(spotDate, tenor);
      let days = Math.round((mat.getTime() - spotDate.getTime()) / 86400000);
      if (tenor === 'ON' || tenor === 'TN' || tenor === 'SN') days = 1;
      days = Math.max(1, days);

      const bRate = interpolateRate(baseCurve, days);
      const qRate = interpolateRate(quoteCurve, days);
      const xccy = applyXccy ? getBasisBps(pairKey, tradeDateStr, tenor) : 0;

      const fwd = calculateOutright(spot, bRate, qRate, days, baseCcy.dayCount, quoteCcy.dayCount, xccy);
      const ptsMid = (fwd - spot) / pair.pipSize;
      const spread = pair.typicalSpreadPips[tenor] || 0.5;

      const ptsBid = ptsMid - (spread * 0.5);
      const ptsAsk = ptsMid + (spread * 0.5);
      const fwdBid = spot + (ptsBid * pair.pipSize);
      const fwdAsk = spot + (ptsAsk * pair.pipSize);
      const ann = ((fwd - spot) / spot) * (360 / days) * 100;

      return {
        tenor,
        settlementDate: mat.toISOString().split('T')[0],
        days,
        baseRate: parseFloat(bRate.toFixed(3)),
        quoteRate: parseFloat(qRate.toFixed(3)),
        rateDifferential: parseFloat((qRate - bRate).toFixed(3)),
        xccyBps: parseFloat(xccy.toFixed(1)),
        swapPoints: {
          bid: parseFloat(ptsBid.toFixed(pair.pipDecimals)),
          mid: parseFloat(ptsMid.toFixed(pair.pipDecimals)),
          ask: parseFloat(ptsAsk.toFixed(pair.pipDecimals))
        },
        outrightForward: {
          bid: parseFloat(fwdBid.toFixed(pair.quoteDecimals)),
          mid: parseFloat(fwd.toFixed(pair.quoteDecimals)),
          ask: parseFloat(fwdAsk.toFixed(pair.quoteDecimals))
        },
        annPremiumPct: parseFloat(ann.toFixed(3))
      };
    });

    const spotSpread = pair.typicalSpreadPips['1M'] || 0.5;
    return {
      pair: pair.symbol,
      pairName: pair.name,
      tradeDate: tradeDateStr,
      spotDate: spotDateStr,
      spot: {
        bid: parseFloat((spot - spotSpread * 0.5 * pair.pipSize).toFixed(pair.quoteDecimals)),
        ask: parseFloat((spot + spotSpread * 0.5 * pair.pipSize).toFixed(pair.quoteDecimals)),
        mid: spot
      },
      baseCcy, quoteCcy, applyXccy, ladder
    };
  }

  function compareCurves(pairKey, d1, d2, applyXccy = true) {
    const c1 = computeLadder(pairKey, d1, applyXccy);
    const c2 = computeLadder(pairKey, d2, applyXccy);
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;

    const comparisons = c1.ladder.map((r1, idx) => {
      const r2 = c2.ladder[idx];
      return {
        tenor: r1.tenor,
        days: r1.days,
        date1: { date: d1, forward: r1.outrightForward.mid, points: r1.swapPoints.mid, rateDiff: r1.rateDifferential },
        date2: { date: d2, forward: r2.outrightForward.mid, points: r2.swapPoints.mid, rateDiff: r2.rateDifferential },
        delta: {
          outright: parseFloat((r2.outrightForward.mid - r1.outrightForward.mid).toFixed(pair.quoteDecimals)),
          pointsPips: parseFloat((r2.swapPoints.mid - r1.swapPoints.mid).toFixed(pair.pipDecimals)),
          rateDiffBps: Math.round((r2.rateDifferential - r1.rateDifferential) * 100)
        }
      };
    });

    return {
      pair: pair.symbol,
      date1: d1, date2: d2,
      spot1: c1.spot.mid, spot2: c2.spot.mid,
      spotDelta: parseFloat((c2.spot.mid - c1.spot.mid).toFixed(pair.quoteDecimals)),
      comparisons
    };
  }

  function brokenDate(pairKey, asOf, settle, applyXccy = true) {
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;
    const spot = getSpotRate(pairKey, asOf);
    const spotDate = getSpotDate(asOf, pair.spotLag);
    const mat = new Date(settle);
    const days = Math.max(1, Math.round((mat.getTime() - spotDate.getTime()) / 86400000));

    const baseCcy = CURRENCIES[pair.base];
    const quoteCcy = CURRENCIES[pair.quote];
    const baseCurve = getYieldCurve(pair.base, asOf);
    const quoteCurve = getYieldCurve(pair.quote, asOf);

    const bRate = interpolateRate(baseCurve, days);
    const qRate = interpolateRate(quoteCurve, days);
    const xccy = applyXccy ? getBasisBps(pairKey, asOf, '3M') : 0;

    const fwd = calculateOutright(spot, bRate, qRate, days, baseCcy.dayCount, quoteCcy.dayCount, xccy);
    const points = (fwd - spot) / pair.pipSize;
    const ann = ((fwd - spot) / spot) * (360 / days) * 100;

    return {
      pair: pair.symbol,
      tradeDate: asOf,
      spotDate: spotDate.toISOString().split('T')[0],
      maturityDate: settle,
      days,
      spot,
      baseRate: parseFloat(bRate.toFixed(4)),
      quoteRate: parseFloat(qRate.toFixed(4)),
      xccyBps: parseFloat(xccy.toFixed(2)),
      swapPoints: parseFloat(points.toFixed(pair.pipDecimals)),
      outrightForward: parseFloat(fwd.toFixed(pair.quoteDecimals)),
      annPremiumPct: parseFloat(ann.toFixed(3))
    };
  }

  function windowForward(pairKey, asOf, windowStart, windowEnd, direction = 'BUY_BASE', options = {}) {
    const pair = PAIRS[pairKey] || PAIRS.EURUSD;
    const applyXccy = options.applyXccy !== false;
    const notional = parseFloat(options.notional) || 1000000;

    const startFwd = brokenDate(pairKey, asOf, windowStart, applyXccy);
    const endFwd = brokenDate(pairKey, asOf, windowEnd, applyXccy);

    const isUpward = endFwd.outrightForward >= startFwd.outrightForward;
    let windowRate;
    let worstCaseDate;
    let worstCaseDays;

    if (direction === 'BUY_BASE') {
      if (isUpward) {
        windowRate = endFwd.outrightForward;
        worstCaseDate = windowEnd;
        worstCaseDays = endFwd.days;
      } else {
        windowRate = startFwd.outrightForward;
        worstCaseDate = windowStart;
        worstCaseDays = startFwd.days;
      }
    } else {
      if (isUpward) {
        windowRate = startFwd.outrightForward;
        worstCaseDate = windowStart;
        worstCaseDays = startFwd.days;
      } else {
        windowRate = endFwd.outrightForward;
        worstCaseDate = windowEnd;
        worstCaseDays = endFwd.days;
      }
    }

    const windowPoints = (windowRate - startFwd.spot) / pair.pipSize;
    const carryCostPips = Math.abs(windowRate - endFwd.outrightForward) / pair.pipSize;
    const carryCostCash = Math.abs(windowRate - endFwd.outrightForward) * notional;
    const totalSettlementCash = notional * windowRate;

    const windowSchedule = [];
    const sDate = new Date(windowStart);
    const eDate = new Date(windowEnd);
    const step = Math.max(1, Math.floor((eDate - sDate) / (1000 * 86400 * 5)));

    let cur = new Date(sDate);
    while (cur <= eDate) {
      const dStr = cur.toISOString().split('T')[0];
      const sub = brokenDate(pairKey, asOf, dStr, applyXccy);
      windowSchedule.push({
        date: dStr,
        days: sub.days,
        outrightForward: sub.outrightForward,
        swapPoints: sub.swapPoints,
        baseRate: sub.baseRate,
        quoteRate: sub.quoteRate
      });
      cur.setUTCDate(cur.getUTCDate() + step);
    }
    if (windowSchedule[windowSchedule.length - 1].date !== windowEnd) {
      windowSchedule.push({
        date: windowEnd,
        days: endFwd.days,
        outrightForward: endFwd.outrightForward,
        swapPoints: endFwd.swapPoints,
        baseRate: endFwd.baseRate,
        quoteRate: endFwd.quoteRate
      });
    }

    return {
      pair: pair.symbol,
      pairName: pair.name,
      tradeDate: asOf,
      spotDate: startFwd.spotDate,
      spot: startFwd.spot,
      direction,
      directionLabel: direction === 'BUY_BASE' ? `Client BUYS ${pair.base} / SELLS ${pair.quote}` : `Client SELLS ${pair.base} / BUYS ${pair.quote}`,
      windowStart,
      windowEnd,
      windowDurationDays: endFwd.days - startFwd.days,
      windowRate: parseFloat(windowRate.toFixed(pair.quoteDecimals)),
      windowPoints: parseFloat(windowPoints.toFixed(pair.pipDecimals)),
      worstCaseDate,
      worstCaseDays,
      curveStructure: isUpward ? 'PREMIUM (Upward Sloping)' : 'DISCOUNT (Downward Sloping)',
      startDatePricing: { date: windowStart, days: startFwd.days, outright: startFwd.outrightForward, points: startFwd.swapPoints },
      endDatePricing: { date: windowEnd, days: endFwd.days, outright: endFwd.outrightForward, points: endFwd.swapPoints },
      windowCost: {
        pips: parseFloat(carryCostPips.toFixed(pair.pipDecimals)),
        cashflow: parseFloat(carryCostCash.toFixed(2)),
        currency: pair.quote
      },
      notional: {
        baseAmount: notional,
        baseCurrency: pair.base,
        settlementCashflow: parseFloat(totalSettlementCash.toFixed(2)),
        quoteCurrency: pair.quote
      },
      windowSchedule
    };
  }

  function tenorHistory(pairKey, tenor, startDate, endDate, stepDays = 14) {
    const series = [];
    let cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      const dStr = cur.toISOString().split('T')[0];
      const lad = computeLadder(pairKey, dStr);
      const row = lad.ladder.find(r => r.tenor === tenor) || lad.ladder[6];
      series.push({
        date: dStr,
        spot: lad.spot.mid,
        forward: row.outrightForward.mid,
        points: row.swapPoints.mid,
        rateDiff: row.rateDifferential
      });
      cur.setUTCDate(cur.getUTCDate() + stepDays);
    }
    return { pair: pairKey, tenor, series };
  }

  return {
    CURRENCIES,
    PAIRS,
    STANDARD_TENORS,
    computeLadder,
    compareCurves,
    brokenDate,
    windowForward,
    tenorHistory
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CIP_CLIENT;
}
