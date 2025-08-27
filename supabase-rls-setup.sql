-- Supabase RLS Setup for Event Images
-- Run this in your Supabase SQL Editor

-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload images to event-images bucket
CREATE POLICY "Allow authenticated users to upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to view images from event-images bucket
CREATE POLICY "Allow users to view event images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-images'
);

-- Allow users to update their own images
CREATE POLICY "Allow users to update their own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: If you want to disable RLS completely for development
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
