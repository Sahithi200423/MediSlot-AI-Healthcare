-- ==============================================================================
-- MediSlot Phase Three: Doctor & Clinic Management, Scheduling, Breaks & Leaves
-- ==============================================================================

-- 1. Add Columns to Clinics
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(100) DEFAULT '08:00 - 20:00',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- 2. Add Columns to Doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- 3. Create Doctor Breaks Table
CREATE TABLE IF NOT EXISTS public.doctor_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    title VARCHAR(100) DEFAULT 'Break',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Doctor Leaves Table
CREATE TABLE IF NOT EXISTS public.doctor_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Clinic Invitations Table
CREATE TABLE IF NOT EXISTS public.clinic_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'DOCTOR',
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.doctor_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_invitations ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Public authenticated can view doctor breaks" 
    ON public.doctor_breaks FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Public authenticated can view doctor leaves" 
    ON public.doctor_leaves FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Doctors can manage own breaks" 
    ON public.doctor_breaks FOR ALL 
    TO authenticated 
    USING (doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid()));

CREATE POLICY "Doctors can manage own leaves" 
    ON public.doctor_leaves FOR ALL 
    TO authenticated 
    USING (doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid()));

CREATE POLICY "Clinic staff view invitations" 
    ON public.clinic_invitations FOR SELECT 
    TO authenticated 
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_memberships WHERE profile_id = auth.uid()
        )
    );
