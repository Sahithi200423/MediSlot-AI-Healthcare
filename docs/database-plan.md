# 📊 MediSlot PostgreSQL Database Schema Plan

This document details the relational schema designed for Supabase PostgreSQL. This plan strictly reflects real-world healthcare SaaS architecture with multi-tenancy, Role-Based Access Control (RBAC), and HIPAA/data audit integrity.

---

## 1. Entity-Relationship Overview

```
[Users]
  ├── (1:1) ── [Patients]
  ├── (1:1) ── [Doctors] ──── (N:1) ── [Clinics]
  └── (N:M) ── [ClinicMemberships] ──── (N:1) ── [Clinics]

[Clinics]
  ├── (1:N) ── [Doctors]
  └── (1:N) ── [Appointments]

[Doctors]
  ├── (1:N) ── [Availability] (recurring schedule slots)
  └── (1:N) ── [Appointments]

[Patients]
  ├── (1:N) ── [Appointments]
  └── (1:N) ── [MedicalDocuments]

[Appointments]
  ├── (1:1) ── [Payments] (Razorpay order/payment tracking)
  └── (1:1) ── [AISummaries] (clinical document summarization)

[AuditLogs] (tracks every sensitive mutation with actor ID and IP)
[Notifications] (multi-channel alerts for patients & staff)
```

---

## 2. Core Tables Specification

### 2.1 `users`
Synced with Supabase Auth `auth.users` via database trigger.
- `id`: UUID (Primary Key, matches `auth.users.id`)
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `phone`: VARCHAR(20)
- `first_name`: VARCHAR(100) NOT NULL
- `last_name`: VARCHAR(100) NOT NULL
- `role`: ENUM ('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'PLATFORM_ADMIN') NOT NULL DEFAULT 'PATIENT'
- `avatar_url`: TEXT
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.2 `clinics`
Healthcare facility multi-tenant organization.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name`: VARCHAR(255) NOT NULL
- `slug`: VARCHAR(255) UNIQUE NOT NULL
- `address`: TEXT NOT NULL
- `city`: VARCHAR(100) NOT NULL
- `state`: VARCHAR(100) NOT NULL
- `postal_code`: VARCHAR(20) NOT NULL
- `phone`: VARCHAR(20) NOT NULL
- `email`: VARCHAR(255) NOT NULL
- `is_verified`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.3 `clinic_memberships`
Links staff and administrators to specific clinics.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `clinic_id`: UUID REFERENCES clinics(id) ON DELETE CASCADE
- `user_id`: UUID REFERENCES users(id) ON DELETE CASCADE
- `clinic_role`: ENUM ('OWNER', 'MANAGER', 'RECEPTIONIST') NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE (clinic_id, user_id)

### 2.4 `doctors`
Professional profiles for healthcare practitioners.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE
- `clinic_id`: UUID REFERENCES clinics(id) ON DELETE SET NULL
- `specialty`: VARCHAR(100) NOT NULL (e.g., Cardiology, Dermatology, Pediatrics)
- `license_number`: VARCHAR(100) NOT NULL UNIQUE
- `years_of_experience`: INT DEFAULT 0
- `bio`: TEXT
- `consultation_fee`: DECIMAL(10, 2) NOT NULL DEFAULT 500.00
- `is_accepting_patients`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.5 `patients`
Medical profile for patients.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE
- `date_of_birth`: DATE
- `gender`: ENUM ('MALE', 'FEMALE', 'OTHER')
- `blood_group`: VARCHAR(10)
- `emergency_contact_name`: VARCHAR(100)
- `emergency_contact_phone`: VARCHAR(20)
- `allergies`: TEXT
- `chronic_conditions`: TEXT
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.6 `availability`
Recurring weekly consultation schedules.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `doctor_id`: UUID REFERENCES doctors(id) ON DELETE CASCADE
- `day_of_week`: INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6) -- 0=Sunday
- `start_time`: TIME NOT NULL
- `end_time`: TIME NOT NULL
- `slot_duration_minutes`: INT NOT NULL DEFAULT 30
- `is_active`: BOOLEAN DEFAULT TRUE

### 2.7 `appointments`
Primary transaction record with strict state machine.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `patient_id`: UUID REFERENCES patients(id) ON DELETE RESTRICT
- `doctor_id`: UUID REFERENCES doctors(id) ON DELETE RESTRICT
- `clinic_id`: UUID REFERENCES clinics(id) ON DELETE RESTRICT
- `scheduled_start`: TIMESTAMPTZ NOT NULL
- `scheduled_end`: TIMESTAMPTZ NOT NULL
- `status`: ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING'
- `reason_for_visit`: TEXT
- `cancellation_reason`: TEXT
- `no_show_risk_score`: DECIMAL(3, 2) -- Calculated by ML microservice (0.00 - 1.00)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.8 `payments`
Financial transaction tracking with Razorpay integration.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `appointment_id`: UUID UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT
- `amount`: DECIMAL(10, 2) NOT NULL
- `currency`: VARCHAR(10) DEFAULT 'INR'
- `razorpay_order_id`: VARCHAR(100)
- `razorpay_payment_id`: VARCHAR(100)
- `razorpay_signature`: VARCHAR(255)
- `status`: ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING'
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.9 `medical_documents`
Storage pointer to Supabase Storage encrypted healthcare buckets.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `patient_id`: UUID REFERENCES patients(id) ON DELETE CASCADE
- `uploaded_by`: UUID REFERENCES users(id) ON DELETE SET NULL
- `file_name`: VARCHAR(255) NOT NULL
- `file_path`: TEXT NOT NULL
- `file_size_bytes`: BIGINT NOT NULL
- `mime_type`: VARCHAR(100) NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.10 `ai_summaries`
Generated by Phase 6 FastAPI microservice using OpenAI API.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `document_id`: UUID REFERENCES medical_documents(id) ON DELETE CASCADE
- `appointment_id`: UUID REFERENCES appointments(id) ON DELETE SET NULL
- `summary_text`: TEXT NOT NULL
- `key_findings`: JSONB -- Array of clinical highlights
- `flagged_risks`: JSONB -- Red flags (e.g. drug allergies, elevated BP)
- `model_version`: VARCHAR(50) NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.11 `notifications`
In-app and outbound notification logs.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID REFERENCES users(id) ON DELETE CASCADE
- `title`: VARCHAR(255) NOT NULL
- `message`: TEXT NOT NULL
- `type`: ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_UPDATE', 'SCHEDULE_CHANGE', 'SYSTEM') NOT NULL
- `is_read`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 2.12 `audit_logs`
Compliance audit trail for HIPAA/security oversight.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID REFERENCES users(id) ON DELETE SET NULL
- `action`: VARCHAR(100) NOT NULL -- e.g., 'VIEW_MEDICAL_RECORD', 'CANCEL_APPOINTMENT'
- `resource_table`: VARCHAR(100) NOT NULL
- `resource_id`: UUID NOT NULL
- `ip_address`: VARCHAR(45)
- `user_agent`: TEXT
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

---

## 3. Migration Roadmap for Phase 2
In Phase 2, these models will be translated directly into `prisma/schema.prisma` alongside Supabase PostgreSQL connection strings and Row Level Security (RLS) policies.
