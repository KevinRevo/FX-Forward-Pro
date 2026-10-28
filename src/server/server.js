/**
 * Institutional Interbank FX Forward API Server
 * Supports standard Fixed Forwards and Window Forwards (Flexible delivery).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PAIRS, STANDARD_TENORS, CURRENCIES, getInvertedPairKey } = require('../fx-engine/conventions');
const {
  getForwardLadder,
  calculateBrokenDateForward,
  compareForwardCurves,
  getTenorHistory,
  calculateWindowForward
} = require('../fx-engine/cip-calculator');
const {
  getSpotDetails,
  getYieldCurve
} = require('../fx-engine/market-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.static(path.join(__dirname, '..', '..', 'public'), { etag: false, maxAge: 0 }));

// Presets for quick historical market scenarios
const HISTORICAL_PRESETS = [
  {
    id: 'live-eurusd',
    title: '🔴 LIVE EUR:USD (Active Interbank Market)',
    pair: 'EURUSD',
    date: new Date().toISOString().split('T')[0],
    description: 'Real-time live interbank market spot rate & dual-curve CIP forward structure.'
  },
  {
    id: 'live-eurgbp',
    title: '🇬🇧 LIVE EUR:GBP (Real SONIA vs €STR)',
    pair: 'EURGBP',
    date: new Date().toISOString().split('T')[0],
    description: 'Current real interbank market for EUR/GBP with active SONIA and €STR rate differentials.'
  },
  {
    id: 'live-usdjpy',
    title: '🇯🇵 LIVE USD:JPY (Fed vs BoJ Carry)',
    pair: 'USDJPY',
    date: new Date().toISOString().split('T')[0],
    description: 'Live USD/JPY showing forward discount driven by US vs Japan yield gap.'
  },
  {
    id: 'eurgbp-benchmark',
    title: 'EUR:GBP Benchmark (25/08/26 Spot 0.8566)',
    pair: 'EURGBP',
    date: '2026-08-25',
    spot: 0.8566,
    winStart: '2026-11-02',
    winEnd: '2027-02-09',
    description: 'Historical comparison: Window 02/11/26 to 09/02/27 at Spot 0.8566.'
  },
  {
    id: 'fed-peak-vs-now',
    title: 'Fed Peak Hikes (Oct 2023) vs Neutral',
    pair: 'EURUSD',
    date1: '2023-10-15',
    date2: '2024-09-15',
    description: 'Compares peak US 5.5% policy rates with the onset of global monetary easing.'
  },
  {
    id: 'covid-crisis-vs-pre',
    title: 'Pre-COVID (Oct 2019) vs COVID Shock (Apr 2020)',
    pair: 'EURUSD',
    date1: '2019-10-15',
    date2: '2020-04-15',
    description: 'Shows dramatic cross-currency basis blowout and emergency rate cuts to zero.'
  },
  {
    id: 'eur-parity-trough',
    title: 'EUR Parity Trough (Sep 2022) vs Oct 2023',
    pair: 'EURUSD',
    date1: '2022-09-27',
    date2: '2023-10-15',
    description: 'Spot below 0.96 vs rapid ECB rate hiking cycle.'
  }
];

// 0. Spot Details (Live & Historical)
app.get('/api/spot', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
    const customSpot = req.query.spot ? parseFloat(req.query.spot.toString().replace(',', '.')) : null;

    const details = await getSpotDetails(pair, date, customSpot, forceRefresh);
    res.json(details);
  } catch (error) {
    console.error('Error in /api/spot:', error);
    res.status(500).json({ error: error.message });
  }
});

// 0b. Yield Curves
app.get('/api/yield-curves', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const curves = {};
    for (const ccy of Object.keys(CURRENCIES)) {
      curves[ccy] = getYieldCurve(ccy, date);
    }
    res.json({ date, curves, currencies: CURRENCIES });
  } catch (error) {
    console.error('Error in /api/yield-curves:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1. Get pairs & conventions (includes inverted pairs)
app.get('/api/pairs', (req, res) => {
  res.json({
    pairs: Object.values(PAIRS),
    currencies: CURRENCIES,
    tenors: STANDARD_TENORS
  });
});

// 2. Presets
app.get('/api/presets', (req, res) => {
  res.json(HISTORICAL_PRESETS);
});

// 3. Forward Rate Display (Tenor ladder)
app.get('/api/forward-ladder', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const applyXccy = req.query.applyXccy !== 'false';

    const result = await getForwardLadder(pair, date, { applyXccy });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/forward-ladder:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Compare Forward Curves
app.get('/api/forward-compare', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const date1 = req.query.date1 || '2023-10-15';
    const date2 = req.query.date2 || '2024-09-15';
    const applyXccy = req.query.applyXccy !== 'false';

    const result = await compareForwardCurves(pair, date1, date2, { applyXccy });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/forward-compare:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Fixed Forward / Broken Date Calculator
app.get('/api/broken-date', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const asOf = req.query.asOf || new Date().toISOString().split('T')[0];
    const settlement = req.query.settlement;
    const spot = req.query.spot ? parseFloat(req.query.spot.toString().replace(',', '.')) : null;
    const baseRate = req.query.baseRate ? parseFloat(req.query.baseRate.toString().replace(',', '.')) : null;
    const quoteRate = req.query.quoteRate ? parseFloat(req.query.quoteRate.toString().replace(',', '.')) : null;
    const applyXccy = req.query.applyXccy !== 'false';

    if (!settlement) {
      return res.status(400).json({ error: 'Missing settlement query parameter (YYYY-MM-DD)' });
    }

    const result = await calculateBrokenDateForward(pair, asOf, settlement, { applyXccy, spot, baseRate, quoteRate });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/broken-date:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Window Forward (Flexible forward) Calculator
app.get('/api/window-forward', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const asOf = req.query.asOf || new Date().toISOString().split('T')[0];
    const windowStart = req.query.windowStart;
    const windowEnd = req.query.windowEnd;
    const direction = req.query.direction || 'BUY_LHS';
    const spot = req.query.spot ? parseFloat(req.query.spot.toString().replace(',', '.')) : null;
    const baseRate = req.query.baseRate ? parseFloat(req.query.baseRate.toString().replace(',', '.')) : null;
    const quoteRate = req.query.quoteRate ? parseFloat(req.query.quoteRate.toString().replace(',', '.')) : null;
    const notional = parseFloat(req.query.notional) || 1000000;
    const applyXccy = req.query.applyXccy !== 'false';

    if (!windowStart || !windowEnd) {
      return res.status(400).json({ error: 'Missing windowStart or windowEnd (YYYY-MM-DD)' });
    }

    const result = await calculateWindowForward(pair, asOf, windowStart, windowEnd, direction, {
      applyXccy,
      notional,
      spot,
      baseRate,
      quoteRate
    });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/window-forward:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Historical Time Series for a Tenor
app.get('/api/forward-history', async (req, res) => {
  try {
    const pair = req.query.pair || 'EURUSD';
    const tenor = req.query.tenor || '3M';
    const startDate = req.query.startDate || '2023-01-01';
    const endDate = req.query.endDate || '2024-09-15';
    const stepDays = parseInt(req.query.stepDays || '14', 10);

    const result = await getTenorHistory(pair, tenor, startDate, endDate, stepDays);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/forward-history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` INTERBANK FX FORWARD TERMINAL RUNNING ON PORT ${PORT}`);
  console.log(` Web Interface: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
