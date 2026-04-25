# Supabase Storage Setup for Event Images

## 🚀 Quick Setup (Recommended)

### Step 1: Create Storage Bucket
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dvqmdzzekmegwzcwfara`
3. Navigate to **Storage** in the left sidebar
4. Click **Create Bucket**
5. Enter bucket details:
   - **Name**: `event-images`
   - **Public bucket**: ✅ Enable (checked)
6. Click **Create bucket**

### Step 2: Configure Bucket Policies
1. In the Storage section, click on the `event-images` bucket
2. Go to **Policies** tab
3. Click **Add Policy** and create these policies:

#### Policy 1: Public Read Access
```sql
-- Allow anyone to view event images
CREATE POLICY "Public read access for event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');
```

#### Policy 2: Authenticated Upload
```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images'
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: User Update (Optional)
```sql
-- Allow users to update their own images
CREATE POLICY "Users can update their own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: User Delete (Optional)
```sql
-- Allow users to delete their own images
CREATE POLICY "Users can delete their own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔧 Manual SQL Setup (Alternative)

If you prefer to run SQL directly:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `create_storage_bucket.sql`
3. Click **Run**

## ✅ Verification

After setup, test that storage is working:

```bash
# Check if bucket exists
curl "https://dvqmdzzekmegwzcwfara.supabase.co/storage/v1/bucket/event-images" \
  -H "apikey: YOUR_ANON_KEY"

# Should return bucket details, not a 404 error
```

## 📁 Expected Image URLs

Once configured, uploaded images will have URLs like:
```
https://dvqmdzzekmegwzcwfara.supabase.co/storage/v1/object/public/event-images/filename.jpg
```

Your Next.js configuration already supports these URLs! 🎉

## 🧪 Testing

1. Create a new event with images through your app
2. Check that images display properly in EventCards
3. Verify images load in EventModal and EventDetailsTab
4. Check browser console for any debug information

## 🔍 Troubleshooting

- **403 Unauthorized**: Check your RLS policies
- **404 Not Found**: Bucket doesn't exist or wrong name
- **Images not loading**: Verify bucket is public and policies are correct

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard for error messages
2. Verify bucket name matches exactly: `event-images`
3. Ensure bucket is set to public
4. Check browser network tab for failed requests
