# 🎓 MediSlot — Technical Interview Preparation Guide (25+ Core Q&As)

This guide is designed for **fresher and junior full-stack software engineer interviews**. It covers the exact technologies, concepts, and architectural decisions implemented in MediSlot, explained in simple, beginner-friendly language.

---

## 📑 Table of Contents

1. [React & Frontend Architecture (Q1–Q4)](#1-react--frontend-architecture)
2. [TypeScript & Type Safety (Q5–Q7)](#2-typescript--type-safety)
3. [Node.js & Express Middleware (Q8–Q10)](#3-nodejs--express-middleware)
4. [REST API Design & HTTP Protocols (Q11–Q13)](#4-rest-api-design--http-protocols)
5. [PostgreSQL & Prisma ORM (Q14–Q16)](#5-postgresql--prisma-orm)
6. [Authentication, JWT & Security (Q17–Q19)](#6-authentication-jwt--security)
7. [Rate Limiting & Request Tracing (Q20–Q22)](#7-rate-limiting--request-tracing)
8. [Microservices & AI Integration (Q23–Q25)](#8-microservices--ai-integration)
9. [DevOps, Cloud Hosting & Architecture Decisions (Q26–Q28)](#9-devops-cloud-hosting--architecture-decisions)

---

## 1. React & Frontend Architecture

### Q1: Why did you use `React.lazy` and `Suspense` in MediSlot?
**Answer:**  
In a healthcare platform with four distinct dashboards (Patient, Doctor, Clinic Admin, Platform Admin), loading all dashboard components in a single initial JavaScript bundle would make the website slow to load.  
By using `React.lazy()` with dynamic `import()` statements and wrapping them in `<Suspense fallback={<LoadingSpinner />}>`, Vite splits the code into smaller chunks. The browser only downloads the Doctor Dashboard when a doctor logs in, reducing initial page load time and improving Core Web Vitals.

### Q2: How does MediSlot handle client-side route protection?
**Answer:**  
We implemented a `<ProtectedRoute>` wrapper component in `client/src/components/auth/ProtectedRoute.tsx`. It inspects the current user session from `AuthContext`:
1. If the user is unauthenticated, it redirects them to `/login` and remembers the page they attempted to visit in `location.state`.
2. If the user is logged in but lacks the required role (e.g., a Patient trying to open `/dashboard/doctor`), it redirects them to their own authorized dashboard.
3. *Crucial interview point:* Client-side route guards are for user experience only. The Express backend independently verifies the JWT token and rejects unauthorized requests with `HTTP 401` or `403`.

### Q3: Why choose Vite over Create React App (CRA)?
**Answer:**  
Create React App is deprecated and uses Webpack, which bundles the entire application in memory before starting the dev server. Vite uses native browser ES Modules (ESM) during development, resulting in near-instant server starts and sub-millisecond Hot Module Replacement (HMR). In production, Vite uses Rollup to create highly optimized, tree-shaken static assets.

### Q4: What is the purpose of TanStack Query (React Query) in the frontend?
**Answer:**  
Traditional React uses `useEffect` and `useState` for API fetching, which often causes duplicate network requests and complex loading/error state management. TanStack Query manages **server state**: it automatically caches API responses (like doctor lists and clinic profiles), handles background refetching, and provides clean `isLoading` and `error` states out of the box.

---

## 2. TypeScript & Type Safety

### Q5: What is the benefit of using TypeScript across both frontend and backend?
**Answer:**  
TypeScript provides compile-time type checking. In MediSlot, interfaces like `UserRole`, `Doctor`, and `Appointment` are shared conceptually across the stack. If a backend controller renames a property or changes an ID from number to string, TypeScript catches the mismatch during compilation (`npm run build`), preventing runtime `TypeError: Cannot read properties of undefined` crashes in production.

### Q6: What are TypeScript Generics and where were they used?
**Answer:**  
Generics allow you to write reusable code that works with multiple types while preserving type safety. In MediSlot, our HTTP API client helper uses generics:
```typescript
async function fetchJson<T>(url: string): Promise<T>
```
When we call `fetchJson<Doctor[]>("/api/doctors")`, TypeScript knows the returned data is an array of `Doctor` objects, providing instant autocomplete and property validation.

### Q7: What is the difference between `interface` and `type` in TypeScript?
**Answer:**  
Both define the shape of an object. In MediSlot:
* We use `interface` for data models and objects that might be extended (e.g., `interface AuthenticatedUser`).
* We use `type` for unions, primitives, and fixed options (e.g., `type UserRole = "PATIENT" | "DOCTOR" | "CLINIC_ADMIN" | "PLATFORM_ADMIN"`).

---

## 3. Node.js & Express Middleware

### Q8: How does the Express middleware pipeline work?
**Answer:**  
In Express, middleware functions execute sequentially in the order they are defined (`app.use()`). Each function receives `(req, res, next)`. A middleware can either modify the request, terminate the cycle by sending a response (e.g., returning `401 Unauthorized`), or pass execution to the next handler by calling `next()`.  
In MediSlot, the pipeline is carefully ordered:
1. `trust proxy` (Client IP resolution)
2. `requestIdMiddleware` (Assigns tracking ID)
3. `morgan` (Logs request with correlation ID)
4. `cors` (Validates origin and exposes headers)
5. Body Parsers (`express.json()`)
6. Route Handlers & Subrouters
7. Centralized `errorHandler`

### Q9: How does MediSlot handle centralized error handling?
**Answer:**  
Rather than writing repetitive `try/catch` blocks that send manual error responses in every controller, uncaught errors are forwarded to Express's 4-argument error middleware `(err, req, res, next)`.  
Our `errorHandler.ts` checks the error status code, logs the error with its request context, and returns a structured JSON payload:
```json
{ "success": false, "error": { "message": "...", "statusCode": 500 } }
```
Crucially, stack traces (`err.stack`) are only included in development and are stripped in production to prevent leaking system internals.

### Q10: What is Node.js event-driven non-blocking I/O?
**Answer:**  
Node.js runs JavaScript on a single thread using an **Event Loop**. When an I/O operation occurs (such as querying PostgreSQL or fetching the AI microservice), Node offloads the operation to the operating system kernel or libuv thread pool. The main thread continues handling other incoming HTTP requests rather than blocking. When the database responds, a callback is placed in the event queue and processed.

---

## 4. REST API Design & HTTP Protocols

### Q11: What makes an API "RESTful"?
**Answer:**  
REST (Representational State Transfer) is an architectural style based on standard HTTP conventions:
* **Resource-oriented URLs:** Nouns instead of verbs (`/api/appointments`, `/api/doctors`).
* **Standard HTTP Methods:**
  * `GET`: Retrieve data (idempotent and safe).
  * `POST`: Create a new resource.
  * `PUT` / `PATCH`: Update an existing resource (`PATCH` for partial updates).
  * `DELETE`: Remove a resource.
* **Appropriate HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`.

### Q12: What is the difference between `HTTP 401` and `HTTP 403`?
**Answer:**  
* **`401 Unauthorized`:** *"I don't know who you are."* The user has not provided credentials or their JWT token is expired/missing.
* **`403 Forbidden`:** *"I know who you are, but you are not allowed here."* The user is authenticated (e.g., a Patient), but they are attempting to access an endpoint restricted to Platform Admins (`/api/admin/stats`).

### Q13: What is CORS and why is it necessary?
**Answer:**  
CORS (Cross-Origin Resource Sharing) is a browser security mechanism that prevents web pages on one domain (e.g., `medislot.pages.dev`) from making unauthorized requests to an API on another domain (e.g., `onrender.com`).  
In MediSlot's Express server, we configure the `cors` package to allow requests from our production frontend origin and explicitly expose custom headers like `X-Request-Id` so the frontend can read the tracking ID.

---

## 5. PostgreSQL & Prisma ORM

### Q14: What is an ORM and why did you choose Prisma?
**Answer:**  
An Object-Relational Mapper (ORM) maps database tables to programming language objects. Instead of writing raw SQL strings that are prone to SQL injection and typos, Prisma automatically generates a TypeScript client based on our `schema.prisma`.  
Benefits in MediSlot:
1. **Type-Safe Queries:** Compile-time auto-completion for relations (`doctor.profile`, `appointment.patient`).
2. **Automated Migrations:** Declarative schema definitions that stay in sync with PostgreSQL.
3. **Relation Handling:** Effortless `include` and `where` filtering for multi-tenant data.

### Q15: How does MediSlot prevent double-booking of appointment slots?
**Answer:**  
Double-booking is prevented using database constraints and transactional validation:
1. In `schema.prisma`, appointments link a specific `doctorId`, `clinicId`, and `dateTime`.
2. When an appointment booking request arrives, the backend queries whether an existing appointment exists for that doctor within the scheduled slot window.
3. In PostgreSQL, the booking logic executes inside an interactive transaction (`prisma.$transaction`). It runs an interval overlap query (`scheduledStart < requestedEnd AND scheduledEnd > requestedStart`) against active appointments. If an overlap is detected, the transaction aborts and returns an `HTTP 409 Conflict` error. In high-scale distributed setups, this can be further augmented with PostgreSQL `SERIALIZABLE` transaction isolation or row-level `SELECT ... FOR UPDATE` locks.

### Q16: What are ACID properties in a database?
**Answer:**  
* **Atomicity:** All parts of a transaction succeed, or the entire transaction rolls back (all-or-nothing).
* **Consistency:** Data must conform to all schema rules, foreign keys, and constraints.
* **Isolation:** Concurrent transactions execute without interfering with one another.
* **Durability:** Once committed, data is permanently recorded even in the event of a crash or reboot.

---

## 6. Authentication, JWT & Security

### Q17: What is a JSON Web Token (JWT) and how does it work?
**Answer:**  
A JWT is a compact, URL-safe string containing three parts separated by dots:
1. **Header:** Algorithm and token type (`{"alg": "HS256", "typ": "JWT"}`).
2. **Payload:** User claims (`id`, `email`, `role`, expiration time `exp`).
3. **Signature:** Cryptographic hash of the header and payload generated with a server secret (`JWT_SECRET`).

When a user logs in, the server generates a token and sends it to the client. On subsequent requests, the client attaches the token in the `Authorization: Bearer <token>` header. The server verifies the signature without needing to look up a session in memory, making the API stateless.

### Q18: How are passwords stored securely in MediSlot?
**Answer:**  
Passwords are never stored in plain text. MediSlot uses `bcryptjs` with a work factor of 10 salt rounds (`bcrypt.hashSync(password, 10)`).  
Bcrypt includes a unique cryptographic salt for every user to defeat precomputed rainbow table attacks and uses a computationally expensive key derivation function that slows down brute-force hardware crackers.

### Q19: What is Role-Based Access Control (RBAC) and how is it implemented?
**Answer:**  
RBAC restricts access based on a user's defined role. In MediSlot, we created a higher-order middleware function `requireRole(allowedRoles: UserRole[])`:
```typescript
export function requireRole(allowedRoles: UserRole[]) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" })
    }
    next()
  }
}
```
If a Doctor attempts to access `/api/admin/stats` (which requires `PLATFORM_ADMIN`), the middleware halts execution and returns `HTTP 403`.

---

## 7. Rate Limiting & Request Tracing (PR #3.1)

### Q20: Why did you implement rate limiting on authentication routes?
**Answer:**  
Authentication endpoints (`/api/auth/login` and `/api/auth/register`) are prime targets for automated credential stuffing and bot account creation.  
In PR #3.1, we implemented `express-rate-limit`:
* **Login:** Limited to 5 failed attempts per IP per 15 minutes. Legitimate logins do not consume failure quotas (`skipSuccessfulRequests: true`).
* **Registration:** Limited to 3 account creations per IP per hour.
* Throttled users receive `HTTP 429 Too Many Requests` with standard `RateLimit-*` and `Retry-After` headers.

### Q21: What is a Request Correlation ID and why is it useful?
**Answer:**  
In distributed or microservice systems, debugging an issue across multiple logs is difficult without a common thread.  
Our `requestIdMiddleware` inspects every incoming request:
1. If the client sends an `X-Request-Id`, the server validates and sanitizes it.
2. If absent or malformed (preventing header injection or script tags), it generates a cryptographic RFC 4122 UUID v4 (`crypto.randomUUID()`).
3. It attaches the ID to `req.id`, injects it into Morgan console logs (`[:req-id]`), and returns it in the `X-Request-Id` response header.  
This allows engineers to match a frontend error reported by a patient to the exact log entry on the backend.

### Q22: Why did you configure `app.set("trust proxy", 1)`?
**Answer:**  
In production hosting like Render, incoming requests first pass through Render's reverse proxy and load balancer before reaching our Node.js container.  
Without `trust proxy: 1`, Express would treat the IP address of Render's internal proxy as the client's IP. All users worldwide would share a single IP bucket, and one user failing their password would accidentally lock out all other users. `trust proxy: 1` tells Express to trust the first upstream hop and read the genuine user IP from the `X-Forwarded-For` header.

---

## 8. Microservices & AI Integration

### Q23: Why separate the AI features into a Python FastAPI microservice?
**Answer:**  
1. **Ecosystem & Libraries:** Python is the industry standard for machine learning, data processing, and document extraction (PyPDF, OCR, LangChain).
2. **Resource Isolation:** AI summarization is CPU/memory-heavy. Separating it from the Node.js server prevents heavy natural language tasks from blocking the event loop or slowing down critical appointment booking traffic.
3. **Independent Scaling:** In a larger deployment, the AI microservice can be scaled horizontally on GPU or compute-optimized instances independently of the web API.

### Q24: How do the Express backend and FastAPI AI service communicate securely?
**Answer:**  
Communication is protected by **mutual shared-secret authentication**:
* The AI microservice is not exposed to direct public browser traffic.
* When the Express server calls the AI service, it passes an internal secret header (`X-AI-Service-Secret`).
* The FastAPI dependency verifies this secret on every incoming request and returns `HTTP 401` if it is missing or invalid.

### Q25: What is the "Physician-in-the-Loop" clinical safety paradigm?
**Answer:**  
Healthcare applications must never allow artificial intelligence to make autonomous, unverified clinical decisions or prescribe medications.  
In MediSlot:
* All AI outputs (such as SOAP consultation notes) are explicitly classified as **assistive drafts**.
* Drafts are presented to a licensed physician who must review, edit, and sign off before anything is recorded in the patient's medical history.
* The AI service processes records in volatile memory buffers (`BytesIO`) and does not write raw patient health information to disk.

---

## 9. DevOps, Cloud Hosting & Architecture Decisions

### Q26: What is a "cold start" on cloud platforms like Render?
**Answer:**  
On free or starter container tiers, hosting providers spin down idle containers to 0 instances after 15 minutes of inactivity to conserve resources. When a new request arrives, the provider must spin up the container, initialize the Node.js runtime, and connect to the database. This causes a one-time delay of ~30–45 seconds for the first visitor. Once warmed up, the container remains active and responds in under 150 ms.

### Q27: What is the difference between In-Memory Rate Limiting and Redis?
**Answer:**  
* **In-Memory Store (Current MediSlot implementation):** Counters are stored in the Node.js process RAM. It is fast, lightweight, and requires no external infrastructure, making it ideal for single-instance web services.
* **Redis Store:** An external in-memory key-value database. If MediSlot were scaled to 5 clustered instances behind a load balancer, Redis would be required so that rate limit counters are shared across all instances rather than isolated to each individual server process.

### Q28: If you had another month to work on MediSlot, what would you improve?
**Answer:**  
1. **Centralized Redis Caching:** Back rate limiters and session invalidations with Redis for multi-instance scalability.
2. **Automated End-to-End Testing:** Add Playwright or Cypress tests to run in a continuous integration (CI) pipeline on every GitHub pull request.
3. **WebSockets for Real-Time Updates:** Replace polling with Socket.io so doctors and patients receive instant notifications when an appointment status changes.
4. **Email & SMS Notifications:** Integrate Twilio or SendGrid for automated appointment reminders.

