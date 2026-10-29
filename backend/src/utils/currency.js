/**
 * Indian Rupee (INR) currency formatting and parsing utilities.
 * Supports lakh (1,00,000) and crore (1,00,00,000) comma systems.
 */

/**
 * Formats a numeric value into Indian Rupee currency string.
 * @param {number} amount - Numeric amount
 * @param {boolean} [includeSymbol=true] - Whether to prepend ₹
 * @returns {string} Formatted INR string (e.g., "₹25,00,000")
 */
export function formatINR(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₹0' : '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const str = absAmount.toString();

  let result = '';
  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.substring(str.length - 3);
    const otherDigits = str.substring(0, str.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}`;
  }

  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${prefix}${symbol}${result}`;
}

/**
 * Formats amount in Lakhs / Crores shorthand for compact displays.
 * @param {number} amount - Numeric amount
 * @returns {string} Shorthand string (e.g. "₹25 Lakhs" or "₹1.5 Crores")
 */
export function formatINRShorthand(amount) {
  if (!amount || isNaN(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    const crores = (abs / 10000000).toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${crores} Cr`;
  }
  if (abs >= 100000) {
    const lakhs = (abs / 100000).toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${lakhs} L`;
  }
  if (abs >= 1000) {
    const thousands = (abs / 1000).toFixed(1).replace(/\.?0+$/, '');
    return `${sign}₹${thousands} K`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Parses user input currency string into a clean integer.
 * @param {string|number} input - e.g. "₹ 25,00,000", "25 Lakhs", "2.5L"
 * @returns {number} Parsed integer amount
 */
export function parseINR(input) {
  if (typeof input === 'number') return Math.round(input);
  if (!input || typeof input !== 'string') return 0;

  const clean = input.trim().toLowerCase();
  
  if (clean.includes('cr') || clean.includes('crore')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000000);
  }
  if (clean.includes('l') || clean.includes('lakh')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }
  if (clean.includes('k') || clean.includes('thousand')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }

  const digits = clean.replace(/[^\d-]/g, '');
  if (!digits || digits === '-') return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}
