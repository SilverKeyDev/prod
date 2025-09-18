import { describe, it, expect } from 'vitest';

import {
  formatUSD,
  formatCompactUSD,
  parseUSD,
  formatPrice,
  formatNumber,
  formatPercentage,
} from '@/core/utils/currency';

describe('currency utilities', () => {
  describe('formatUSD', () => {
    it('should format numbers as USD currency', () => {
      expect(formatUSD(1000)).toBe('$1,000');
      expect(formatUSD(1500000)).toBe('$1,500,000');
      expect(formatUSD(0)).toBe('$0');
    });

    it('should handle negative numbers', () => {
      expect(formatUSD(-1000)).toBe('-$1,000');
    });

    it('should round to whole numbers', () => {
      expect(formatUSD(1000.99)).toBe('$1,001');
    });
  });

  describe('formatCompactUSD', () => {
    it('should format numbers in compact notation', () => {
      expect(formatCompactUSD(1000)).toBe('$1.0K');
      expect(formatCompactUSD(1500000)).toBe('$1.5M');
      expect(formatCompactUSD(1000000000)).toBe('$1.0B');
    });

    it('should handle smaller amounts', () => {
      expect(formatCompactUSD(500)).toBe('$500.0');
      expect(formatCompactUSD(999)).toBe('$999.0');
    });
  });

  describe('parseUSD', () => {
    it('should parse currency strings to numbers', () => {
      expect(parseUSD('$1,000')).toBe(1000);
      expect(parseUSD('$1,500,000')).toBe(1500000);
      expect(parseUSD('$0')).toBe(0);
    });

    it('should handle compact notation', () => {
      expect(parseUSD('$1K')).toBe(1000);
      expect(parseUSD('$1.5M')).toBe(1500000);
      expect(parseUSD('$2B')).toBe(2000000000);
    });

    it('should handle various formats', () => {
      expect(parseUSD('1,000')).toBe(1000);
      expect(parseUSD('1K')).toBe(1000);
      expect(parseUSD('1.5M')).toBe(1500000);
    });

    it('should return 0 for empty or invalid strings', () => {
      expect(parseUSD('')).toBe(0);
      expect(parseUSD('invalid')).toBe(NaN);
      expect(parseUSD('$')).toBe(NaN);
    });
  });

  describe('formatPrice', () => {
    it('should format price with default USD currency', () => {
      expect(formatPrice(1000)).toBe('$1,000');
    });

    it('should format price with custom currency', () => {
      expect(formatPrice(1000, 'EUR')).toBe('€1,000');
      expect(formatPrice(1000, 'GBP')).toBe('£1,000');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1500000)).toBe('1,500,000');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with default decimal places', () => {
      expect(formatPercentage(12.345)).toBe('12.3%');
    });

    it('should format percentages with custom decimal places', () => {
      expect(formatPercentage(12.345, 2)).toBe('12.35%');
      expect(formatPercentage(12.345, 0)).toBe('12%');
    });
  });
});
