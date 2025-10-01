# SilverKey Client Tech Stack

This document provides a comprehensive overview of the frontend technology stack used in the SilverKey real estate AI application.

## Architecture Overview

SilverKey Client is a modern React application built with TypeScript, designed for real estate property analysis and AI-powered decision making. The client communicates with backend services through REST APIs.

```text
┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Backend APIs  │
│   (Port 5173)   │    │   (External)    │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Vite Build    │
│   System        │
└─────────────────┘
```

## Frontend Stack

### Core Framework

- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.5.3** - Type-safe JavaScript development
- **Vite 7.1.3** - Fast build tool and development server
- **SWC** - Ultra-fast TypeScript/JavaScript compiler

### State Management & Data Fetching

- **Zustand 5.0.8** - Lightweight state management
- **TanStack Query 5.87.1** - Server state management and caching
- **React Router DOM 6.20.1** - Client-side routing

### UI & Styling

- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.35** - CSS processing
- **Autoprefixer 10.4.18** - CSS vendor prefixing
- **Framer Motion 12.23.12** - Animation library
- **Lucide React 0.344.0** - Icon library

### UI Components & Interactions

- **@dnd-kit** - Drag and drop functionality
  - `@dnd-kit/core` (6.3.1)
  - `@dnd-kit/sortable` (10.0.0)
  - `@dnd-kit/utilities` (3.2.2)
- **React Phone Number Input 3.2.20** - International phone input
- **React Responsive Carousel 3.2.23** - Image carousel component

### Development Tools

- **ESLint 9.9.1** - Code linting with custom configuration
- **Prettier 3.3.3** - Code formatting
- **TypeScript ESLint 8.3.0** - TypeScript-specific linting rules
- **Vitest 3.2.4** - Unit testing framework
- **Playwright 1.55.0** - End-to-end testing
- **Testing Library** - React component testing utilities

### Build Tools & Infrastructure

- **Vite** - Fast build system with HMR
- **Docker** - Containerized deployment
- **Node.js 22+** - Runtime environment

## Testing Strategy

### Frontend Testing

- **Unit Tests** - Vitest with Testing Library
- **E2E Tests** - Playwright across multiple browsers
- **Coverage Reporting** - V8 coverage with HTML reports

### Code Quality

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Security Auditing** - Automated security checks

## Key Features & Capabilities

### Real Estate Features

- Property search and filtering
- Interactive maps integration
- Document upload and processing
- Market analysis and reporting

### User Experience

- Responsive design for all devices
- Touch-friendly mobile interface
- Smooth animations and transitions
- Accessibility compliance

### Security & Performance

- JWT-based authentication
- File type validation and security scanning
- Caching for improved performance
- HTTPS and secure headers

## Development Workflow

### Frontend Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Code linting
npm run format       # Code formatting
```

### Build & Deployment

```bash
docker build .       # Build production container
```

## Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## Performance Targets

- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 3.5s

This tech stack provides a robust, scalable foundation for the SilverKey real estate client application, combining modern web technologies with excellent user experience and performance.
