/**
 * Institutional FX Conventions & Standard Pairs
 * Cleaned standard market pairs with clear LHS (Base) and RHS (Quote/Terms) definitions.
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

const STANDARD_PAIRS = {
  EURUSD: {
    symbol: 'EURUSD',
    lhs: 'EUR',
    rhs: 'USD',
    base: 'EUR',
    quote: 'USD',
    name: 'EUR:USD',
    label: 'EUR:USD (LHS: EUR | RHS: USD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'EURUSD=X',
    typicalSpreadPips: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.8, '9M': 1.0, '1Y': 1.2, '2Y': 2.0, '3Y': 3.0, '5Y': 5.0 }
  },
  EURGBP: {
    symbol: 'EURGBP',
    lhs: 'EUR',
    rhs: 'GBP',
    base: 'EUR',
    quote: 'GBP',
    name: 'EUR:GBP',
    label: 'EUR:GBP (LHS: EUR | RHS: GBP)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 6,
    pipDecimals: 2,
    yahooTicker: 'EURGBP=X',
    typicalSpreadPips: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.12, '2W': 0.15, '1M': 0.2, '2M': 0.3, '3M': 0.4, '6M': 0.6, '9M': 0.8, '1Y': 1.0, '2Y': 1.5, '3Y': 2.5, '5Y': 4.0 }
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    lhs: 'GBP',
    rhs: 'USD',
    base: 'GBP',
    quote: 'USD',
    name: 'GBP:USD',
    label: 'GBP:USD (LHS: GBP | RHS: USD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'GBPUSD=X',
    typicalSpreadPips: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.1, '9M': 1.4, '1Y': 1.8, '2Y': 2.5, '3Y': 4.0, '5Y': 6.0 }
  },
  USDJPY: {
    symbol: 'USDJPY',
    lhs: 'USD',
    rhs: 'JPY',
    base: 'USD',
    quote: 'JPY',
    name: 'USD:JPY',
    label: 'USD:JPY (LHS: USD | RHS: JPY)',
    spotLag: 2,
    pipSize: 0.01,
    quoteDecimals: 3,
    pipDecimals: 1,
    yahooTicker: 'USDJPY=X',
    typicalSpreadPips: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.9, '9M': 1.2, '1Y': 1.5, '2Y': 2.5, '3Y': 3.5, '5Y': 6.0 }
  },
  USDCHF: {
    symbol: 'USDCHF',
    lhs: 'USD',
    rhs: 'CHF',
    base: 'USD',
    quote: 'CHF',
    name: 'USD:CHF',
    label: 'USD:CHF (LHS: USD | RHS: CHF)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'USDCHF=X',
    typicalSpreadPips: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.7, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 }
  },
  USDCAD: {
    symbol: 'USDCAD',
    lhs: 'USD',
    rhs: 'CAD',
    base: 'USD',
    quote: 'CAD',
    name: 'USD:CAD',
    label: 'USD:CAD (LHS: USD | RHS: CAD)',
    spotLag: 1, // T+1 settlement in North America
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'CAD=X',
    typicalSpreadPips: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.2, '3Y': 4.5, '5Y': 7.0 }
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    lhs: 'AUD',
    rhs: 'USD',
    base: 'AUD',
    quote: 'USD',
    name: 'AUD:USD',
    label: 'AUD:USD (LHS: AUD | RHS: USD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'AUDUSD=X',
    typicalSpreadPips: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4, '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0 }
  },
  NZDUSD: {
    symbol: 'NZDUSD',
    lhs: 'NZD',
    rhs: 'USD',
    base: 'NZD',
    quote: 'USD',
    name: 'NZD:USD',
    label: 'NZD:USD (LHS: NZD | RHS: USD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'NZDUSD=X',
    typicalSpreadPips: { ON: 0.2, TN: 0.2, SN: 0.2, '1W': 0.3, '2W': 0.4, '1M': 0.6, '2M': 0.8, '3M': 1.0, '6M': 1.5, '9M': 2.0, '1Y': 2.5, '2Y': 4.0, '3Y': 5.5, '5Y': 8.0 }
  },
  EURJPY: {
    symbol: 'EURJPY',
    lhs: 'EUR',
    rhs: 'JPY',
    base: 'EUR',
    quote: 'JPY',
    name: 'EUR:JPY',
    label: 'EUR:JPY (LHS: EUR | RHS: JPY)',
    spotLag: 2,
    pipSize: 0.01,
    quoteDecimals: 3,
    pipDecimals: 1,
    yahooTicker: 'EURJPY=X',
    typicalSpreadPips: { ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.25, '2W': 0.35, '1M': 0.5, '2M': 0.7, '3M': 0.9, '6M': 1.4, '9M': 1.8, '1Y': 2.3, '2Y': 3.8, '3Y': 5.2, '5Y': 8.0 }
  },
  USDEUR: {
    symbol: 'USDEUR',
    lhs: 'USD',
    rhs: 'EUR',
    base: 'USD',
    quote: 'EUR',
    name: 'USD:EUR',
    label: 'USD:EUR (LHS: USD | RHS: EUR)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'EURUSD=X',
    isInverted: true,
    underlyingPair: 'EURUSD',
    typicalSpreadPips: { ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3, '2M': 0.4, '3M': 0.5, '6M': 0.8, '9M': 1.0, '1Y': 1.2, '2Y': 2.0, '3Y': 3.0, '5Y': 5.0 }
  },
  GBPEUR: {
    symbol: 'GBPEUR',
    lhs: 'GBP',
    rhs: 'EUR',
    base: 'GBP',
    quote: 'EUR',
    name: 'GBP:EUR',
    label: 'GBP:EUR (LHS: GBP | RHS: EUR)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 6,
    pipDecimals: 2,
    yahooTicker: 'EURGBP=X',
    isInverted: true,
    underlyingPair: 'EURGBP',
    typicalSpreadPips: { '1M': 0.2 }
  },
  USDGBP: {
    symbol: 'USDGBP',
    lhs: 'USD',
    rhs: 'GBP',
    base: 'USD',
    quote: 'GBP',
    name: 'USD:GBP',
    label: 'USD:GBP (LHS: USD | RHS: GBP)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'GBPUSD=X',
    isInverted: true,
    underlyingPair: 'GBPUSD',
    typicalSpreadPips: { '1M': 0.4 }
  },
  JPYUSD: {
    symbol: 'JPYUSD',
    lhs: 'JPY',
    rhs: 'USD',
    base: 'JPY',
    quote: 'USD',
    name: 'JPY:USD',
    label: 'JPY:USD (LHS: JPY | RHS: USD)',
    spotLag: 2,
    pipSize: 0.000001,
    quoteDecimals: 6,
    pipDecimals: 2,
    yahooTicker: 'USDJPY=X',
    isInverted: true,
    underlyingPair: 'USDJPY',
    typicalSpreadPips: { '1M': 0.3 }
  },
  CHFUSD: {
    symbol: 'CHFUSD',
    lhs: 'CHF',
    rhs: 'USD',
    base: 'CHF',
    quote: 'USD',
    name: 'CHF:USD',
    label: 'CHF:USD (LHS: CHF | RHS: USD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'USDCHF=X',
    isInverted: true,
    underlyingPair: 'USDCHF',
    typicalSpreadPips: { '1M': 0.4 }
  },
  CADUSD: {
    symbol: 'CADUSD',
    lhs: 'CAD',
    rhs: 'USD',
    base: 'CAD',
    quote: 'USD',
    name: 'CAD:USD',
    label: 'CAD:USD (LHS: CAD | RHS: USD)',
    spotLag: 1,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'CAD=X',
    isInverted: true,
    underlyingPair: 'USDCAD',
    typicalSpreadPips: { '1M': 0.4 }
  },
  USDAUD: {
    symbol: 'USDAUD',
    lhs: 'USD',
    rhs: 'AUD',
    base: 'USD',
    quote: 'AUD',
    name: 'USD:AUD',
    label: 'USD:AUD (LHS: USD | RHS: AUD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'AUDUSD=X',
    isInverted: true,
    underlyingPair: 'AUDUSD',
    typicalSpreadPips: { '1M': 0.4 }
  },
  USDNZD: {
    symbol: 'USDNZD',
    lhs: 'USD',
    rhs: 'NZD',
    base: 'USD',
    quote: 'NZD',
    name: 'USD:NZD',
    label: 'USD:NZD (LHS: USD | RHS: NZD)',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'NZDUSD=X',
    isInverted: true,
    underlyingPair: 'NZDUSD',
    typicalSpreadPips: { '1M': 0.6 }
  },
  JPYEUR: {
    symbol: 'JPYEUR',
    lhs: 'JPY',
    rhs: 'EUR',
    base: 'JPY',
    quote: 'EUR',
    name: 'JPY:EUR',
    label: 'JPY:EUR (LHS: JPY | RHS: EUR)',
    spotLag: 2,
    pipSize: 0.000001,
    quoteDecimals: 6,
    pipDecimals: 2,
    yahooTicker: 'EURJPY=X',
    isInverted: true,
    underlyingPair: 'EURJPY',
    typicalSpreadPips: { '1M': 0.5 }
  }
};

const PAIRS = STANDARD_PAIRS;

const STANDARD_TENORS = [
  'ON', 'TN', 'SN',
  '1W', '2W', '3W',
  '1M', '2M', '3M', '6M', '9M',
  '1Y', '2Y', '3Y', '5Y'
];

function getEffectivePair(pairKey, direction = 'LHS') {
  const isRHS = (direction === 'RHS' || direction === 'BUY_RHS' || direction === 'BUY_BASE');
  const baseKey = (pairKey || 'EURUSD').toUpperCase().replace(/[\/:]/g, '');
  const p = PAIRS[baseKey] || PAIRS.EURUSD;
  if (!isRHS) return p;

  const invSymbol = `${p.quote}${p.base}`;
  if (PAIRS[invSymbol]) return PAIRS[invSymbol];
  return p;
}

module.exports = {
  CURRENCIES,
  PAIRS,
  STANDARD_PAIRS,
  STANDARD_TENORS,
  getEffectivePair
};
