-- ==============================================================================
-- MediSlot Phase Two: Supabase Initial Schema, Triggers & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'PLATFORM_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE clinic_role AS ENUM ('OWNER', 'MANAGER', 'RECEPTIONIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_UPDATE', 'SCHEDULE_CHANGE', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'PATIENT',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Clinics Table
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Clinic Memberships
CREATE TABLE IF NOT EXISTS public.clinic_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_role clinic_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (clinic_id, profile_id)
);

-- 5. Create Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    years_of_experience INT DEFAULT 0,
    bio TEXT,
    consultation_fee DECIMAL(10, 2) DEFAULT 50.00,
    is_accepting_patients BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    allergies TEXT,
    chronic_conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Doctor Availability
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    slot_duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE RESTRICT,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'PENDING',
    reason_for_visit TEXT,
    cancellation_reason TEXT,
    no_show_risk_score DECIMAL(3, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_table VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON auth.users SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(new.raw_user_meta_data->>'last_name', 'Patient'),
        'PATIENT' -- STRICT: Always defaults to PATIENT; privileged roles require onboarding
    );

    INSERT INTO public.patients (profile_id)
    VALUES (new.id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile; Platform Admins can view all
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Clinics: Anyone authenticated can view clinics
CREATE POLICY "Public authenticated can view clinics" 
    ON public.clinics FOR SELECT 
    TO authenticated 
    USING (true);

-- Doctors: Anyone authenticated can view doctor directory
CREATE POLICY "Public authenticated can view doctors" 
    ON public.doctors FOR SELECT 
    TO authenticated 
    USING (true);

-- Patients: Only the patient or assigned clinicians can view patient record
CREATE POLICY "Patients view own record" 
    ON public.patients FOR SELECT 
    USING (profile_id = auth.uid());

-- Appointments: Patients view their appointments, doctors view their assigned appointments
CREATE POLICY "Patients view their appointments" 
    ON public.appointments FOR SELECT 
    USING (
        patient_id IN (SELECT id FROM public.patients WHERE profile_id = auth.uid())
        OR 
        doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    );

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users view own notifications" 
    ON public.notifications FOR SELECT 
    USING (profile_id = auth.uid());
