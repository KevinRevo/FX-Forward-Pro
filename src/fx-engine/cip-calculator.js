/**
 * Covered Interest Rate Parity (CIP) Engine & FX Forward Ladder Calculator
 * Recreates Bloomberg FRD (Forward Rate Display) and FXFA (FX Forward Analytics).
 */

const { PAIRS, CURRENCIES, STANDARD_TENORS } = require('./conventions');
const { getSpotDate, getTenorMaturityDate, getDayCount, formatDateISO } = require('./calendar');
const {
  getSpotRate,
  getYieldCurve,
  getCrossCurrencyBasisBps,
  interpolateRateForDays
} = require('./market-data');

/**
 * Calculate Outright Forward Rate from Spot, Rates, and Day Count
 */
function calculateOutrightForward(spot, baseRatePct, quoteRatePct, days, baseBasis, quoteBasis, xccyBps = 0) {
  const rBase = baseRatePct / 100;
  const rQuote = (quoteRatePct / 100) + (xccyBps / 10000);

  const tBase = days / baseBasis;
  const tQuote = days / quoteBasis;

  let forward;
  if (days <= 365) {
    // Money Market Simple Interest CIP
    const numerator = 1 + (rQuote * tQuote);
    const denominator = 1 + (rBase * tBase);
    forward = spot * (numerator / denominator);
  } else {
    // Multi-year compound CIP
    const numerator = Math.pow(1 + rQuote, tQuote);
    const denominator = Math.pow(1 + rBase, tBase);
    forward = spot * (numerator / denominator);
  }

  return forward;
}

/**
 * Build the full Forward Rate Display (FRD) ladder for a pair on a given date.
 */
async function getForwardLadder(pairKey, tradeDateStr, options = {}) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const applyXccy = options.applyXccy !== false; // Default true (matches real interbank market)

  const spotMid = await getSpotRate(pairKey, tradeDateStr);
  const spotDate = getSpotDate(tradeDateStr, pairKey);
  const spotDateStr = formatDateISO(spotDate);

  const baseCcy = CURRENCIES[pair.base];
  const quoteCcy = CURRENCIES[pair.quote];

  const baseCurve = getYieldCurve(pair.base, tradeDateStr);
  const quoteCurve = getYieldCurve(pair.quote, tradeDateStr);

  const spotSpreadPips = pair.typicalSpreadPips['1M'] || 0.5;
  const spotBid = parseFloat((spotMid - (spotSpreadPips * 0.5 * pair.pipSize)).toFixed(pair.quoteDecimals));
  const spotAsk = parseFloat((spotMid + (spotSpreadPips * 0.5 * pair.pipSize)).toFixed(pair.quoteDecimals));

  const ladder = [];

  for (const tenor of STANDARD_TENORS) {
    const maturityDate = getTenorMaturityDate(tradeDateStr, tenor, pairKey);
    const maturityDateStr = formatDateISO(maturityDate);

    let days = 0;
    if (tenor === 'ON' || tenor === 'TN' || tenor === 'SN') {
      days = 1;
    } else {
      days = Math.max(1, getDayCount(spotDate, maturityDate));
    }

    // Get interpolated rates along the curve
    const baseRate = interpolateRateForDays(baseCurve, days);
    const quoteRate = interpolateRateForDays(quoteCurve, days);

    const xccyBps = applyXccy ? getCrossCurrencyBasisBps(pairKey, tradeDateStr, tenor) : 0;

    // Outright Forward Mid
    const fwdMid = calculateOutrightForward(
      spotMid,
      baseRate,
      quoteRate,
      days,
      baseCcy.dayCount,
      quoteCcy.dayCount,
      xccyBps
    );

    // Swap Points (in pips)
    const pointsMid = (fwdMid - spotMid) / pair.pipSize;

    // Bid/Ask spread for forward points
    const pointsSpread = pair.typicalSpreadPips[tenor] || 0.5;
    const pointsBid = pointsMid - (pointsSpread * 0.5);
    const pointsAsk = pointsMid + (pointsSpread * 0.5);

    const fwdBid = spotBid + (pointsBid * pair.pipSize);
    const fwdAsk = spotAsk + (pointsAsk * pair.pipSize);

    // Annualized forward premium/discount (% p.a.)
    const annPremiumPct = (days > 0) ? ((fwdMid - spotMid) / spotMid) * (360 / days) * 100 : 0;

    ladder.push({
      tenor,
      settlementDate: maturityDateStr,
      days,
      baseRate: parseFloat(baseRate.toFixed(3)),
      quoteRate: parseFloat(quoteRate.toFixed(3)),
      rateDifferential: parseFloat((quoteRate - baseRate).toFixed(3)),
      xccyBps: parseFloat(xccyBps.toFixed(1)),
      swapPoints: {
        bid: parseFloat(pointsBid.toFixed(pair.pipDecimals)),
        ask: parseFloat(pointsAsk.toFixed(pair.pipDecimals)),
        mid: parseFloat(pointsMid.toFixed(pair.pipDecimals))
      },
      outrightForward: {
        bid: parseFloat(fwdBid.toFixed(pair.quoteDecimals)),
        ask: parseFloat(fwdAsk.toFixed(pair.quoteDecimals)),
        mid: parseFloat(fwdMid.toFixed(pair.quoteDecimals))
      },
      annPremiumPct: parseFloat(annPremiumPct.toFixed(3))
    });
  }

  return {
    pair: pair.symbol,
    pairName: pair.name,
    tradeDate: tradeDateStr,
    spotDate: spotDateStr,
    spot: {
      bid: spotBid,
      ask: spotAsk,
      mid: spotMid
    },
    baseCcy: {
      code: baseCcy.code,
      dayCount: baseCcy.dayCount,
      benchmark: baseCcy.benchmarkRate
    },
    quoteCcy: {
      code: quoteCcy.code,
      dayCount: quoteCcy.dayCount,
      benchmark: quoteCcy.benchmarkRate
    },
    applyXccy,
    ladder
  };
}

/**
 * Broken-Date Forward Calculator
 */
async function calculateBrokenDateForward(pairKey, tradeDateStr, targetMaturityStr, options = {}) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const applyXccy = options.applyXccy !== false;

  const spotMid = (options.spot != null && parseFloat(options.spot) > 0)
    ? parseFloat(options.spot)
    : await getSpotRate(pairKey, tradeDateStr);

  const spotDate = getSpotDate(tradeDateStr, pairKey);
  const spotDateStr = formatDateISO(spotDate);

  const maturityDate = new Date(targetMaturityStr);
  const days = Math.max(1, getDayCount(spotDate, maturityDate));

  const baseCcy = CURRENCIES[pair.base];
  const quoteCcy = CURRENCIES[pair.quote];

  const baseCurve = getYieldCurve(pair.base, tradeDateStr);
  const quoteCurve = getYieldCurve(pair.quote, tradeDateStr);

  const baseRate = interpolateRateForDays(baseCurve, days);
  const quoteRate = interpolateRateForDays(quoteCurve, days);
  const xccyBps = applyXccy ? getCrossCurrencyBasisBps(pairKey, tradeDateStr, days > 90 ? '6M' : '3M') : 0;

  const fwdMid = calculateOutrightForward(
    spotMid,
    baseRate,
    quoteRate,
    days,
    baseCcy.dayCount,
    quoteCcy.dayCount,
    xccyBps
  );

  const pointsMid = (fwdMid - spotMid) / pair.pipSize;
  const annPremiumPct = ((fwdMid - spotMid) / spotMid) * (360 / days) * 100;

  // Interbank Bid / Ask pricing
  const defaultSpreadPips = days <= 30 ? 0.3 : (days <= 90 ? 0.5 : (days <= 180 ? 0.8 : 1.2));
  const pointsSpread = options.spreadPips || pair.typicalSpreadPips['3M'] || defaultSpreadPips;
  const spotSpread = pair.typicalSpreadPips['1M'] || 0.5;

  const spotBid = parseFloat((spotMid - spotSpread * 0.5 * pair.pipSize).toFixed(pair.quoteDecimals));
  const spotAsk = parseFloat((spotMid + spotSpread * 0.5 * pair.pipSize).toFixed(pair.quoteDecimals));

  const pointsBid = pointsMid - (pointsSpread * 0.5);
  const pointsAsk = pointsMid + (pointsSpread * 0.5);

  const fwdBid = spotBid + (pointsBid * pair.pipSize);
  const fwdAsk = spotAsk + (pointsAsk * pair.pipSize);

  return {
    pair: pair.symbol,
    pairName: pair.name,
    lhs: pair.lhs,
    rhs: pair.rhs,
    tradeDate: tradeDateStr,
    spotDate: spotDateStr,
    maturityDate: targetMaturityStr,
    days,
    spot: spotMid,
    spotBid,
    spotAsk,
    baseRate: parseFloat(baseRate.toFixed(4)),
    quoteRate: parseFloat(quoteRate.toFixed(4)),
    xccyBps: parseFloat(xccyBps.toFixed(2)),
    swapPoints: parseFloat(pointsMid.toFixed(pair.pipDecimals)),
    pointsBid: parseFloat(pointsBid.toFixed(pair.pipDecimals)),
    pointsAsk: parseFloat(pointsAsk.toFixed(pair.pipDecimals)),
    outrightForward: parseFloat(fwdMid.toFixed(pair.quoteDecimals)),
    forwardBid: parseFloat(fwdBid.toFixed(pair.quoteDecimals)),
    forwardAsk: parseFloat(fwdAsk.toFixed(pair.quoteDecimals)),
    annPremiumPct: parseFloat(annPremiumPct.toFixed(3))
  };
}

/**
 * Historical Comparison between two dates (COMP functionality)
 */
async function compareForwardCurves(pairKey, date1Str, date2Str, options = {}) {
  const curve1 = await getForwardLadder(pairKey, date1Str, options);
  const curve2 = await getForwardLadder(pairKey, date2Str, options);

  const pair = PAIRS[pairKey] || PAIRS.EURUSD;

  const comparisons = curve1.ladder.map((row1, idx) => {
    const row2 = curve2.ladder[idx];
    const diffOutright = row2.outrightForward.mid - row1.outrightForward.mid;
    const diffPoints = row2.swapPoints.mid - row1.swapPoints.mid;
    const diffRateDiff = row2.rateDifferential - row1.rateDifferential;

    return {
      tenor: row1.tenor,
      days: row1.days,
      date1: {
        date: date1Str,
        forward: row1.outrightForward.mid,
        points: row1.swapPoints.mid,
        baseRate: row1.baseRate,
        quoteRate: row1.quoteRate,
        rateDiff: row1.rateDifferential
      },
      date2: {
        date: date2Str,
        forward: row2.outrightForward.mid,
        points: row2.swapPoints.mid,
        baseRate: row2.baseRate,
        quoteRate: row2.quoteRate,
        rateDiff: row2.rateDifferential
      },
      delta: {
        outright: parseFloat(diffOutright.toFixed(pair.quoteDecimals)),
        pointsPips: parseFloat(diffPoints.toFixed(pair.pipDecimals)),
        rateDiffBps: Math.round(diffRateDiff * 100)
      }
    };
  });

  return {
    pair: pair.symbol,
    date1: date1Str,
    date2: date2Str,
    spot1: curve1.spot.mid,
    spot2: curve2.spot.mid,
    spotDelta: parseFloat((curve2.spot.mid - curve1.spot.mid).toFixed(pair.quoteDecimals)),
    spotDeltaPct: parseFloat((((curve2.spot.mid - curve1.spot.mid) / curve1.spot.mid) * 100).toFixed(2)),
    comparisons
  };
}

/**
 * Historical time-series of a specific tenor forward rate vs spot.
 */
async function getTenorHistory(pairKey, tenor = '3M', startDateStr, endDateStr, stepDays = 7) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const series = [];
  let current = new Date(start);

  while (current <= end) {
    const curStr = formatDateISO(current);
    try {
      const ladder = await getForwardLadder(pairKey, curStr);
      const row = ladder.ladder.find(r => r.tenor === tenor) || ladder.ladder.find(r => r.tenor === '3M');

      series.push({
        date: curStr,
        spot: ladder.spot.mid,
        forward: row ? row.outrightForward.mid : ladder.spot.mid,
        points: row ? row.swapPoints.mid : 0,
        baseRate: row ? row.baseRate : 0,
        quoteRate: row ? row.quoteRate : 0,
        rateDiff: row ? row.rateDifferential : 0
      });
    } catch (e) {
      // skip errors on individual dates
    }

    current.setUTCDate(current.getUTCDate() + stepDays);
  }

  return {
    pair: pair.symbol,
    tenor,
    startDate: startDateStr,
    endDate: endDateStr,
    dataPoints: series.length,
    series
  };
}

/**
 * Window Forward Pricing (Forward à Fenêtre / Flexible Forward)
 * Prices an American-style delivery forward executable anytime between windowStart and windowEnd.
 * Applies the conservative interbank boundary principle (worst-case carry for client).
 */
async function calculateWindowForward(pairKey, tradeDateStr, windowStartStr, windowEndStr, direction = 'BUY_LHS', options = {}) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const applyXccy = options.applyXccy !== false;
  const notional = parseFloat(options.notional) || 1000000;
  const customSpot = options.spot != null && parseFloat(options.spot) > 0 ? parseFloat(options.spot) : null;

  // 1. Calculate pricing at Window Start & Window End
  const startFwd = await calculateBrokenDateForward(pairKey, tradeDateStr, windowStartStr, { applyXccy, spot: customSpot, spreadPips: options.spreadPips });
  const endFwd = await calculateBrokenDateForward(pairKey, tradeDateStr, windowEndStr, { applyXccy, spot: customSpot, spreadPips: options.spreadPips });

  const isUpwardSloping = endFwd.outrightForward >= startFwd.outrightForward;

  let windowRate;
  let worstCaseDate;
  let worstCaseDays;
  let windowPoints;

  const isBuyLHS = (direction === 'BUY_LHS' || direction === 'BUY_BASE');

  if (isBuyLHS) {
    // Client BUYS LHS / SELLS RHS (e.g. Buys EUR, Pays GBP/USD)
    // Client wants lowest rate. Bank sells LHS at Ask.
    // Least favorable rate for client is the HIGHEST Ask price across the window.
    if (endFwd.forwardAsk >= startFwd.forwardAsk) {
      windowRate = endFwd.forwardAsk;
      worstCaseDate = windowEndStr;
      worstCaseDays = endFwd.days;
    } else {
      windowRate = startFwd.forwardAsk;
      worstCaseDate = windowStartStr;
      worstCaseDays = startFwd.days;
    }
    windowPoints = (windowRate - startFwd.spotAsk) / pair.pipSize;
  } else {
    // Client SELLS LHS / BUYS RHS (e.g. Sells EUR, Receives GBP/USD)
    // Client wants highest rate. Bank buys LHS at Bid.
    // Least favorable rate for client is the LOWEST Bid price across the window.
    if (endFwd.forwardBid <= startFwd.forwardBid) {
      windowRate = endFwd.forwardBid;
      worstCaseDate = windowEndStr;
      worstCaseDays = endFwd.days;
    } else {
      windowRate = startFwd.forwardBid;
      worstCaseDate = windowStartStr;
      worstCaseDays = startFwd.days;
    }
    windowPoints = (windowRate - startFwd.spotBid) / pair.pipSize;
  }

  const benchmarkEndRate = isBuyLHS ? endFwd.forwardAsk : endFwd.forwardBid;
  const carryCostPips = Math.abs(windowRate - benchmarkEndRate) / pair.pipSize;
  const carryCostCash = Math.abs(windowRate - benchmarkEndRate) * notional;
  const totalSettlementCash = notional * windowRate;

  // 2. Generate intermediate pillar points across the window
  const windowSchedule = [];
  const startDate = new Date(windowStartStr);
  const endDate = new Date(windowEndStr);
  const stepDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 86400 * 5)));

  let current = new Date(startDate);
  while (current <= endDate) {
    const cStr = formatDateISO(current);
    const subFwd = await calculateBrokenDateForward(pairKey, tradeDateStr, cStr, { applyXccy, spot: customSpot, spreadPips: options.spreadPips });
    windowSchedule.push({
      date: cStr,
      days: subFwd.days,
      forwardBid: subFwd.forwardBid,
      forwardAsk: subFwd.forwardAsk,
      outrightForward: subFwd.outrightForward,
      swapPoints: subFwd.swapPoints,
      pointsBid: subFwd.pointsBid,
      pointsAsk: subFwd.pointsAsk
    });
    current.setUTCDate(current.getUTCDate() + stepDays);
  }
  if (windowSchedule[windowSchedule.length - 1].date !== windowEndStr) {
    windowSchedule.push({
      date: windowEndStr,
      days: endFwd.days,
      forwardBid: endFwd.forwardBid,
      forwardAsk: endFwd.forwardAsk,
      outrightForward: endFwd.outrightForward,
      swapPoints: endFwd.swapPoints,
      pointsBid: endFwd.pointsBid,
      pointsAsk: endFwd.pointsAsk
    });
  }

  return {
    pair: pair.symbol,
    pairName: pair.name,
    lhs: pair.lhs,
    rhs: pair.rhs,
    tradeDate: tradeDateStr,
    spotDate: startFwd.spotDate,
    spot: startFwd.spot,
    spotBid: startFwd.spotBid,
    spotAsk: startFwd.spotAsk,
    direction: isBuyLHS ? 'BUY_LHS' : 'SELL_LHS',
    directionLabel: isBuyLHS ? `Client BUYS ${pair.lhs} (LHS) / SELLS ${pair.rhs} (RHS)` : `Client SELLS ${pair.lhs} (LHS) / BUYS ${pair.rhs} (RHS)`,
    windowStart: windowStartStr,
    windowEnd: windowEndStr,
    windowDurationDays: endFwd.days - startFwd.days,
    windowRate: parseFloat(windowRate.toFixed(pair.quoteDecimals)),
    windowPoints: parseFloat(windowPoints.toFixed(pair.pipDecimals)),
    worstCaseDate,
    worstCaseDays,
    curveStructure: isUpwardSloping ? 'PREMIUM (Upward Sloping)' : 'DISCOUNT (Downward Sloping)',
    startDatePricing: {
      date: windowStartStr,
      days: startFwd.days,
      bid: startFwd.forwardBid,
      ask: startFwd.forwardAsk,
      mid: startFwd.outrightForward,
      pointsBid: startFwd.pointsBid,
      pointsAsk: startFwd.pointsAsk,
      pointsMid: startFwd.swapPoints
    },
    endDatePricing: {
      date: windowEndStr,
      days: endFwd.days,
      bid: endFwd.forwardBid,
      ask: endFwd.forwardAsk,
      mid: endFwd.outrightForward,
      pointsBid: endFwd.pointsBid,
      pointsAsk: endFwd.pointsAsk,
      pointsMid: endFwd.swapPoints
    },
    windowCost: {
      pips: parseFloat(carryCostPips.toFixed(pair.pipDecimals)),
      cashflow: parseFloat(carryCostCash.toFixed(2)),
      currency: pair.rhs
    },
    notional: {
      lhsAmount: notional,
      lhsCurrency: pair.lhs,
      rhsSettlementCashflow: parseFloat(totalSettlementCash.toFixed(2)),
      rhsCurrency: pair.rhs
    },
    windowSchedule
  };
}

module.exports = {
  calculateOutrightForward,
  getForwardLadder,
  calculateBrokenDateForward,
  compareForwardCurves,
  getTenorHistory,
  calculateWindowForward
};
