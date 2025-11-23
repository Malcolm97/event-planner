-- Performance optimization indexes for PNG Events database
-- Run this in your Supabase SQL Editor to improve query performance

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_category ON public.events(date, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_featured ON public.events(date, featured) WHERE featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_date ON public.events(location, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_category_featured ON public.events(category, featured, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_by_date ON public.events(created_by, date);

-- Text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_name_gin ON public.events USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_description_gin ON public.events USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_gin ON public.events USING gin(to_tsvector('english', location));

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming ON public.events(date) WHERE date >= CURRENT_DATE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_past ON public.events(date) WHERE date < CURRENT_DATE;

-- Indexes for saved events relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_events_user_event_date ON public.saved_events(user_id, event_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_events_event_user ON public.saved_events(event_id, user_id);

-- Push subscriptions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subscriptions_user_created ON public.push_subscriptions(user_id, created_at);

-- User profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Comments on indexes for documentation
COMMENT ON INDEX idx_events_date_category IS 'Optimizes event filtering by date and category';
COMMENT ON INDEX idx_events_date_featured IS 'Speeds up featured events queries';
COMMENT ON INDEX idx_events_location_date IS 'Improves location-based event searches';
COMMENT ON INDEX idx_events_category_featured IS 'Optimizes featured events by category';
COMMENT ON INDEX idx_events_created_by_date IS 'Speeds up user dashboard queries';
COMMENT ON INDEX idx_events_name_gin IS 'Full-text search on event names';
COMMENT ON INDEX idx_events_description_gin IS 'Full-text search on event descriptions';
COMMENT ON INDEX idx_events_location_gin IS 'Full-text search on locations';
COMMENT ON INDEX idx_events_upcoming IS 'Fast upcoming events queries';
COMMENT ON INDEX idx_events_past IS 'Fast past events queries';
COMMENT ON INDEX idx_saved_events_user_event_date IS 'Optimizes user saved events queries';
COMMENT ON INDEX idx_saved_events_event_user IS 'Speeds up event popularity calculations';
COMMENT ON INDEX idx_push_subscriptions_user_created IS 'Optimizes push notification queries';
COMMENT ON INDEX idx_profiles_updated_at IS 'Speeds up profile update queries';
