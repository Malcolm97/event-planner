-- Migration to create rate_limits table for database-backed rate limiting
-- Run this in your Supabase SQL Editor

-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on reset_time for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Set up RLS policies (adjust as needed for your security requirements)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for rate limiting (IP-based, no sensitive data)
CREATE POLICY "Allow public rate limit operations" ON rate_limits
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to cleanup old rate limit entries (call this periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_time < NOW();
END;
$$;

-- Comment explaining the table
COMMENT ON TABLE rate_limits IS 'Stores rate limit counters for API endpoints. Used for database-backed rate limiting in serverless environments.';
