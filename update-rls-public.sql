-- Update RLS Policies for Public Admin Access
-- Since admin pages are now public, update policies to allow public access

-- Categories table - allow public access
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Public can manage categories" ON public.categories
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Activities table - allow public access
DROP POLICY IF EXISTS "Admins can view all activities" ON activities;
DROP POLICY IF EXISTS "Admins can manage all activities" ON activities;
CREATE POLICY "Public can view all activities" ON activities
FOR SELECT TO public
USING (true);

CREATE POLICY "Public can manage all activities" ON activities
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Saved events table - allow public access
DROP POLICY IF EXISTS "Admins can view all saved events" ON saved_events;
DROP POLICY IF EXISTS "Admins can manage all saved events" ON saved_events;
CREATE POLICY "Public can view all saved events" ON saved_events
FOR SELECT TO public
USING (true);

CREATE POLICY "Public can manage all saved events" ON saved_events
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Profiles table - allow public read access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Public can view all profiles" ON public.profiles
FOR SELECT TO public
USING (true);

-- Events table - allow public access
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Public can manage events" ON public.events
FOR ALL TO public
USING (true)
WITH CHECK (true);
