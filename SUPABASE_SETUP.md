# Supabase Migration Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready

## 2. Get Your Project Credentials

1. Go to Project Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Database Schema Setup

Run these SQL commands in your Supabase SQL Editor:

### Create Events Table
```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  location TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  image TEXT,
  featured BOOLEAN DEFAULT false,
  date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = created_by);
```

### Create Users Table
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  company TEXT,
  phone TEXT,
  about TEXT,
  photo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON users
  FOR DELETE USING (auth.uid() = id);
```

### Create Users By Email Table
```sql
CREATE TABLE users_by_email (
  email TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  company TEXT,
  phone TEXT,
  about TEXT,
  photo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users_by_email ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users by email are viewable by everyone" ON users_by_email
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own email record" ON users_by_email
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email record" ON users_by_email
  FOR UPDATE USING (auth.uid() = user_id);
```

## 4. Authentication Setup

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL and redirect URLs
3. Enable the providers you want (Email, Google, etc.)

## 5. Storage Setup (Optional)

If you want to use Supabase Storage for images:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called "event-images"
3. Set the bucket to public
4. Create policies for the bucket

## 6. Update Your Code

The migration has been completed! Your app now uses Supabase instead of Firebase.

## 7. Test Your App

1. Start your development server: `npm run dev`
2. Test authentication, event creation, and data fetching
3. Verify that all functionality works as expected

## Troubleshooting

- Make sure your environment variables are correct
- Check the Supabase dashboard for any errors
- Verify that your database tables and policies are set up correctly
- Check the browser console for any authentication or database errors 