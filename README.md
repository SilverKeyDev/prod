# SilverKey

> AI-powered real estate platform helping homebuyers find, analyze, and purchase their dream homes through intelligent automation and personalized insights.

**Live Application**: https://usesilverkey.com/

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Folder Structure & Purposes](#folder-structure--purposes)
- [Development Setup](#development-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## Overview

SilverKey is a comprehensive full-stack real estate application that combines AI, machine learning, and intelligent automation to guide users through their entire home buying journey—from initial search to closing. The platform features:

- **AI-Powered Home Matching**: Ensemble system combining embeddings, tabular models, and LLM scoring
- **Intelligent Property Reports**: Comprehensive neighborhood and market analysis
- **Smart Negotiation Strategies**: Data-driven offer recommendations
- **Contextual AI Chatbot**: Answers property questions with full report context
- **Personalized User Experience**: Tailored to individual preferences and constraints

---

## Monorepo Structure

SilverKey uses a monorepo architecture with two main components:

```
SilverKey/
├── Client/                    # Frontend application (React + TypeScript)
│   ├── apps/
│   │   └── web/              # Main web application
│   └── packages/             # Shared packages
│       ├── config/           # Configuration & API clients
│       ├── contexts/         # React contexts
│       ├── hooks/            # Custom React hooks
│       ├── schemas/          # TypeScript schemas
│       ├── services/         # Frontend services
│       ├── store/            # Zustand state management
│       ├── styles/           # Global styles & Tailwind
│       └── utils/            # Utility functions
├── Server/                   # Backend application (Flask + Python)
│   └── app/
│       ├── celery/           # Async task queue
│       ├── home_matching/    # AI matching system
│       ├── models/           # SQLAlchemy models
│       ├── routes/           # API endpoints
│       ├── services/         # Business logic
│       └── utils/            # Helper utilities
├── Dockerfile.web            # Multi-stage Docker build
└── run-dev.sh               # Development runner script
```

### How Components Interact

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vite)                      │
│  React Components → Hooks → Services → API → Backend        │
│  State: Zustand + React Query                                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Flask)                           │
│  Routes → Services → Models → Database/S3/External APIs     │
│  Async: Celery Workers                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────┐              ┌───────────────┐
│   PostgreSQL    │              │  External APIs│
│   (Data)        │              │  - OpenAI     │
└─────────────────┘              │  - Perplexity │
         │                       │  - Google     │
         ▼                       │  - Plaid      │
┌─────────────────┐              │  - Zillow     │
│  AWS S3         │              └───────────────┘
│  (PDF Reports)  │                       │
└─────────────────┘                       ▼
         │                       ┌───────────────┐
         └───────────────────────│     Redis     │
                                 │   (Cache)     │
                                 └───────────────┘
```

---

## Technology Stack

### Backend Technologies

#### Core Framework
- **Flask**: Python web framework for REST API
- **Gunicorn**: Production WSGI server
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations

#### AI & Machine Learning
- **OpenAI (GPT-4o)**: LLM for chatbot, report generation, and home scoring
- **Perplexity (Sonar Pro)**: Advanced research and property analysis
- **Sentence Transformers**: Embedding generation for semantic similarity
- **XGBoost/LightGBM**: Tabular machine learning models for home matching
- **NumPy/Pandas**: Data processing
- **Torch**: Deep learning framework

#### Data Storage
- **PostgreSQL**: Primary relational database (AWS RDS or local)
- **AWS S3**: Object storage for PDF reports and documents
- **Redis**: Caching layer and Celery message broker

#### Authentication & Authorization
- **AWS Cognito**: Primary authentication service (email/password)
- **Google OAuth**: Social authentication and calendar integration
- **JWT Tokens**: Stateless authentication (RS256 for Cognito, HS256 for custom tokens)

#### Task Queue & Background Jobs
- **Celery**: Distributed task queue for async operations
- **Redis**: Message broker for Celery

#### External Integrations
- **Google Maps API**: Location; services, geocoding, and mapping
- **Google Calendar API**: Schedule management and appointment tracking
- **Plaid API**: Financial verification and asset reports
- **Zillow API (via RapidAPI)**: Property listings and search
- **ReportLab**: PDF generation
- **Boto3**: AWS SDK for S3 operations

### Frontend Technologies

#### Core Framework
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server (fast HMR)
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

#### State Management
- **Zustand**: Global client-side state
- **TanStack React Query**: Server state, caching, and sync
- **React Context**: App-level providers (theme, localization, services)

#### Routing & Navigation
- **React Router v7**: Client-side routing
- **React Router Guards**: Route protection

#### UI & UX
- **Framer Motion**: Animations
- **Lucide React**: Icon library
- **dnd-kit**: Drag and drop
- **react-plaid-link**: Plaid integration UI
- **react-responsive-carousel**: Image carousel

#### Services & API
- **Custom HTTP Client**: Axios-based with interceptors
- **Service Layer Pattern**: Abstraction for API calls
- **React Query Integration**: Automatic caching and refetching

---

## Architecture

### Request Flow

1. **User Interaction**: React component triggers action
2. **Hook**: Custom hook (e.g., `useReports`) handles the request
3. **Service**: Service layer (`reports.ts`) formats the API call
4. **API Config**: API configuration (`config/api/*.ts`) defines endpoints
5. **HTTP Client**: HTTP client (`http.ts`) makes the request with auth headers
6. **Backend Route**: Flask route handler receives request
7. **Authentication**: JWT verification via `get_current_user()`
8. **Service Layer**: Business logic in `app/services/`
9. **Model/Database**: SQLAlchemy models interact with PostgreSQL
10. **External APIs**: Calls to OpenAI, S3, Google, etc.
11. **Response**: JSON response sent back to frontend
12. **React Query**: Automatic caching and state updates
13. **Re-render**: Component updates with new data

### State Management Strategy

#### Zustand (Client State)
Use for data that changes during a session and doesn't need to persist:
- `auth.slice.ts`: Authentication status, user profile
- `ui.slice.ts`: UI state (modals, toasts, sidebars)
- `view.slice.ts`: Current view settings
- `filters.slice.ts`: Search filters
- `session.slice.ts`: Session data

```typescript
// Example: auth.slice.ts
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null, isAuthenticated: false })
}));
```

#### React Query (Server State)
Use for data that comes from the server and should be cached:
- User preferences
- Property reports
- Chat history
- Saved homes
- Search results

```typescript
// Example: useReports hook
export function useReports() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsService.getAll()
  });
  return { reports: data, isLoading, refetch };
}
```

#### Services Layer Pattern
Services abstract API calls and provide a clean interface:
- `services/reports.ts`: Report operations
- `services/chats.ts`: Chat operations
- `services/auth.ts`: Authentication
- `services/documents.ts`: Document management

```typescript
// Example: reports service
export class ReportsService {
  async generate(address: string) {
    return api.post('/api/v1/report/generate', { address });
  }
  
  async getAll() {
    return api.get('/api/v1/report/list');
  }
}
```

#### Contexts (Application-wide)
React contexts provide shared state across the component tree:
- `ThemeContext.tsx`: Theme (light/dark) management
- `LocalizationContext.tsx`: i18n support
- `ServiceContext.tsx`: Service injection (testing)

#### Hooks (Composable Logic)
Custom hooks encapsulate reusable logic:
- **Data Hooks** (`hooks/data/`): Server state queries
- **Store Hooks** (`hooks/store/`): Zustand access
- **UI Hooks** (`hooks/ui/`): UI interactions (modals, toasts)

---

## Key Features

### 1. AI-Powered Home Matching

The platform uses an ensemble approach combining three scoring methods:

**Location**: `Server/app/home_matching/ensemble/blend_scores.py`

```python
class EnsembleScorer:
    def __init__(self):
        self.embedding_scorer = EmbeddingScorer()    # Semantic similarity
        self.tabular_predictor = TabularPredictor()  # ML model
        self.llm_scorer = LLMScorer()                # GPT-4 evaluation
        
    def blend_scores(self, embedding, tabular, llm):
        # Weighted average: 40% embedding, 40% tabular, 20% LLM
        return 0.4*embedding + 0.4*tabular + 0.2*llm
```

**Components**:
- `embeddings/`: Sentence transformer encoding
- `tabular_model/`: XGBoost/LightGBM trained on user-home pairs
- `llm_scorer/`: GPT-4o scoring with explanations

### 2. Intelligent Property Reports

**Location**: `Server/app/services/reportgen/`

Generates comprehensive PDF reports with:
- Neighborhood analysis
- Market trends
- School ratings
- Crime statistics
- Lifestyle DNA (AI-generated neighborhood personality)
- Property comparison (duel reports)

Uses **Perplexity Sonar Pro** for real-time data gathering and **ReportLab** for PDF generation.

### 3. AI Chatbot

**Location**: `Server/app/routes/chatbot.py`, `Server/app/services/chatbot/`

Context-aware chatbot powered by GPT-4o that:
- Answers questions about specific properties
- References full report data
- Considers user preferences
- Provides personalized recommendations

### 4. Negotiation Strategies

**Location**: `Server/app/routes/offer.py`, `Server/app/services/standardgen/`

AI-generated negotiation strategies including:
- Comp-based offer rationale
- Seller pain point leverage
- Holding cost analysis
- Repair tolerance guidance
- Actionable urgency strategies

### 5. Personalized Onboarding

**Location**: `Client/apps/web/features/onboardpersonalize/`

Multi-step onboarding collects:
- Demographics (age, occupation, pets)
- Financial profile (income, credit, budget)
- Housing preferences (bedrooms, bathrooms, style)
- Location preferences (commute tolerance, walkability)
- Deal breakers
- Report customization

---

## Folder Structure & Purposes

### Client/ (Frontend)

#### `apps/web/`
Main web application entry point.

- **`app/`**: Core application setup
  - `App.tsx`: Root component
  - `guards/`: Route protection logic
  - `layouts/`: Layout components (headers, sidebars)
  - `providers/`: Context providers
  - `routes/`: Route definitions and config
- **`components/`**: Reusable UI components
  - `auth/`: Authentication UI
  - `cards/`: Card layouts
  - `feedback/`: Toasts, modals, alerts
  - `layout/`: Header, sidebar, navigation
  - `ui/`: Form inputs, buttons, basic UI
- **`features/`**: Feature-specific code
  - `onboardpersonalize/`: Onboarding flow
  - `search/`: Property search
  - `dashboard/`: Dashboard
  - `negotiate/`: Negotiation tools
  - `close/`: Checklists
  - `decide/`: Report comparison
- **`pages/`**: Page-level components

#### `packages/` (Shared Code)
Reusable code across applications.

- **`config/`**: Configuration
  - `api/`: API endpoint definitions (one per domain)
  - `auth.ts`: Auth configuration
  - `env.ts`: Environment variables
  - `http.ts`: HTTP client with interceptors
  - `query/`: React Query config
  
- **`contexts/`**: React contexts
  - `ThemeContext.tsx`: Theme management
  - `LocalizationContext.tsx`: i18n
  - `ServiceContext.tsx`: Dependency injection

- **`hooks/`**: Custom React hooks
  - `data/`: Server state hooks (useUserData, useReports)
  - `store/`: Zustand store access hooks
  - `ui/`: UI hooks (useModal, useToast)

- **`schemas/`**: TypeScript type definitions
  - Domain-specific types (user, property, reports, etc.)

- **`services/`**: Frontend services
  - Business logic for API calls
  - Abstraction layer between components and API
  - `http/`: HTTP utilities

- **`store/`**: Zustand stores
  - Global state slices (auth, ui, filters)
  - `middleware/`: Custom middleware

- **`styles/`**: Global styles
  - Tailwind utilities
  - Custom CSS
  - Animations

- **`utils/`**: Utility functions
  - Address formatting
  - Currency formatting
  - Error handling
  - Type guards

### Server/ (Backend)

#### `app/`

- **`celery/`**: Async task queue
  - `celery_worker.py`: Celery configuration
  - `tasks.py`: Background tasks (report generation)
  
- **`home_matching/`**: AI matching system
  - `ensemble/`: Ensemble scoring logic
  - `embeddings/`: User and home encoders
  - `tabular_model/`: ML model training and prediction
  - `llm_scorer/`: GPT-4 scoring
  - `config/`: Configuration
  - `utils/`: Feature engineering and preprocessing

- **`models/`**: SQLAlchemy database models
  - `user.py`: User accounts
  - `user_preferences.py`: Onboarding data
  - `pdf_document.py`: Report metadata
  - `home_universal.py`: Favorited properties
  - `chat_history.py`: Chatbot messages
  - `subscription.py`: Billing
  - `plaid.py`: Financial data
  - `report_models.py`: Report schema definitions
  - `offer_models.py`: Negotiation strategy schemas

- **`routes/`**: Flask Blueprint route handlers
  - `auth.py`: Authentication endpoints
  - `report.py`: Report generation
  - `search.py`: Property search
  - `home_matching.py`: AI matching
  - `chatbot.py`: Chat endpoints
  - `offer.py`: Negotiation strategies
  - `preferences.py`: User preferences
  - `user.py`: User management
  - `google_calendar.py`: Calendar integration
  - `plaid.py`: Financial integration
  - `maps.py`: Google Maps integration
  - `secure_upload.py`: Document upload

- **`services/`**: Business logic
  - `reportgen/`: Report generation orchestration
  - `standardgen/`: Standard report sections
  - `chatbot/`: Chatbot logic
  - `s3_service.py`: AWS S3 operations
  - `auth.py`: Cognito integration
  - `google_oauth_service.py`: Google OAuth
  - `google_calendar_service.py`: Calendar operations
  - `plaid_client.py`: Plaid integration
  - `search_help.py`: Property search utilities
  - `minimal_token.py`: Custom JWT tokens

- **`utils/`**: Helper utilities
  - `auth.py`: Authentication helpers
  - `app_logging.py`: Logging configuration
  - `common_patterns.py`: Reusable decorators and patterns
  - `db_reliability.py`: Database connection handling
  - `env_validator.py`: Environment validation
  - `secure_errors.py`: Error handling

- **`config.py`**: Application configuration
- **`extensions.py`**: Flask extensions (db, ma, etc.)
- **`__init__.py`**: Flask app factory

#### `migrations/`
Alembic database migrations (35+ versions tracking schema evolution).

---

## Development Setup

### Prerequisites

- **Node.js**: v20.19.0+ or v22.12.0+
- **pnpm**: v9.0.0 (package manager)
- **Python**: 3.11+
- **PostgreSQL**: 12+
- **Redis**: 6+ (for Celery and caching)

### Environment Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd SilverKey
```

2. **Backend Setup**:
```bash
cd Server
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**:
```bash
cd Client
pnpm install
```

4. **Environment Variables**:
Create `Server/.env` with required credentials:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/silverkey

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-2
S3_BUCKET_NAME_PDFS=your-bucket

# Cognito
AWS_COGNITO_USER_POOL_ID=us-east-2_xxxx
AWS_COGNITO_CLIENT_ID=your_client_id
AWS_COGNITO_CLIENT_SECRET=your_secret

# Google
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_SECRET=your_secret
GOOGLE_MAPS_API_KEY=your_key

# AI Services
OPENAI_KEY=sk-...
PERPLEXITY_API_KEY=...

# Other APIs
RAPIDAPI_KEY=your_key  # Zillow
PLAID_SANDBOX_KEY=your_key
PLAID_SECRET=your_secret
```

5. **Database Setup**:
```bash
cd Server
flask db upgrade  # Run migrations
```

6. **Start Development Servers**:
```bash
# From project root
./run-dev.sh
```

This starts:
- **Flask backend** on `http://localhost:5000`
- **Vite frontend** on `http://localhost:5173`
- **Celery worker** for background tasks
- **Redis** for caching and message queue

### Development Workflow

- **Frontend**: Hot module replacement (HMR) enabled
- **Backend**: Auto-reload on file changes
- **TypeScript**: Continuous type checking in background
- **Database**: Migrations applied automatically

---

## CI/CD Pipeline

### Overview

SilverKey uses **GitHub Actions** for continuous integration and deployment to **AWS EC2**.

**Location**: `.github/workflows/ci_web.yml`

### Pipeline Stages

1. **Trigger**: Push to `main` branch or manual dispatch
2. **Environment Loading**: Load secrets from AWS Secrets Manager
3. **Docker Build**:
   - Multi-stage build (frontend + backend)
   - Build arguments for environment variables
   - Push to AWS ECR (Elastic Container Registry)
   - Image caching for faster builds
4. **EC2 Deployment**:
   - SSH into EC2 instance
   - Pull latest Docker image
   - Start containers with proper environment
   - Deploy frontend static files to `/var/www/html`
   - Health checks
5. **Cleanup**: Prune Docker resources

### Deployment Architecture

```
GitHub Actions → AWS ECR → EC2 Instance
                           ├── cre_app (Flask)
                           ├── cre_worker (Celery)
                           └── redis
```

### AWS Services Used

- **ECR**: Docker image registry
- **Secrets Manager**: Environment variables storage
- **EC2**: Application hosting
- **RDS**: Managed PostgreSQL database
- **S3**: File storage

### Docker Build Process

The `Dockerfile.web` uses a multi-stage build:

1. **Stage 1 (Frontend)**:
   - Install Node.js and pnpm
   - Copy client code
   - Install dependencies
   - Build Vite bundle
   - Output: Optimized production bundle

2. **Stage 2 (Backend)**:
   - Install Python and system dependencies
   - Install Python packages
   - Copy server code
   - Copy built frontend from Stage 1
   - Expose port 5000
   - Run Gunicorn with 4 workers

### Key Features

- **Zero-downtime deployment**: Graceful container restart
- **Rolling updates**: New containers start before old ones stop
- **Health checks**: Automatic container restarts on failure
- **Logging**: Centralized Docker logging
- **Resource management**: Automatic cleanup of old containers

---

## API Documentation

### Base URL
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://usesilverkey.com/api/v1`

### Authentication

Most endpoints require authentication via JWT tokens in cookies or Authorization header:

```http
Cookie: session=<jwt_token>
# OR
Authorization: Bearer <jwt_token>
```

### Key Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /signup` - Create account
- `POST /login` - Sign in
- `POST /logout` - Sign out
- `GET /me` - Get current user

#### Reports (`/api/v1/report`)
- `POST /generate` - Generate property report (async)
- `GET /list` - List user's reports
- `GET /view/<report_id>` - View report PDF

#### Search (`/api/v1/search`)
- `POST /properties-by-polygon` - Search properties by area
- `GET /property` - Get property details
- `GET /propertyComps` - Get comparable properties

#### Home Matching (`/api/home-matching`)
- `POST /find-matches` - Find best matches (async)
- `GET /task-status/<task_id>` - Check match status

#### Negotiation (`/api/v1/offer`)
- `POST /generate-strategy` - Generate negotiation strategy

#### Chatbot (`/api/v1/chat`)
- `POST /address/<report_id>` - Send message
- `GET /history/<report_id>` - Get chat history

---

## Contributing

### Code Style

- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: ESLint + Prettier configuration
- **TypeScript**: Strict mode enabled

### Git Workflow

1. Create a feature branch from `main`
2. Make changes with clear commit messages
3. Run tests and linting
4. Submit pull request for review

### Running Tests

```bash
# Frontend
cd Client
pnpm test

# Backend
cd Server
pytest
```

---

## License

Copyright © 2024 SilverKey. All rights reserved.

---

## Support

For questions or issues, please contact the development team or open an issue in the repository.

