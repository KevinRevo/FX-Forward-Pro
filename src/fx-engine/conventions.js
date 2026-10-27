/**
 * FX Market Conventions & Currency Pair Definitions
 * Follows standard ISDA / ACI Financial Markets Association conventions.
 */

const CURRENCIES = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    dayCount: 360, // ACT/360
    benchmarkRate: 'SOFR',
    holidayCenter: 'US',
    symbol: '$'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    dayCount: 360, // ACT/360
    benchmarkRate: '€STR',
    holidayCenter: 'TARGET2',
    symbol: '€'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    dayCount: 365, // ACT/365
    benchmarkRate: 'SONIA',
    holidayCenter: 'UK',
    symbol: '£'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    dayCount: 360, // ACT/360
    benchmarkRate: 'TONAR',
    holidayCenter: 'JP',
    symbol: '¥'
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    dayCount: 360, // ACT/360
    benchmarkRate: 'SARON',
    holidayCenter: 'CH',
    symbol: 'CHF'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    dayCount: 365, // ACT/365
    benchmarkRate: 'CORRA',
    holidayCenter: 'CA',
    symbol: 'C$'
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    dayCount: 365, // ACT/365
    benchmarkRate: 'AONIA',
    holidayCenter: 'AU',
    symbol: 'A$'
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    dayCount: 365, // ACT/365
    benchmarkRate: 'NZIONA',
    holidayCenter: 'NZ',
    symbol: 'NZ$'
  }
};

const PAIRS = {
  EURUSD: {
    symbol: 'EURUSD',
    base: 'EUR',
    quote: 'USD',
    name: 'EUR / USD',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1, // e.g., 12.3 pips
    yahooTicker: 'EURUSD=X',
    typicalSpreadPips: {
      ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3,
      '2M': 0.4, '3M': 0.5, '6M': 0.8, '9M': 1.0, '1Y': 1.2, '2Y': 2.0, '3Y': 3.0, '5Y': 5.0
    }
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    base: 'GBP',
    quote: 'USD',
    name: 'GBP / USD',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'GBPUSD=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4,
      '2M': 0.6, '3M': 0.7, '6M': 1.1, '9M': 1.4, '1Y': 1.8, '2Y': 2.5, '3Y': 4.0, '5Y': 6.0
    }
  },
  USDJPY: {
    symbol: 'USDJPY',
    base: 'USD',
    quote: 'JPY',
    name: 'USD / JPY',
    spotLag: 2,
    pipSize: 0.01,
    quoteDecimals: 3,
    pipDecimals: 1,
    yahooTicker: 'USDJPY=X',
    typicalSpreadPips: {
      ON: 0.1, TN: 0.1, SN: 0.1, '1W': 0.15, '2W': 0.2, '1M': 0.3,
      '2M': 0.4, '3M': 0.5, '6M': 0.9, '9M': 1.2, '1Y': 1.5, '2Y': 2.5, '3Y': 3.5, '5Y': 6.0
    }
  },
  USDCHF: {
    symbol: 'USDCHF',
    base: 'USD',
    quote: 'CHF',
    name: 'USD / CHF',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'USDCHF=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4,
      '2M': 0.6, '3M': 0.7, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0
    }
  },
  USDCAD: {
    symbol: 'USDCAD',
    base: 'USD',
    quote: 'CAD',
    name: 'USD / CAD',
    spotLag: 1, // Special North American rule: T+1 settlement
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'CAD=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4,
      '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.2, '3Y': 4.5, '5Y': 7.0
    }
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    base: 'AUD',
    quote: 'USD',
    name: 'AUD / USD',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'AUDUSD=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.2, '2W': 0.3, '1M': 0.4,
      '2M': 0.6, '3M': 0.8, '6M': 1.2, '9M': 1.5, '1Y': 2.0, '2Y': 3.0, '3Y': 4.5, '5Y': 7.0
    }
  },
  NZDUSD: {
    symbol: 'NZDUSD',
    base: 'NZD',
    quote: 'USD',
    name: 'NZD / USD',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'NZDUSD=X',
    typicalSpreadPips: {
      ON: 0.2, TN: 0.2, SN: 0.2, '1W': 0.3, '2W': 0.4, '1M': 0.6,
      '2M': 0.8, '3M': 1.0, '6M': 1.5, '9M': 2.0, '1Y': 2.5, '2Y': 4.0, '3Y': 5.5, '5Y': 8.0
    }
  },
  EURGBP: {
    symbol: 'EURGBP',
    base: 'EUR',
    quote: 'GBP',
    name: 'EUR / GBP',
    spotLag: 2,
    pipSize: 0.0001,
    quoteDecimals: 5,
    pipDecimals: 1,
    yahooTicker: 'EURGBP=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.25, '2W': 0.35, '1M': 0.5,
      '2M': 0.7, '3M': 0.9, '6M': 1.3, '9M': 1.7, '1Y': 2.2, '2Y': 3.5, '3Y': 5.0, '5Y': 7.5
    }
  },
  EURJPY: {
    symbol: 'EURJPY',
    base: 'EUR',
    quote: 'JPY',
    name: 'EUR / JPY',
    spotLag: 2,
    pipSize: 0.01,
    quoteDecimals: 3,
    pipDecimals: 1,
    yahooTicker: 'EURJPY=X',
    typicalSpreadPips: {
      ON: 0.15, TN: 0.15, SN: 0.15, '1W': 0.25, '2W': 0.35, '1M': 0.5,
      '2M': 0.7, '3M': 0.9, '6M': 1.4, '9M': 1.8, '1Y': 2.3, '2Y': 3.8, '3Y': 5.2, '5Y': 8.0
    }
  }
};

const STANDARD_TENORS = [
  'ON', 'TN', 'SN',
  '1W', '2W', '3W',
  '1M', '2M', '3M', '6M', '9M',
  '1Y', '2Y', '3Y', '5Y'
];

module.exports = {
  CURRENCIES,
  PAIRS,
  STANDARD_TENORS
};
