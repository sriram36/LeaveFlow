# LeaveFlow Architecture

LeaveFlow is built on a modern, asynchronous stack designed for performance, security, and multi-channel user experience.

## High-Level Architecture

```mermaid
graph TD
    %% Entities
    User[Employee / Manager]
    Admin[Administrator]
  
    %% Frontend
    subgraph Frontend [Dashboard - Next.js]
        UI[React UI Components]
        State[React Query Cache]
        Auth[Auth Context]
    end
  
    %% Backend
    subgraph Backend [API - FastAPI]
        Router[API Routers]
        Service[Business Logic Services]
        WS[WebSocket Manager]
        Security[Auth & Security Middleware]
    end
  
    %% External Services
    subgraph External [External Integrations]
        WhatsApp[WhatsApp Cloud API]
    end
  
    %% Data Store
    subgraph DataStore [Database]
        Postgres[(PostgreSQL)]
    end

    %% Connections
    User -- HTTPs/WSS --> Frontend
    Admin -- HTTPs/WSS --> Frontend
    User -- WhatsApp Messages --> WhatsApp
  
    %% Frontend to Backend
    Frontend -- HTTP GET/POST (JWT Cookies) --> Router
    Frontend -- WebSocket (JWT Auth) --> WS
  
    %% Backend Internal
    Router --> Security
    Router --> Service
    Security --> Service
    Service --> WS
  
    %% Backend to External
    Service -- Send Messages (HTTP) --> WhatsApp
    WhatsApp -- Webhook Events (HTTP) --> Router
  
    %% Backend to Database
    Service -- Async SQLAlchemy --> Postgres
    Security -- Read Users --> Postgres
```

## Tech Stack Details

### Frontend (Dashboard)

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query (Server state), Context API (Local/Auth state)
- **Authentication**: HTTP-Only Cookies

### Backend (API)

- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0 (Async)
- **Database Driver**: asyncpg
- **Security**: PyJWT (v2.13+), Passlib/Bcrypt, slowapi (Rate Limiting)
- **Real-time**: WebSockets (Broadcasting via custom connection manager)

### Database

- **Engine**: PostgreSQL 15+
- **Migrations**: Alembic

### External Integrations

- **WhatsApp Cloud API**: Bidirectional messaging and webhooks for natural language leave requests.
- **OpenRouter (LLM)**: Natural language processing for parsing WhatsApp messages and webhook intents.
