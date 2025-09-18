import { describe, it, expect } from 'vitest';

import {
  formatFilenameToAddress,
  truncateText,
  formatDate,
  formatPrice,
  formatStructuredAddress,
  getStatusColor,
  formatHomeStatus,
  formatAgentName,
  formatSquareFootage,
  formatLotSize,
} from '@/core/utils/address';

describe('address utilities', () => {
  describe('formatFilenameToAddress', () => {
    it('should convert filename to readable address', () => {
      const filename = '10421f3ef19c483a9_777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf';
      const result = formatFilenameToAddress(filename);
      expect(result).toBe('777 W Middlefield Rd, Mountain View, CA, 94043');
    });

    it('should handle filename without hash prefix', () => {
      const filename = '777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf';
      const result = formatFilenameToAddress(filename);
      expect(result).toBe('777 W Middlefield Rd, Mountain View, CA, 94043');
    });

    it('should handle filename without country', () => {
      const filename = '123_Main_St_New_York_NY_10001.pdf';
      const result = formatFilenameToAddress(filename);
      expect(result).toBe('123 Main St, New York, NY, 10001');
    });

    it('should handle short filenames', () => {
      const filename = '123_Main_St.pdf';
      const result = formatFilenameToAddress(filename);
      expect(result).toBe('123, Main, St');
    });

    it('should return empty string for empty filename', () => {
      expect(formatFilenameToAddress('')).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle text without spaces', () => {
      const text = 'VeryLongTextWithoutSpaces';
      const result = truncateText(text, 10);
      expect(result).toBe('VeryLon...');
    });

    it('should use default maxLength', () => {
      const text = 'This is a very long text that should be truncated because it exceeds the default length';
      const result = truncateText(text);
      expect(result).toBe('This is a very long text that should be...');
    });
  });

  describe('formatDate', () => {
    it('should format valid date strings', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 14, 2024');
      expect(formatDate('2024-12-25T10:30:00Z')).toBe('Dec 25, 2024');
    });

    it('should return original string for invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date');
      expect(formatDate('')).toBe('');
    });
  });

  describe('formatPrice', () => {
    it('should format price with USD currency', () => {
      expect(formatPrice(750000)).toBe('$750,000');
    });

    it('should format price with custom currency', () => {
      expect(formatPrice(750000, 'EUR')).toBe('€750,000');
    });
  });

  describe('formatStructuredAddress', () => {
    it('should format structured address object', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipcode: '94102',
      };
      const result = formatStructuredAddress(address);
      expect(result).toBe('123 Main St, San Francisco, CA 94102');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getStatusColor('recently_sold')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('for_sale')).toBe('bg-blue-100 text-blue-800');
      expect(getStatusColor('off_market')).toBe('bg-gray-100 text-gray-800');
      expect(getStatusColor('unknown_status')).toBe('bg-gray-100 text-gray-800');
    });

    it('should handle case insensitive status', () => {
      expect(getStatusColor('RECENTLY_SOLD')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('For_Sale')).toBe('bg-blue-100 text-blue-800');
    });
  });

  describe('formatHomeStatus', () => {
    it('should format status with underscores to title case', () => {
      expect(formatHomeStatus('recently_sold')).toBe('Recently Sold');
      expect(formatHomeStatus('for_sale')).toBe('For Sale');
      expect(formatHomeStatus('off_market')).toBe('Off Market');
    });
  });

  describe('formatAgentName', () => {
    it('should format agent name to title case', () => {
      expect(formatAgentName('john doe')).toBe('John Doe');
      expect(formatAgentName('MARY SMITH')).toBe('Mary Smith');
      expect(formatAgentName('bob wilson-jones')).toBe('Bob Wilson-Jones');
    });
  });

  describe('formatSquareFootage', () => {
    it('should format square footage with commas', () => {
      expect(formatSquareFootage(1500)).toBe('1,500 sqft');
      expect(formatSquareFootage(1500, 'sqft')).toBe('1,500 sqft');
    });

    it('should format acres with 2 decimal places', () => {
      expect(formatSquareFootage(1.5, 'acres')).toBe('1.50 acres');
      expect(formatSquareFootage(2.25, 'ACRES')).toBe('2.25 acres');
    });

    it('should round square footage to integers', () => {
      expect(formatSquareFootage(1500.7)).toBe('1,501 sqft');
    });
  });

  describe('formatLotSize', () => {
    it('should format number lot size', () => {
      expect(formatLotSize(5000)).toBe('5,000 sqft');
    });

    it('should return string lot size as-is if it contains units', () => {
      expect(formatLotSize('1.5 acres')).toBe('1.5 acres');
      expect(formatLotSize('5000 sqft')).toBe('5000 sqft');
    });

    it('should parse and format numeric string', () => {
      expect(formatLotSize('5000')).toBe('5,000 sqft');
      expect(formatLotSize('1.5')).toBe('2 sqft');
    });

    it('should return N/A for invalid inputs', () => {
      expect(formatLotSize(undefined)).toBe('N/A');
      expect(formatLotSize(null)).toBe('N/A');
      expect(formatLotSize('invalid')).toBe('invalid');
    });
  });
});
