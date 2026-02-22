-- Set Admin Role for Multiple Users
-- Run this in your Supabase SQL Editor to give admin privileges

-- Update the profiles for both users to have admin role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('test@test.com', 'sionimalcolm@gmail.com')
);

-- Verify the updates
SELECT
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('test@test.com', 'sionimalcolm@gmail.com');