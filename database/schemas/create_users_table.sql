-- Create users table for storing user profiles
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    company TEXT,
    phone TEXT,
    about TEXT,
    photo_url TEXT,
    contact_method TEXT DEFAULT 'both' CHECK (contact_method IN ('email', 'phone', 'both', 'none')),
    whatsapp_number TEXT,
    contact_visibility BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_contact_method ON public.users(contact_method);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles with contact information and preferences';
COMMENT ON COLUMN public.users.contact_method IS 'Preferred contact method: email, phone, both, or none';
COMMENT ON COLUMN public.users.whatsapp_number IS 'WhatsApp phone number for contact';
COMMENT ON COLUMN public.users.contact_visibility IS 'Whether contact information is publicly visible to logged-in users';
