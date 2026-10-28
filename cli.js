#!/usr/bin/env node
/**
 * Institutional Interbank FX Forward CLI
 * Supports:
 *   - Bidirectional pairs: EURUSD, USDEUR, GBPUSD, USDGBP, USDJPY, JPYUSD, etc.
 *   - Fixed Forward / Broken Date pricing
 *   - Window Forward (flexible delivery) pricing
 *   - Side-by-side historical curve comparison
 *
 * Usage:
 *   node cli.js EURUSD
 *   node cli.js USDEUR --date 2023-10-15
 *   node cli.js EURUSD --compare 2023-10-15 2024-09-15
 *   node cli.js EURUSD --broken 2024-12-20 --date 2024-01-15
 *   node cli.js EURUSD --window 2023-11-15 2024-01-15 --direction BUY --date 2023-10-15
 */

const {
  getForwardLadder,
  compareForwardCurves,
  calculateBrokenDateForward,
  getTenorHistory,
  calculateWindowForward
} = require('./src/fx-engine/cip-calculator');
const { PAIRS } = require('./src/fx-engine/conventions');

const args = process.argv.slice(2);

// ANSI color codes
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  amber: '\x1b[38;5;214m',
  cyan: '\x1b[38;5;51m',
  green: '\x1b[38;5;46m',
  red: '\x1b[38;5;196m',
  white: '\x1b[38;5;255m',
  dim: '\x1b[38;5;244m',
  bgHeader: '\x1b[48;5;236m'
};

function printBanner() {
  console.log(`${C.amber}${C.bold}`);
  console.log(`========================================================================================`);
  console.log(`   INTERBANK FX FORWARD TERMINAL (DUAL-CURVE CIP & WINDOW PRICING ENGINE)              `);
  console.log(`========================================================================================${C.reset}`);
}

function parseArgs() {
  const options = {
    pair: 'EURUSD',
    date: new Date().toISOString().split('T')[0],
    spot: null,
    compare: null,
    broken: null,
    window: null,
    direction: 'BUY_LHS',
    notional: 1000000,
    history: null,
    from: '2023-01-01',
    to: '2024-01-01',
    noXccy: false,
    baseRate: null,
    quoteRate: null
  };

  for (let i = 0; i < args.length; i++) {
    const raw = args[i].toUpperCase().replace(/[\/:]/g, '');
    if (PAIRS[raw]) {
      options.pair = raw;
    } else if (args[i] === '--spot' && args[i + 1]) {
      options.spot = parseFloat(args[++i]);
    } else if (args[i] === '--date' && args[i + 1]) {
      options.date = args[++i];
    } else if (args[i] === '--baseRate' && args[i + 1]) {
      options.baseRate = parseFloat(args[++i]);
    } else if (args[i] === '--quoteRate' && args[i + 1]) {
      options.quoteRate = parseFloat(args[++i]);
    } else if (args[i] === '--compare' && args[i + 1] && args[i + 2]) {
      options.compare = [args[++i], args[++i]];
    } else if (args[i] === '--broken' && args[i + 1]) {
      options.broken = args[++i];
    } else if (args[i] === '--window' && args[i + 1] && args[i + 2]) {
      options.window = [args[++i], args[++i]];
    } else if (args[i] === '--direction' && args[i + 1]) {
      const d = args[++i].toUpperCase();
      options.direction = (d === 'LHS' || d.includes('SELL')) ? 'LHS' : 'RHS';
    } else if (args[i] === '--notional' && args[i + 1]) {
      options.notional = parseFloat(args[++i]);
    } else if (args[i] === '--history') {
      options.history = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '3M';
    } else if (args[i] === '--from' && args[i + 1]) {
      options.from = args[++i];
    } else if (args[i] === '--to' && args[i + 1]) {
      options.to = args[++i];
    } else if (args[i] === '--no-xccy') {
      options.noXccy = true;
    }
  }

  return options;
}

function pad(str, len, align = 'left') {
  str = String(str);
  if (str.length >= len) return str.slice(0, len);
  const diff = len - str.length;
  return align === 'right' ? ' '.repeat(diff) + str : str + ' '.repeat(diff);
}

async function runLadder(pairKey, dateStr, noXccy) {
  printBanner();
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  console.log(`${C.dim}Loading market rates & constructing forward curve for ${pair.name} as of ${dateStr}...${C.reset}\n`);

  const data = await getForwardLadder(pairKey, dateStr, { applyXccy: !noXccy });

  console.log(`${C.white}${C.bold}PAIR: ${C.amber}${data.pairName} (${data.pair})${C.reset}   |   ${C.white}TRADE DATE: ${C.cyan}${data.tradeDate}${C.reset}   |   ${C.white}SPOT DATE: ${C.cyan}${data.spotDate}${C.reset}`);
  console.log(`${C.white}SPOT BID/ASK/MID: ${C.green}${data.spot.bid}${C.reset} / ${C.green}${data.spot.ask}${C.reset} (${C.amber}${data.spot.mid}${C.reset})   |   ${C.white}XCCY BASIS: ${data.applyXccy ? C.green + 'ACTIVE' : C.red + 'OFF'}${C.reset}`);
  console.log(`${C.dim}Base Rate (${data.baseCcy.code}): ACT/${data.baseCcy.dayCount} [${data.baseCcy.benchmark}]   |   Quote Rate (${data.quoteCcy.code}): ACT/${data.quoteCcy.dayCount} [${data.quoteCcy.benchmark}]${C.reset}\n`);

  console.log(`${C.bgHeader}${C.amber}${C.bold}` +
    pad('TENOR', 6) +
    pad('SETTLE', 12) +
    pad('DAYS', 6, 'right') +
    pad('BASE %', 9, 'right') +
    pad('QUOTE %', 9, 'right') +
    pad('XCCY(bp)', 9, 'right') +
    pad('SWAP PTS (MID)', 16, 'right') +
    pad('OUTRIGHT FWD', 16, 'right') +
    pad('ANN %', 9, 'right') +
    `  ${C.reset}`
  );
  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}`);

  for (const row of data.ladder) {
    const fwdColor = row.outrightForward.mid >= data.spot.mid ? C.green : C.red;
    const ptsColor = row.swapPoints.mid >= 0 ? C.green : C.red;
    const sign = row.swapPoints.mid >= 0 ? '+' : '';

    console.log(
      `${C.bold}${C.white}${pad(row.tenor, 6)}${C.reset}` +
      `${C.dim}${pad(row.settlementDate, 12)}${C.reset}` +
      `${pad(row.days, 6, 'right')}` +
      `${C.cyan}${pad(row.baseRate.toFixed(2), 9, 'right')}${C.reset}` +
      `${C.cyan}${pad(row.quoteRate.toFixed(2), 9, 'right')}${C.reset}` +
      `${C.dim}${pad(row.xccyBps.toFixed(1), 9, 'right')}${C.reset}` +
      `${ptsColor}${pad(sign + row.swapPoints.mid.toFixed(pair.pipDecimals), 16, 'right')}${C.reset}` +
      `${fwdColor}${C.bold}${pad(row.outrightForward.mid.toFixed(pair.quoteDecimals), 16, 'right')}${C.reset}` +
      `${pad(row.annPremiumPct.toFixed(2) + '%', 9, 'right')}`
    );
  }

  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}`);
  console.log(`${C.dim}Tip: Run with reverse direction (e.g. USDEUR) or --window YYYY-MM-DD YYYY-MM-DD for window forward.${C.reset}\n`);
}

async function runWindow(pairKey, tradeDate, winStart, winEnd, direction, notional, noXccy, customSpot, baseRate, quoteRate) {
  printBanner();
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  console.log(`${C.dim}Pricing Window Forward (Flexible Delivery) for ${pair.name}...${C.reset}\n`);

  const res = await calculateWindowForward(pairKey, tradeDate, winStart, winEnd, direction, {
    applyXccy: !noXccy,
    notional,
    spot: customSpot,
    baseRate,
    quoteRate
  });

  console.log(`${C.white}${C.bold}PAIR: ${C.amber}${res.pairName} (${res.pair})${C.reset}`);
  console.log(`${C.white}TRADE DATE: ${C.cyan}${res.tradeDate}${C.reset}  -->  ${C.white}SPOT DATE: ${C.cyan}${res.spotDate}${C.reset}`);
  console.log(`${C.white}SPOT LHS (BID):           ${C.green}${C.bold}${res.spotBid}${C.reset}  |  ${C.white}SPOT RHS (ASK): ${C.amber}${C.bold}${res.spotAsk}${C.reset} (Mid: ${res.spot})`);
  console.log(`${C.white}WINDOW PERIOD: ${C.cyan}${res.windowStart}${C.reset} to ${C.cyan}${res.windowEnd}${C.reset} (${res.windowDurationDays} days flexibility)`);
  console.log(`${C.white}TRADING DIRECTION: ${C.bold}${res.directionLabel}${C.reset}`);
  console.log(`${C.dim}${'-'.repeat(75)}${C.reset}`);

  console.log(`${C.white}Curve Structure:          ${C.cyan}${res.curveStructure}${C.reset}`);
  console.log(`${C.white}Window Start (${res.windowStart}):  Bid ${C.green}${C.bold}${res.startDatePricing.bid}${C.reset} / Ask ${C.amber}${C.bold}${res.startDatePricing.ask}${C.reset} (Mid: ${res.startDatePricing.mid}, Points: ${res.startDatePricing.pointsMid} pips)`);
  console.log(`${C.white}Window End (${res.windowEnd}):    Bid ${C.green}${C.bold}${res.endDatePricing.bid}${C.reset} / Ask ${C.amber}${C.bold}${res.endDatePricing.ask}${C.reset} (Mid: ${res.endDatePricing.mid}, Points: ${res.endDatePricing.pointsMid} pips)`);
  console.log(`${C.white}Conservative Pillar:      ${C.amber}${res.worstCaseDate} (${res.worstCaseDays} days from spot)${C.reset}`);
  console.log(`${C.dim}${'-'.repeat(75)}${C.reset}`);

  console.log(`${C.green}${C.bold}LHS FORWARD BID:          ${res.windowBid} (Client SELLS ${res.base} / BUYS ${res.quote})${C.reset}`);
  console.log(`${C.amber}${C.bold}RHS FORWARD ASK:          ${res.windowAsk} (Client BUYS ${res.base} / SELLS ${res.quote})${C.reset}`);
  console.log(`${C.white}WINDOW POINTS (BID/ASK):  ${res.windowPointsBid >= 0 ? '+' : ''}${res.windowPointsBid} pips / ${res.windowPointsAsk >= 0 ? '+' : ''}${res.windowPointsAsk} pips${C.reset}`);
  const dealSpot = res.direction === 'LHS' ? res.spotBid : res.spotAsk;
  console.log(`${C.white}APPLIED DEAL SPOT:        ${C.cyan}${dealSpot}${C.reset} (${res.direction === 'LHS' ? 'Spot LHS / Bid' : 'Spot RHS / Ask'})`);
  console.log(`${C.white}CLIENT EXECUTABLE RATE:   ${C.amber}${C.bold}${res.windowRate}${C.reset} (${res.directionLabel})`);
  console.log(`${C.white}WINDOW CARRY PENALTY:     ${res.windowCost.pips} pips (${res.windowCost.cashflow.toLocaleString('en-US')} ${res.windowCost.currency})`);
  console.log(`${C.white}SETTLEMENT CASHFLOW:      ${C.bold}${res.notional.rhsSettlementCashflow.toLocaleString('en-US')} ${res.notional.rhsCurrency}${C.reset} for ${res.notional.lhsAmount.toLocaleString('en-US')} ${res.notional.lhsCurrency}\n`);

  console.log(`${C.bgHeader}${C.amber}${C.bold}` +
    pad('WINDOW DATE', 14) +
    pad('DAYS', 6, 'right') +
    pad('FORWARD BID', 16, 'right') +
    pad('FORWARD ASK', 16, 'right') +
    pad('SWAP POINTS', 14, 'right') +
    `  ${C.reset}`
  );
  console.log(`${C.dim}${'-'.repeat(68)}${C.reset}`);

  for (const s of res.windowSchedule) {
    console.log(
      `${pad(s.date, 14)}` +
      `${pad(s.days, 6, 'right')}` +
      `${pad(s.forwardBid.toFixed(pair.quoteDecimals), 16, 'right')}` +
      `${pad(s.forwardAsk.toFixed(pair.quoteDecimals), 16, 'right')}` +
      `${pad((s.swapPoints >= 0 ? '+' : '') + s.swapPoints.toFixed(1), 14, 'right')}`
    );
  }
  console.log(`${C.dim}${'-'.repeat(68)}${C.reset}\n`);
}

async function runCompare(pairKey, date1, date2, noXccy) {
  printBanner();
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  console.log(`${C.dim}Comparing forward curves for ${pair.name} between ${date1} and ${date2}...${C.reset}\n`);

  const comp = await compareForwardCurves(pairKey, date1, date2, { applyXccy: !noXccy });

  console.log(`${C.bold}PAIR: ${C.amber}${pairKey}${C.reset}  |  ${C.white}DATE 1: ${C.cyan}${comp.date1}${C.reset} (Spot: ${comp.spot1})  |  ${C.white}DATE 2: ${C.cyan}${comp.date2}${C.reset} (Spot: ${comp.spot2})`);
  console.log(`${C.white}SPOT CHANGE: ${comp.spotDelta >= 0 ? C.green + '+' : C.red}${comp.spotDelta} (${comp.spotDeltaPct}%)${C.reset}\n`);

  console.log(`${C.bgHeader}${C.amber}${C.bold}` +
    pad('TENOR', 7) +
    pad('DAYS', 6, 'right') +
    pad('FWD (DATE 1)', 14, 'right') +
    pad('FWD (DATE 2)', 14, 'right') +
    pad('Δ OUTRIGHT', 13, 'right') +
    pad('PTS 1(pip)', 12, 'right') +
    pad('PTS 2(pip)', 12, 'right') +
    pad('Δ PTS (pip)', 13, 'right') +
    `  ${C.reset}`
  );
  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}`);

  for (const row of comp.comparisons) {
    const deltaOutColor = row.delta.outright >= 0 ? C.green : C.red;
    const deltaPtsColor = row.delta.pointsPips >= 0 ? C.green : C.red;
    const signO = row.delta.outright >= 0 ? '+' : '';
    const signP = row.delta.pointsPips >= 0 ? '+' : '';

    console.log(
      `${C.bold}${C.white}${pad(row.tenor, 7)}${C.reset}` +
      `${pad(row.days, 6, 'right')}` +
      `${C.dim}${pad(row.date1.forward.toFixed(pair.quoteDecimals), 14, 'right')}${C.reset}` +
      `${C.bold}${pad(row.date2.forward.toFixed(pair.quoteDecimals), 14, 'right')}${C.reset}` +
      `${deltaOutColor}${pad(signO + row.delta.outright.toFixed(pair.quoteDecimals), 13, 'right')}${C.reset}` +
      `${pad(row.date1.points.toFixed(pair.pipDecimals), 12, 'right')}` +
      `${pad(row.date2.points.toFixed(pair.pipDecimals), 12, 'right')}` +
      `${deltaPtsColor}${C.bold}${pad(signP + row.delta.pointsPips.toFixed(pair.pipDecimals), 13, 'right')}${C.reset}`
    );
  }
  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}\n`);
}

async function runBroken(pairKey, tradeDate, targetSettlement, noXccy, customSpot) {
  printBanner();
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  console.log(`${C.dim}Pricing Fixed Forward / Broken Date for ${pair.name}...${C.reset}\n`);

  const res = await calculateBrokenDateForward(pairKey, tradeDate, targetSettlement, { applyXccy: !noXccy, spot: customSpot });

  console.log(`${C.white}${C.bold}PAIR: ${C.amber}${res.pair}${C.reset}`);
  console.log(`${C.white}TRADE DATE: ${C.cyan}${res.tradeDate}${C.reset}  -->  ${C.white}SPOT DATE: ${C.cyan}${res.spotDate}${C.reset}`);
  console.log(`${C.white}FIXED SETTLEMENT DATE: ${C.amber}${C.bold}${res.maturityDate}${C.reset} (${C.white}${res.days} calendar days${C.reset})`);
  console.log(`${C.dim}${'-'.repeat(60)}${C.reset}`);
  console.log(`${C.white}SPOT LHS (BID):           ${C.green}${C.bold}${res.spotBid}${C.reset}  |  ${C.white}SPOT RHS (ASK): ${C.amber}${C.bold}${res.spotAsk}${C.reset} (Mid: ${res.spot})`);
  console.log(`${C.white}INTERPOLATED BASE RATE:   ${C.cyan}${res.baseRate.toFixed(3)}%${C.reset}`);
  console.log(`${C.white}INTERPOLATED QUOTE RATE:  ${C.cyan}${res.quoteRate.toFixed(3)}%${C.reset}`);
  console.log(`${C.white}XCCY BASIS SPREAD:        ${res.xccyBps} bps`);
  console.log(`${C.white}SWAP POINTS (BID/ASK):    ${res.pointsBid >= 0 ? '+' : ''}${res.pointsBid} / ${res.pointsAsk >= 0 ? '+' : ''}${res.pointsAsk} pips (Mid: ${res.swapPoints} pips)`);
  console.log(`${C.dim}${'-'.repeat(60)}${C.reset}`);
  console.log(`${C.green}${C.bold}LHS FORWARD BID:          ${res.forwardBid} (Client SELLS ${pair.base} / BUYS ${pair.quote})${C.reset}`);
  console.log(`${C.amber}${C.bold}RHS FORWARD ASK:          ${res.forwardAsk} (Client BUYS ${pair.base} / SELLS ${pair.quote})${C.reset}`);
  console.log(`${C.white}FORWARD MID:              ${res.outrightForward}`);
  console.log(`${C.white}ANNUALIZED PREMIUM:       ${res.annPremiumPct}% p.a.${C.reset}\n`);
}

async function runHistory(pairKey, tenor, from, to) {
  printBanner();
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  console.log(`${C.dim}Retrieving historical ${tenor} forward rates for ${pair.name} from ${from} to ${to}...${C.reset}\n`);

  const data = await getTenorHistory(pairKey, tenor, from, to, 14);

  console.log(`${C.bgHeader}${C.amber}${C.bold}` +
    pad('DATE', 12) +
    pad('SPOT', 12, 'right') +
    pad(`${tenor} FORWARD`, 15, 'right') +
    pad('SWAP PTS(pips)', 16, 'right') +
    pad('RATE DIFF(%)', 14, 'right') +
    `  ${C.reset}`
  );
  console.log(`${C.dim}${'-'.repeat(71)}${C.reset}`);

  for (const p of data.series) {
    const ptsColor = p.points >= 0 ? C.green : C.red;
    console.log(
      `${C.cyan}${pad(p.date, 12)}${C.reset}` +
      `${pad(p.spot.toFixed(pair.quoteDecimals), 12, 'right')}` +
      `${C.bold}${pad(p.forward.toFixed(pair.quoteDecimals), 15, 'right')}${C.reset}` +
      `${ptsColor}${pad((p.points >= 0 ? '+' : '') + p.points.toFixed(pair.pipDecimals), 16, 'right')}${C.reset}` +
      `${pad(p.rateDiff.toFixed(2) + '%', 14, 'right')}`
    );
  }
  console.log(`${C.dim}${'-'.repeat(71)}${C.reset}\n`);
}

async function main() {
  const options = parseArgs();
  try {
    if (options.window) {
      await runWindow(options.pair, options.date, options.window[0], options.window[1], options.direction, options.notional, options.noXccy, options.spot, options.baseRate, options.quoteRate);
    } else if (options.compare) {
      await runCompare(options.pair, options.compare[0], options.compare[1], options.noXccy);
    } else if (options.broken) {
      await runBroken(options.pair, options.date, options.broken, options.noXccy, options.spot);
    } else if (options.history) {
      await runHistory(options.pair, options.history, options.from, options.to);
    } else {
      await runLadder(options.pair, options.date, options.noXccy);
    }
  } catch (err) {
    console.error(`${C.red}Error executing command:${C.reset}`, err.message);
  }
}

main();
