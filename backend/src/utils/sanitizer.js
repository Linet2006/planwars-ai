/**
 * Input sanitization utility to prevent XSS and control character injection.
 */

/**
 * Strips script tags, HTML tags, and null bytes from input string.
 * @param {string} input - Raw untrusted input
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove scripts
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .trim();
}

/**
 * Recursively sanitizes strings in an object.
 * @param {any} obj
 * @returns {any} Sanitized object
 */
export function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeObject(value);
    }
    return cleaned;
  }
  return obj;
}

