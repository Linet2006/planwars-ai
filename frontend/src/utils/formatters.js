/**
 * Indian Rupee (INR) and Date formatting utilities for the frontend UI.
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

export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
