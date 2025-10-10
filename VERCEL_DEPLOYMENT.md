# Vercel Production Deployment Guide

## 🚀 Environment Variables Setup

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your "event-planner" project

### Step 2: Configure Environment Variables
1. Click on the **"Settings"** tab
2. Click on **"Environment Variables"** in the left sidebar
3. Click **"Add New"** for each variable:

#### Required Production Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-production-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
| `NODE_ENV` | `production` | Production |

### Step 3: Get Production Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in and select your **production project** (not development)
3. Go to **Settings → API**
4. Copy the **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Deploy to Production

1. In your Vercel project dashboard, click **"Deployments"**
2. Click **"Deploy"** to trigger a new production deployment
3. Wait for the build to complete (usually 2-3 minutes)
4. Once deployed, your app will be live at `https://your-project-name.vercel.app`

## 🔍 Verification Steps

After deployment, verify these work:

1. **Basic Functionality**: Can you access the homepage?
2. **Authentication**: Can users sign in/sign up?
3. **Database Connection**: Do events load from the database?
4. **PWA Features**: Can you install the app on mobile?

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs for specific errors
- Ensure all environment variables are set correctly
- Verify Supabase production project is accessible

### Database Connection Issues
- Double-check the production Supabase URL and key
- Ensure RLS policies are enabled in production
- Check Supabase dashboard for any errors

### PWA Not Working
- Verify `manifest.json` is accessible
- Check service worker registration in browser dev tools
- Ensure all icon files are in the `public/icons/` directory

## 📊 Monitoring

After deployment:
1. Check **Core Web Vitals** in Vercel Analytics
2. Monitor **error rates** in Vercel dashboard
3. Set up **real user monitoring** if needed
4. Check **PWA install rates** on mobile devices

## 🔄 Updates

When you push changes to your main branch:
- Vercel will automatically deploy the updates
- Test in production before announcing to users
- Monitor for any breaking changes

---

**Need Help?** Check the [Vercel Documentation](https://vercel.com/docs) or [Supabase Docs](https://supabase.com/docs).
