# PNG Events - Production Deployment Guide

A modern, offline-first Progressive Web App (PWA) for discovering local events in Papua New Guinea.

## 🚀 Production Deployment Checklist

### ✅ Completed Tasks

- [x] **Vercel Configuration**: Fixed `vercel.json` for proper Next.js routing
- [x] **ESLint Configuration**: Updated to be compatible with Next.js 15 (warnings present but non-blocking)
- [x] **Environment Variables**: Created `.env.example` template
- [x] **PWA Features**: Verified manifest.json and service worker implementation
- [x] **Error Handling**: Confirmed error boundaries and error handling utilities
- [x] **Production Build**: Verified successful build completion

### 🔄 Manual Verification Required

- [ ] **Database Migrations**: Apply all SQL migrations to production Supabase instance
- [ ] **Environment Variables**: Set up production environment variables in Vercel
- [ ] **PWA Testing**: Test offline functionality and PWA installation
- [ ] **Security Review**: Verify RLS policies and authentication
- [ ] **Performance Testing**: Test load times and Core Web Vitals

## 📋 Database Setup

Run the following SQL files in your Supabase SQL Editor in order:

1. `complete-schema-setup.sql` - Core tables and RLS policies
2. `supabase-rls-setup.sql` - Storage policies for images
3. `add_end_date_migration.sql` - Optional end date support
4. `user_contact_migration.sql` - Contact preferences
5. `create_activities_table.sql` - User activity tracking
6. `recent_activities_dashboard.sql` - Dashboard queries

## 🔧 Environment Variables

Set these in your Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NODE_ENV=production
```

## 🏗️ Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server (for testing)
npm start
```

## 📱 PWA Features

- **Offline Support**: Service worker caches critical assets and API responses
- **Installable**: Manifest.json configured for PWA installation
- **Background Sync**: Periodic data updates when online
- **Push Notifications**: Support for event updates (requires additional setup)

## 🔒 Security Features

- **Row Level Security (RLS)**: Enabled on all database tables
- **Authentication**: Supabase Auth integration
- **API Route Protection**: Server-side authentication checks
- **Input Validation**: Comprehensive validation on all forms

## 📊 Performance

- **Next.js 15**: Latest framework with App Router
- **Optimized Builds**: Code splitting and tree shaking
- **Image Optimization**: Next.js built-in image optimization
- **Caching Strategy**: Multi-layer caching (service worker + browser)

## 🐛 Known Issues

- ESLint shows warnings during build (non-blocking)
- Some TypeScript strict mode issues may appear (under review)

## 📞 Support

For production deployment issues, check:
1. Vercel deployment logs
2. Supabase dashboard for database errors
3. Browser developer tools for client-side issues

## 🔄 Post-Deployment

After successful deployment:

1. Test PWA installation on mobile devices
2. Verify offline functionality works
3. Check Core Web Vitals in search console
4. Monitor error rates and performance
5. Set up monitoring and alerting

---

Built with ❤️ for Papua New Guinea's event community.
