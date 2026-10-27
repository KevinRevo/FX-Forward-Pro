/**
 * Bloomberg Terminal FX Forward Client Engine
 */

let AVAILABLE_PAIRS = [];
let ACTIVE_PAIR = 'EURUSD';
let CURRENT_LADDER_DATA = null;

// DOM Elements
const commandInput = document.getElementById('command-input');
const goBtn = document.getElementById('go-btn');
const systemClock = document.getElementById('system-clock');
const presetsContainer = document.getElementById('presets-container');

// Banner elements
const activePairName = document.getElementById('active-pair-name');
const bannerSpotBid = document.getElementById('banner-spot-bid');
const bannerSpotAsk = document.getElementById('banner-spot-ask');
const bannerSpotMid = document.getElementById('banner-spot-mid');
const bannerSpotChange = document.getElementById('banner-spot-change');
const bannerBaseRate = document.getElementById('banner-base-rate');
const bannerQuoteRate = document.getElementById('banner-quote-rate');
const bannerXccyBasis = document.getElementById('banner-xccy-basis');

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

// FXFA elements
const fxfaPairSelect = document.getElementById('fxfa-pair-select');
const fxfaAsofDate = document.getElementById('fxfa-asof-date');
const fxfaSettleDate = document.getElementById('fxfa-settle-date');
const fxfaNotional = document.getElementById('fxfa-notional');
const fxfaXccyToggle = document.getElementById('fxfa-xccy-toggle');
const fxfaCalculateBtn = document.getElementById('fxfa-calculate-btn');

// FXFA results
const resDays = document.getElementById('res-days');
const resSpotDate = document.getElementById('res-spot-date');
const resSpot = document.getElementById('res-spot');
const resPoints = document.getElementById('res-points');
const resAnnPrm = document.getElementById('res-ann-prm');
const resOutright = document.getElementById('res-outright');
const resBaseRate = document.getElementById('res-base-rate');
const resQuoteRate = document.getElementById('res-quote-rate');
const resXccyBasis = document.getElementById('res-xccy-basis');
const resCashflow = document.getElementById('res-cashflow');

// 1. Clock
function updateClock() {
  const now = new Date();
  systemClock.textContent = now.toUTCString().replace('GMT', 'UTC');
}
setInterval(updateClock, 1000);
updateClock();

// 2. Tab Navigation
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

  if (tabId === 'comp') {
    loadComparison();
  } else if (tabId === 'hist') {
    loadHistory();
  } else if (tabId === 'fxfa') {
    calculateFXFA();
  }
}

const DEFAULT_PRESETS = [
  {
    id: 'fed-peak-vs-now',
    title: 'Fed Peak Hikes (Oct 2023) vs Recent Neutral',
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
  },
  {
    id: 'usdjpy-divergence',
    title: 'BoJ NIRP (Jun 2022) vs Peak Rates (Oct 2023)',
    pair: 'USDJPY',
    date1: '2022-06-15',
    date2: '2023-10-15',
    description: 'Massive forward discount on USD/JPY due to US-Japan interest rate divergence.'
  }
];

// 3. Initialize Pairs and Presets
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
        opt.textContent = `${p.symbol} (${p.name})`;
        select.appendChild(opt);
      });
    });

    let presets = DEFAULT_PRESETS;
    try {
      const presetsRes = await fetch('/api/presets');
      if (presetsRes.ok) presets = await presetsRes.json();
    } catch (e) {}
    renderPresets(presets);

    // Initial Load
    await loadForwardLadder();
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
  frdPairSelect.value = preset.pair;
  compPairSelect.value = preset.pair;
  compDate1.value = preset.date1;
  compDate2.value = preset.date2;
  frdDateInput.value = preset.date2;

  switchTab('comp');
}

// 4. FRD: Load Forward Rate Display Ladder
async function loadForwardLadder() {
  const pair = frdPairSelect.value || ACTIVE_PAIR;
  ACTIVE_PAIR = pair;
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
    updateBanner(data);
    renderLadderTable(data);
  } catch (err) {
    frdTableBody.innerHTML = `<tr><td colspan="14" class="text-center negative">Error: ${err.message}</td></tr>`;
  }
}

function updateBanner(data) {
  activePairName.textContent = `${data.pairName} (${data.pair})`;
  bannerSpotBid.textContent = data.spot.bid;
  bannerSpotAsk.textContent = data.spot.ask;
  bannerSpotMid.textContent = `(${data.spot.mid})`;

  bannerBaseRate.textContent = `${data.baseCcy.benchmark} ${data.ladder[0].baseRate}%`;
  bannerQuoteRate.textContent = `${data.quoteCcy.benchmark} ${data.ladder[0].quoteRate}%`;
  bannerXccyBasis.textContent = data.applyXccy ? `${data.ladder[6].xccyBps} bps (3M)` : 'OFF (0.0 bps)';
}

function renderLadderTable(data) {
  frdTableBody.innerHTML = '';
  const pair = AVAILABLE_PAIRS.find(p => p.symbol === data.pair) || { quoteDecimals: 5, pipDecimals: 1 };

  data.ladder.forEach(row => {
    const tr = document.createElement('tr');
    tr.dataset.tenor = row.tenor;
    tr.dataset.settlement = row.settlementDate;

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
      <td class="text-right ${ptsClass}">${ptsSign}${row.swapPoints.bid.toFixed(pair.pipDecimals)}</td>
      <td class="text-right highlight ${ptsClass}"><strong>${ptsSign}${row.swapPoints.mid.toFixed(pair.pipDecimals)}</strong></td>
      <td class="text-right ${ptsClass}">${ptsSign}${row.swapPoints.ask.toFixed(pair.pipDecimals)}</td>
      <td class="text-right">${row.outrightForward.bid.toFixed(pair.quoteDecimals)}</td>
      <td class="text-right highlight ${fwdClass}"><strong>${row.outrightForward.mid.toFixed(pair.quoteDecimals)}</strong></td>
      <td class="text-right">${row.outrightForward.ask.toFixed(pair.quoteDecimals)}</td>
      <td class="text-right ${ptsClass}">${row.annPremiumPct.toFixed(2)}%</td>
    `;

    // Click row to jump into Broken Date (FXFA)
    tr.addEventListener('click', () => {
      fxfaPairSelect.value = data.pair;
      fxfaAsofDate.value = data.tradeDate;
      fxfaSettleDate.value = row.settlementDate;
      switchTab('fxfa');
    });

    frdTableBody.appendChild(tr);
  });
}

// 5. COMP: Historical Comparison
async function loadComparison() {
  const pair = compPairSelect.value || ACTIVE_PAIR;
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
  const pair = AVAILABLE_PAIRS.find(p => p.symbol === data.pair) || { quoteDecimals: 5, pipDecimals: 1 };

  data.comparisons.forEach(row => {
    const tr = document.createElement('tr');

    const dOutClass = row.delta.outright >= 0 ? 'positive' : 'negative';
    const dOutSign = row.delta.outright >= 0 ? '+' : '';
    const dPtsClass = row.delta.pointsPips >= 0 ? 'positive' : 'negative';
    const dPtsSign = row.delta.pointsPips >= 0 ? '+' : '';

    tr.innerHTML = `
      <td><strong>${row.tenor}</strong></td>
      <td class="text-right">${row.days}</td>
      <td class="text-right" style="color: var(--bbg-amber);">${row.date1.forward.toFixed(pair.quoteDecimals)}</td>
      <td class="text-right" style="color: var(--bbg-cyan); font-weight: 700;">${row.date2.forward.toFixed(pair.quoteDecimals)}</td>
      <td class="text-right ${dOutClass}"><strong>${dOutSign}${row.delta.outright.toFixed(pair.quoteDecimals)}</strong></td>
      <td class="text-right">${row.date1.points.toFixed(pair.pipDecimals)}</td>
      <td class="text-right">${row.date2.points.toFixed(pair.pipDecimals)}</td>
      <td class="text-right ${dPtsClass}"><strong>${dPtsSign}${row.delta.pointsPips.toFixed(pair.pipDecimals)}</strong></td>
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

  // Filter tenors for visual curve: 1W to 5Y
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
      <!-- Grid -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#1e2a36" />
      <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${width - padding.right}" y2="${padding.top + plotHeight}" stroke="#1e2a36" />
      ${zeroLine}
      
      <!-- Axis Labels -->
      <text x="${padding.left - 8}" y="${padding.top + 10}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${maxVal.toFixed(0)}p</text>
      <text x="${padding.left - 8}" y="${padding.top + plotHeight}" fill="#8ba2b8" font-size="10" text-anchor="end" font-family="monospace">${minVal.toFixed(0)}p</text>
      ${xLabels}

      <!-- Curves -->
      <path d="${pathD1}" fill="none" stroke="#ff9900" stroke-width="2.5" />
      <path d="${pathD2}" fill="none" stroke="#00e5ff" stroke-width="2.5" />
      ${circles1}
      ${circles2}
    </svg>
  `;
}

// 6. HIST: Tenor Time Series
async function loadHistory() {
  const pair = histPairSelect.value || ACTIVE_PAIR;
  const tenor = histTenorSelect.value || '3M';
  const start = histStartDate.value;
  const end = histEndDate.value;

  histChartTitle.textContent = `${pair} ${tenor} FORWARD VS SPOT OVER TIME`;

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

  // 1. Rate Chart (Spot & Forward)
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

  // 2. Points Chart
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

// 7. FXFA: Broken Date Analytics
async function calculateFXFA() {
  const pair = fxfaPairSelect.value || ACTIVE_PAIR;
  const asOf = fxfaAsofDate.value;
  const settle = fxfaSettleDate.value;
  const applyXccy = fxfaXccyToggle.checked;
  const notional = parseFloat(fxfaNotional.value) || 1000000;

  try {
    let data = null;
    try {
      const res = await fetch(`/api/broken-date?pair=${pair}&asOf=${asOf}&settlement=${settle}&applyXccy=${applyXccy}`);
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data && typeof CIP_CLIENT !== 'undefined') {
      data = CIP_CLIENT.brokenDate(pair, asOf, settle, applyXccy);
    }

    if (!data) throw new Error('Could not calculate broken date');

    resDays.textContent = `${data.days} days`;
    resSpotDate.textContent = `Spot Date: ${data.spotDate}`;
    resSpot.textContent = data.spot;
    resPoints.textContent = `${data.swapPoints >= 0 ? '+' : ''}${data.swapPoints} pips`;
    resAnnPrm.textContent = `${data.annPremiumPct >= 0 ? '+' : ''}${data.annPremiumPct}% Ann.`;
    resOutright.textContent = data.outrightForward;

    resBaseRate.textContent = `${data.baseRate}%`;
    resQuoteRate.textContent = `${data.quoteRate}%`;
    resXccyBasis.textContent = `${data.xccyBps} bps`;

    const totalCashflow = notional * data.outrightForward;
    resCashflow.textContent = `$${totalCashflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (err) {
    console.error('FXFA calculation error:', err);
  }
}

// 8. Command Parser (Mimics Bloomberg Commands)
function handleCommand(cmd) {
  cmd = cmd.trim().toUpperCase();
  if (!cmd) return;

  if (cmd === 'HELP' || cmd === 'F1') {
    alert(`BLOOMBERG COMMAND HELP:
• EURUSD FRD                - Show Forward Rate Display for EUR/USD
• EURUSD COMP 2023-10-15 2024-09-15 - Compare two forward curves
• USDJPY HIST               - Open historical tenor time series
• EURUSD FXFA               - Open Broken Date analytics
• F2 / F3 / F4 / F5         - Switch between tabs`);
    return;
  }

  const parts = cmd.split(/\s+/);
  const potentialPair = parts[0].replace('/', '');

  if (AVAILABLE_PAIRS.some(p => p.symbol === potentialPair)) {
    ACTIVE_PAIR = potentialPair;
    frdPairSelect.value = ACTIVE_PAIR;
    compPairSelect.value = ACTIVE_PAIR;
    histPairSelect.value = ACTIVE_PAIR;
    fxfaPairSelect.value = ACTIVE_PAIR;

    const fn = parts[1] || 'FRD';
    if (fn === 'FRD') {
      if (parts[2]) frdDateInput.value = parts[2];
      switchTab('frd');
      loadForwardLadder();
    } else if (fn === 'COMP') {
      if (parts[2]) compDate1.value = parts[2];
      if (parts[3]) compDate2.value = parts[3];
      switchTab('comp');
    } else if (fn === 'HIST') {
      if (parts[2]) histTenorSelect.value = parts[2];
      switchTab('hist');
    } else if (fn === 'FXFA') {
      switchTab('fxfa');
    }
  }
}

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleCommand(commandInput.value);
  }
});
goBtn.addEventListener('click', () => handleCommand(commandInput.value));

// Event Listeners for Controls
frdRefreshBtn.addEventListener('click', loadForwardLadder);
frdPairSelect.addEventListener('change', loadForwardLadder);
frdXccyToggle.addEventListener('change', loadForwardLadder);

compRunBtn.addEventListener('click', loadComparison);
compPairSelect.addEventListener('change', loadComparison);

histRunBtn.addEventListener('click', loadHistory);
histPairSelect.addEventListener('change', loadHistory);
histTenorSelect.addEventListener('change', loadHistory);

fxfaCalculateBtn.addEventListener('click', calculateFXFA);
fxfaPairSelect.addEventListener('change', calculateFXFA);
fxfaXccyToggle.addEventListener('change', calculateFXFA);

// Quick Date buttons
document.querySelectorAll('.quick-date-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    let d = btn.dataset.date;
    if (d === 'today') d = new Date().toISOString().split('T')[0];
    frdDateInput.value = d;
    loadForwardLadder();
  });
});

// Export CSV
frdExportCsv.addEventListener('click', () => {
  if (!CURRENT_LADDER_DATA) return;
  const rows = [
    ['Tenor', 'Settlement Date', 'Days', 'Base Rate %', 'Quote Rate %', 'XCCY (bp)', 'Swap Points Mid', 'Outright Forward Mid', 'Annualized %']
  ];
  CURRENT_LADDER_DATA.ladder.forEach(r => {
    rows.push([
      r.tenor,
      r.settlementDate,
      r.days,
      r.baseRate,
      r.quoteRate,
      r.xccyBps,
      r.swapPoints.mid,
      r.outrightForward.mid,
      r.annPremiumPct
    ]);
  });
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${CURRENT_LADDER_DATA.pair}_FRD_${CURRENT_LADDER_DATA.tradeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Keyboard function keys (F1 - F5)
window.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    e.preventDefault();
    handleCommand('HELP');
  } else if (e.key === 'F2') {
    e.preventDefault();
    switchTab('frd');
  } else if (e.key === 'F3') {
    e.preventDefault();
    switchTab('comp');
  } else if (e.key === 'F4') {
    e.preventDefault();
    switchTab('hist');
  } else if (e.key === 'F5') {
    // If not reloading browser
    if (e.ctrlKey) return;
    e.preventDefault();
    switchTab('fxfa');
  }
});

// Start
init();
