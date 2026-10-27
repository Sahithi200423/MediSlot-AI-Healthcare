-- ==============================================================================
-- 006_appointment_status_transitions.sql
-- MediSlot Phase Four: Lifecycle Status Transitions (CHECKED_IN, IN_CONSULTATION)
-- ==============================================================================

DO $$ BEGIN
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'CHECKED_IN';
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'IN_CONSULTATION';
EXCEPTION
    WHEN others THEN null;
END $$;
