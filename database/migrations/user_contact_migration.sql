-- Migration: Add contact method preferences and WhatsApp support to users table
-- Run this in your Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS contact_method TEXT DEFAULT 'both' CHECK (contact_method IN ('email', 'phone', 'both', 'none')),
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS contact_visibility BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.users.contact_method IS 'Preferred contact method: email, phone, both, or none';
COMMENT ON COLUMN public.users.whatsapp_number IS 'WhatsApp phone number for contact';
COMMENT ON COLUMN public.users.contact_visibility IS 'Whether contact information is publicly visible to logged-in users';

-- Create index for contact method queries
CREATE INDEX IF NOT EXISTS idx_users_contact_method ON public.users(contact_method);

-- Update existing users to have default contact_method based on existing contact info
UPDATE public.users
SET contact_method = CASE
  WHEN phone IS NOT NULL AND email IS NOT NULL THEN 'both'
  WHEN phone IS NOT NULL THEN 'phone'
  WHEN email IS NOT NULL THEN 'email'
  ELSE 'none'
END
WHERE contact_method IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('contact_method', 'whatsapp_number', 'contact_visibility')
ORDER BY column_name;
