-- Set Admin Role for test@test.com
-- Run this in your Supabase SQL Editor to give admin privileges to the test user

-- Update the profile for test@test.com to have admin role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'test@test.com'
);

-- Verify the update
SELECT
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test@test.com';