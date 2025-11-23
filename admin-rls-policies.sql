-- Admin RLS Policies for Activities and System Data Access
-- Run this in your Supabase SQL Editor after admin-schema-setup.sql

-- Allow admins to view all activities (for admin dashboard)
CREATE POLICY "Admins can view all activities" ON activities
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage all activities
CREATE POLICY "Admins can manage all activities" ON activities
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to view all saved_events
CREATE POLICY "Admins can view all saved events" ON saved_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage all saved_events
CREATE POLICY "Admins can manage all saved events" ON saved_events
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to view all push_subscriptions (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
    EXECUTE 'CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
             FOR SELECT TO authenticated
             USING (
               EXISTS (
                 SELECT 1 FROM public.profiles
                 WHERE profiles.id = auth.uid()
                 AND profiles.role = ''admin''
               )
             )';

    EXECUTE 'CREATE POLICY "Admins can manage all push subscriptions" ON push_subscriptions
             FOR ALL TO authenticated
             USING (
               EXISTS (
                 SELECT 1 FROM public.profiles
                 WHERE profiles.id = auth.uid()
                 AND profiles.role = ''admin''
               )
             )';
  END IF;
END $$;

-- Ensure admin policies for profiles are comprehensive
-- (These should already exist from admin-schema-setup.sql, but ensuring they're correct)

-- Allow admins to view all profiles (confirming this exists)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Allow admins to update any profile (confirming this exists)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Allow admins to delete profiles (confirming this exists)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);
