-- Complete Admin Data Setup SQL
-- Run this in your Supabase SQL Editor to enable all admin data access

-- ===========================================
-- RLS POLICY UPDATES FOR PUBLIC ACCESS
-- ===========================================

-- Categories table - allow public access
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
FOR SELECT TO public
USING (true);

-- Profiles table - allow public read access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Public can view all profiles" ON public.profiles
FOR SELECT TO public
USING (true);

-- Events table - allow public access
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Public can view events" ON public.events
FOR SELECT TO public
USING (true);

-- Activities table - allow public access
DROP POLICY IF EXISTS "Admins can view all activities" ON activities;
CREATE POLICY "Public can view all activities" ON activities
FOR SELECT TO public
USING (true);

-- ===========================================
-- CREATE SAMPLE DATA
-- ===========================================

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
('Music', 'Music events and concerts'),
('Sports', 'Sports events and games'),
('Technology', 'Tech conferences and meetups'),
('Food & Drink', 'Food festivals and tastings'),
('Arts', 'Art exhibitions and performances')
ON CONFLICT (name) DO NOTHING;

-- Insert sample locations (matching webapp location options)
INSERT INTO public.locations (name, description) VALUES
('Port Moresby, Papua New Guinea', 'Capital city of Papua New Guinea'),
('Lae, Papua New Guinea', 'Second largest city in Papua New Guinea'),
('Madang, Papua New Guinea', 'Coastal city known for diving and marine life'),
('Mount Hagen, Papua New Guinea', 'Highlands city in Western Highlands Province'),
('Goroka, Papua New Guinea', 'City in Eastern Highlands Province'),
('Rabaul, Papua New Guinea', 'Volcanic city in East New Britain Province'),
('Wewak, Papua New Guinea', 'Coastal city in East Sepik Province'),
('Popondetta, Papua New Guinea', 'Capital of Oro Province'),
('Arawa, Papua New Guinea', 'Capital of Bougainville Region'),
('Kavieng, Papua New Guinea', 'Capital of New Ireland Province'),
('Daru, Papua New Guinea', 'Town in Western Province'),
('Vanimo, Papua New Guinea', 'Border town in Sandaun Province'),
('Kimbe, Papua New Guinea', 'Capital of West New Britain Province'),
('Mendi, Papua New Guinea', 'Capital of Southern Highlands Province'),
('Kundiawa, Papua New Guinea', 'Town in Chimbu Province'),
('Lorengau, Papua New Guinea', 'Capital of Manus Province'),
('Wabag, Papua New Guinea', 'Capital of Enga Province'),
('Kokopo, Papua New Guinea', 'Town near Rabaul, East New Britain Province'),
('Buka, Papua New Guinea', 'Town in Bougainville Region'),
('Alotau, Papua New Guinea', 'Capital of Milne Bay Province')
ON CONFLICT (name) DO NOTHING;

-- Insert sample events (if events table is empty)
INSERT INTO public.events (name, category, location, date, description, approved, created_at) VALUES
('Summer Music Festival', 'Music', 'Port Moresby, Papua New Guinea', NOW() + INTERVAL '30 days', 'A fantastic music festival featuring local and international artists.', true, NOW()),
('Tech Conference 2024', 'Technology', 'Port Moresby, Papua New Guinea', NOW() + INTERVAL '60 days', 'Latest trends in technology and innovation.', true, NOW()),
('Food Festival', 'Food & Drink', 'Lae, Papua New Guinea', NOW() + INTERVAL '15 days', 'Taste the best local cuisine from Papua New Guinea.', false, NOW()),
('Art Exhibition', 'Arts', 'Madang, Papua New Guinea', NOW() + INTERVAL '45 days', 'Contemporary art from local artists.', true, NOW()),
('Sports Tournament', 'Sports', 'Kokopo, Papua New Guinea', NOW() + INTERVAL '20 days', 'Annual sports tournament featuring multiple disciplines.', false, NOW())
ON CONFLICT DO NOTHING;

-- ===========================================
-- VERIFY SETUP
-- ===========================================

-- Check categories
SELECT 'Categories count:' as info, COUNT(*) as count FROM public.categories
UNION ALL
-- Check locations
SELECT 'Locations count:' as info, COUNT(*) as count FROM public.locations
UNION ALL
-- Check events
SELECT 'Events count:' as info, COUNT(*) as count FROM public.events
UNION ALL
-- Check profiles
SELECT 'Profiles count:' as info, COUNT(*) as count FROM public.profiles;

-- Show sample data
SELECT 'Categories:' as type, name, description FROM public.categories LIMIT 5;
SELECT 'Locations:' as type, name, description FROM public.locations LIMIT 5;
SELECT 'Events:' as type, name, category, approved FROM public.events LIMIT 5;
