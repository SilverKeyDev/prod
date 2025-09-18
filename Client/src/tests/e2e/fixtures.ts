import { test as base, expect } from '@playwright/test';

// Test user fixtures
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'password123',
    name: 'New User',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
  },
};

// Mock property data
export const mockProperties = [
  {
    id: '1',
    address: '123 Main St, San Francisco, CA',
    price: 750000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    yearBuilt: 2010,
    description: 'Beautiful family home in prime location',
    images: ['https://example.com/image1.jpg'],
    features: ['garage', 'garden', 'updated kitchen'],
  },
  {
    id: '2',
    address: '456 Oak Ave, San Francisco, CA',
    price: 650000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1200,
    yearBuilt: 2005,
    description: 'Cozy home with modern amenities',
    images: ['https://example.com/image2.jpg'],
    features: ['hardwood floors', 'central air'],
  },
  {
    id: '3',
    address: '789 Pine St, Oakland, CA',
    price: 550000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    yearBuilt: 2015,
    description: 'Modern condo with great views',
    images: ['https://example.com/image3.jpg'],
    features: ['balcony', 'parking', 'gym'],
  },
];

// Mock search results
export const mockSearchResults = {
  sanFrancisco: {
    query: 'San Francisco',
    results: mockProperties.filter(p => p.address.includes('San Francisco')),
    total: 2,
  },
  oakland: {
    query: 'Oakland',
    results: mockProperties.filter(p => p.address.includes('Oakland')),
    total: 1,
  },
};

// Mock user preferences
export const mockPreferences = {
  default: {
    budget: { min: 300000, max: 800000 },
    location: 'San Francisco, CA',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
  },
  luxury: {
    budget: { min: 1000000, max: 5000000 },
    location: 'San Francisco, CA',
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
  },
  budget: {
    budget: { min: 200000, max: 500000 },
    location: 'Oakland, CA',
    propertyType: 'condo',
    bedrooms: 2,
    bathrooms: 1,
  },
};

// Helper functions for common test operations
export const authHelpers = {
  async login(page: any, user = testUsers.validUser) {
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  },

  async register(page: any, user = testUsers.newUser) {
    await page.goto('/signup');
    await page.fill('input[name="name"]', user.name);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.fill('input[name="confirmPassword"]', user.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/(onboarding|dashboard)/);
  },

  async logout(page: any) {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL(/login/);
  },
};

export const searchHelpers = {
  async performSearch(page: any, query: string) {
    await page.goto('/search');
    await page.fill('input[placeholder*="search"]', query);
    await page.press('input[placeholder*="search"]', 'Enter');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  },

  async openPropertyDetails(page: any, propertyIndex = 0) {
    await page.click(`[data-testid="property-card"]:nth-child(${propertyIndex + 1})`);
    await expect(page.locator('[data-testid="property-details-modal"]')).toBeVisible();
  },

  async saveProperty(page: any, propertyIndex = 0) {
    await page.click(`[data-testid="property-card"]:nth-child(${propertyIndex + 1}) [data-testid="save-button"]`);
    await expect(page.locator('[data-testid="saved-indicator"]')).toBeVisible();
  },

  async applyFilters(page: any, filters: any) {
    await page.click('button:has-text("Filters")');
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
    
    if (filters.minPrice) {
      await page.fill('input[name="minPrice"]', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      await page.fill('input[name="maxPrice"]', filters.maxPrice.toString());
    }
    if (filters.bedrooms) {
      await page.selectOption('select[name="bedrooms"]', filters.bedrooms.toString());
    }
    if (filters.bathrooms) {
      await page.selectOption('select[name="bathrooms"]', filters.bathrooms.toString());
    }
    
    await page.click('button:has-text("Apply Filters")');
  },
};

export const navigationHelpers = {
  async navigateToSearch(page: any) {
    await page.goto('/search');
    await expect(page.locator('[data-testid="search-header"]')).toBeVisible();
  },

  async navigateToDashboard(page: any) {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  },

  async navigateToSavedHomes(page: any) {
    await page.goto('/saved-homes');
    await expect(page.locator('[data-testid="saved-homes"]')).toBeVisible();
  },

  async navigateToProfile(page: any) {
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile"]')).toBeVisible();
  },
};

export const responsiveHelpers = {
  async setMobileViewport(page: any) {
    await page.setViewportSize({ width: 375, height: 667 });
  },

  async setTabletViewport(page: any) {
    await page.setViewportSize({ width: 768, height: 1024 });
  },

  async setDesktopViewport(page: any) {
    await page.setViewportSize({ width: 1920, height: 1080 });
  },
};

// Custom test with fixtures
export const test = base.extend({
  // Add any custom fixtures here
  authenticatedPage: async ({ page }, use) => {
    await authHelpers.login(page);
    await use(page);
  },
});

export { expect };

