-- ==============================================================================
-- 004_appointment_booking_engine.sql
-- MediSlot Phase Four: Real Appointment Booking Engine & Concurrency Lock
-- ==============================================================================

-- 1. Add Booking Reference, Visit Type, Fee, and Payment Status columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(64),
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50) DEFAULT 'IN_CLINIC',
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'PAY_AT_CLINIC',
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;

-- 2. Populate existing null booking_references if any exist
UPDATE public.appointments 
SET booking_reference = 'MS-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE booking_reference IS NULL;

-- 3. Enforce Unique constraint on booking_reference
CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_reference ON public.appointments (booking_reference);

-- 4. Database-enforced Double Booking Protection
-- Partial unique index guarantees at PostgreSQL engine level that no two active
-- (non-cancelled) appointments can ever share the same doctor and start time!
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_doctor_appointment 
ON public.appointments (doctor_id, scheduled_start) 
WHERE status != 'CANCELLED';

-- 5. Additional index on patient and status for efficient My Appointments queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status 
ON public.appointments (patient_id, status, scheduled_start DESC);

-- 6. Additional index on clinic and scheduled_start for clinic master ledger
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON public.appointments (clinic_id, scheduled_start);
