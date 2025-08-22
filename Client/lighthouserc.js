module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/reports',
        'http://localhost:5173/search',
        'http://localhost:5173/onboarding',
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:',
      numberOfRuns: 3,
      settings: {
        // Mobile-first testing
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        // Test multiple form factors
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        // Performance budgets for mobile
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals - Mobile thresholds
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:total-blocking-time': ['error', { maxNumericValue: 200 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'metrics:speed-index': ['error', { maxNumericValue: 3400 }],
        
        // Mobile-specific audits
        'audits:viewport': 'error',
        'audits:tap-targets': 'error',
        'audits:content-width': 'error',
        'audits:font-size': 'error',
        
        // Accessibility audits
        'audits:color-contrast': 'error',
        'audits:focus-traps': 'error',
        'audits:focusable-controls': 'error',
        'audits:interactive-element-affordance': 'error',
        'audits:logical-tab-order': 'error',
        
        // Performance audits
        'audits:unused-css-rules': ['warn', { maxLength: 2 }],
        'audits:unused-javascript': ['warn', { maxLength: 2 }],
        'audits:modern-image-formats': 'warn',
        'audits:uses-responsive-images': 'warn',
        'audits:efficient-animated-content': 'warn',
        
        // PWA audits
        'audits:service-worker': 'off', // Not implemented yet
        'audits:installable-manifest': 'off', // Not implemented yet
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
