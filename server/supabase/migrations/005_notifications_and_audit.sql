-- ==============================================================================
-- 005_notifications_and_audit.sql
-- MediSlot Phase Four: Extended Notification Types
-- ==============================================================================

DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'APPOINTMENT_BOOKED';
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLED';
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED';
EXCEPTION
    WHEN others THEN null;
END $$;
