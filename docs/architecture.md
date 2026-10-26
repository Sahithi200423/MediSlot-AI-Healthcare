# 🏗️ MediSlot System Architecture & Design Specification

> **MediSlot — AI-Powered Smart Clinic Booking & Management System**

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Clients ["Frontend Layer (React 19 + TypeScript + Vite)"]
        Landing["Public Landing & Discovery Page"]
        PatientPortal["Patient Dashboard"]
        DoctorWorkspace["Doctor Workspace"]
        ClinicAdmin["Clinic Admin Portal"]
        SuperAdmin["Platform Admin Portal"]
    end

    subgraph Gateway ["API Gateway & Routing"]
        CORS["CORS & Rate Limiter"]
        AuthMiddleware["JWT & RBAC Authorization"]
    end

    subgraph Backend ["Core Backend Service (Node.js + Express + TypeScript)"]
        API["REST API Router"]
        Scheduler["Scheduling Engine (ACID Transactional Locking)"]
        PaymentHandler["Razorpay Order & Signature Verifier"]
        BullMQWorker["BullMQ Background Workers"]
    end

    subgraph Database ["Data & Persistence Layer"]
        SupabasePostgres[("Supabase PostgreSQL (ACID & Constraints)")]
        PgVector[("pgvector Embeddings (Admin Assistant)")]
        SupabaseStorage[("Supabase Storage (Encrypted Clinical Vault)")]
        RedisCache[("Redis (BullMQ & Cache)")]
    end

    subgraph AIService ["AI/ML Microservice (Python FastAPI)"]
        FastAPIApp["FastAPI Engine"]
        DocSummarizer["Document Summarizer (OpenAI + OCR)"]
        NoShowModel["scikit-learn No-Show Classifier"]
        RAGAssistant["RAG Administrative Assistant"]
    end

    Landing --> Gateway
    PatientPortal --> Gateway
    DoctorWorkspace --> Gateway
    ClinicAdmin --> Gateway
    SuperAdmin --> Gateway

    Gateway --> AuthMiddleware
    AuthMiddleware --> API

    API --> Scheduler
    API --> PaymentHandler
    API --> BullMQWorker

    Scheduler --> SupabasePostgres
    PaymentHandler --> SupabasePostgres
    BullMQWorker --> RedisCache

    API -.->|REST / Internal RPC| FastAPIApp
    FastAPIApp --> DocSummarizer
    FastAPIApp --> NoShowModel
    FastAPIApp --> RAGAssistant
    RAGAssistant --> PgVector
    DocSummarizer --> SupabaseStorage
```

---

## 2. Multi-Tier Security & Tenant Isolation

1. **Role-Based Access Control (RBAC)**:
   - `PATIENT`: Can only read/write own profile, appointments, and uploaded health documents.
   - `DOCTOR`: Scoped strictly to assigned patients and clinical appointment queues.
   - `CLINIC_ADMIN`: Scoped to clinic-level membership, doctors, staff, and clinic revenues.
   - `PLATFORM_ADMIN`: Global platform health, compliance logs, and clinic onboarding.
2. **ACID Transaction Isolation**:
   - Double-booking prevention implemented via PostgreSQL row-level locks (`SELECT FOR UPDATE`) and unique composite constraints `(doctor_id, scheduled_start)`.
3. **Protected Health Information (PHI)**:
   - Private Supabase Storage buckets with pre-signed short-lived URLs.
   - Medical documents are never publicly exposed or indexed by search engines.
