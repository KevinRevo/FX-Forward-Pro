/**
 * FX Calendar & Settlement Date Engine
 * Implements:
 * - Spot Date calculation (T+2 / T+1)
 * - Joint financial center holiday checking
 * - Modified Following convention
 * - End-of-Month (EOM) rule
 * - Standard Tenor generation (ON, TN, SN, 1W...5Y)
 */

const { CURRENCIES, PAIRS } = require('./conventions');

// Known recurring financial center holiday functions
function isFixedHoliday(year, month, day) {
  // New Year's Day
  if (month === 0 && day === 1) return true;
  // Christmas Day
  if (month === 11 && day === 25) return true;
  // Boxing Day
  if (month === 11 && day === 26) return true;
  return false;
}

// Easter calculation (Meeus/Jones/Butcher algorithm)
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

function isGoodFriday(date) {
  const easter = getEasterSunday(date.getUTCFullYear());
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(easter.getUTCDate() - 2);
  return date.getUTCFullYear() === goodFriday.getUTCFullYear() &&
         date.getUTCMonth() === goodFriday.getUTCMonth() &&
         date.getUTCDate() === goodFriday.getUTCDate();
}

function isEasterMonday(date) {
  const easter = getEasterSunday(date.getUTCFullYear());
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easter.getUTCDate() + 1);
  return date.getUTCFullYear() === easterMonday.getUTCFullYear() &&
         date.getUTCMonth() === easterMonday.getUTCMonth() &&
         date.getUTCDate() === easterMonday.getUTCDate();
}

function isUSHoliday(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const dow = date.getUTCDay();

  // New Year (observed)
  if (m === 0 && d === 1) return true;
  if (m === 0 && d === 2 && dow === 1) return true;
  // MLK Day (3rd Mon in Jan)
  if (m === 0 && dow === 1 && d >= 15 && d <= 21) return true;
  // Presidents Day (3rd Mon in Feb)
  if (m === 1 && dow === 1 && d >= 15 && d <= 21) return true;
  // Good Friday
  if (isGoodFriday(date)) return true;
  // Memorial Day (Last Mon in May)
  if (m === 4 && dow === 1 && d >= 25) return true;
  // Juneteenth (June 19)
  if (m === 5 && d === 19) return true;
  // Independence Day (July 4)
  if (m === 6 && d === 4) return true;
  if (m === 6 && d === 5 && dow === 1) return true;
  // Labor Day (1st Mon in Sep)
  if (m === 8 && dow === 1 && d <= 7) return true;
  // Thanksgiving (4th Thu in Nov)
  if (m === 10 && dow === 4 && d >= 22 && d <= 28) return true;
  // Christmas
  if (m === 11 && d === 25) return true;
  if (m === 11 && d === 26 && dow === 1) return true;

  return false;
}

function isEuropeanTargetHoliday(date) {
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  // New Year
  if (m === 0 && d === 1) return true;
  // Good Friday
  if (isGoodFriday(date)) return true;
  // Easter Monday
  if (isEasterMonday(date)) return true;
  // Labour Day (May 1)
  if (m === 4 && d === 1) return true;
  // Christmas Day & Boxing Day
  if (m === 11 && (d === 25 || d === 26)) return true;
  return false;
}

function isBusinessDay(date, ccy1, ccy2) {
  const dow = date.getUTCDay();
  // Weekends
  if (dow === 0 || dow === 6) return false;

  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  if (isFixedHoliday(y, m, d)) return false;

  const checkUS = (ccy1 === 'USD' || ccy2 === 'USD');
  const checkEUR = (ccy1 === 'EUR' || ccy2 === 'EUR');

  if (checkUS && isUSHoliday(date)) return false;
  if (checkEUR && isEuropeanTargetHoliday(date)) return false;

  return true;
}

function addBusinessDays(date, days, ccy1, ccy2) {
  const current = new Date(date);
  let added = 0;
  while (added < days) {
    current.setUTCDate(current.getUTCDate() + 1);
    if (isBusinessDay(current, ccy1, ccy2)) {
      added++;
    }
  }
  return current;
}

function isLastBusinessDayOfMonth(date, ccy1, ccy2) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  while (!isBusinessDay(next, ccy1, ccy2)) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getUTCMonth() !== date.getUTCMonth();
}

function getLastBusinessDayOfMonth(year, month, ccy1, ccy2) {
  // month is 0-based
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  while (!isBusinessDay(lastDay, ccy1, ccy2)) {
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  }
  return lastDay;
}

/**
 * Apply the Modified Following convention:
 * Advance to next business day; if that falls in next calendar month, roll back.
 */
function applyModifiedFollowing(date, ccy1, ccy2) {
  const originalMonth = date.getUTCMonth();
  let forward = new Date(date);

  while (!isBusinessDay(forward, ccy1, ccy2)) {
    forward.setUTCDate(forward.getUTCDate() + 1);
  }

  if (forward.getUTCMonth() === originalMonth) {
    return forward;
  }

  // Roll backward if crossed into next month
  let backward = new Date(date);
  while (!isBusinessDay(backward, ccy1, ccy2)) {
    backward.setUTCDate(backward.getUTCDate() - 1);
  }
  return backward;
}

/**
 * Calculate the Spot Settlement Date for a given pair and trade date.
 */
function getSpotDate(tradeDate, pairKey) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const baseCcy = pair.base;
  const quoteCcy = pair.quote;
  const lag = pair.spotLag || 2;

  let current = new Date(tradeDate);
  // Ensure trade date itself is treated cleanly
  return addBusinessDays(current, lag, baseCcy, quoteCcy);
}

/**
 * Calculate the Settlement Date for a specific standard tenor.
 */
function getTenorMaturityDate(tradeDate, tenor, pairKey) {
  const pair = PAIRS[pairKey] || PAIRS.EURUSD;
  const baseCcy = pair.base;
  const quoteCcy = pair.quote;
  const spotDate = getSpotDate(tradeDate, pairKey);

  if (tenor === 'ON') {
    // Overnight: Trade Date to Trade Date + 1 business day
    return addBusinessDays(new Date(tradeDate), 1, baseCcy, quoteCcy);
  }

  if (tenor === 'TN') {
    // Tomorrow-Next: Trade Date + 1 bday to Spot Date
    return spotDate;
  }

  if (tenor === 'SN') {
    // Spot-Next: Spot Date to Spot Date + 1 bday
    return addBusinessDays(new Date(spotDate), 1, baseCcy, quoteCcy);
  }

  // Week tenors
  const weekMatch = tenor.match(/^(\d+)W$/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    const target = new Date(spotDate);
    target.setUTCDate(target.getUTCDate() + weeks * 7);
    return applyModifiedFollowing(target, baseCcy, quoteCcy);
  }

  // Month tenors
  const monthMatch = tenor.match(/^(\d+)M$/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    const isEOM = isLastBusinessDayOfMonth(spotDate, baseCcy, quoteCcy);

    if (isEOM) {
      const targetYear = spotDate.getUTCFullYear() + Math.floor((spotDate.getUTCMonth() + months) / 12);
      const targetMonth = (spotDate.getUTCMonth() + months) % 12;
      return getLastBusinessDayOfMonth(targetYear, targetMonth, baseCcy, quoteCcy);
    }

    const target = new Date(spotDate);
    target.setUTCMonth(target.getUTCMonth() + months);
    return applyModifiedFollowing(target, baseCcy, quoteCcy);
  }

  // Year tenors
  const yearMatch = tenor.match(/^(\d+)Y$/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    const isEOM = isLastBusinessDayOfMonth(spotDate, baseCcy, quoteCcy);

    if (isEOM) {
      const targetYear = spotDate.getUTCFullYear() + years;
      const targetMonth = spotDate.getUTCMonth();
      return getLastBusinessDayOfMonth(targetYear, targetMonth, baseCcy, quoteCcy);
    }

    const target = new Date(spotDate);
    target.setUTCFullYear(target.getUTCFullYear() + years);
    return applyModifiedFollowing(target, baseCcy, quoteCcy);
  }

  // Fallback: default to 1M
  const fallback = new Date(spotDate);
  fallback.setUTCMonth(fallback.getUTCMonth() + 1);
  return applyModifiedFollowing(fallback, baseCcy, quoteCcy);
}

/**
 * Compute day counts between two dates
 */
function getDayCount(dateFrom, dateTo) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dateTo.getTime() - dateFrom.getTime()) / msPerDay);
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  isBusinessDay,
  addBusinessDays,
  applyModifiedFollowing,
  getSpotDate,
  getTenorMaturityDate,
  getDayCount,
  formatDateISO
};
