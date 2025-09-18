import { http, HttpResponse } from 'msw';

// Mock data
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    budget: { min: 300000, max: 800000 },
    location: 'San Francisco, CA',
    propertyType: 'house',
  },
};

const mockHomes = [
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
];

const mockReports = [
  {
    id: '1',
    homeId: '1',
    title: 'Property Analysis Report',
    content: 'Detailed analysis of property value and market conditions',
    createdAt: '2024-01-15T10:00:00Z',
  },
];

// API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: mockUser,
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      user: mockUser,
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({ user: mockUser });
  }),

  // User preferences
  http.get('/api/preferences', () => {
    return HttpResponse.json({ preferences: mockUser.preferences });
  }),

  http.put('/api/preferences', () => {
    return HttpResponse.json({ success: true });
  }),

  // Search endpoints
  http.get('/api/search/homes', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const location = url.searchParams.get('location');
    
    return HttpResponse.json({
      homes: mockHomes,
      total: mockHomes.length,
      query,
      location,
    });
  }),

  http.get('/api/search/homes/:id', ({ params }) => {
    const home = mockHomes.find(h => h.id === params.id);
    if (!home) {
      return HttpResponse.json(
        { error: 'Home not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ home });
  }),

  // Reports
  http.get('/api/reports', () => {
    return HttpResponse.json({ reports: mockReports });
  }),

  http.post('/api/reports', () => {
    return HttpResponse.json({
      success: true,
      report: {
        id: '2',
        homeId: '2',
        title: 'New Report',
        content: 'Generated report content',
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Dashboard
  http.get('/api/dashboard', () => {
    return HttpResponse.json({
      user: mockUser,
      recentSearches: mockHomes.slice(0, 3),
      savedHomes: mockHomes.slice(0, 2),
      reports: mockReports,
    });
  }),

  // Health check
  http.get('/healthz', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Catch-all handler for unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];

