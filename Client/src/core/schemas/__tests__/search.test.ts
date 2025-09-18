import {
  isPropertyDetails,
  isApiResponse,
  isMapPosition,
  type PropertyDetails,
  type ApiResponse,
  type MapPosition,
} from '../search';

describe('Search Type Guards', () => {
  describe('isPropertyDetails', () => {
    it('should return true for valid PropertyDetails', () => {
      const validProperty: PropertyDetails = {
        id: '1',
        address: '123 Test St',
        price: '$500,000',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lat: 40.7128,
        lng: -74.0060,
        propertyType: 'SINGLE_FAMILY',
        listingStatus: 'FOR_SALE',
      };

      expect(isPropertyDetails(validProperty)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isPropertyDetails(null)).toBe(false);
      expect(isPropertyDetails(undefined)).toBe(false);
      expect(isPropertyDetails({})).toBe(false);
      expect(isPropertyDetails('string')).toBe(false);
      expect(isPropertyDetails(123)).toBe(false);
    });

    it('should return false for objects missing required fields', () => {
      const invalidProperty = {
        address: '123 Test St',
        price: '$500,000',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lat: 40.7128,
        lng: -74.0060,
        propertyType: 'SINGLE_FAMILY',
        listingStatus: 'FOR_SALE',
        // Missing id
      };

      expect(isPropertyDetails(invalidProperty)).toBe(false);
    });

    it('should return false for objects with wrong types', () => {
      const invalidProperty = {
        id: 123, // Should be string
        address: '123 Test St',
        price: '$500,000',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lat: '40.7128', // Should be number
        lng: -74.0060,
        propertyType: 'SINGLE_FAMILY',
        listingStatus: 'FOR_SALE',
      };

      expect(isPropertyDetails(invalidProperty)).toBe(false);
    });
  });

  describe('isApiResponse', () => {
    it('should return true for valid ApiResponse', () => {
      const validResponse: ApiResponse<string> = {
        success: true,
        data: 'test data',
      };

      expect(isApiResponse(validResponse)).toBe(true);
    });

    it('should return true for ApiResponse with error', () => {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Something went wrong',
      };

      expect(isApiResponse(errorResponse)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isApiResponse(null)).toBe(false);
      expect(isApiResponse(undefined)).toBe(false);
      expect(isApiResponse({})).toBe(false);
      expect(isApiResponse('string')).toBe(false);
      expect(isApiResponse(123)).toBe(false);
    });

    it('should return false for objects missing success field', () => {
      const invalidResponse = {
        data: 'test data',
        // Missing success field
      };

      expect(isApiResponse(invalidResponse)).toBe(false);
    });

    it('should return false for objects with wrong success type', () => {
      const invalidResponse = {
        success: 'true', // Should be boolean
        data: 'test data',
      };

      expect(isApiResponse(invalidResponse)).toBe(false);
    });
  });

  describe('isMapPosition', () => {
    it('should return true for valid MapPosition', () => {
      const validPosition: MapPosition = {
        lat: 40.7128,
        lng: -74.0060,
      };

      expect(isMapPosition(validPosition)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isMapPosition(null)).toBe(false);
      expect(isMapPosition(undefined)).toBe(false);
      expect(isMapPosition({})).toBe(false);
      expect(isMapPosition('string')).toBe(false);
      expect(isMapPosition(123)).toBe(false);
    });

    it('should return false for objects missing required fields', () => {
      const invalidPosition = {
        lat: 40.7128,
        // Missing lng
      };

      expect(isMapPosition(invalidPosition)).toBe(false);
    });

    it('should return false for objects with wrong types', () => {
      const invalidPosition = {
        lat: '40.7128', // Should be number
        lng: -74.0060,
      };

      expect(isMapPosition(invalidPosition)).toBe(false);
    });

    it('should return false for objects with non-numeric values', () => {
      const invalidPosition = {
        lat: NaN,
        lng: -74.0060,
      };

      expect(isMapPosition(invalidPosition)).toBe(false);
    });
  });
});

describe('Type Definitions', () => {
  describe('PropertyDetails', () => {
    it('should accept valid property types', () => {
      const property: PropertyDetails = {
        id: '1',
        address: '123 Test St',
        price: '$500,000',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lat: 40.7128,
        lng: -74.0060,
        propertyType: 'CONDO',
        listingStatus: 'FOR_RENT',
      };

      expect(property.propertyType).toBe('CONDO');
      expect(property.listingStatus).toBe('FOR_RENT');
    });

    it('should accept optional fields', () => {
      const property: PropertyDetails = {
        id: '1',
        address: '123 Test St',
        price: '$500,000',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lat: 40.7128,
        lng: -74.0060,
        propertyType: 'SINGLE_FAMILY',
        listingStatus: 'FOR_SALE',
        lotSize: '0.25 acres',
        imageUrl: 'https://example.com/image.jpg',
        images: [
          {
            url: 'https://example.com/image1.jpg',
            alt: 'Front view',
            width: 800,
            height: 600,
          },
        ],
        calculatedScore: 85,
        _score: 90,
      };

      expect(property.lotSize).toBe('0.25 acres');
      expect(property.imageUrl).toBe('https://example.com/image.jpg');
      expect(property.images).toHaveLength(1);
      expect(property.calculatedScore).toBe(85);
      expect(property._score).toBe(90);
    });
  });

  describe('ApiResponse', () => {
    it('should accept generic type parameter', () => {
      const stringResponse: ApiResponse<string> = {
        success: true,
        data: 'test',
      };

      const numberResponse: ApiResponse<number> = {
        success: true,
        data: 123,
      };

      const objectResponse: ApiResponse<{ key: string }> = {
        success: true,
        data: { key: 'value' },
      };

      expect(stringResponse.data).toBe('test');
      expect(numberResponse.data).toBe(123);
      expect(objectResponse.data?.key).toBe('value');
    });

    it('should accept error responses', () => {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Something went wrong',
        message: 'Additional error information',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Something went wrong');
      expect(errorResponse.message).toBe('Additional error information');
    });
  });

  describe('MapPosition', () => {
    it('should accept valid coordinates', () => {
      const position: MapPosition = {
        lat: 40.7128,
        lng: -74.0060,
      };

      expect(position.lat).toBe(40.7128);
      expect(position.lng).toBe(-74.0060);
    });

    it('should accept negative coordinates', () => {
      const position: MapPosition = {
        lat: -40.7128,
        lng: -74.0060,
      };

      expect(position.lat).toBe(-40.7128);
      expect(position.lng).toBe(-74.0060);
    });
  });
});
