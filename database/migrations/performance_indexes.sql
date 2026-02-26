-- Performance Indexes for PNG Events
-- Run this migration to add indexes that improve query performance
-- Updated to match actual database schema

-- Events table indexes (all columns exist in schema)
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events(location);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_date_category ON public.events(date, category);
CREATE INDEX IF NOT EXISTS idx_events_date_location ON public.events(date, location);

-- Saved events table indexes (all columns exist in schema)
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_user_event ON public.saved_events(user_id, event_id);

-- Profiles table indexes (only columns that exist: id, full_name, avatar_url, updated_at)
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Analyze tables to update statistics (PostgreSQL)
ANALYZE public.events;
ANALYZE public.saved_events;
ANALYZE public.profiles;

-- Note: Only create indexes for tables that exist in your database
-- The following tables may not exist yet, so they are commented out:
-- activities, push_subscriptions, audit_logs, categories, locations

-- Uncomment and run these only after creating the respective tables:

-- Activities table indexes (uncomment when table exists)
-- CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
-- CREATE INDEX IF NOT EXISTS idx_activities_event_id ON public.activities(event_id);
-- CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
-- CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

-- Push subscriptions table indexes (uncomment when table exists)
-- CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Audit logs table indexes (uncomment when table exists)
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Categories table indexes (uncomment when table exists)
-- CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Locations table indexes (uncomment when table exists)
-- CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);