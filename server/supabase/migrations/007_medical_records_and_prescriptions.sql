-- ==============================================================================
-- 007_medical_records_and_prescriptions.sql
-- MediSlot Phase Five: Medical Records, Clinical SOAP Notes & Prescriptions
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE medical_record_category AS ENUM (
        'LAB_REPORT',
        'PRESCRIPTION',
        'IMAGING_SCAN',
        'DISCHARGE_SUMMARY',
        'VACCINATION_RECORD',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scan_status AS ENUM ('CLEAN', 'PENDING_SCAN', 'QUARANTINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_status AS ENUM ('DRAFT', 'FINALIZED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Medical Records Table (Document Uploads)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    uploaded_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category medical_record_category NOT NULL DEFAULT 'OTHER',
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    scan_status scan_status NOT NULL DEFAULT 'CLEAN',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_category ON public.medical_records (category);

-- 3. Create Doctor Record Access Table (Explicit Consent & Revocation)
CREATE TABLE IF NOT EXISTS public.doctor_record_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    granted_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_record_access ON public.doctor_record_access (patient_id, doctor_id, is_revoked);

-- 4. Create Clinical Notes Table (SOAP Notes)
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    status note_status NOT NULL DEFAULT 'DRAFT',
    finalized_at TIMESTAMPTZ,
    finalized_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amendment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON public.clinical_notes (patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor ON public.clinical_notes (doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON public.clinical_notes (appointment_id);

-- 5. Create Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(64) NOT NULL UNIQUE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    diagnosis TEXT,
    general_instructions TEXT,
    follow_up_date DATE,
    pdf_storage_path VARCHAR(500),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions (patient_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON public.prescriptions (appointment_id);

-- 6. Create Prescription Items Table
CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON public.prescription_items (prescription_id);

-- 7. Additional range index for appointment overlap prevention
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_interval 
ON public.appointments (doctor_id, scheduled_start, scheduled_end) 
WHERE status != 'CANCELLED';

-- 8. Enable Row Level Security (RLS) on all Phase 5 tables
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_record_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
