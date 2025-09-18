# SilverKey Client - Source Directory Structure

This document outlines the main source directories within `/src/` of the
SilverKey React client application.

## Directory Overview

```
src/
├── app/                   # Application core and infrastructure
├── components/            # Reusable UI components
├── core/                  # Foundational code and utilities
├── features/             # Feature-specific components and logic
└── pages/                # Top-level page components
```

## `/src/app/` - Application Core

The application infrastructure and foundational elements:

```
app/
├── App.tsx               # Main application component
├── error/                # Error handling and boundaries
├── guards/               # Authentication and authorization guards
├── layouts/              # Page layout components
├── providers/            # Context providers and global state
├── routes/               # Route definitions and configuration
└── routes.tsx            # Main routing setup
```

**Purpose**: Contains the core application setup, routing, error handling,
authentication guards, and global providers. This is the foundation layer that
everything else builds upon.

## `/src/core/` - Foundational Code

The foundational code that powers the rest of the application:

```
core/
├── config/               # Application and runtime configuration
├── contexts/             # Global React state providers
├── hooks/                # Reusable stateful logic
├── schemas/              # Data validation and contracts
├── services/             # API and business logic layer
├── styles/               # Global design system and CSS
└── utils/                # Pure helper functions
```

**Purpose**: Contains foundational code including configuration, data contracts,
service layers, shared state, and utilities. This is the spine of the
application that provides core functionality to all other layers.

### Core Directory Responsibilities

**`/core/config/`** - Application configuration (no React dependencies)

- API client setup and interceptors
- Feature flags and environment variables
- Route definitions and constants
- Logging configuration

**`/core/services/`** - Business logic and API calls (no React dependencies)

- API service functions
- Data fetching and mutation logic
- Business rule implementations
- External service integrations

**`/core/hooks/`** - React hooks for stateful logic

- Custom hooks wrapping services
- React Query integration
- Component lifecycle management
- State management hooks

**`/core/contexts/`** - Global React state providers

- Authentication context
- Theme and UI state
- User preferences
- Application-wide shared state

**`/core/schemas/`** - Data validation and contracts (no React dependencies)

- TypeScript interfaces and types
- Data validation schemas
- API response contracts
- Form validation rules

**`/core/styles/`** - Global design system (no React dependencies)

- CSS variables and design tokens
- Global stylesheets
- Theme definitions
- Typography and spacing systems

**`/core/utils/`** - Pure helper functions (no React dependencies)

- Data formatting utilities
- Date and time helpers
- String manipulation functions
- Mathematical calculations

### Dependency Flow

```
utils ─────┐
schemas ───┼──▶ services ──▶ hooks ──▶ contexts ──▶ components/pages
config ────┘ styles ─────▶ components/pages
```

## `/src/components/` - Reusable UI Components

Shared, reusable components organized by category:

```
components/
├── cards/                # Card-based display components
├── feedback/             # User feedback components (toasts, alerts)
├── layout/               # Layout and structural components
├── modals/               # Modal dialog components
├── security/             # Security-related UI components
├── ui/                   # Base UI elements (buttons, inputs, etc.)
└── widgets/              # Complex composite components
```

**Purpose**: Houses all reusable UI components that can be used across multiple
features and pages. These are generic, feature-agnostic components focused on
presentation and user interaction.

## `/src/features/` - Feature-Specific Logic

Feature modules containing business logic and specialized components:

```
features/
├── close/                # Closing/transaction completion features
├── dashboard/            # Dashboard-specific components
├── decide/               # Decision-making tools and reports
├── homeauth/             # Home authentication and verification
├── negotiate/            # Negotiation and offer management
├── onboardpersonalize/   # User onboarding and personalization
└── search/               # Property search functionality
```

**Purpose**: Contains feature-specific business logic, specialized components,
and domain-specific functionality. Each feature directory encapsulates
everything related to that particular business capability.

## `/src/pages/` - Top-Level Pages

Page-level components that represent full application screens:

```
pages/
├── Close/                # Closing process pages
├── Dashboard.tsx         # Main dashboard page
├── Decide/               # Decision and report pages
├── HomeAuth/             # Authentication flow pages
├── Negotiate/            # Negotiation workflow pages
├── Onboard/              # Onboarding process pages
└── Search/               # Property search pages
```

**Purpose**: Contains the top-level page components that are directly mapped to
routes. These pages compose features and components to create complete user
experiences.

## Architecture Pattern

The source structure follows a **layered architecture**:

1. **`/app/`** - Infrastructure layer (routing, providers, guards)
2. **`/components/`** - Presentation layer (reusable UI components)
3. **`/features/`** - Business logic layer (domain-specific functionality)
4. **`/pages/`** - Application layer (user-facing screens)

This separation ensures:

- **Reusability**: Components can be shared across features
- **Maintainability**: Business logic is isolated in feature modules
- **Scalability**: New features can be added without affecting existing code
- **Testability**: Each layer can be tested independently
