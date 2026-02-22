-- Audit Logs Table for tracking admin actions
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs table
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow service role to insert (for API routes)
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit trail for admin actions';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., user.role_changed, event.approved)';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity affected (e.g., user, event, category)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before change';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after change';