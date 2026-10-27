/**
 * FX Market Conventions & Currency Pair Definitions
 * Follows standard ISDA / ACI Financial Markets Association conventions.
 * Supports bidirectional pairs (e.g. EUR/USD and USD/EUR).
 */

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

// Base market pairs (market standard quoting direction)
const BASE_PAIRS = {
  EURUSD: { symbol: 'EURUSD', base: 'EUR', quote: 'USD', name: 'EUR / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'EURUSD=X', isStandard: true },
  GBPUSD: { symbol: 'GBPUSD', base: 'GBP', quote: 'USD', name: 'GBP / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'GBPUSD=X', isStandard: true },
  USDJPY: { symbol: 'USDJPY', base: 'USD', quote: 'JPY', name: 'USD / JPY', spotLag: 2, pipSize: 0.01, quoteDecimals: 3, pipDecimals: 1, yahooTicker: 'USDJPY=X', isStandard: true },
  USDCHF: { symbol: 'USDCHF', base: 'USD', quote: 'CHF', name: 'USD / CHF', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'USDCHF=X', isStandard: true },
  USDCAD: { symbol: 'USDCAD', base: 'USD', quote: 'CAD', name: 'USD / CAD', spotLag: 1, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'CAD=X', isStandard: true },
  AUDUSD: { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', name: 'AUD / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'AUDUSD=X', isStandard: true },
  NZDUSD: { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', name: 'NZD / USD', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'NZDUSD=X', isStandard: true },
  EURGBP: { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', name: 'EUR / GBP', spotLag: 2, pipSize: 0.0001, quoteDecimals: 5, pipDecimals: 1, yahooTicker: 'EURGBP=X', isStandard: true },
  EURJPY: { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', name: 'EUR / JPY', spotLag: 2, pipSize: 0.01, quoteDecimals: 3, pipDecimals: 1, yahooTicker: 'EURJPY=X', isStandard: true }
};

// Spread matrix for standard tenors
const TYPICAL_SPREADS = {
  EURUSD: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.8, '9M': 1.0, '1Y': 1.2, '2Y': 2.0, '3Y': 3.0, '5Y': 5.0 },
  GBPUSD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.1, '9M': 1.4, '1Y': 1.8, '2Y': 2.5, '3Y': 4.0, '5Y': 6.0 },
  USDJPY: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.9, '9M': 1.2, '1Y': 1.5, '2Y': 2.5, '3Y': 3.5, '5Y': 6.0 },
  USDCHF: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 },
  USDCAD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.2, '3Y': 4.5, '5Y': 7.0 },
  AUDUSD: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 },
  NZDUSD: { ON: 0.2, TN: 0.2, SN: 0.2, '1W': 0.3, '2W': 0.4, '1M': 0.6, '2M': 0.8, '3M': 1.0, '6M': 1.5, '9M': 2.0, '1Y': 2.5, '2Y': 4.0, '3Y': 5.5, '5Y': 8.0 },
  EURGBP: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.25, '2W': 0.35, '1M': 0.5, '2M': 0.7, '3M': 0.9, '6M': 1.3, '9M': 1.7, '1Y': 2.2, '2Y': 3.5, '3Y': 5.0, '5Y': 7.5 },
  EURJPY: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.25, '2W': 0.35, '1M': 0.5, '2M': 0.7, '3M': 0.9, '6M': 1.4, '9M': 1.8, '1Y': 2.3, '2Y': 3.8, '3Y': 5.2, '5Y': 8.0 }
};

// Generate full bidirectional dictionary
const PAIRS = {};

Object.keys(BASE_PAIRS).forEach(key => {
  const std = BASE_PAIRS[key];
  PAIRS[key] = {
    ...std,
    typicalSpreadPips: TYPICAL_SPREADS[key],
    standardPairKey: key,
    isInverted: false
  };

  // Inverted pair (e.g. USDEUR, USDGBP, JPYUSD, CADUSD, etc.)
  const invKey = `${std.quote}${std.base}`;
  let invPipSize = 0.0001;
  let invDecimals = 5;
  if (std.quote === 'JPY') {
    // When JPY is base, e.g. JPY/USD, quote is around 0.0066, pip is 0.000001 (6 decimals)
    invPipSize = 0.000001;
    invDecimals = 6;
  } else if (std.base === 'JPY') {
    // When JPY is quote, pip is 0.01, decimals 3
    invPipSize = 0.01;
    invDecimals = 3;
  }

  PAIRS[invKey] = {
    symbol: invKey,
    base: std.quote,
    quote: std.base,
    name: `${std.quote} / ${std.base}`,
    spotLag: std.spotLag,
    pipSize: invPipSize,
    quoteDecimals: invDecimals,
    pipDecimals: 1,
    yahooTicker: std.yahooTicker,
    typicalSpreadPips: TYPICAL_SPREADS[key],
    standardPairKey: key,
    isInverted: true
  };
});

const STANDARD_TENORS = [
  'ON', 'TN', 'SN',
  '1W', '2W', '3W',
  '1M', '2M', '3M', '6M', '9M',
  '1Y', '2Y', '3Y', '5Y'
];

function getInvertedPairKey(pairKey) {
  const p = PAIRS[pairKey];
  if (!p) return 'USDEUR';
  return `${p.quote}${p.base}`;
}

module.exports = {
  CURRENCIES,
  PAIRS,
  STANDARD_TENORS,
  getInvertedPairKey
};
