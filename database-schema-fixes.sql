-- Database Schema Fixes Migration
-- Run this in your Supabase SQL Editor to fix critical schema issues

-- ===========================================
-- PHASE 1: Critical Database Schema Fixes
-- ===========================================

-- 1. Fix type mismatch in activities table (event_id should be TEXT to match events.id)
-- First, we need to handle existing data and constraints
DO $$
BEGIN
    -- Check if activities table exists and has event_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'activities' AND column_name = 'event_id') THEN

        -- Drop existing foreign key constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'activities' AND constraint_name = 'activities_event_id_fkey') THEN
            ALTER TABLE activities DROP CONSTRAINT activities_event_id_fkey;
        END IF;

        -- Change event_id type from UUID to TEXT
        ALTER TABLE activities ALTER COLUMN event_id TYPE TEXT;
    END IF;
END $$;

-- 2. Fix type mismatch in saved_events table (event_id should be TEXT to match events.id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'saved_events' AND column_name = 'event_id') THEN

        -- Drop existing foreign key constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'saved_events' AND constraint_name = 'saved_events_event_id_fkey') THEN
            ALTER TABLE saved_events DROP CONSTRAINT saved_events_event_id_fkey;
        END IF;

        -- Change event_id type from UUID to TEXT
        ALTER TABLE saved_events ALTER COLUMN event_id TYPE TEXT;
    END IF;
END $$;

-- 3. Add proper foreign key constraints with CASCADE DELETE
-- Activities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'activities' AND constraint_name = 'activities_event_id_fkey') THEN
        ALTER TABLE activities ADD CONSTRAINT activities_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Saved events table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'saved_events' AND constraint_name = 'saved_events_event_id_fkey') THEN
        ALTER TABLE saved_events ADD CONSTRAINT saved_events_event_id_fkey
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Push subscriptions table (already has proper foreign key)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'push_subscriptions' AND constraint_name = 'push_subscriptions_user_id_fkey') THEN
        ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add missing indexes for performance
-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_date_category ON events(date, category);
CREATE INDEX IF NOT EXISTS idx_events_featured_date ON events(featured, date);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_contact_method ON users(contact_method);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- Activities table indexes (additional ones)
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Saved events table indexes (additional ones)
CREATE INDEX IF NOT EXISTS idx_saved_events_created_at ON saved_events(created_at DESC);

-- Push subscriptions table indexes (additional ones)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at DESC);

-- 5. Add check constraints for data validation
-- Events table constraints
DO $$
BEGIN
    -- Price constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'events_presale_price_check') THEN
        ALTER TABLE events ADD CONSTRAINT events_presale_price_check
            CHECK (presale_price IS NULL OR presale_price >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'events_gate_price_check') THEN
        ALTER TABLE events ADD CONSTRAINT events_gate_price_check
            CHECK (gate_price IS NULL OR gate_price >= 0);
    END IF;

    -- Date constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'events_end_date_check') THEN
        ALTER TABLE events ADD CONSTRAINT events_end_date_check
            CHECK (end_date IS NULL OR end_date > date);
    END IF;
END $$;

-- Users table constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'users_contact_method_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_contact_method_check
            CHECK (contact_method IN ('email', 'phone', 'both', 'none'));
    END IF;
END $$;

-- 6. Add updated_at triggers for automatic timestamp updates
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables that have updated_at columns
DO $$
BEGIN
    -- Events table
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers
                   WHERE trigger_name = 'trigger_events_updated_at') THEN
        CREATE TRIGGER trigger_events_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers
                   WHERE trigger_name = 'trigger_users_updated_at') THEN
        CREATE TRIGGER trigger_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Push subscriptions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers
                   WHERE trigger_name = 'trigger_push_subscriptions_updated_at') THEN
        CREATE TRIGGER trigger_push_subscriptions_updated_at
            BEFORE UPDATE ON push_subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7. Add missing updated_at column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'updated_at') THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- 8. Verify all changes
-- Check that all tables have proper structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('events', 'users', 'activities', 'saved_events', 'push_subscriptions')
ORDER BY tablename;

-- Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('events', 'users', 'activities', 'saved_events', 'push_subscriptions')
ORDER BY tablename, indexname;

-- Check constraints
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('events', 'users', 'activities', 'saved_events', 'push_subscriptions')
ORDER BY tc.table_name, tc.constraint_name;
