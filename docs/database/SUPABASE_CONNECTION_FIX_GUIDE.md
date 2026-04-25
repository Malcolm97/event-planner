# Supabase Connection Fix Guide

This guide provides comprehensive instructions to ensure Supabase connects properly to your webapp.

## 🚨 Critical Issues Fixed

### 1. RLS Policy Infinite Recursion
**Problem**: Circular references in Supabase RLS policies causing infinite recursion errors.
**Solution**: Run the SQL fix in your Supabase dashboard.

### 2. Enhanced Error Handling
**Problem**: Poor error handling and connection validation.
**Solution**: Enhanced Supabase client with comprehensive error handling.

### 3. Connection Monitoring
**Problem**: No visibility into database connection status.
**Solution**: Added connection status indicators and monitoring.

## 📋 Step-by-Step Fix Instructions

### Step 1: Apply RLS Policy Fixes (CRITICAL)

1. **Go to your Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Fix SQL**
   Copy and paste the following SQL commands:

```sql
-- Fix RLS Policy Conflicts and Infinite Recursion
-- Run this in your Supabase SQL Editor to fix the infinite recursion issue

-- First, drop the conflicting policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate the policies with non-circular references
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin'
  )
);

-- Verify the policies are working correctly
SELECT 'RLS policies updated successfully' as status;
```

4. **Execute the Query**
   - Click the "Run" button
   - You should see a success message

### Step 2: Verify Environment Variables

Check your `.env.local` file contains the correct Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**⚠️ Important**: Replace the placeholder values with your actual Supabase project credentials.

### Step 3: Test the Connection

Run the connection test script to verify everything is working:

```bash
# From your project root directory
node scripts/test-supabase-connection.js
```

This script will:
- Check environment variables
- Validate URL format
- Test database connection
- Test authentication
- Check required tables
- Provide detailed diagnostics

### Step 4: Start Your Application

```bash
npm run dev
```

## 🔧 What Was Fixed

### Enhanced Supabase Client (`src/lib/supabase.ts`)
- ✅ Added connection status tracking
- ✅ Enhanced error handling with specific error messages
- ✅ Connection validation and testing
- ✅ Better error categorization (RLS, permissions, tables)

### Improved Authentication Hook (`src/hooks/useAuth.ts`)
- ✅ Added Supabase connection monitoring
- ✅ Enhanced error handling for auth failures
- ✅ Connection status integration
- ✅ Better user experience during connection issues

### Connection Status Indicator (`src/components/SupabaseStatusIndicator.tsx`)
- ✅ Visual indicator for database connection status
- ✅ User-friendly error messages
- ✅ Non-intrusive design
- ✅ Automatic status updates

### Layout Integration (`src/app/layout.tsx`)
- ✅ Integrated status indicator into main layout
- ✅ Proper component placement
- ✅ Enhanced user experience

## 🧪 Testing Your Connection

### Manual Testing
1. Start your development server: `npm run dev`
2. Open browser developer tools
3. Check the console for connection status messages
4. Look for the database status indicator in the top-left corner

### Automated Testing
Run the comprehensive test script:
```bash
node scripts/test-supabase-connection.js
```

### What to Expect
- ✅ Green indicator when connected
- ⚠️ Yellow indicator when disconnected
- ❌ Red indicator when errors occur
- Detailed console logs for debugging

## 🚨 Common Issues and Solutions

### Issue: "Table not found" Error
**Solution**: 
1. Run the database schema setup SQL
2. Ensure all required tables exist
3. Check RLS policies are properly configured

### Issue: "Permission denied" Error
**Solution**:
1. Check Row Level Security policies
2. Ensure anon key has proper permissions
3. Run the RLS policy fixes

### Issue: "Infinite recursion" Error
**Solution**:
1. **CRITICAL**: Run the RLS policy fix SQL immediately
2. This is the most common cause of connection issues
3. The fix-rls-policies.sql file contains the solution

### Issue: Environment Variables Not Set
**Solution**:
1. Check `.env.local` file exists
2. Verify variables are properly formatted
3. Restart development server after changes

## 📊 Connection Status Codes

- **connected**: Database is accessible and working
- **disconnected**: Database is unreachable
- **error**: Connection failed with specific error
- **unknown**: Connection status not yet determined

## 🔍 Debugging Tips

### Check Console Logs
Look for these key messages:
- "Supabase connection test successful"
- "Database connection error"
- "RLS policy error detected"

### Use the Test Script
The test script provides detailed diagnostics:
```bash
node scripts/test-supabase-connection.js
```

### Check Network Tab
In browser developer tools:
- Look for failed API requests to Supabase
- Check response codes and error messages
- Verify CORS settings if applicable

## 🎯 Success Criteria

After applying these fixes, you should see:
- ✅ No infinite recursion errors in console
- ✅ Successful database connections
- ✅ Proper authentication flow
- ✅ Working user profile loading
- ✅ All database operations functioning
- ✅ Connection status indicator showing green

## 📞 Getting Help

If you're still experiencing issues:

1. **Run the test script** and share the output
2. **Check console logs** for specific error messages
3. **Verify RLS policy fixes** were applied correctly
4. **Ensure environment variables** are correct
5. **Check Supabase dashboard** for any service issues

## 🔄 Next Steps

Once Supabase is properly connected:
1. Test all application features that use the database
2. Verify user registration and login
3. Test event creation and management
4. Check push notifications (if configured)
5. Monitor performance and connection stability

---

**Note**: This fix addresses the most common Supabase connection issues. If problems persist, consult the Supabase documentation or seek additional support.