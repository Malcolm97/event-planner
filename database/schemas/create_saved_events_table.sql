-- Create saved_events table for user bookmarks
CREATE TABLE saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved events
CREATE POLICY "Users can view their own saved events" ON saved_events
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved events
CREATE POLICY "Users can save events" ON saved_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved events
CREATE POLICY "Users can unsave events" ON saved_events
FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_saved_events_user_id ON saved_events(user_id);
CREATE INDEX idx_saved_events_event_id ON saved_events(event_id);
