import { test, expect } from '@playwright/test';

test.describe('SilverKey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/SilverKey/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle user authentication flow', async ({ page }) => {
    // Test login flow
    await page.click('text=Login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Check if redirected to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should handle user registration flow', async ({ page }) => {
    // Test registration flow
    await page.click('text=Sign Up');
    
    // Fill in registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit registration form
    await page.click('button[type="submit"]');
    
    // Check if redirected to onboarding or dashboard
    await expect(page).toHaveURL(/(onboarding|dashboard)/);
  });

  test('should handle property search flow', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Wait for search page to load
    await expect(page.locator('[data-testid="search-header"]')).toBeVisible();
    
    // Perform search
    await page.fill('input[placeholder*="search"]', 'San Francisco');
    await page.press('input[placeholder*="search"]', 'Enter');
    
    // Wait for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Check if properties are displayed
    await expect(page.locator('[data-testid="property-card"]')).toHaveCount.greaterThan(0);
  });

  test('should handle property details modal', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Wait for search results
    await page.fill('input[placeholder*="search"]', 'San Francisco');
    await page.press('input[placeholder*="search"]', 'Enter');
    
    await expect(page.locator('[data-testid="property-card"]')).toBeVisible();
    
    // Click on first property
    await page.click('[data-testid="property-card"]:first-child');
    
    // Check if property details modal opens
    await expect(page.locator('[data-testid="property-details-modal"]')).toBeVisible();
    
    // Check modal content
    await expect(page.locator('[data-testid="property-details-modal"]')).toContainText('Price');
    await expect(page.locator('[data-testid="property-details-modal"]')).toContainText('Bedrooms');
    await expect(page.locator('[data-testid="property-details-modal"]')).toContainText('Bathrooms');
  });

  test('should handle map interactions', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Wait for map to load
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Test map controls
    await page.click('[data-testid="zoom-in-button"]');
    await page.click('[data-testid="zoom-out-button"]');
    
    // Test map click
    await page.click('[data-testid="map-container"]', { position: { x: 400, y: 300 } });
  });

  test('should handle filters', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Wait for filters panel
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
    
    // Set price range
    await page.fill('input[name="minPrice"]', '300000');
    await page.fill('input[name="maxPrice"]', '800000');
    
    // Set bedrooms
    await page.selectOption('select[name="bedrooms"]', '3');
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    
    // Check if filters are applied
    await expect(page.locator('[data-testid="applied-filters"]')).toBeVisible();
  });

  test('should handle saved homes', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Perform search
    await page.fill('input[placeholder*="search"]', 'San Francisco');
    await page.press('input[placeholder*="search"]', 'Enter');
    
    // Wait for search results
    await expect(page.locator('[data-testid="property-card"]')).toBeVisible();
    
    // Save a home
    await page.click('[data-testid="property-card"]:first-child [data-testid="save-button"]');
    
    // Check if home is saved
    await expect(page.locator('[data-testid="saved-indicator"]')).toBeVisible();
    
    // Navigate to saved homes
    await page.click('text=Saved Homes');
    
    // Check if saved home appears
    await expect(page.locator('[data-testid="saved-homes-list"]')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to search page
    await page.goto('/search');
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check tablet-specific layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page');
    
    // Check for 404 page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    
    // Test error boundary
    await page.goto('/search');
    
    // Simulate network error by going offline
    await page.context().setOffline(true);
    
    // Try to perform search
    await page.fill('input[placeholder*="search"]', 'San Francisco');
    await page.press('input[placeholder*="search"]', 'Enter');
    
    // Check for error message
    await expect(page.locator('text=Network error')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should handle accessibility', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper form labels
    await expect(page.locator('input[placeholder*="search"]')).toHaveAttribute('aria-label');
    
    // Check for proper button labels
    await expect(page.locator('button:has-text("Filters")')).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Check if focus is properly managed
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle performance', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/search');
    
    // Measure page load time
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    
    // Check if page loads within acceptable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Test search performance
    const startTime = Date.now();
    await page.fill('input[placeholder*="search"]', 'San Francisco');
    await page.press('input[placeholder*="search"]', 'Enter');
    
    // Wait for results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    const searchTime = Date.now() - startTime;
    
    // Check if search completes within acceptable time (3 seconds)
    expect(searchTime).toBeLessThan(3000);
  });
});

