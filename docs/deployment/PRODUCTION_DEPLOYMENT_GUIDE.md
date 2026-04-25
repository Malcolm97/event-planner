# 🚀 PNG Events - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Build Verification
- [x] Build completed successfully (19.9s)
- [x] No TypeScript errors
- [x] All 37 routes generated
- [x] 21 static pages, 16 dynamic routes
- [x] Bundle optimization complete

### 🔧 Critical Configuration Required

#### 1. Environment Variables Setup

**File: `.env.local`**

```bash
# Replace these placeholder values with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Push Notifications (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAt5qY9WZafW_cuuKO3mdjZgaG5lmmDsN-GwlVgtybwvoOUyd3Oylz4qNmD1J8qfB4hvMCFddyHD0BgpVIV8GgE
VAPID_PRIVATE_KEY=trOW1dGTwoyaRe9HDQqfXlGR3tOX-XNMnF6D6SbHRXU
VAPID_SUBJECT=mailto:admin@event-planner.local
VAPID_EMAIL=admin@event-planner.local

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project or use existing one
3. Get your Project URL and anon key from Settings → API
4. Update `.env.local` with real credentials

#### 2. Database Setup

**Required SQL Files to Run in Supabase SQL Editor:**

1. **Core Schema** (`database/schemas/complete-schema-setup.sql`)
2. **RLS Policies** (`database/schemas/supabase-rls-setup.sql`)
3. **Categories** (`database/schemas/create_categories_table.sql`)
4. **Push Subscriptions** (`database/schemas/create_push_subscriptions_table.sql`)
5. **Activities** (`database/schemas/create_activities_table.sql`)
6. **Locations** (`database/schemas/create_locations_table.sql`)

**Quick Setup Script:**
```bash
# Run this in your project root after setting up Supabase
node scripts/create-admin-user.js
node scripts/create-categories.js
```

#### 3. Admin User Creation

After database setup, create an admin user:

```bash
# Create admin user
node scripts/create-admin-user.js

# Create default categories
node scripts/create-categories.js
```

### 🌐 Vercel Deployment

#### 1. Environment Variables in Vercel

Add these to your Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NODE_ENV=production
```

#### 2. Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev"
}
```

#### 3. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

### 🔒 Security Verification

#### 1. RLS Policies Check
Verify these policies are enabled in Supabase:
- ✅ `events` table RLS enabled
- ✅ `users` table RLS enabled  
- ✅ `push_subscriptions` table RLS enabled
- ✅ `activities` table RLS enabled
- ✅ `categories` table RLS enabled

#### 2. CORS Configuration
In Supabase Settings → API, ensure CORS allows:
```
https://your-domain.vercel.app
http://localhost:3000 (for development)
```

#### 3. Rate Limiting
Verify rate limits are configured:
- API: 100 requests/15 minutes
- Admin: 50 requests/15 minutes  
- Auth: 10 requests/15 minutes

### 📱 PWA Verification

#### 1. Manifest Validation
Check `/manifest.json` contains:
- ✅ All required icons (192x192, 512x512)
- ✅ iOS splash screens
- ✅ Proper theme colors
- ✅ Short name and description

#### 2. Service Worker Test
Verify service worker functionality:
```javascript
// Test in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations.length);
  registrations.forEach(reg => console.log(reg.scope));
});
```

#### 3. Push Notifications Test
Test push notification setup:
```bash
# Test VAPID configuration
node test-vapid-config.js
```

### 🧪 Testing Checklist

#### 1. Local Testing
```bash
# Start production server locally
npm run start

# Test these endpoints:
# http://localhost:3000 (homepage)
# http://localhost:3000/admin (admin dashboard)
# http://localhost:3000/api/health (health check)
```

#### 2. Functionality Tests
- [ ] Homepage loads with events
- [ ] Event creation works
- [ ] User authentication works
- [ ] Admin dashboard accessible
- [ ] PWA install prompt appears
- [ ] Offline mode works
- [ ] Push notifications work

#### 3. Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals green
- [ ] Bundle size optimized

### 📊 Post-Deployment Monitoring

#### 1. Health Checks
Monitor these endpoints:
- `https://your-domain.vercel.app/api/health`
- `https://your-domain.vercel.app/admin/dashboard`

#### 2. Error Monitoring
Set up error tracking:
- [ ] Sentry integration
- [ ] Vercel Analytics
- [ ] Supabase logs monitoring

#### 3. Performance Monitoring
- [ ] Core Web Vitals tracking
- [ ] Page speed monitoring
- [ ] API response time monitoring

### 🚨 Troubleshooting

#### Common Issues

**Build Failures:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Rebuild with clean cache
rm -rf .next
npm run build
```

**Database Connection Issues:**
```bash
# Test Supabase connection
node -e "const { supabase } = require('./src/lib/supabase'); supabase.from('users').select('*').then(console.log)"
```

**PWA Not Installing:**
- Check manifest.json validity
- Verify service worker registration
- Test on different browsers

**Push Notifications Not Working:**
- Verify VAPID keys are correct
- Check browser push notification permissions
- Test with different browsers

### 📞 Support Resources

#### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Deployment](https://vercel.com/docs/deployments)

#### Monitoring Tools
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry Error Tracking](https://sentry.io)
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)

### 🎯 Success Criteria

**Before Go-Live:**
- [ ] All tests pass
- [ ] Performance targets met
- [ ] Security checks passed
- [ ] PWA features working
- [ ] Push notifications tested

**Post-Deployment:**
- [ ] No critical errors in logs
- [ ] User registration working
- [ ] Event creation functional
- [ ] Admin dashboard accessible
- [ ] PWA installable on mobile

---

## 🚀 Ready for Production!

Your PNG Events webapp is now configured for production deployment. Follow this guide step by step to ensure a smooth deployment process.

**Estimated Deployment Time:** 30 minutes
**Required Tools:** Node.js, Vercel CLI, Supabase account
**Difficulty Level:** Intermediate

For any issues during deployment, refer to the troubleshooting section or check the project documentation.