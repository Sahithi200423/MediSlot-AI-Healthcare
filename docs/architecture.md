# 🏗️ MediSlot System Architecture & Design Specification

> **MediSlot — AI-Powered Smart Clinic Booking & Healthcare Management Platform**

This document provides a comprehensive technical breakdown of the MediSlot system architecture, service communication protocols, security layers, and data flow.

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientTier ["1. Presentation Layer (Cloudflare Pages)"]
        Browser["User Browser / Client Device"]
        ReactApp["React 19 + TypeScript + Vite<br/>• Tailwind CSS & Framer Motion<br/>• React Router v7 (Protected Routes)<br/>• TanStack Query v5"]
        Browser <-->|"HTTPS / DOM Events"| ReactApp
    end

    subgraph SecurityGateway ["2. Security & Request Gateway"]
        Proxy["Render Load Balancer (Reverse Proxy)<br/>app.set('trust proxy', 1)"]
        ReqId["Request Correlation Middleware<br/>(RFC 4122 UUID v4 / Sanitization)"]
        RateLimit["Rate Limiting Layer (express-rate-limit)<br/>• Login: 5 failed / 15 min<br/>• Register: 3 attempts / 1 hr"]
        CorsLayer["CORS & Header Exposure<br/>(Exposes X-Request-Id)"]
        AuthMid["Authentication & RBAC Middleware<br/>• JWT Bearer Validation<br/>• Role Verification (requireRole)"]
        
        Proxy --> ReqId
        ReqId --> RateLimit
        RateLimit --> CorsLayer
        CorsLayer --> AuthMid
    end

    subgraph BackendCore ["3. Core Application Tier (Render Web Service)"]
        ExpressApp["Express.js / TypeScript API Server<br/>(Node.js v22/24)"]
        MorganLog["Morgan Logger [:req-id]"]
        AuthMid --> ExpressApp
        ExpressApp --> MorganLog
        
        subgraph Subrouters ["API Subrouters"]
            RHealth["/api/health (Exempt from limiters)"]
            RAuth["/api/auth (Login & Registration)"]
            RAppt["/api/appointments (Booking Engine)"]
            RDoctors["/api/doctors (Directory & Filters)"]
            RClinics["/api/clinics (Tenant Management)"]
            RMedical["/api/medical (Records & Vault)"]
            RAdmin["/api/admin (Platform Metrics)"]
            RAiRouter["/api/ai (Decision Support)"]
        end

        ExpressApp --> Subrouters
    end

    subgraph PersistenceTier ["4. Persistence & Database Tier"]
        PrismaClient["Prisma ORM Client v6.19.3"]
        PostgresDB[("Supabase PostgreSQL Database<br/>• 19 Relational Models & 7 Enums<br/>• ACID Transactions & Relational Integrity")]
        StorageBucket[("Supabase Private Storage<br/>(Bucket: medical-records)")]
        
        Subrouters -->|"Type-Safe Queries"| PrismaClient
        PrismaClient --> PostgresDB
        RMedical -->|"Pre-Signed URLs"| StorageBucket
    end

    subgraph AiMicroservice ["5. AI Decision Support Tier (Render Web Service)"]
        FastAPIApp["Python FastAPI Microservice<br/>(Uvicorn ASGI Engine)"]
        MemoryBuffer["Stateless Memory Buffers<br/>(BytesIO - Zero Disk Writes)"]
        AiModelRouter["Clinical Copilot & Patient Explainer<br/>(Physician-Supervised Decision Support)"]
        
        RAiRouter <-->|"Mutual Secret (X-AI-Service-Secret)"| FastAPIApp
        FastAPIApp --> MemoryBuffer
        FastAPIApp --> AiModelRouter
    end

    ReactApp <-->|"JSON over HTTPS / Bearer JWT / X-Request-Id"| Proxy
```

---

## 2. Service Separation & Responsibilities

MediSlot adopts a modular, microservice-supported architecture designed for security, scalability, and clinical safety:

### A. Presentation Tier (React 19 + TypeScript)
* **Hosted on:** Cloudflare Pages (Edge CDN).
* **Role:** Single Page Application (SPA) delivering client-side routing, state management, and responsive UI components across desktop, tablet, and mobile viewports.
* **Security:** Employs client-side route guards (`ProtectedRoute.tsx`) that inspect the authenticated user's role before rendering views. Frontend state never replaces backend validation.

### B. Core Application Tier (Express.js + TypeScript)
* **Hosted on:** Render Web Service (Node.js).
* **Role:** Central API gateway and business logic coordinator. Enforces business validation using Zod schemas, manages user sessions, and orchestrates database transactions.
* **Security:**
  * **Reverse Proxy Trust:** Configured with `app.set("trust proxy", 1)` so that Express correctly evaluates client remote IPs from Render's `X-Forwarded-For` header.
  * **Request Tracing:** Intercepts every incoming request with `requestIdMiddleware` to ensure a consistent RFC 4122 UUID v4 correlation token (`X-Request-Id`) across console logs and client responses.
  * **Rate Limiting:** Protects `/api/auth/login` and `/api/auth/register` from brute-force dictionary attacks and bot registrations.

### C. Data & Persistence Tier (PostgreSQL + Prisma)
* **Hosted on:** Supabase PostgreSQL.
* **Role:** Relational data store enforcing data integrity, foreign key relations, and transactional concurrency control for appointment scheduling.
* **ORM:** Prisma Client v6.19.3 provides full type safety between TypeScript models and SQL tables.

### D. AI Decision Support Tier (Python FastAPI)
* **Hosted on:** Render Web Service (Python/Uvicorn).
* **Role:** Dedicated microservice for compute-intensive natural language processing, consultation draft generation, and medical report summarization.
* **Mutual Authentication:** Completely private from public web traffic. Rejects any incoming request lacking a valid `X-AI-Service-Secret` header matching the backend's internal environment configuration.
* **Stateless Processing:** Processes patient documents in transient memory buffers (`BytesIO`). Zero patient health information is persisted to disk on the AI tier.

---

## 3. Role-Based Access Control (RBAC) Matrix

MediSlot categorizes users into four mutually exclusive operational roles:

| Endpoint Subrouter | Public | `PATIENT` | `DOCTOR` | `CLINIC_ADMIN` | `PLATFORM_ADMIN` |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/health` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `GET /api/doctors` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `GET /api/clinics` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `POST /api/auth/login` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `POST /api/auth/register` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `GET /api/auth/me` | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `POST /api/appointments` | ❌ 401 | ✅ Book own | ❌ 403 | ❌ 403 | ✅ Allowed |
| `GET /api/appointments/my` | ❌ 401 | ✅ Own appts | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /api/appointments/doctor/:id` | ❌ 401 | ❌ 403 | ✅ Own queue | ❌ 403 | ✅ Allowed |
| `GET /api/appointments/clinic/:id` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Own clinic | ✅ Allowed |
| `GET /api/admin/stats` | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ Allowed |
| `POST /api/ai/copilot/*` | ❌ 401 | ❌ 403 | ✅ Allowed | ❌ 403 | ✅ Allowed |
| `POST /api/ai/patient/*` | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

---

## 4. End-to-End Request & Response Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient Browser
    participant Cloudflare as Cloudflare Pages (Frontend)
    participant Gateway as Express Gateway (Port 5000)
    participant Auth as Auth & RBAC Middleware
    participant Database as PostgreSQL (Prisma)
    participant AIService as FastAPI AI Microservice

    User->>Cloudflare: 1. Navigate to /login or book appointment
    Cloudflare-->>User: 2. Deliver React SPA bundle & Tailwind assets
    User->>Gateway: 3. POST /api/auth/login (email, password)
    Gateway->>Gateway: 4. Assign X-Request-Id & Check Rate Limit Bucket
    Gateway->>Database: 5. Query user profile & verify bcrypt password hash
    Database-->>Gateway: 6. User verified & return role (e.g., PATIENT)
    Gateway-->>User: 7. Return HTTP 200 + Bearer JWT + X-Request-Id

    User->>Gateway: 8. POST /api/appointments (Bearer JWT, booking payload)
    Gateway->>Auth: 9. Validate JWT signature & check PATIENT role
    Auth-->>Gateway: 10. Authentication approved (req.user populated)
    Gateway->>Database: 11. Transaction: Validate slot availability & create appointment
    Database-->>Gateway: 12. Appointment confirmed (ACID commit)
    Gateway-->>User: 13. Return HTTP 201 Created + Appointment JSON

    User->>Gateway: 14. POST /api/ai/patient/explain (Bearer JWT, medical term)
    Gateway->>Auth: 15. Validate JWT token
    Gateway->>AIService: 16. Internal POST /explain (X-AI-Service-Secret, term)
    AIService->>AIService: 17. Generate patient-friendly explanation in memory
    AIService-->>Gateway: 18. Return assistive explanation JSON
    Gateway-->>User: 19. Return HTTP 200 with sanitized AI response
```

---

## 5. Architectural Reliability & Limitations

1. **In-Memory Rate Limiting:**
   * Rate limiting quotas are tracked using Node.js process memory (`MemoryStore`). This provides zero-dependency speed for single-instance web services. In a distributed multi-instance deployment, this would be backed by Redis.
2. **Reverse Proxy Topology:**
   * `trust proxy: 1` explicitly trusts the single hop between Render's cloud load balancer and the container. If Cloudflare CDN proxying is enabled in front of Render in the future, the hop count would be updated accordingly.
3. **Container Cold-Starts:**
   * On Render's free tier, backend containers enter sleep mode after 15 minutes of inactivity. Initial requests after sleep take ~30–45s to warm up; subsequent requests respond in under 150 ms.
