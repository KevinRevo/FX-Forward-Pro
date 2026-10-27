#!/usr/bin/env node
/**
 * Bloomberg-Style FX Forward CLI
 * Usage:
 *   node cli.js EURUSD
 *   node cli.js EURUSD --date 2023-10-15
 *   node cli.js EURUSD --compare 2023-10-15 2024-09-15
 *   node cli.js EURUSD --broken 2024-12-20 --date 2024-01-15
 *   node cli.js USDJPY --history 3M --from 2023-01-01 --to 2024-01-01
 */

const {
  getForwardLadder,
  compareForwardCurves,
  calculateBrokenDateForward,
  getTenorHistory
} = require('./src/fx-engine/cip-calculator');
const { PAIRS } = require('./src/fx-engine/conventions');

const args = process.argv.slice(2);

// ANSI color codes for authentic terminal look
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  amber: '\x1b[38;5;214m',
  cyan: '\x1b[38;5;51m',
  green: '\x1b[38;5;46m',
  red: '\x1b[38;5;196m',
  white: '\x1b[38;5;255m',
  dim: '\x1b[38;5;244m',
  bgDark: '\x1b[48;5;234m',
  bgHeader: '\x1b[48;5;236m'
};

function printBanner() {
  console.log(`${C.amber}${C.bold}`);
  console.log(`========================================================================================`);
  console.log(`   BLOOMBERG-LIKE INTERBANK FX FORWARD TERMINAL (CIP ENGINE)                            `);
  console.log(`========================================================================================${C.reset}`);
}

function parseArgs() {
  const options = {
    pair: 'EURUSD',
    date: new Date().toISOString().split('T')[0],
    compare: null,
    broken: null,
    history: null,
    from: '2023-01-01',
    to: '2024-01-01',
    noXccy: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i].toUpperCase();
    if (PAIRS[arg]) {
      options.pair = arg;
    } else if (args[i] === '--date' && args[i + 1]) {
      options.date = args[++i];
    } else if (args[i] === '--compare' && args[i + 1] && args[i + 2]) {
      options.compare = [args[++i], args[++i]];
    } else if (args[i] === '--broken' && args[i + 1]) {
      options.broken = args[++i];
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
  console.log(`${C.dim}Loading market rates & constructing forward curve for ${pairKey} as of ${dateStr}...${C.reset}\n`);

  const data = await getForwardLadder(pairKey, dateStr, { applyXccy: !noXccy });

  console.log(`${C.white}${C.bold}PAIR: ${C.amber}${data.pairName} (${data.pair})${C.reset}   |   ${C.white}TRADE DATE: ${C.cyan}${data.tradeDate}${C.reset}   |   ${C.white}SPOT DATE: ${C.cyan}${data.spotDate}${C.reset}`);
  console.log(`${C.white}SPOT BID/ASK/MID: ${C.green}${data.spot.bid}${C.reset} / ${C.green}${data.spot.ask}${C.reset} (${C.amber}${data.spot.mid}${C.reset})   |   ${C.white}XCCY BASIS: ${data.applyXccy ? C.green + 'ACTIVE' : C.red + 'OFF'}${C.reset}`);
  console.log(`${C.dim}Base Rate (${data.baseCcy.code}): ACT/${data.baseCcy.dayCount} [${data.baseCcy.benchmark}]   |   Quote Rate (${data.quoteCcy.code}): ACT/${data.quoteCcy.dayCount} [${data.quoteCcy.benchmark}]${C.reset}\n`);

  // Table header
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
      `${ptsColor}${pad(sign + row.swapPoints.mid.toFixed(1), 16, 'right')}${C.reset}` +
      `${fwdColor}${C.bold}${pad(row.outrightForward.mid.toFixed(PAIRS[pairKey].quoteDecimals), 16, 'right')}${C.reset}` +
      `${pad(row.annPremiumPct.toFixed(2) + '%', 9, 'right')}`
    );
  }

  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}`);
  console.log(`${C.dim}Tip: Run with --compare YYYY-MM-DD YYYY-MM-DD to compare curves side-by-side like Bloomberg COMP.${C.reset}\n`);
}

async function runCompare(pairKey, date1, date2, noXccy) {
  printBanner();
  console.log(`${C.dim}Comparing forward curves for ${pairKey} between ${date1} and ${date2}...${C.reset}\n`);

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
      `${C.dim}${pad(row.date1.forward.toFixed(PAIRS[pairKey].quoteDecimals), 14, 'right')}${C.reset}` +
      `${C.bold}${pad(row.date2.forward.toFixed(PAIRS[pairKey].quoteDecimals), 14, 'right')}${C.reset}` +
      `${deltaOutColor}${pad(signO + row.delta.outright.toFixed(PAIRS[pairKey].quoteDecimals), 13, 'right')}${C.reset}` +
      `${pad(row.date1.points.toFixed(1), 12, 'right')}` +
      `${pad(row.date2.points.toFixed(1), 12, 'right')}` +
      `${deltaPtsColor}${C.bold}${pad(signP + row.delta.pointsPips.toFixed(1), 13, 'right')}${C.reset}`
    );
  }
  console.log(`${C.dim}${'-'.repeat(93)}${C.reset}\n`);
}

async function runBroken(pairKey, tradeDate, targetSettlement, noXccy) {
  printBanner();
  console.log(`${C.dim}Pricing Broken-Date FX Forward (FXFA) for ${pairKey}...${C.reset}\n`);

  const res = await calculateBrokenDateForward(pairKey, tradeDate, targetSettlement, { applyXccy: !noXccy });

  console.log(`${C.white}${C.bold}PAIR: ${C.amber}${res.pair}${C.reset}`);
  console.log(`${C.white}TRADE DATE: ${C.cyan}${res.tradeDate}${C.reset}  -->  ${C.white}SPOT DATE: ${C.cyan}${res.spotDate}${C.reset}`);
  console.log(`${C.white}CUSTOM SETTLEMENT DATE: ${C.amber}${C.bold}${res.maturityDate}${C.reset} (${C.white}${res.days} calendar days${C.reset})`);
  console.log(`${C.dim}${'-'.repeat(60)}${C.reset}`);
  console.log(`${C.white}SPOT MID:                 ${C.bold}${res.spot}${C.reset}`);
  console.log(`${C.white}INTERPOLATED BASE RATE:   ${C.cyan}${res.baseRate.toFixed(3)}%${C.reset}`);
  console.log(`${C.white}INTERPOLATED QUOTE RATE:  ${C.cyan}${res.quoteRate.toFixed(3)}%${C.reset}`);
  console.log(`${C.white}XCCY BASIS SPREAD:        ${res.xccyBps} bps`);
  console.log(`${C.white}SWAP POINTS:              ${res.swapPoints >= 0 ? C.green + '+' : C.red}${res.swapPoints} pips${C.reset}`);
  console.log(`${C.amber}${C.bold}OUTRIGHT FORWARD RATE:    ${res.outrightForward}${C.reset}`);
  console.log(`${C.white}ANNUALIZED PREMIUM:       ${res.annPremiumPct}% p.a.${C.reset}\n`);
}

async function runHistory(pairKey, tenor, from, to) {
  printBanner();
  console.log(`${C.dim}Retrieving historical ${tenor} forward rates for ${pairKey} from ${from} to ${to}...${C.reset}\n`);

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
      `${pad(p.spot.toFixed(PAIRS[pairKey].quoteDecimals), 12, 'right')}` +
      `${C.bold}${pad(p.forward.toFixed(PAIRS[pairKey].quoteDecimals), 15, 'right')}${C.reset}` +
      `${ptsColor}${pad((p.points >= 0 ? '+' : '') + p.points.toFixed(1), 16, 'right')}${C.reset}` +
      `${pad(p.rateDiff.toFixed(2) + '%', 14, 'right')}`
    );
  }
  console.log(`${C.dim}${'-'.repeat(71)}${C.reset}\n`);
}

async function main() {
  const options = parseArgs();
  try {
    if (options.compare) {
      await runCompare(options.pair, options.compare[0], options.compare[1], options.noXccy);
    } else if (options.broken) {
      await runBroken(options.pair, options.date, options.broken, options.noXccy);
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
