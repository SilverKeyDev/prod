/**
 * Pure currency formatting utilities
 * No React dependencies - can be used anywhere
 */

/**
 * Formats a number as USD currency
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a number as compact USD currency (e.g., $1.2M, $500K)
 */
export function formatCompactUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Parses a USD currency string to number
 */
export function parseUSD(currencyString: string): number {
  if (!currencyString) return 0;

  // Remove currency symbols, commas, and spaces
  const cleanString = currencyString.replace(/[$,\s]/g, '');

  // Handle compact notation (K, M, B)
  const multipliers: Record<string, number> = {
    K: 1000,
    M: 1000000,
    B: 1000000000,
  };

  const lastChar = cleanString.slice(-1).toUpperCase();
  if (multipliers[lastChar]) {
    const baseValue = parseFloat(cleanString.slice(0, -1));
    return baseValue * multipliers[lastChar];
  }

  return parseFloat(cleanString) ?? 0;
}

/**
 * Formats a price with custom currency
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats a number with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
