-- Migration: Add creator profile features
-- Run this in your Supabase SQL Editor to enable new profile features

-- Add verification columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add creator stats columns (denormalized for performance)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_attendees INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_event_views INTEGER DEFAULT 0;

-- Add creator categories (event types they specialize in)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_categories TEXT[] DEFAULT '{}';

-- Add response time tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_response_hours INTEGER;

-- Create index for verified creators
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = TRUE;

-- Create index for follower count (for sorting by popularity)
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON profiles(follower_count DESC);

-- Create table for creator followers (many-to-many relationship)
CREATE TABLE IF NOT EXISTS creator_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, follower_id)
);

-- Create indexes for the followers table
CREATE INDEX IF NOT EXISTS idx_creator_followers_creator ON creator_followers(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_followers_follower ON creator_followers(follower_id);

-- Enable RLS on creator_followers table
ALTER TABLE creator_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_followers
CREATE POLICY "Anyone can view followers" ON creator_followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow creators" ON creator_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow creators" ON creator_followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Function to update follower count when a follow is added/removed
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.creator_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update follower count
DROP TRIGGER IF EXISTS trigger_update_follower_count ON creator_followers;
CREATE TRIGGER trigger_update_follower_count
  AFTER INSERT OR DELETE ON creator_followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- Comments for documentation
COMMENT ON COLUMN profiles.is_verified IS 'Whether this creator is verified';
COMMENT ON COLUMN profiles.verified_at IS 'Timestamp when the creator was verified';
COMMENT ON COLUMN profiles.follower_count IS 'Number of followers (denormalized for performance)';
COMMENT ON COLUMN profiles.total_attendees IS 'Total attendees across all events';
COMMENT ON COLUMN profiles.total_event_views IS 'Total views across all events';
COMMENT ON COLUMN profiles.creator_categories IS 'Event categories this creator specializes in';
COMMENT ON COLUMN profiles.avg_response_hours IS 'Average response time in hours';
COMMENT ON TABLE creator_followers IS 'Many-to-many relationship for creator followers';