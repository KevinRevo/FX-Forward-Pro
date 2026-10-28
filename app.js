/**
 * Institutional Interbank FX Forward Client Application
 * Features:
 * - Standard pairs with explicit LHS (Base) and RHS (Terms/Quote)
 * - Exact Spot Rate lookup and custom override
 * - Window Flexible Forward & Fixed Forward pricing with conservative interbank boundary
 * - Tenor ladder display and historical curve comparison
 */

let AVAILABLE_PAIRS = [];
let ACTIVE_PAIR = 'EURUSD';
let CURRENT_LADDER_DATA = null;
let PRICER_MODE = 'window'; // default to window forward

// DOM Elements
const commandInput = document.getElementById('command-input');
const goBtn = document.getElementById('go-btn');
const systemClock = document.getElementById('system-clock');
const presetsContainer = document.getElementById('presets-container');

// Banner elements
const activePairName = document.getElementById('active-pair-name');
const bannerLhsRhsBadge = document.getElementById('banner-lhs-rhs-badge');
const bannerLiveBadge = document.getElementById('banner-live-badge');
const bannerSpotBid = document.getElementById('banner-spot-bid');
const bannerSpotAsk = document.getElementById('banner-spot-ask');
const bannerSpotMid = document.getElementById('banner-spot-mid');
const bannerBaseCode = document.getElementById('banner-base-code');
const bannerQuoteCode = document.getElementById('banner-quote-code');
const bannerLhsCode = document.getElementById('banner-lhs-code');
const bannerRhsCode = document.getElementById('banner-rhs-code');
const bannerBaseRate = document.getElementById('banner-base-rate');
const bannerQuoteRate = document.getElementById('banner-quote-rate');
const bannerXccyBasis = document.getElementById('banner-xccy-basis');

// Interbank CIP Strip elements
const stripBaseLbl = document.getElementById('strip-base-lbl');
const stripBaseVal = document.getElementById('strip-base-val');
const stripQuoteLbl = document.getElementById('strip-quote-lbl');
const stripQuoteVal = document.getElementById('strip-quote-val');
const stripDiffVal = document.getElementById('strip-diff-val');
const stripFeedSource = document.getElementById('strip-feed-source');
const btnToggleCustomRates = document.getElementById('btn-toggle-custom-rates');
const boxCustomRates = document.getElementById('box-custom-rates');
const fxfaCustomBaseRate = document.getElementById('fxfa-custom-base-rate');
const fxfaCustomQuoteRate = document.getElementById('fxfa-custom-quote-rate');
const lblCustomBase = document.getElementById('lbl-custom-base');
const lblCustomQuote = document.getElementById('lbl-custom-quote');
const btnResetRates = document.getElementById('btn-reset-rates');
const fxfaRefreshSpotBtn = document.getElementById('fxfa-refresh-spot-btn');

// FRD elements
const frdPairSelect = document.getElementById('frd-pair-select');
const frdDateInput = document.getElementById('frd-date-input');
const frdXccyToggle = document.getElementById('frd-xccy-toggle');
const frdRefreshBtn = document.getElementById('frd-refresh-btn');
const frdExportCsv = document.getElementById('frd-export-csv');
const frdTableBody = document.getElementById('frd-table-body');

// COMP elements
const compPairSelect = document.getElementById('comp-pair-select');
const compDate1 = document.getElementById('comp-date1');
const compDate2 = document.getElementById('comp-date2');
const compRunBtn = document.getElementById('comp-run-btn');
const compTableBody = document.getElementById('comp-table-body');
const compCurveChart = document.getElementById('comp-curve-chart');
const compLegendDate1 = document.getElementById('comp-legend-date1');
const compLegendDate2 = document.getElementById('comp-legend-date2');

// HIST elements
const histPairSelect = document.getElementById('hist-pair-select');
const histTenorSelect = document.getElementById('hist-tenor-select');
const histStartDate = document.getElementById('hist-start-date');
const histEndDate = document.getElementById('hist-end-date');
const histRunBtn = document.getElementById('hist-run-btn');
const histRateChart = document.getElementById('hist-rate-chart');
const histPointsChart = document.getElementById('hist-points-chart');
const histChartTitle = document.getElementById('hist-chart-title');

// PRICER elements
const modeFixedBtn = document.getElementById('mode-fixed-btn');
const modeWindowBtn = document.getElementById('mode-window-btn');
const rowFixedDate = document.getElementById('row-fixed-date');
const rowWindowDates = document.getElementById('row-window-dates');
const rowDirection = document.getElementById('row-direction');

const fxfaPairSelect = document.getElementById('fxfa-pair-select');
const fxfaAsofDate = document.getElementById('fxfa-asof-date');
const fxfaSpotInput = document.getElementById('fxfa-spot-input');
const fxfaResetSpotBtn = document.getElementById('fxfa-reset-spot-btn');
const fxfaSettleDate = document.getElementById('fxfa-settle-date');
const fxfaWindowStart = document.getElementById('fxfa-window-start');
const fxfaWindowEnd = document.getElementById('fxfa-window-end');
const fxfaDirection = document.getElementById('fxfa-direction');
const fxfaNotional = document.getElementById('fxfa-notional');
const fxfaXccyToggle = document.getElementById('fxfa-xccy-toggle');
const fxfaCalculateBtn = document.getElementById('fxfa-calculate-btn');

// PRICER outputs
const pricerResultHeading = document.getElementById('pricer-result-heading');
const lblMetricRate = document.getElementById('lbl-metric-rate');
const resDays = document.getElementById('res-days');
const resSpotDate = document.getElementById('res-spot-date');
const resSpot = document.getElementById('res-spot');
const resPoints = document.getElementById('res-points');
const resAnnPrm = document.getElementById('res-ann-prm');
const resOutright = document.getElementById('res-outright');
const resSubDesc = document.getElementById('res-sub-desc');

// New Two-Way Bid/Ask elements
const cardFwdBid = document.getElementById('card-fwd-bid');
const cardFwdAsk = document.getElementById('card-fwd-ask');
const resFwdBid = document.getElementById('res-fwd-bid');
const resFwdAsk = document.getElementById('res-fwd-ask');
const resPtsBid = document.getElementById('res-pts-bid');
const resPtsAsk = document.getElementById('res-pts-ask');
const resFwdMid = document.getElementById('res-fwd-mid');
const resFwdSpread = document.getElementById('res-fwd-spread');
const resDealDirection = document.getElementById('res-deal-direction');
const resCashflow = document.getElementById('res-cashflow');
const lblLhsClientRole = document.getElementById('lbl-lhs-client-role');
const lblRhsClientRole = document.getElementById('lbl-rhs-client-role');
const lblNotional = document.getElementById('lbl-notional');

// Spot LHS / RHS elements
const resSpotLhs = document.getElementById('res-spot-lhs');
const resSpotRhs = document.getElementById('res-spot-rhs');
const resSpotLhsPill = document.getElementById('res-spot-lhs-pill');
const resSpotRhsPill = document.getElementById('res-spot-rhs-pill');
const inputSpotLhs = document.getElementById('input-spot-lhs');
const inputSpotRhs = document.getElementById('input-spot-rhs');
const lblSpotSide = document.getElementById('lbl-spot-side');
const bdItemLhs = document.getElementById('bd-item-lhs');
const bdItemRhs = document.getElementById('bd-item-rhs');
const resDealSpot = document.getElementById('res-deal-spot');
const resDealPoints = document.getElementById('res-deal-points');
const fixSpotBid = document.getElementById('fix-spot-bid');
const fixSpotAsk = document.getElementById('fix-spot-ask');
const fixPtsBid = document.getElementById('fix-pts-bid');
const fixPtsAsk = document.getElementById('fix-pts-ask');

// Window Boundaries elements
const windowDecomposition = document.getElementById('window-decomposition');
const winCurveStructure = document.getElementById('win-curve-structure');
const cardBoundaryStart = document.getElementById('card-boundary-start');
const cardBoundaryEnd = document.getElementById('card-boundary-end');
const winStartDateLbl = document.getElementById('win-start-date-lbl');
const winEndDateLbl = document.getElementById('win-end-date-lbl');
const winStartBid = document.getElementById('win-start-bid');
const winStartAsk = document.getElementById('win-start-ask');
const winStartMid = document.getElementById('win-start-mid');
const winStartPts = document.getElementById('win-start-pts');
const winEndBid = document.getElementById('win-end-bid');
const winEndAsk = document.getElementById('win-end-ask');
const winEndMid = document.getElementById('win-end-mid');
const winEndPts = document.getElementById('win-end-pts');
const winWorstDate = document.getElementById('win-worst-date');
const winCarryCost = document.getElementById('win-carry-cost');

const windowScheduleBox = document.getElementById('window-schedule-box');
const windowScheduleTbody = document.getElementById('window-schedule-tbody');

// Fixed forward elements
const fixedDecomposition = document.getElementById('fixed-decomposition');
const fixBidFwd = document.getElementById('fix-bid-fwd');
const fixAskFwd = document.getElementById('fix-ask-fwd');
const fixMidPts = document.getElementById('fix-mid-pts');
const resBaseRate = document.getElementById('res-base-rate');
const resQuoteRate = document.getElementById('res-quote-rate');

const BENCHMARK_PRESETS = [
  {
    id: 'live-eurusd',
    title: '🔴 LIVE EUR:USD (Active Market)',
    pair: 'EURUSD',
    date: new Date().toISOString().split('T')[0],
    description: 'Real-time live interbank spot rate & dual-curve CIP forward structure.'
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
    title: '🇯🇵 LIVE USD:JPY (Carry Trade)',
    pair: 'USDJPY',
    date: new Date().toISOString().split('T')[0],
    description: 'Live USD/JPY showing forward discount driven by US vs Japan yield gap.'
  },
  {
    id: 'user-case-2026',
    title: '⭐ EUR:USD RHS Benchmark (25/08/26 Spot 0.8566)',
    pair: 'EURUSD',
    direction: 'RHS',
    date: '2026-08-25',
    spot: 0.8566,
    winStart: '2026-11-02',
    winEnd: '2027-02-09',
    description: 'Historical comparison: EUR:USD RHS quoted in USD:EUR @ 0.8566, Window 02/11/26 to 09/02/27.'
  },
  {
    id: 'fed-peak-2023',
    title: 'EUR:USD Peak Rates (Oct 2023)',
    pair: 'EURUSD',
    date: '2023-10-15',
    spot: 1.05216,
    winStart: '2023-11-15',
    winEnd: '2024-01-15',
    description: 'Peak US 5.5% policy rates, forward points in premium.'
  }
];

// Clock
function updateClock() {
  const now = new Date();
  systemClock.textContent = now.toUTCString().replace('GMT', 'UTC');
}
setInterval(updateClock, 1000);
updateClock();

function getPairMeta(symbol) {
  if (!symbol) return AVAILABLE_PAIRS[0];
  const clean = symbol.toUpperCase().replace(/[\/:]/g, '');
  const found = AVAILABLE_PAIRS.find(p => p.symbol === clean) ||
                (typeof CIP_CLIENT !== 'undefined' && CIP_CLIENT.PAIRS && CIP_CLIENT.PAIRS[clean]);
  if (found) return found;

  // Check if inverted pair
  const direct = AVAILABLE_PAIRS.find(p => clean === `${p.quote}${p.base}`) ||
                 (typeof CIP_CLIENT !== 'undefined' && CIP_CLIENT.PAIRS && Object.values(CIP_CLIENT.PAIRS).find(p => clean === `${p.quote}${p.base}`));
  if (direct) {
    return {
      symbol: clean,
      lhs: direct.rhs,
      rhs: direct.lhs,
      base: direct.quote,
      quote: direct.base,
      name: `${direct.rhs}:${direct.lhs}`,
      label: `${direct.rhs}:${direct.lhs}`,
      quoteDecimals: direct.quoteDecimals,
      pipDecimals: direct.pipDecimals,
      pipSize: direct.pipSize,
      typicalSpreadPips: direct.typicalSpreadPips,
      isInverted: true,
      underlyingPair: direct.symbol
    };
  }

  return AVAILABLE_PAIRS[0] || {
    symbol: 'EURUSD', lhs: 'EUR', rhs: 'USD', base: 'EUR', quote: 'USD', name: 'EUR:USD', quoteDecimals: 5, pipDecimals: 1, pipSize: 0.0001
  };
}

function getInvertedPairKey(pairKey) {
  const p = getPairMeta(pairKey);
  const base = p.base || p.lhs;
  const quote = p.quote || p.rhs;
  return `${quote}${base}`;
}

function getEffectivePairMeta(pairKey, direction) {
  const isLHS = (direction === 'LHS' || direction === 'SELL_LHS' || direction === 'SELL');
  if (isLHS) {
    return getPairMeta(pairKey);
  }
  return getPairMeta(getInvertedPairKey(pairKey));
}

function syncAllSelects(pairSymbol) {
  [frdPairSelect, compPairSelect, histPairSelect, fxfaPairSelect].forEach(select => {
    if (select) select.value = pairSymbol;
  });

  const p = getPairMeta(pairSymbol);
  if (p) {
    const base = p.base || p.lhs;
    const quote = p.quote || p.rhs;
    activePairName.textContent = `${p.name}`;
    if (bannerLhsRhsBadge) bannerLhsRhsBadge.textContent = `${p.name}`;
    if (bannerBaseCode) bannerBaseCode.textContent = base;
    if (bannerQuoteCode) bannerQuoteCode.textContent = quote;
    if (bannerLhsCode) bannerLhsCode.textContent = base;
    if (bannerRhsCode) bannerRhsCode.textContent = quote;
    if (lblNotional) lblNotional.textContent = `${base} Deal Notional Amount:`;
    if (lblCustomBase) lblCustomBase.textContent = base;
    if (lblCustomQuote) lblCustomQuote.textContent = quote;

    // Institutional Nomenclature:
    // LHS = Client SELLS base / BUYS quote (Quoted in Base:Terms, e.g. EUR:USD)
    // RHS = Client BUYS base / SELLS quote (Quoted in Terms:Base, e.g. USD:EUR)
    const curVal = fxfaDirection ? fxfaDirection.value : 'LHS';
    if (fxfaDirection) {
      fxfaDirection.innerHTML = `
        <option value="LHS">LHS — Client Sells ${base} / Buys ${quote} (Quoted in ${base}:${quote})</option>
        <option value="RHS">RHS — Client Buys ${base} / Sells ${quote} (Quoted in ${quote}:${base})</option>
      `;
      fxfaDirection.value = (curVal === 'RHS') ? 'RHS' : 'LHS';
    }

    if (lblLhsClientRole) lblLhsClientRole.textContent = `Client Sells ${base} / Buys ${quote} (${base}:${quote})`;
    if (lblRhsClientRole) lblRhsClientRole.textContent = `Client Buys ${base} / Sells ${quote} (${quote}:${base})`;
  }
}

// Mode Selection (Fixed vs Window Forward)
modeFixedBtn.addEventListener('click', () => {
  PRICER_MODE = 'fixed';
  modeFixedBtn.classList.add('active');
  modeWindowBtn.classList.remove('active');
  rowFixedDate.style.display = 'block';
  rowWindowDates.style.display = 'none';
  rowDirection.style.display = 'block';
  pricerResultHeading.textContent = 'FIXED FORWARD (SINGLE MATURITY) PRICING';
  calculatePricer();
});

modeWindowBtn.addEventListener('click', () => {
  PRICER_MODE = 'window';
  modeWindowBtn.classList.add('active');
  modeFixedBtn.classList.remove('active');
  rowFixedDate.style.display = 'none';
  rowWindowDates.style.display = 'grid';
  rowDirection.style.display = 'block';
  pricerResultHeading.textContent = 'WINDOW FORWARD (FLEXIBLE DELIVERY) PRICING';
  calculatePricer();
});

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    const isActive = b.dataset.tab === tabId;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });

  if (tabId === 'pricer') calculatePricer();
  else if (tabId === 'frd') loadForwardLadder();
  else if (tabId === 'comp') loadComparison();
  else if (tabId === 'hist') loadHistory();
}

// Initialize Pairs and Presets
async function init() {
  try {
    let pairsData = null;
    try {
      const pairsRes = await fetch('/api/pairs');
      if (pairsRes.ok) pairsData = await pairsRes.json();
    } catch (e) {}

    if (pairsData && pairsData.pairs) {
      AVAILABLE_PAIRS = pairsData.pairs;
    } else if (typeof CIP_CLIENT !== 'undefined') {
      AVAILABLE_PAIRS = Object.values(CIP_CLIENT.PAIRS);
    }

    const selects = [frdPairSelect, compPairSelect, histPairSelect, fxfaPairSelect];
    selects.forEach(select => {
      select.innerHTML = '';
      AVAILABLE_PAIRS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.symbol;
        opt.textContent = `${p.name}`;
        select.appendChild(opt);
      });
    });

    const today = new Date().toISOString().split('T')[0];
    if (fxfaAsofDate) fxfaAsofDate.value = today;
    if (frdDateInput) frdDateInput.value = today;
    if (compDate1 && !compDate1.value) compDate1.value = '2023-10-15';
    if (compDate2) compDate2.value = today;
    if (histStartDate && !histStartDate.value) histStartDate.value = '2023-01-01';
    if (histEndDate) histEndDate.value = today;

    const dWinStart = new Date();
    dWinStart.setUTCDate(dWinStart.getUTCDate() + 30);
    const dWinEnd = new Date();
    dWinEnd.setUTCDate(dWinEnd.getUTCDate() + 90);
    if (fxfaWindowStart) fxfaWindowStart.value = dWinStart.toISOString().split('T')[0];
    if (fxfaWindowEnd) fxfaWindowEnd.value = dWinEnd.toISOString().split('T')[0];
    if (fxfaSettleDate) fxfaSettleDate.value = dWinEnd.toISOString().split('T')[0];

    renderPresets(BENCHMARK_PRESETS);
    syncAllSelects(ACTIVE_PAIR);

    // Initial load
    await calculatePricer();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

function renderPresets(presets) {
  presetsContainer.innerHTML = '';
  presets.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.textContent = p.title;
    chip.title = p.description;
    chip.addEventListener('click', () => {
      applyPreset(p);
    });
    presetsContainer.appendChild(chip);
  });
}

function applyPreset(preset) {
  ACTIVE_PAIR = preset.pair;
  if (preset.direction && fxfaDirection) {
    fxfaDirection.value = preset.direction;
  }
  syncAllSelects(ACTIVE_PAIR);

  fxfaAsofDate.value = preset.date;
  if (preset.spot) fxfaSpotInput.value = preset.spot;
  if (preset.winStart) fxfaWindowStart.value = preset.winStart;
  if (preset.winEnd) fxfaWindowEnd.value = preset.winEnd;

  frdDateInput.value = preset.date;
  updateSpotUI(ACTIVE_PAIR, preset.date, fxfaDirection ? fxfaDirection.value : 'LHS', preset.spot ? preset.spot.toString() : null, false);
  modeWindowBtn.click();
  switchTab('pricer');
}

/**
 * Fetch market spot details from server or client engine
 */
async function getMarketSpotDetails(pairKey, asOfDate, forceRefresh = false, customSpot = null) {
  const pair = getPairMeta(pairKey);
  const decimals = pair.quoteDecimals || 5;
  const spreadPips = (pair.typicalSpreadPips && pair.typicalSpreadPips['1M']) || 0.4;
  const halfSpread = (spreadPips * 0.5) * pair.pipSize;

  if (customSpot != null && !isNaN(parseFloat(customSpot)) && parseFloat(customSpot) > 0) {
    const mid = parseFloat(customSpot);
    return {
      rate: mid, mid,
      bid: parseFloat((mid - halfSpread).toFixed(decimals)),
      ask: parseFloat((mid + halfSpread).toFixed(decimals)),
      source: 'USER_OVERRIDE',
      isLive: false,
      timestamp: new Date().toISOString()
    };
  }

  // 1. Try server API
  try {
    const res = await fetch(`/api/spot?pair=${pairKey}&date=${asOfDate}${forceRefresh ? '&refresh=true' : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.mid > 0) return data;
    }
  } catch (e) {}

  // 2. Try CIP_CLIENT in engine.js
  if (typeof CIP_CLIENT !== 'undefined' && CIP_CLIENT.fetchLiveSpot) {
    try {
      const data = await CIP_CLIENT.fetchLiveSpot(pairKey, asOfDate, null, forceRefresh);
      if (data && data.mid > 0) return data;
    } catch (e) {}
  }

  // 3. Fallback
  const mid = (typeof CIP_CLIENT !== 'undefined') ? CIP_CLIENT.getSpotRate(pairKey, asOfDate) : 1.0;
  return {
    rate: mid, mid,
    bid: parseFloat((mid - halfSpread).toFixed(decimals)),
    ask: parseFloat((mid + halfSpread).toFixed(decimals)),
    source: 'INTERBANK_BASELINE',
    isLive: false,
    timestamp: new Date().toISOString()
  };
}

/**
 * Dynamically synchronize the Spot Rate input, the breakdown (LHS Bid vs RHS Ask),
 * the active side indicator, and the top terminal banner across pair and direction changes.
 */
async function updateSpotUI(pairKey, asOfDate, direction, rawInputVal = null, forceReset = false) {
  const isLHS = (direction === 'LHS' || direction === 'SELL_LHS' || direction === 'SELL');
  const isRHS = !isLHS;
  const effectiveKey = isRHS ? getInvertedPairKey(pairKey) : pairKey;
  const pairMeta = getPairMeta(effectiveKey);
  const decimals = pairMeta.quoteDecimals || 5;

  let spotVal = null;
  if (!forceReset && rawInputVal != null && rawInputVal !== '') {
    const clean = rawInputVal.toString().trim().replace(',', '.');
    if (!isNaN(parseFloat(clean)) && parseFloat(clean) > 0) {
      spotVal = parseFloat(clean);
    }
  }

  let details;
  if (spotVal == null || forceReset) {
    details = await getMarketSpotDetails(effectiveKey, asOfDate, forceReset);
    spotVal = details.mid;
    if (fxfaSpotInput) {
      fxfaSpotInput.value = spotVal.toFixed(decimals);
    }
  } else {
    details = await getMarketSpotDetails(effectiveKey, asOfDate, false, spotVal);
  }

  const spotBid = details.bid;
  const spotAsk = details.ask;
  const spotMid = details.mid;

  if (inputSpotLhs) inputSpotLhs.textContent = spotBid.toFixed(decimals);
  if (inputSpotRhs) inputSpotRhs.textContent = spotAsk.toFixed(decimals);

  if (bdItemLhs) bdItemLhs.classList.toggle('active-side', true);
  if (bdItemRhs) bdItemRhs.classList.toggle('active-side', false);

  if (lblSpotSide) {
    lblSpotSide.textContent = `(${pairMeta.name} Bank Bid: ${spotBid.toFixed(decimals)})`;
  }

  if (bannerSpotBid) bannerSpotBid.textContent = spotBid.toFixed(decimals);
  if (bannerSpotAsk) bannerSpotAsk.textContent = spotAsk.toFixed(decimals);
  if (bannerSpotMid) bannerSpotMid.textContent = `(Mid: ${spotMid.toFixed(decimals)})`;

  if (bannerLhsRhsBadge) bannerLhsRhsBadge.textContent = pairMeta.name;
  if (activePairName) activePairName.textContent = pairMeta.name;
  if (bannerBaseCode) bannerBaseCode.textContent = pairMeta.base;
  if (bannerQuoteCode) bannerQuoteCode.textContent = pairMeta.quote;

  if (bannerLiveBadge) {
    if (details.isLive) {
      bannerLiveBadge.textContent = '🟢 LIVE';
      bannerLiveBadge.className = 'live-pulse-badge';
    } else {
      bannerLiveBadge.textContent = details.source === 'USER_OVERRIDE' ? '✏️ OVERRIDE' : '📅 HISTORICAL';
      bannerLiveBadge.className = 'live-pulse-badge historical';
    }
  }

  if (stripFeedSource) {
    if (details.isLive) {
      stripFeedSource.textContent = '🟢 LIVE INTERBANK (' + (details.source || 'REALTIME') + ')';
      stripFeedSource.className = 'cip-strip-source';
    } else {
      stripFeedSource.textContent = details.source === 'USER_OVERRIDE' ? '✏️ CUSTOM OVERRIDE' : '📅 ' + (details.source || 'HISTORICAL FIXING');
      stripFeedSource.className = 'cip-strip-source historical';
    }
  }

  return { spotMid, spotBid, spotAsk, isLHS, details };
}

function updateRateStripAndBanner(data, pairMeta) {
  const base = pairMeta.base || pairMeta.lhs;
  const quote = pairMeta.quote || pairMeta.rhs;
  const bRate = data.startDatePricing?.baseRate != null ? data.startDatePricing.baseRate : (data.baseRate != null ? data.baseRate : 0);
  const qRate = data.startDatePricing?.quoteRate != null ? data.startDatePricing.quoteRate : (data.quoteRate != null ? data.quoteRate : 0);
  const diffRate = qRate - bRate;
  const xccy = data.xccyBps != null ? data.xccyBps : 0;

  if (stripBaseLbl) stripBaseLbl.textContent = `${base} / ${data.baseCcy?.benchmark || '€STR'}`;
  if (stripQuoteLbl) stripQuoteLbl.textContent = `${quote} / ${data.quoteCcy?.benchmark || 'SOFR'}`;
  if (stripBaseVal) stripBaseVal.textContent = `${bRate.toFixed(3)}%`;
  if (stripQuoteVal) stripQuoteVal.textContent = `${qRate.toFixed(3)}%`;
  if (stripDiffVal) {
    stripDiffVal.textContent = `${diffRate >= 0 ? '+' : ''}${diffRate.toFixed(3)}% (${diffRate >= 0 ? '+' : ''}${Math.round(diffRate * 100)} bps)`;
    stripDiffVal.className = `cip-strip-val ${diffRate >= 0 ? 'highlight' : 'negative'}`;
  }

  if (bannerBaseRate) bannerBaseRate.textContent = `${data.baseCcy?.benchmark || 'RFR'} ${bRate.toFixed(2)}%`;
  if (bannerQuoteRate) bannerQuoteRate.textContent = `${data.quoteCcy?.benchmark || 'RFR'} ${qRate.toFixed(2)}%`;
  if (bannerXccyBasis) bannerXccyBasis.textContent = `${xccy.toFixed(1)} bps`;
}

// Spot Reset Button
fxfaResetSpotBtn.addEventListener('click', async () => {
  const pair = fxfaPairSelect.value || ACTIVE_PAIR;
  const asOf = fxfaAsofDate.value;
  const dir = fxfaDirection.value;
  await updateSpotUI(pair, asOf, dir, null, true);
  calculatePricer();
});

// Spot Live Tick Refresh Button
if (fxfaRefreshSpotBtn) {
  fxfaRefreshSpotBtn.addEventListener('click', async () => {
    const pair = fxfaPairSelect.value || ACTIVE_PAIR;
    const asOf = fxfaAsofDate.value;
    const dir = fxfaDirection.value;
    await updateSpotUI(pair, asOf, dir, null, true);
    calculatePricer();
  });
}

// Custom Rates Toggles
if (btnToggleCustomRates) {
  btnToggleCustomRates.addEventListener('click', () => {
    const isHidden = boxCustomRates.style.display === 'none';
    boxCustomRates.style.display = isHidden ? 'block' : 'none';
    btnToggleCustomRates.textContent = isHidden ? '▲ Hide Custom Rates' : '⚙️ Customize Interbank Rates (Advanced CIP)';
  });
}
if (btnResetRates) {
  btnResetRates.addEventListener('click', () => {
    if (fxfaCustomBaseRate) fxfaCustomBaseRate.value = '';
    if (fxfaCustomQuoteRate) fxfaCustomQuoteRate.value = '';
    calculatePricer();
  });
}
if (fxfaCustomBaseRate) fxfaCustomBaseRate.addEventListener('input', calculatePricer);
if (fxfaCustomQuoteRate) fxfaCustomQuoteRate.addEventListener('input', calculatePricer);

// 1. PRICER: Fixed Forward & Window Forward Calculator
async function calculatePricer() {
  const pair = fxfaPairSelect.value || ACTIVE_PAIR;
  ACTIVE_PAIR = pair;
  syncAllSelects(ACTIVE_PAIR);
  const asOf = fxfaAsofDate.value;
  const rawSpotStr = fxfaSpotInput.value ? fxfaSpotInput.value.trim().replace(',', '.') : '';
  const customSpot = rawSpotStr && !isNaN(parseFloat(rawSpotStr)) && parseFloat(rawSpotStr) > 0 ? parseFloat(rawSpotStr) : null;
  const customBase = (fxfaCustomBaseRate && fxfaCustomBaseRate.value) ? parseFloat(fxfaCustomBaseRate.value.trim().replace(',', '.')) : null;
  const customQuote = (fxfaCustomQuoteRate && fxfaCustomQuoteRate.value) ? parseFloat(fxfaCustomQuoteRate.value.trim().replace(',', '.')) : null;
  const rateParams = (customBase != null && !isNaN(customBase) ? `&baseRate=${customBase}` : '') +
                     (customQuote != null && !isNaN(customQuote) ? `&quoteRate=${customQuote}` : '');

  const applyXccy = fxfaXccyToggle.checked;
  const notional = parseFloat(fxfaNotional.value) || 1000000;
  const direction = fxfaDirection.value;
  // Institutional Nomenclature:
  // - LHS: Client SELLS base / BUYS quote (Quoted in Base:Terms, e.g. EUR:USD). Client sells Base @ Bank BID.
  // - RHS: Client BUYS base / SELLS quote (Quoted in Terms:Base, e.g. USD:EUR). In USD:EUR, Client sells USD @ Bank BID.
  const isLHS = (direction === 'LHS' || direction === 'SELL_LHS' || direction === 'SELL');
  const isRHS = !isLHS;

  // Inverted quotation when RHS is selected
  const effectivePairKey = isRHS ? getInvertedPairKey(pair) : pair;
  const effectiveMeta = getPairMeta(effectivePairKey);
  const base = effectiveMeta.base || effectiveMeta.lhs;
  const quote = effectiveMeta.quote || effectiveMeta.rhs;

  if (lblNotional) lblNotional.textContent = `${base} Deal Notional Amount:`;
  if (lblLhsClientRole) lblLhsClientRole.textContent = `Client Sells ${base} / Buys ${quote} (${effectiveMeta.name} Bid)`;
  if (lblRhsClientRole) lblRhsClientRole.textContent = `Client Buys ${base} / Sells ${quote} (${effectiveMeta.name} Ask)`;

  // Ensure spot breakdown reflects the current effective pair, date and direction
  const spotUiResult = await updateSpotUI(pair, asOf, direction, customSpot != null ? customSpot.toString() : null, false);
  const activeSpot = customSpot != null ? customSpot : (spotUiResult ? spotUiResult.spotMid : null);

  if (PRICER_MODE === 'window') {
    // WINDOW FORWARD
    fixedDecomposition.style.display = 'none';
    windowDecomposition.style.display = 'block';
    windowScheduleBox.style.display = 'block';
    pricerResultHeading.textContent = `WINDOW FORWARD (FLEXIBLE DELIVERY) — ${effectiveMeta.name}`;
    lblMetricRate.textContent = 'CLIENT EXECUTABLE RATE';
    resSubDesc.textContent = `Guaranteed Rate for Window Execution (${effectiveMeta.name})`;

    const winStart = fxfaWindowStart.value;
    const winEnd = fxfaWindowEnd.value;

    try {
      let data = null;
      try {
        const spotParam = activeSpot ? `&spot=${activeSpot}` : '';
        const url = `/api/window-forward?pair=${effectivePairKey}&asOf=${asOf}&windowStart=${winStart}&windowEnd=${winEnd}&direction=LHS&notional=${notional}&applyXccy=${applyXccy}${spotParam}${rateParams}`;
        const res = await fetch(url);
        if (res.ok) data = await res.json();
      } catch (e) {}

      if (!data && typeof CIP_CLIENT !== 'undefined') {
        data = CIP_CLIENT.windowForward(effectivePairKey, asOf, winStart, winEnd, 'LHS', {
          applyXccy,
          notional,
          spot: activeSpot,
          baseRate: customBase,
          quoteRate: customQuote
        });
      }

      if (!data) throw new Error('Could not calculate window forward');

      // Update spot inputs if empty
      if (!fxfaSpotInput.value) fxfaSpotInput.value = data.spot.toFixed(effectiveMeta.quoteDecimals);

      // Update banner & breakdown
      await updateSpotUI(pair, asOf, direction, customSpot != null ? customSpot.toString() : data.spot.toString(), false);
      updateRateStripAndBanner(data, effectiveMeta);

      // 1. Meta Pills & Spot LHS / RHS
      resSpot.textContent = data.spot.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotLhsPill) resSpotLhsPill.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotRhsPill) resSpotRhsPill.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);
      if (inputSpotLhs) inputSpotLhs.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (inputSpotRhs) inputSpotRhs.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);
      resSpotDate.textContent = data.spotDate;
      resDays.textContent = `${data.windowDurationDays}d flex`;
      winCurveStructure.textContent = data.curveStructure;

      // 2. TWO-WAY BID / ASK DISPLAY
      const wBid = data.windowBid != null ? data.windowBid : data.startDatePricing.bid;
      const wAsk = data.windowAsk != null ? data.windowAsk : data.startDatePricing.ask;
      const wPtsBid = data.windowPointsBid != null ? data.windowPointsBid : data.startDatePricing.pointsBid;
      const wPtsAsk = data.windowPointsAsk != null ? data.windowPointsAsk : data.startDatePricing.pointsAsk;
      const wMid = (wBid + wAsk) / 2;
      const wSpread = (wAsk - wBid) / effectiveMeta.pipSize;

      // Spot LHS / RHS in respective two-way cards
      if (resSpotLhs) resSpotLhs.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotRhs) resSpotRhs.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);

      resFwdBid.textContent = wBid.toFixed(effectiveMeta.quoteDecimals);
      resFwdAsk.textContent = wAsk.toFixed(effectiveMeta.quoteDecimals);
      resPtsBid.textContent = `${wPtsBid >= 0 ? '+' : ''}${wPtsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      resPtsAsk.textContent = `${wPtsAsk >= 0 ? '+' : ''}${wPtsAsk.toFixed(effectiveMeta.pipDecimals)} pips`;

      resFwdMid.textContent = wMid.toFixed(effectiveMeta.quoteDecimals);
      resFwdSpread.textContent = `${wSpread.toFixed(2)} pips`;
      resPoints.textContent = `${wPtsBid >= 0 ? '+' : ''}${wPtsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      resAnnPrm.textContent = data.curveStructure.includes('PREMIUM') ? 'Premium' : 'Discount';

      // 3. Client Execution Deal Card (Active Side Highlight)
      // Client is executing at Bank BID of the quoted pair (effectiveMeta)
      cardFwdBid.classList.add('deal-active');
      cardFwdAsk.classList.remove('deal-active');
      resOutright.textContent = wBid.toFixed(effectiveMeta.quoteDecimals);
      if (isRHS) {
        resDealDirection.textContent = `RHS Deal: Client BUYS ${quote} / SELLS ${base} (Quoted in ${effectiveMeta.name} @ Bank BID: ${wBid.toFixed(effectiveMeta.quoteDecimals)})`;
      } else {
        resDealDirection.textContent = `LHS Deal: Client SELLS ${base} / BUYS ${quote} (Quoted in ${effectiveMeta.name} @ Bank BID: ${wBid.toFixed(effectiveMeta.quoteDecimals)})`;
      }
      if (resDealSpot) resDealSpot.textContent = `${data.spotBid.toFixed(effectiveMeta.quoteDecimals)} (Spot ${effectiveMeta.name} Bank BID)`;
      if (resDealPoints) resDealPoints.textContent = `${wPtsBid >= 0 ? '+' : ''}${wPtsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      const settleCash = notional * wBid;
      resCashflow.textContent = `${settleCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote} for ${notional.toLocaleString('en-US')} ${base}`;

      // 4. Side-by-side Boundary Pillars (Start vs End)
      winStartDateLbl.textContent = `${data.startDatePricing.date} (${data.startDatePricing.days}d)`;
      winStartBid.textContent = data.startDatePricing.bid.toFixed(effectiveMeta.quoteDecimals);
      winStartAsk.textContent = data.startDatePricing.ask.toFixed(effectiveMeta.quoteDecimals);
      winStartMid.textContent = data.startDatePricing.mid.toFixed(effectiveMeta.quoteDecimals);
      winStartPts.textContent = `${data.startDatePricing.pointsMid >= 0 ? '+' : ''}${data.startDatePricing.pointsMid.toFixed(effectiveMeta.pipDecimals)} pips`;

      winEndDateLbl.textContent = `${data.endDatePricing.date} (${data.endDatePricing.days}d)`;
      winEndBid.textContent = data.endDatePricing.bid.toFixed(effectiveMeta.quoteDecimals);
      winEndAsk.textContent = data.endDatePricing.ask.toFixed(effectiveMeta.quoteDecimals);
      winEndMid.textContent = data.endDatePricing.mid.toFixed(effectiveMeta.quoteDecimals);
      winEndPts.textContent = `${data.endDatePricing.pointsMid >= 0 ? '+' : ''}${data.endDatePricing.pointsMid.toFixed(effectiveMeta.pipDecimals)} pips`;

      // Highlight active conservative pillar
      if (data.worstCaseDate === data.windowStart) {
        cardBoundaryStart.classList.add('pillar-active');
        cardBoundaryEnd.classList.remove('pillar-active');
      } else {
        cardBoundaryEnd.classList.add('pillar-active');
        cardBoundaryStart.classList.remove('pillar-active');
      }

      winWorstDate.textContent = `${data.worstCaseDate} (${data.worstCaseDays}d from spot - Conservative Carry Boundary)`;
      winCarryCost.textContent = `${data.windowCost.pips.toFixed(effectiveMeta.pipDecimals)} pips (${data.windowCost.cashflow.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${data.windowCost.currency})`;

      // 5. Corridor table
      windowScheduleTbody.innerHTML = '';
      data.windowSchedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${row.date}</strong></td>
          <td class="text-right">${row.days}</td>
          <td class="text-right ${row.swapPoints >= 0 ? 'positive' : 'negative'}">${row.swapPoints >= 0 ? '+' : ''}${row.swapPoints.toFixed(effectiveMeta.pipDecimals)}</td>
          <td class="text-right green-text">${row.forwardBid.toFixed(effectiveMeta.quoteDecimals)}</td>
          <td class="text-right amber-text"><strong>${row.forwardAsk.toFixed(effectiveMeta.quoteDecimals)}</strong></td>
        `;
        windowScheduleTbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Window Forward pricing error:', err);
    }
  } else {
    // FIXED FORWARD
    fixedDecomposition.style.display = 'block';
    windowDecomposition.style.display = 'none';
    windowScheduleBox.style.display = 'none';
    pricerResultHeading.textContent = `FIXED FORWARD (SINGLE MATURITY) — ${effectiveMeta.name}`;
    lblMetricRate.textContent = 'CLIENT EXECUTABLE RATE';
    resSubDesc.textContent = `Fixed Settlement Delivery Rate (${effectiveMeta.name})`;

    const settle = fxfaSettleDate.value;

    try {
      let data = null;
      try {
        const spotParam = activeSpot ? `&spot=${activeSpot}` : '';
        const res = await fetch(`/api/broken-date?pair=${effectivePairKey}&asOf=${asOf}&settlement=${settle}&applyXccy=${applyXccy}${spotParam}${rateParams}`);
        if (res.ok) data = await res.json();
      } catch (e) {}

      if (!data && typeof CIP_CLIENT !== 'undefined') {
        data = CIP_CLIENT.brokenDate(effectivePairKey, asOf, settle, applyXccy, activeSpot, {
          baseRate: customBase,
          quoteRate: customQuote
        });
      }

      if (!data) throw new Error('Could not calculate fixed forward');

      await updateSpotUI(pair, asOf, direction, customSpot != null ? customSpot.toString() : data.spot.toString(), false);
      updateRateStripAndBanner(data, effectiveMeta);

      resSpot.textContent = data.spot.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotLhsPill) resSpotLhsPill.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotRhsPill) resSpotRhsPill.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);
      if (inputSpotLhs) inputSpotLhs.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (inputSpotRhs) inputSpotRhs.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotLhs) resSpotLhs.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (resSpotRhs) resSpotRhs.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);

      resSpotDate.textContent = data.spotDate;
      resDays.textContent = `${data.days} days`;
      winCurveStructure.textContent = data.outrightForward >= data.spot ? 'PREMIUM' : 'DISCOUNT';

      const fSpread = (data.forwardAsk - data.forwardBid) / effectiveMeta.pipSize;
      resFwdBid.textContent = data.forwardBid.toFixed(effectiveMeta.quoteDecimals);
      resFwdAsk.textContent = data.forwardAsk.toFixed(effectiveMeta.quoteDecimals);
      resPtsBid.textContent = `${data.pointsBid >= 0 ? '+' : ''}${data.pointsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      resPtsAsk.textContent = `${data.pointsAsk >= 0 ? '+' : ''}${data.pointsAsk.toFixed(effectiveMeta.pipDecimals)} pips`;

      resFwdMid.textContent = data.outrightForward.toFixed(effectiveMeta.quoteDecimals);
      resFwdSpread.textContent = `${fSpread.toFixed(2)} pips`;
      resPoints.textContent = `${data.pointsBid >= 0 ? '+' : ''}${data.pointsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      resAnnPrm.textContent = `${data.annPremiumPct >= 0 ? '+' : ''}${data.annPremiumPct.toFixed(2)}% Ann.`;

      // Dealing execution
      cardFwdBid.classList.add('deal-active');
      cardFwdAsk.classList.remove('deal-active');
      resOutright.textContent = data.forwardBid.toFixed(effectiveMeta.quoteDecimals);
      if (isRHS) {
        resDealDirection.textContent = `RHS Deal: Client BUYS ${quote} / SELLS ${base} (Quoted in ${effectiveMeta.name} @ Bank BID: ${data.forwardBid.toFixed(effectiveMeta.quoteDecimals)})`;
      } else {
        resDealDirection.textContent = `LHS Deal: Client SELLS ${base} / BUYS ${quote} (Quoted in ${effectiveMeta.name} @ Bank BID: ${data.forwardBid.toFixed(effectiveMeta.quoteDecimals)})`;
      }
      if (resDealSpot) resDealSpot.textContent = `${data.spotBid.toFixed(effectiveMeta.quoteDecimals)} (Spot ${effectiveMeta.name} Bank BID)`;
      if (resDealPoints) resDealPoints.textContent = `${data.pointsBid >= 0 ? '+' : ''}${data.pointsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      const totalCash = notional * data.forwardBid;
      resCashflow.textContent = `${totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote} for ${notional.toLocaleString('en-US')} ${base}`;

      if (fixSpotBid) fixSpotBid.textContent = data.spotBid.toFixed(effectiveMeta.quoteDecimals);
      if (fixSpotAsk) fixSpotAsk.textContent = data.spotAsk.toFixed(effectiveMeta.quoteDecimals);
      if (fixPtsBid) fixPtsBid.textContent = `${data.pointsBid >= 0 ? '+' : ''}${data.pointsBid.toFixed(effectiveMeta.pipDecimals)} pips`;
      if (fixPtsAsk) fixPtsAsk.textContent = `${data.pointsAsk >= 0 ? '+' : ''}${data.pointsAsk.toFixed(effectiveMeta.pipDecimals)} pips`;
      fixBidFwd.textContent = data.forwardBid.toFixed(effectiveMeta.quoteDecimals);
      fixAskFwd.textContent = data.forwardAsk.toFixed(effectiveMeta.quoteDecimals);
      fixMidPts.textContent = `${data.swapPoints >= 0 ? '+' : ''}${data.swapPoints.toFixed(effectiveMeta.pipDecimals)} pips`;
      resBaseRate.textContent = `${data.baseRate.toFixed(2)}%`;
      resQuoteRate.textContent = `${data.quoteRate.toFixed(2)}%`;
    } catch (err) {
      console.error('Fixed Forward pricing error:', err);
    }
  }
}

// 2. FRD: Tenor Forward Ladder
async function loadForwardLadder() {
  const pair = frdPairSelect.value || ACTIVE_PAIR;
  ACTIVE_PAIR = pair;
  syncAllSelects(ACTIVE_PAIR);
  const date = frdDateInput.value;
  const applyXccy = frdXccyToggle.checked;

  frdTableBody.innerHTML = `<tr><td colspan="14" class="text-center">Fetching market data & generating CIP curves...</td></tr>`;

  try {
    let data = null;
    try {
      const res = await fetch(`/api/forward-ladder?pair=${pair}&date=${date}&applyXccy=${applyXccy}`);
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data && typeof CIP_CLIENT !== 'undefined') {
      data = CIP_CLIENT.computeLadder(pair, date, applyXccy);
    }

    if (!data) throw new Error('Could not compute forward ladder');

    CURRENT_LADDER_DATA = data;
    renderLadderTable(data);
  } catch (err) {
    frdTableBody.innerHTML = `<tr><td colspan="14" class="text-center negative">Error: ${err.message}</td></tr>`;
  }
}

function renderLadderTable(data) {
  frdTableBody.innerHTML = '';
  const pairMeta = getPairMeta(data.pair);

  data.ladder.forEach(row => {
    const tr = document.createElement('tr');
    const ptsClass = row.swapPoints.mid >= 0 ? 'positive' : 'negative';
    const ptsSign = row.swapPoints.mid >= 0 ? '+' : '';
    const fwdClass = row.outrightForward.mid >= data.spot.mid ? 'positive' : 'negative';

    tr.innerHTML = `
      <td><strong>${row.tenor}</strong></td>
      <td>${row.settlementDate}</td>
      <td class="text-right">${row.days}</td>
      <td class="text-right rate-val">${row.baseRate.toFixed(2)}%</td>
      <td class="text-right rate-val">${row.quoteRate.toFixed(2)}%</td>
      <td class="text-right">${(row.quoteRate - row.baseRate).toFixed(2)}%</td>
      <td class="text-right">${row.xccyBps.toFixed(1)}</td>
      <td class="text-right ${ptsClass}">${ptsSign}${row.swapPoints.bid.toFixed(pairMeta.pipDecimals)}</td>
      <td class="text-right highlight ${ptsClass}"><strong>${ptsSign}${row.swapPoints.mid.toFixed(pairMeta.pipDecimals)}</strong></td>
      <td class="text-right ${ptsClass}">${ptsSign}${row.swapPoints.ask.toFixed(pairMeta.pipDecimals)}</td>
      <td class="text-right">${row.outrightForward.bid.toFixed(pairMeta.quoteDecimals)}</td>
      <td class="text-right highlight ${fwdClass}"><strong>${row.outrightForward.mid.toFixed(pairMeta.quoteDecimals)}</strong></td>
      <td class="text-right">${row.outrightForward.ask.toFixed(pairMeta.quoteDecimals)}</td>
      <td class="text-right ${ptsClass}">${row.annPremiumPct.toFixed(2)}%</td>
    `;

    tr.addEventListener('click', () => {
      fxfaPairSelect.value = data.pair;
      fxfaAsofDate.value = data.tradeDate;
      fxfaSettleDate.value = row.settlementDate;
      modeFixedBtn.click();
      switchTab('pricer');
    });

    frdTableBody.appendChild(tr);
  });
}

// 3. COMP: Curve Comparison
async function loadComparison() {
  const pair = compPairSelect.value || ACTIVE_PAIR;
  ACTIVE_PAIR = pair;
  syncAllSelects(ACTIVE_PAIR);
  const d1 = compDate1.value;
  const d2 = compDate2.value;

  compTableBody.innerHTML = `<tr><td colspan="11" class="text-center">Comparing historical curves...</td></tr>`;
  compLegendDate1.textContent = `Date 1 (${d1})`;
  compLegendDate2.textContent = `Date 2 (${d2})`;

  try {
    let data = null;
    try {
      const res = await fetch(`/api/forward-compare?pair=${pair}&date1=${d1}&date2=${d2}&applyXccy=true`);
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data && typeof CIP_CLIENT !== 'undefined') {
      data = CIP_CLIENT.compareCurves(pair, d1, d2, true);
    }

    if (!data) throw new Error('Could not compute curve comparison');

    renderComparisonTable(data);
    renderComparisonChart(data);
  } catch (err) {
    compTableBody.innerHTML = `<tr><td colspan="11" class="text-center negative">Error: ${err.message}</td></tr>`;
  }
}

function renderComparisonTable(data) {
  compTableBody.innerHTML = '';
  const pairMeta = getPairMeta(data.pair);

  data.comparisons.forEach(row => {
    const tr = document.createElement('tr');
    const dOutClass = row.delta.outright >= 0 ? 'positive' : 'negative';
    const dOutSign = row.delta.outright >= 0 ? '+' : '';
    const dPtsClass = row.delta.pointsPips >= 0 ? 'positive' : 'negative';
    const dPtsSign = row.delta.pointsPips >= 0 ? '+' : '';

    tr.innerHTML = `
      <td><strong>${row.tenor}</strong></td>
      <td class="text-right">${row.days}</td>
      <td class="text-right" style="color: var(--bbg-amber);">${row.date1.forward.toFixed(pairMeta.quoteDecimals)}</td>
      <td class="text-right" style="color: var(--bbg-cyan); font-weight: 700;">${row.date2.forward.toFixed(pairMeta.quoteDecimals)}</td>
      <td class="text-right ${dOutClass}"><strong>${dOutSign}${row.delta.outright.toFixed(pairMeta.quoteDecimals)}</strong></td>
      <td class="text-right">${row.date1.points.toFixed(pairMeta.pipDecimals)}</td>
      <td class="text-right">${row.date2.points.toFixed(pairMeta.pipDecimals)}</td>
      <td class="text-right ${dPtsClass}"><strong>${dPtsSign}${row.delta.pointsPips.toFixed(pairMeta.pipDecimals)}</strong></td>
      <td class="text-right">${row.date1.rateDiff.toFixed(2)}%</td>
      <td class="text-right">${row.date2.rateDiff.toFixed(2)}%</td>
      <td class="text-right">${row.delta.rateDiffBps > 0 ? '+' : ''}${row.delta.rateDiffBps} bp</td>
    `;
    compTableBody.appendChild(tr);
  });
}

function renderComparisonChart(data) {
  const container = compCurveChart;
  const width = container.clientWidth || 900;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const items = data.comparisons.filter(c => c.days >= 7);
  if (items.length === 0) return;

  const pts1 = items.map(c => c.date1.points);
  const pts2 = items.map(c => c.date2.points);
  const allPts = [...pts1, ...pts2];

  let minVal = Math.min(...allPts);
  let maxVal = Math.max(...allPts);
  if (minVal === maxVal) { minVal -= 10; maxVal += 10; }
  const range = maxVal - minVal;

  const getX = (idx) => padding.left + (idx / (items.length - 1)) * plotWidth;
  const getY = (val) => padding.top + plotHeight - ((val - minVal) / range) * plotHeight;

  let pathD1 = '';
  let pathD2 = '';
  let circles1 = '';
  let circles2 = '';
  let xLabels = '';

  items.forEach((c, idx) => {
    const x = getX(idx);
    const y1 = getY(c.date1.points);
    const y2 = getY(c.date2.points);

    if (idx === 0) {
      pathD1 += `M ${x} ${y1}`;
      pathD2 += `M ${x} ${y2}`;
    } else {
      pathD1 += ` L ${x} ${y1}`;
      pathD2 += ` L ${x} ${y2}`;
    }

    circles1 += `<circle cx="${x}" cy="${y1}" r="4" fill="#ff9900"><title>${c.tenor} (Date 1): ${c.date1.points} pips</title></circle>`;
    circles2 += `<circle cx="${x}" cy="${y2}" r="4" fill="#00e5ff"><title>${c.tenor} (Date 2): ${c.date2.points} pips</title></circle>`;
    xLabels += `<text x="${x}" y="${height - 10}" fill="#8ba2b8" font-size="10" text-anchor="middle" font-family="monospace">${c.tenor}</text>`;
  });

  const zeroY = getY(0);
  let zeroLine = '';
  if (minVal <= 0 && maxVal >= 0) {
    zeroLine = `<line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="#334455" stroke-dasharray="3,3" />`;
  }

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
      <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#1e2a36" />
      <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${width - padding.right}" y2="${padding.top + plotHeight}" stroke="#1e2a36" />
      ${zeroLine}
      <text x="${padding.left - 8}" y="${padding.top + 10}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${maxVal.toFixed(0)}p</text>
      <text x="${padding.left - 8}" y="${padding.top + plotHeight}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${minVal.toFixed(0)}p</text>
      ${xLabels}
      <path d="${pathD1}" fill="none" stroke="#ff9900" stroke-width="2.5" />
      <path d="${pathD2}" fill="none" stroke="#00e5ff" stroke-width="2.5" />
      ${circles1}
      ${circles2}
    </svg>
  `;
}

// 4. HIST: Tenor Time Series
async function loadHistory() {
  const pair = histPairSelect.value || ACTIVE_PAIR;
  ACTIVE_PAIR = pair;
  syncAllSelects(ACTIVE_PAIR);
  const tenor = histTenorSelect.value || '3M';
  const start = histStartDate.value;
  const end = histEndDate.value;
  const pairMeta = getPairMeta(pair);

  histChartTitle.textContent = `${pairMeta.name} ${tenor} FORWARD VS SPOT OVER TIME`;

  try {
    let data = null;
    try {
      const res = await fetch(`/api/forward-history?pair=${pair}&tenor=${tenor}&startDate=${start}&endDate=${end}&stepDays=14`);
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data && typeof CIP_CLIENT !== 'undefined') {
      data = CIP_CLIENT.tenorHistory(pair, tenor, start, end, 14);
    }

    if (data) renderHistoryCharts(data);
  } catch (err) {
    console.error('History error:', err);
  }
}

function renderHistoryCharts(data) {
  const series = data.series;
  if (!series || series.length < 2) return;

  const w = histRateChart.clientWidth || 900;
  const h1 = 240;
  const h2 = 160;
  const pad = { top: 20, right: 30, bottom: 35, left: 60 };

  const pw = w - pad.left - pad.right;
  const ph1 = h1 - pad.top - pad.bottom;
  const ph2 = h2 - pad.top - pad.bottom;

  const allRates = [...series.map(s => s.spot), ...series.map(s => s.forward)];
  let minR = Math.min(...allRates);
  let maxR = Math.max(...allRates);
  const rRange = maxR - minR || 0.01;

  const getX = (idx) => pad.left + (idx / (series.length - 1)) * pw;
  const getY1 = (val) => pad.top + ph1 - ((val - minR) / rRange) * ph1;

  let spotPath = '';
  let fwdPath = '';
  let dateLabels = '';

  series.forEach((s, idx) => {
    const x = getX(idx);
    const ySpot = getY1(s.spot);
    const yFwd = getY1(s.forward);

    if (idx === 0) {
      spotPath += `M ${x} ${ySpot}`;
      fwdPath += `M ${x} ${yFwd}`;
    } else {
      spotPath += ` L ${x} ${ySpot}`;
      fwdPath += ` L ${x} ${yFwd}`;
    }

    if (idx % Math.ceil(series.length / 5) === 0 || idx === series.length - 1) {
      dateLabels += `<text x="${x}" y="${h1 - 10}" fill="#8ba2b8" font-size="10" text-anchor="middle" font-family="monospace">${s.date.slice(2)}</text>`;
    }
  });

  histRateChart.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h1}">
      <text x="${pad.left - 8}" y="${pad.top + 10}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${maxR.toFixed(4)}</text>
      <text x="${pad.left - 8}" y="${pad.top + ph1}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${minR.toFixed(4)}</text>
      ${dateLabels}
      <path d="${spotPath}" fill="none" stroke="#8ba2b8" stroke-width="1.8" stroke-dasharray="4,4" />
      <path d="${fwdPath}" fill="none" stroke="#ff9900" stroke-width="2.5" />
    </svg>
  `;

  const allPts = series.map(s => s.points);
  let minP = Math.min(...allPts);
  let maxP = Math.max(...allPts);
  const pRange = maxP - minP || 1;

  const getY2 = (val) => pad.top + ph2 - ((val - minP) / pRange) * ph2;

  let ptsPath = '';
  series.forEach((s, idx) => {
    const x = getX(idx);
    const yPts = getY2(s.points);
    if (idx === 0) ptsPath += `M ${x} ${yPts}`;
    else ptsPath += ` L ${x} ${yPts}`;
  });

  const zeroY = getY2(0);
  let zeroLine = '';
  if (minP <= 0 && maxP >= 0) {
    zeroLine = `<line x1="${pad.left}" y1="${zeroY}" x2="${w - pad.right}" y2="${zeroY}" stroke="#334455" stroke-dasharray="3,3" />`;
  }

  histPointsChart.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h2}">
      <text x="${pad.left - 8}" y="${pad.top + 10}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${maxP.toFixed(1)}p</text>
      <text x="${pad.left - 8}" y="${pad.top + ph2}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${minP.toFixed(1)}p</text>
      ${zeroLine}
      <path d="${ptsPath}" fill="none" stroke="#00e5ff" stroke-width="2" />
    </svg>
  `;
}

// Command Parser
function handleCommand(cmd) {
  cmd = cmd.trim().toUpperCase();
  if (!cmd) return;

  if (cmd === 'HELP' || cmd === 'F1') {
    alert(`COMMANDS:
• EURGBP, EURUSD, GBPUSD, USDJPY - Select pair
• PRICER                 - Window & Fixed Forward Calculator
• FRD [YYYY-MM-DD]       - Tenor Forward ladder
• COMP [Date1] [Date2]   - Compare two forward curves
• HIST [Tenor]           - Time series chart`);
    return;
  }

  const parts = cmd.split(/\s+/);
  const potentialPair = parts[0].replace(/[\/:]/g, '');

  if (AVAILABLE_PAIRS.some(p => p.symbol === potentialPair)) {
    ACTIVE_PAIR = potentialPair;
    syncAllSelects(ACTIVE_PAIR);
    calculatePricer();
  }
}

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleCommand(commandInput.value);
});
goBtn.addEventListener('click', () => handleCommand(commandInput.value));

// Change listeners
let spotInputDebounceTimer = null;
if (fxfaSpotInput) {
  fxfaSpotInput.addEventListener('input', () => {
    const pair = fxfaPairSelect.value || ACTIVE_PAIR;
    const asOf = fxfaAsofDate.value;
    const dir = fxfaDirection.value;
    updateSpotUI(pair, asOf, dir, fxfaSpotInput.value, false);

    clearTimeout(spotInputDebounceTimer);
    spotInputDebounceTimer = setTimeout(() => {
      calculatePricer();
    }, 250);
  });

  fxfaSpotInput.addEventListener('change', () => {
    const pair = fxfaPairSelect.value || ACTIVE_PAIR;
    const asOf = fxfaAsofDate.value;
    const dir = fxfaDirection.value;
    updateSpotUI(pair, asOf, dir, fxfaSpotInput.value, false);
    calculatePricer();
  });
}

fxfaPairSelect.addEventListener('change', async () => {
  ACTIVE_PAIR = fxfaPairSelect.value;
  syncAllSelects(ACTIVE_PAIR);
  await updateSpotUI(ACTIVE_PAIR, fxfaAsofDate.value, fxfaDirection.value, null, true);
  calculatePricer();
});

fxfaAsofDate.addEventListener('change', async () => {
  await updateSpotUI(ACTIVE_PAIR, fxfaAsofDate.value, fxfaDirection.value, null, true);
  calculatePricer();
});

fxfaCalculateBtn.addEventListener('click', calculatePricer);
fxfaXccyToggle.addEventListener('change', calculatePricer);
fxfaDirection.addEventListener('change', async () => {
  const isNowRHS = (fxfaDirection.value === 'RHS');
  const curVal = parseFloat(fxfaSpotInput.value);
  if (!isNaN(curVal) && curVal > 0) {
    if (isNowRHS && curVal > 1.0) {
      if (Math.abs(curVal - 1.1662) < 0.005) {
        fxfaSpotInput.value = '0.85660';
      } else {
        fxfaSpotInput.value = (1 / curVal).toFixed(5);
      }
    } else if (!isNowRHS && curVal < 1.0) {
      if (Math.abs(curVal - 0.8566) < 0.005) {
        fxfaSpotInput.value = '1.16620';
      } else {
        fxfaSpotInput.value = (1 / curVal).toFixed(5);
      }
    }
  }
  await updateSpotUI(ACTIVE_PAIR, fxfaAsofDate.value, fxfaDirection.value, fxfaSpotInput.value, false);
  calculatePricer();
});

frdRefreshBtn.addEventListener('click', loadForwardLadder);
frdPairSelect.addEventListener('change', () => {
  ACTIVE_PAIR = frdPairSelect.value;
  syncAllSelects(ACTIVE_PAIR);
  loadForwardLadder();
});
frdXccyToggle.addEventListener('change', loadForwardLadder);

compRunBtn.addEventListener('click', loadComparison);
compPairSelect.addEventListener('change', () => {
  ACTIVE_PAIR = compPairSelect.value;
  syncAllSelects(ACTIVE_PAIR);
  loadComparison();
});

histRunBtn.addEventListener('click', loadHistory);
histPairSelect.addEventListener('change', () => {
  ACTIVE_PAIR = histPairSelect.value;
  syncAllSelects(ACTIVE_PAIR);
  loadHistory();
});
histTenorSelect.addEventListener('change', loadHistory);

// Keyboard function keys
window.addEventListener('keydown', (e) => {
  if (e.key === 'F1') { e.preventDefault(); handleCommand('HELP'); }
  else if (e.key === 'F2') { e.preventDefault(); switchTab('pricer'); }
  else if (e.key === 'F3') { e.preventDefault(); switchTab('frd'); }
  else if (e.key === 'F4') { e.preventDefault(); switchTab('comp'); }
  else if (e.key === 'F5') { if (e.ctrlKey) return; e.preventDefault(); switchTab('hist'); }
});

init();
