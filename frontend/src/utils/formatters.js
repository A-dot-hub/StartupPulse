/**
 * Format numerical currency value into clean USD string.
 * @param {number|string} value
 * @param {boolean} compact - if true, shows e.g. $5.2M
 * @returns {string}
 */
export function formatCurrency(value, compact = false) {
  const num = Number(value);
  if (isNaN(num)) return '$0';

  if (compact) {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `$${num.toLocaleString('en-US')}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage value.
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
  const num = Number(value);
  if (isNaN(num)) return '0.00%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format regular number with comma separators.
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format ISO date string into readable user date.
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Normalize risk level string into 'Low', 'Medium', or 'High'.
 * @param {string} risk
 * @returns {'Low' | 'Medium' | 'High'}
 */
export function normalizeRisk(risk) {
  if (!risk) return 'Medium';
  const clean = String(risk).toLowerCase().replace('risk', '').trim();
  if (clean.includes('low')) return 'Low';
  if (clean.includes('high')) return 'High';
  return 'Medium';
}
