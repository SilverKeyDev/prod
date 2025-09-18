import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavedHomesData } from '../useSavedHomesData';
import { userApi } from '../../../config/api/user';
import { getAuthToken } from '../../../utils/auth';
import type { SavedHome } from '../../../schemas';

// Mock dependencies
jest.mock('../../../config/api/user', () => ({
  userApi: {
    getFavoriteHomes: jest.fn(),
    addFavoriteHome: jest.fn(),
    removeFavoriteHome: jest.fn(),
  },
}));

jest.mock('../../../utils/auth', () => ({
  getAuthToken: jest.fn(),
}));

jest.mock('../../../config/query/adapters', () => ({
  useFiltersQueryParams: () => ({}),
}));

const mockUserApi = userApi as jest.Mocked<typeof userApi>;
const mockGetAuthToken = getAuthToken as jest.MockedFunction<typeof getAuthToken>;

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSavedHomesData', () => {
  const mockSavedHomes: SavedHome[] = [
    {
      home_id: '1',
      description: 'Beautiful home',
      address: '123 Test St',
      price: '$500,000',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      lot_size: '0.25 acres',
      image_url: 'https://example.com/image.jpg',
      lat: 40.7128,
      lng: -74.0060,
    },
    {
      home_id: '2',
      description: 'Modern condo',
      address: '456 Test Ave',
      price: '$300,000',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 1000,
      lot_size: undefined,
      image_url: undefined,
      lat: 40.7138,
      lng: -74.0070,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthToken.mockReturnValue('mock-token');
  });

  describe('data fetching', () => {
    it('should fetch saved homes successfully', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toEqual(mockSavedHomes);
      expect(result.current.savedHomesError).toBeNull();
      expect(mockUserApi.getFavoriteHomes).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: false,
        error: 'API Error',
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toEqual([]);
      expect(result.current.savedHomesError).toBe('Failed to load favorite homes');
    });

    it('should handle network errors', async () => {
      mockUserApi.getFavoriteHomes.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toEqual([]);
      expect(result.current.savedHomesError).toBe('Network error');
    });

    it('should not fetch when user is not authenticated', () => {
      mockGetAuthToken.mockReturnValue(null);

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.savedHomesLoading).toBe(false);
      expect(mockUserApi.getFavoriteHomes).not.toHaveBeenCalled();
    });
  });

  describe('saveHome', () => {
    it('should save home successfully', async () => {
      const mockProperty = {
        id: '3',
        address: '789 New St',
        price: '$400,000',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2000,
        lat: 40.7148,
        lng: -74.0080,
        propertyType: 'SINGLE_FAMILY' as const,
        listingStatus: 'FOR_SALE' as const,
      };

      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      mockUserApi.addFavoriteHome.mockResolvedValue({
        success: true,
        favorites: [...mockSavedHomes, mockProperty as any],
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await act(async () => {
        await result.current.saveHome(mockProperty);
      });

      expect(mockUserApi.addFavoriteHome).toHaveBeenCalledWith({
        home: mockProperty,
      });
    });

    it('should handle save errors', async () => {
      const mockProperty = {
        id: '3',
        address: '789 New St',
        price: '$400,000',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2000,
        lat: 40.7148,
        lng: -74.0080,
        propertyType: 'SINGLE_FAMILY' as const,
        listingStatus: 'FOR_SALE' as const,
      };

      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      mockUserApi.addFavoriteHome.mockResolvedValue({
        success: false,
        error: 'Save failed',
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.saveHome(mockProperty);
        })
      ).rejects.toThrow('Failed to save home');
    });
  });

  describe('removeSavedHome', () => {
    it('should remove home successfully', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      mockUserApi.removeFavoriteHome.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes.slice(1),
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeSavedHome('1');
      });

      expect(mockUserApi.removeFavoriteHome).toHaveBeenCalledWith({
        address: '123 Test St',
      });
    });

    it('should handle remove errors', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      mockUserApi.removeFavoriteHome.mockResolvedValue({
        success: false,
        error: 'Remove failed',
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.removeSavedHome('1');
        })
      ).rejects.toThrow('Failed to remove home');
    });

    it('should throw error when property not found', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.removeSavedHome('nonexistent');
        })
      ).rejects.toThrow('Property not found');
    });

    it('should throw error when property address is missing', async () => {
      const homesWithoutAddress = [
        {
          ...mockSavedHomes[0],
          address: undefined,
        },
      ];

      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: homesWithoutAddress as any,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.removeSavedHome('1');
        })
      ).rejects.toThrow('Property address not found');
    });
  });

  describe('isHomeSaved', () => {
    it('should return true for saved homes', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.isHomeSaved('1')).toBe(true);
      expect(result.current.isHomeSaved('2')).toBe(true);
    });

    it('should return false for unsaved homes', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.isHomeSaved('3')).toBe(false);
      expect(result.current.isHomeSaved('nonexistent')).toBe(false);
    });
  });

  describe('getSavedHome', () => {
    it('should return saved home by id', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      const home = result.current.getSavedHome('1');
      expect(home).toEqual(mockSavedHomes[0]);
    });

    it('should return undefined for non-existent home', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      const home = result.current.getSavedHome('nonexistent');
      expect(home).toBeUndefined();
    });
  });

  describe('refreshSavedHomes', () => {
    it('should refetch saved homes', async () => {
      mockUserApi.getFavoriteHomes.mockResolvedValue({
        success: true,
        favorites: mockSavedHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSavedHomes();
      });

      expect(mockUserApi.getFavoriteHomes).toHaveBeenCalledTimes(2);
    });
  });
});
