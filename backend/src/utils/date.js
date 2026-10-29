/**
 * Date manipulation utilities specialized for DD/MM/YYYY formatting
 * and backward timeline scheduling.
 */

/**
 * Formats a Date object or ISO string to DD/MM/YYYY.
 * @param {string|Date} dateInput
 * @returns {string} DD/MM/YYYY formatted string
 */
export function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parses DD/MM/YYYY or YYYY-MM-DD string into ISO YYYY-MM-DD.
 * @param {string} str
 * @returns {string} YYYY-MM-DD
 */
export function normalizeDateToISO(str) {
  if (!str) return '';
  const trimmed = str.trim();
  // Check DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Check YYYY-MM-DD
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Calculates days difference between two dates (date2 - date1).
 * @param {string|Date} date1
 * @param {string|Date} date2
 * @returns {number} Days difference (positive if date2 is in future)
 */
export function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates days remaining from today until target date.
 * @param {string|Date} targetDate
 * @returns {number}
 */
export function getDaysRemaining(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return getDaysDifference(today, target);
}

/**
 * Shifts a date by a given number of days (+ or -).
 * @param {string} baseDateISO - YYYY-MM-DD
 * @param {number} daysDelta - Positive to advance, negative to move earlier
 * @returns {string} Shifted YYYY-MM-DD
 */
export function shiftDate(baseDateISO, daysDelta) {
  const d = new Date(baseDateISO);
  d.setDate(d.getDate() + daysDelta);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates back-scheduled date: Event Date minus daysBefore.
 * @param {string} eventDateISO - YYYY-MM-DD
 * @param {number} daysBefore - Positive number of days before event
 * @returns {string} YYYY-MM-DD
 */
export function calculateBackScheduledDate(eventDateISO, daysBefore) {
  return shiftDate(eventDateISO, -Math.abs(daysBefore));
}

