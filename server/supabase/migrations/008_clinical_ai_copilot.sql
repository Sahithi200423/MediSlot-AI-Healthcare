-- 008_clinical_ai_copilot.sql
-- MediSlot Phase Six: Clinical AI Copilot, Lab Report Analyzer, and Patient AI Consent

-- 1. Patient AI Consent Table (Explicit consent required before external processing)
CREATE TABLE IF NOT EXISTS patient_ai_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_ai_consent_patient ON patient_ai_consent(patient_id, consent_given);

-- 2. AI Analyses & Copilot Records Table
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    analysis_type VARCHAR(64) NOT NULL, -- LAB_SUMMARY, DOCUMENT_SUMMARY, CONSULTATION_DRAFT, CLINICAL_QA, PATIENT_EXPLANATION
    extracted_data JSONB,
    summary TEXT NOT NULL,
    plain_language_summary TEXT,
    disclaimer TEXT NOT NULL,
    reviewed_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, ACCEPTED, REJECTED, MODIFIED
    clinician_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient ON ai_analyses(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_record ON ai_analyses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_doctor ON ai_analyses(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_review ON ai_analyses(review_status);

-- 3. Row-Level Security (RLS)
ALTER TABLE patient_ai_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Patients can view and manage their own AI consent
DROP POLICY IF EXISTS "Patients manage own AI consent" ON patient_ai_consent;
CREATE POLICY "Patients manage own AI consent" ON patient_ai_consent
    FOR ALL
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()))
    WITH CHECK (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- Patients can view their own AI analyses
DROP POLICY IF EXISTS "Patients view own AI analyses" ON ai_analyses;
CREATE POLICY "Patients view own AI analyses" ON ai_analyses
    FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- Doctors can view AI analyses for authorized patients
DROP POLICY IF EXISTS "Doctors view authorized AI analyses" ON ai_analyses;
CREATE POLICY "Doctors view authorized AI analyses" ON ai_analyses
    FOR SELECT
    USING (
        patient_id IN (
            SELECT dra.patient_id FROM doctor_record_access dra
            JOIN doctors d ON d.id = dra.doctor_id
            WHERE d.profile_id = auth.uid() AND dra.is_revoked = FALSE
            UNION
            SELECT a.patient_id FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            WHERE d.profile_id = auth.uid()
        )
    );

-- Doctors can insert or review AI analyses for authorized patients
DROP POLICY IF EXISTS "Doctors manage AI analyses" ON ai_analyses;
CREATE POLICY "Doctors manage AI analyses" ON ai_analyses
    FOR ALL
    USING (
        patient_id IN (
            SELECT dra.patient_id FROM doctor_record_access dra
            JOIN doctors d ON d.id = dra.doctor_id
            WHERE d.profile_id = auth.uid() AND dra.is_revoked = FALSE
            UNION
            SELECT a.patient_id FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            WHERE d.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        patient_id IN (
            SELECT dra.patient_id FROM doctor_record_access dra
            JOIN doctors d ON d.id = dra.doctor_id
            WHERE d.profile_id = auth.uid() AND dra.is_revoked = FALSE
            UNION
            SELECT a.patient_id FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            WHERE d.profile_id = auth.uid()
        )
    );
