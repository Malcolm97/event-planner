-- Recent Activities Dashboard Queries for Supabase
-- These queries can be used in your dashboard to show user activities

-- 1. Get recent activities for the logged-in user (last 10 activities)
SELECT
    id,
    activity_type,
    description,
    metadata,
    event_id,
    event_name,
    created_at
FROM activities
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 2. Get recent activities with formatted activity type names
SELECT
    id,
    CASE
        WHEN activity_type = 'event_created' THEN 'Created Event'
        WHEN activity_type = 'event_updated' THEN 'Updated Event'
        WHEN activity_type = 'event_saved' THEN 'Saved Event'
        WHEN activity_type = 'event_completed' THEN 'Completed Event'
        WHEN activity_type = 'profile_updated' THEN 'Updated Profile'
        WHEN activity_type = 'event_viewed' THEN 'Viewed Event'
        ELSE activity_type
    END as formatted_activity_type,
    description,
    metadata,
    event_id,
    event_name,
    created_at
FROM activities
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 3. Get activity count by type for the logged-in user
SELECT
    activity_type,
    COUNT(*) as activity_count
FROM activities
WHERE user_id = auth.uid()
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type
ORDER BY activity_count DESC;

-- 4. Get recent activities with event details (if you want to join with events table)
SELECT
    a.id,
    a.activity_type,
    a.description,
    a.metadata,
    a.event_id,
    a.event_name,
    a.created_at,
    e.title as event_title,
    e.date as event_date,
    e.location as event_location
FROM activities a
LEFT JOIN events e ON a.event_id = e.id
WHERE a.user_id = auth.uid()
ORDER BY a.created_at DESC
LIMIT 10;

-- 5. Get activities for a specific date range
SELECT
    id,
    activity_type,
    description,
    created_at
FROM activities
WHERE user_id = auth.uid()
    AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 6. Get the most recent activity for each type
SELECT DISTINCT ON (activity_type)
    activity_type,
    description,
    created_at
FROM activities
WHERE user_id = auth.uid()
ORDER BY activity_type, created_at DESC;

-- 7. Count total activities for the logged-in user
SELECT COUNT(*) as total_activities
FROM activities
WHERE user_id = auth.uid();

-- 8. Get activities with pagination (for loading more activities)
SELECT
    id,
    activity_type,
    description,
    created_at
FROM activities
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10 OFFSET 0; -- Change OFFSET value for pagination

-- Note: These queries use auth.uid() to ensure users only see their own activities
-- The RLS policies in your activities table already enforce this security
