# 🏥 MediSlot — AI-Powered Healthcare Management Platform

[![Status: Phase 1–6 Complete](https://img.shields.io/badge/Status-Phases%201--6%20Complete-emerald.svg)](#implementation-status)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24-blue.svg)](https://nodejs.org)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B%20%7C%203.14-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-19%20%7C%20Vite-cyan.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-teal.svg)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-emerald.svg)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **Smarter Appointments. Better Clinic Management. Physician-Supervised Clinical AI.**

MediSlot is a production-grade, full-stack healthcare SaaS platform engineered to streamline clinical operations, doctor scheduling, patient consultations, encrypted health records, and AI-assisted clinical documentation. Built with a strict **physician-supervised AI paradigm**, all machine learning outputs are treated as assistive decision-support drafts that require human clinician review and attestation.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Key Features (Phases 1–6)](#-key-features-phases-16)
- [Technology Stack](#-technology-stack)
- [Security, Privacy & Clinical Safety](#-security-privacy--clinical-safety)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Local Installation](#-getting-started--local-installation)
- [Environment Configuration](#-environment-configuration)
- [Verification & Testing Suite](#-verification--testing-suite)
- [UI & Screenshots Gallery](#-ui--screenshots-gallery)
- [Clinical Safety Disclaimer & Limitations](#-clinical-safety-disclaimer--limitations)
- [Upcoming Roadmap](#-upcoming-roadmap)

---

## 🏛️ Architecture Overview

MediSlot separates presentation, business logic, persistence, and artificial intelligence into dedicated, securely coordinated services:

```mermaid
graph TD
    subgraph Client Tier
        UI["React 19 + TypeScript + Vite<br/>(Tailwind CSS + Framer Motion)"]
    end

    subgraph API & Persistence Tier
        API["Express.js / TypeScript Core Server<br/>(Port 5000)"]
        DB[("Supabase PostgreSQL<br/>(Prisma ORM + RLS + Audit Logs)")]
        Storage[("Supabase Private Storage<br/>(Bucket: medical-records)")]
    end

    subgraph AI Decision Support Tier
        AIService["FastAPI Python Microservice<br/>(Port 8000)"]
        OCR["PyPDF & Tesseract OCR Engine"]
        Safety["Deterministic Clinical Safety Layer"]
        Model["Multi-Provider Router<br/>(Deterministic Local / Gemini / OpenAI)"]
    end

    UI -->|"Authenticated HTTPS / Bearer JWT"| API
    API -->|"Prisma Client / Transactions"| DB
    API -->|"Encrypted Streaming / Signed URLs"| Storage
    API -->|"Mutual Internal Secret (X-AI-Service-Secret)"| AIService
    AIService --> OCR
    AIService --> Safety
    AIService --> Model
```

### Architectural Principles:
1. **Zero Client-Side AI Secrets:** The frontend client never communicates directly with external AI providers or internal AI endpoints. All AI interactions are authenticated, authorized, and logged through the Express API backend.
2. **Mutual Service Authentication:** Communication between the Express server and the Python AI microservice is gated by an internal shared secret (`X-AI-Service-Secret`). Direct unauthenticated external calls are rejected with `HTTP 401`.
3. **Stateless Processing & Memory Cleanup:** Uploaded files and base64 streams are processed in memory buffers (`BytesIO`) and purged immediately upon extraction. No raw patient records are saved to the AI microservice disk.
4. **Fine-Grained Row-Level Security (RLS):** Supabase database policies enforce strict multi-tenant boundaries between patients, doctors, and clinic administrators.

---

## 🌟 Key Features (Phases 1–6)

### 🏥 Phase 1: Core Foundation & Design System
- **Responsive Healthcare Design:** Modern, clinical-grade interface built with Tailwind CSS, Lucide icons, and Framer Motion micro-animations.
- **5-Step Booking Engine:** Streamlined wizard guiding patients through specialty selection, clinic location, doctor availability, appointment details, and confirmation.
- **Role-Based Portals:** Dedicated dashboard layouts tailored for **Patients**, **Doctors**, **Clinic Administrators**, and **Platform Operators**.

### 🔐 Phase 2: Supabase Integration & RBAC
- **Unified Identity Management:** Seamless Supabase Auth integration supporting secure sign-up, password hashing, and email OTP verification.
- **Prisma PostgreSQL Schema:** Robust data models covering Profiles, Patients, Doctors, Clinics, Availabilities, Appointments, and Audit Logs.
- **Enforced RBAC Middleware:** Route-level middleware validating caller roles (`PATIENT`, `DOCTOR`, `CLINIC_ADMIN`, `PLATFORM_ADMIN`).

### 📅 Phase 3: Clinic & Doctor Scheduling Engine
- **Multi-Clinic Network:** Support for clinics with distinct operating hours, geographical metadata, and practitioner affiliations.
- **Doctor Onboarding Workflow:** License verification, specialty classification, custom consultation fees, and slot duration settings.
- **Dynamic Slot Generation:** Intelligent scheduling engine calculating non-overlapping consultation slots while accounting for past appointments, cancellations, and clinic hours.

### ⚡ Phase 4: Real-Time Appointment Engine & Concurrency
- **Double-Booking Prevention:** Atomic transaction management ensuring no two patients can claim the same time slot simultaneously.
- **State Transition Machine:** Strict lifecycle management (`PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `RESCHEDULED` / `NO_SHOW`).
- **Reschedule & Cancellation Workflows:** Self-service patient cancellation and reschedule handling with automated audit logging.

### 📂 Phase 5: Medical Records, SOAP Notes & Digital Prescriptions
- **Encrypted Health Records Vault:** Secure document upload supporting lab reports, imaging files, and discharge summaries with category tagging.
- **Access Control Lists (ACL):** Explicit patient-granted doctor access permissions (`doctor_record_access`) with one-click revocation.
- **Clinical SOAP Note Editor:** Structured clinical documentation tool for physicians (**S**ubjective, **O**bjective, **A**ssessment, **P**lan).
- **Digital Prescription Generator:** Structured prescription builder with medication names, dosages, frequencies, duration, and doctor signatures.

### 🧠 Phase 6: Clinical AI Copilot & Document Understanding
- **PDF & Optical OCR Text Extraction:** Dual-mode extraction supporting born-digital PDFs via `pypdf` and scanned image documents via `pytesseract`.
- **Structured Lab Report Analyzer:** Automatic identification of 14 common analytes (Fasting Glucose, HbA1c, WBC, Platelets, Creatinine, Total Cholesterol, etc.), flagging out-of-range results (`HIGH`, `LOW`, `NORMAL`).
- **Grounded Source Citations:** Every extracted measurement links to an explicit source citation format: `[Page X, Line Y]: "context excerpt"`.
- **Zero-Hallucination Data Integrity:** The extraction engine strictly refuses to invent measurements that are absent from the document.
- **Physician Consultation Pre-Drafts:** Synthesizes patient appointment intake notes, reported symptoms, and uploaded lab findings into structured SOAP drafts and flags missing baseline investigations.
- **Patient AI Features:** Plain-language medical glossary explanations (6th-grade reading level) and suggested discussion questions for doctor visits.
- **Deterministic Safety Guardrails:** Hard-coded detection of acute medical emergencies (chest pain, stroke symptoms, respiratory distress) with immediate 911 redirection, autonomous prescribing blocks, and adversarial prompt-injection neutralization.
- **Clinician Review & Attestation:** Required clinician acceptance, rejection, or modification workflow with full immutable audit tracking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React |
| **Backend API** | Node.js (v24), Express.js, TypeScript, Prisma ORM, BullMQ |
| **AI / ML Microservice** | Python 3.14, FastAPI, Uvicorn, Pydantic, PyPDF, Tesseract OCR, Pillow |
| **Database & Auth** | Supabase PostgreSQL 16 (pgvector ready), Supabase Auth, Row-Level Security (RLS) |
| **File Storage** | Supabase Storage (Private `medical-records` bucket) |
| **Security & Safety** | Deterministic Safety Engine, RBAC Middleware, Prompt-Injection Filters, Audit Trails |
| **Testing** | Node.js Test Harness, Live Integration Suites, PDFKit Generator |

---

## 🛡️ Security, Privacy & Clinical Safety

MediSlot treats patient data protection and clinical safety as first-class architectural constraints:

```
+-------------------------------------------------------------------------+
|                      CLINICAL SAFETY ARCHITECTURE                       |
+-------------------------------------------------------------------------+
|  1. Patient AI Consent Gate    -> Explicit opt-in required before processing
|  2. Cross-Patient Isolation    -> Strict tenant authorization validation 
|  3. Deterministic Safety Layer -> Acute emergency screening (911 redirect)
|  4. Prescription Blocker       -> Autonomous medication dosing blocked   
|  5. Injection Neutralization   -> Adversarial prompt overrides filtered  
|  6. Zero Log Exposure          -> No patient PHI in application logs     
|  7. Clinician Attestation      -> All outputs watermarked as AI Drafts   
+-------------------------------------------------------------------------+
```

- **Explicit Patient AI Consent:** Sensitive documents cannot be analyzed by AI until the patient explicitly opts in via the Patient Portal.
- **No Autonomous Medical Decision-Making:** All AI outputs feature a mandatory watermark:  
  `"AI-Generated Clinical Decision Support Draft. Not a licensed physician, independent diagnosis, or autonomous treatment directive. Must be reviewed, verified, and approved by a licensed healthcare provider."`
- **Sanitized Logging:** Console and server log handlers redact patient names, test results, and file contents.
- **Immutable Audit Logging:** Every AI analysis, consultation draft generation, and clinician review attestation is committed to the PostgreSQL `audit_logs` table with actor profile ID and client IP.

---

## 📁 Project Directory Structure

```
MediSlot/
├── client/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI, AI Modals, Booking & Medical Wizards
│   │   │   ├── ai/             # AiConsentBanner, AiCopilotModal, LabReportAnalyzerModal, etc.
│   │   │   ├── booking/        # BookingModal, AppointmentDetailsModal, RescheduleModal
│   │   │   ├── medical/        # SoapNoteEditorModal, PrescriptionBuilderModal, UploadRecordModal
│   │   │   └── ui/             # Design system components (Button, Card, Badge, Modal)
│   │   ├── context/            # Authentication & State Providers
│   │   ├── lib/                # API client & Supabase browser SDK
│   │   └── pages/              # Landing page, Auth views & 4 Role-Based Dashboards
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Express.js + TypeScript REST API Backend
│   ├── prisma/
│   │   └── schema.prisma       # Prisma ORM Database Schema
│   ├── src/
│   │   ├── config/             # Environment, Database, & Supabase admin client
│   │   ├── controllers/        # Express Route Controllers (Auth, Doctor, AI, etc.)
│   │   ├── middleware/         # Supabase JWT authentication & RBAC guards
│   │   ├── routes/             # REST API endpoint routes
│   │   ├── services/           # Core domain logic (Appointments, AI, Medical Records)
│   │   └── validators/         # Zod request payload schemas
│   ├── supabase/
│   │   └── migrations/         # SQL migration scripts (001 through 008)
│   └── package.json
│
├── ai-service/                 # Python FastAPI Clinical AI Microservice
│   ├── app/
│   │   ├── config.py           # Multi-provider settings & secret validation
│   │   ├── copilot.py          # SOAP Note Pre-Drafter & Grounded Document Q&A
│   │   ├── extractor.py        # PDF & Tesseract OCR parsing engine
│   │   ├── main.py             # FastAPI REST endpoints & dependency guards
│   │   ├── patient_ai.py       # Plain-language medical glossary & question generator
│   │   └── safety.py           # Deterministic emergency triage & injection filters
│   ├── Dockerfile
│   └── requirements.txt
│
├── tests/                      # Live integration test suites
├── docker-compose.yml          # Multi-container orchestration (Postgres, Redis, Server, Client, AI)
├── .env.example                # Safe root configuration template
└── README.md                   # This documentation
```

---

## 🚀 Getting Started & Local Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (tested on v24.18.1)
- **npm**: v9.0.0 or higher
- **Python**: 3.10 or higher (tested on Python 3.14)
- **Git**: installed
- **Supabase Account**: (Free tier) with PostgreSQL database and Storage enabled

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Sahithi200423/MediSlot-AI-Healthcare.git
cd MediSlot-AI-Healthcare
```

---

### Step 2: Configure Environment Variables
Copy the `.env.example` templates in each project directory and populate the required placeholders:

```bash
# 1. Server configuration
cp server/.env.example server/.env

# 2. Client configuration
cp client/.env.example client/.env

# 3. AI Service configuration
cp ai-service/.env.example ai-service/.env
```

---

### Step 3: Setup & Launch the Python AI Microservice
```bash
cd ai-service

# Create virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI microservice (runs on port 8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Verify: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 4: Setup & Launch the Express Backend
Open a second terminal:
```bash
cd server

# Install dependencies
npm install

# Generate Prisma Client & apply database migrations
npx prisma generate
node scripts/apply-phase6-migration.cjs

# Start development server (runs on port 5000)
npm run dev
```
Verify: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Step 5: Setup & Launch the React Frontend
Open a third terminal:
```bash
cd client

# Install dependencies
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```
Access the application: **[http://localhost:5173](http://localhost:5173)**

---

## ⚙️ Environment Configuration

### Server (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=medislot-internal-ai-secret-2026

# Supabase Connection Strings
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Admin Keys
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

JWT_SECRET="your-32-character-secret-key"
```

### Client (`client/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### AI Service (`ai-service/.env`)
```ini
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8000
AI_SERVICE_SECRET=medislot-internal-ai-secret-2026
AI_PROVIDER=deterministic_local

# Optional external LLM providers
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

---

## 🧪 Verification & Testing Suite

MediSlot includes an end-to-end integration test suite (`server/scripts/test-phase6-live.cjs`) validating all critical clinical workflows against a live database using programmatically generated fictional clinical PDF reports:

```bash
cd server
node scripts/test-phase6-live.cjs
```

### Test Suite Execution Results:
```text
========================================================
🧠 MEDISLOT PHASE SIX LIVE INTEGRATION TEST SUITE
   Clinical AI Copilot, Lab Analyzer, Consent & Security
========================================================

[TEST 1] Text-Based PDF Extraction...................... PASSED ✓
[TEST 2] Scanned Document OCR / Optical Extraction...... PASSED ✓
[TEST 3] Structured Laboratory Measurement Extraction... PASSED ✓
[TEST 4] Source Citation Accuracy....................... PASSED ✓
[TEST 5] Missing Data Handling (Zero Invention)......... PASSED ✓
[TEST 6] Patient AI Consent Enforcement................. PASSED ✓
[TEST 7] Cross-Patient Isolation & Access Rejection..... PASSED ✓
[TEST 8] Backend and AI Service Integration............. PASSED ✓
[TEST 9] Prompt-Injection Resistance.................... PASSED ✓
[TEST 10] Deterministic Emergency & Prescribing Blocker. PASSED ✓
[TEST 11] Physician Clinical AI Copilot (SOAP & Q&A).... PASSED ✓
[TEST 12] Clinician Review & Attestation Workflow....... PASSED ✓

========================================================
🎉 ALL 12 PHASE SIX LIVE INTEGRATION TESTS PASSED!
========================================================
```

---

## 📸 UI & Screenshots Gallery

| Screen | Description |
|---|---|
| **Landing & Booking Engine** | Animated landing page showcasing services, doctors, and the 5-step appointment reservation wizard. |
| **Patient Dashboard** | Health timeline, appointment management, consent banner, and encrypted medical records vault. |
| **Lab Report Analyzer** | Analyte value cards with reference limits, out-of-range tags, and grounded source-page citations. |
| **Clinical AI Copilot** | Physician panel for generating SOAP pre-drafts, checking missing baseline investigations, and grounded Q&A. |
| **Doctor Dashboard** | Active consultation queues, schedule management, SOAP clinical note editor, and digital prescription builder. |
| **Clinic Admin Portal** | Facility operating hours, practitioner directory management, and verified patient booking metrics. |

---

## ⚠️ Clinical Safety Disclaimer & Limitations

> [!IMPORTANT]
> **MediSlot is a clinical decision-support and administrative workflow tool.**
>
> 1. **Not a Licensed Physician:** MediSlot AI features are not certified as medical devices and do not provide autonomous clinical diagnoses, medication dosages, or treatment plans.
> 2. **Mandatory Human Oversight:** All AI-generated SOAP notes, summaries, and suggestions must be reviewed, edited, and approved by a qualified, licensed healthcare provider before clinical application.
> 3. **Emergency Care:** MediSlot is not an emergency triage tool. Any patient exhibiting acute red-flag symptoms (e.g., chest pain, respiratory distress, stroke indicators) must immediately contact local emergency medical services (911 / 112).
> 4. **OCR Resolution Dependent:** Document extraction accuracy depends on source image quality. Distorted or handwritten records require manual clinician verification.

---

## 🗺️ Upcoming Roadmap

- [x] **Phase 1**: Workspace bootstrap, design system, animated landing page, 4 dashboard portals, Express API.
- [x] **Phase 2**: Supabase PostgreSQL database integration, schema design, JWT authentication, and RBAC.
- [x] **Phase 3**: Doctor availability scheduling and multi-clinic management engine.
- [x] **Phase 4**: Real-time appointment booking engine with atomic double-booking prevention.
- [x] **Phase 5**: Medical records vault, doctor record access ACLs, SOAP clinical note editor, and digital prescriptions.
- [x] **Phase 6**: Clinical AI Copilot, Lab Report Analyzer, Optical OCR/PDF extraction, and patient educational features.
- [ ] **Phase 7**: ML Appointment No-Show Prediction (`scikit-learn` historical gradient-boosted classifier).
- [ ] **Phase 8**: AI Administrative Operations Assistant with `pgvector` Retrieval-Augmented Generation (RAG).
- [ ] **Phase 9**: Automated Playwright E2E testing, Docker container hardening, CI/CD pipeline, and cloud deployment.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
