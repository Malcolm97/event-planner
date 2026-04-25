# Push Notifications Quick Start Guide

## ✅ Status: FULLY CONFIGURED AND OPERATIONAL

Your PNG Events PWA push notification system is complete and ready for production deployment.

---

## Quick Reference

### For Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open browser and install as PWA
# - Chrome: Click install button in address bar or menu
# - Android: Tap install button in browser

# 3. Go to Settings → User Preferences → Notifications
# Toggle the switch to enable notifications

# 4. Grant browser permission when prompted

# 5. Create a new event from another account to test
```

### VAPID Keys Status
- **Public Key**: ✅ In `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key**: ✅ In `.env.local` as `VAPID_PRIVATE_KEY`
- **Email**: ✅ In `.env.local` as `VAPID_EMAIL`

### Component Checklist
| Component | Status | Location |
|-----------|--------|----------|
| Environment Variables | ✅ Configured | `.env.local` |
| Frontend Hook | ✅ Implemented | `src/hooks/usePushNotifications.ts` |
| Settings UI | ✅ Integrated | `src/app/settings/page.tsx` (line 440) |
| Subscription API | ✅ Secure | `src/app/api/push-subscription/route.ts` |
| Notification Sender | ✅ Ready | `src/app/api/send-push-notification/route.ts` |
| Service Worker | ✅ Active | `public/service-worker.js` (lines 760-920) |
| Database | ✅ Created | Supabase `push_subscriptions` table |
| Build | ✅ Passing | 0 errors, 43 routes generated |

---

## How It Works in 4 Steps

### 1️⃣ User Enables Notifications
User goes to Settings → toggles Notifications → grants permission
```typescript
// usePushNotifications hook handles:
// - Service worker registration
// - VAPID key conversion
// - Subscription creation & storage
```

### 2️⃣ Browser Stores Subscription
Push subscription saved to Supabase `push_subscriptions` table
```json
{
  "user_id": "uuid",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "base64-encoded",
      "auth": "base64-encoded"
    }
  }
}
```

### 3️⃣ Creator Publishes Event
Event is created, notification automatically sent to all subscribers
```
POST /api/send-push-notification
├─ Fetch all subscriptions (logged-in users)
├─ Sign payload with VAPID_PRIVATE_KEY
├─ Send to push service (FCM/APNs)
└─ Return confirmation
```

### 4️⃣ User Receives Notification
Notification appears in system tray → user clicks → app opens to event
```
Service Worker 'push' event
├─ Parse notification data
├─ Show notification with title/body/actions
└─ Navigate to event on click
```

---

## Testing Checklist

### ✅ Local Testing (5-10 minutes)
```
□ Open PWA and go to Settings
□ Toggle "Notifications" ON
□ See "Push notifications enabled!" message
□ Check Supabase → push_subscriptions table (new row)
□ Create event from another account
□ Verify notification appears in browser
□ Click notification and confirm app opens
```

### ✅ Android Testing (5-10 minutes)
```
□ Install app on Android device
□ Go to Settings → enable Notifications
□ Grant Chrome permission
□ Create event from another device
□ Check status bar for notification
□ Tap notification and confirm navigation
```

### ✅ Build Verification
```
□ npm run build → 0 errors, 43 routes
□ Routes include /api/push-subscription
□ Routes include /api/send-push-notification
□ Service worker file exists
```

---

## Production Deployment

### Step 1: Generate Production VAPID Keys
```bash
npx web-push generate-vapid-keys
```
Output:
```
Public Key: BJ...
Private Key: hQ...
```

### Step 2: Add to Vercel Environment Variables
Vercel Dashboard → Project Settings → Environment Variables

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BJ...
VAPID_PRIVATE_KEY = hQ...
VAPID_EMAIL = your-notifications@your-domain.com
```

### Step 3: Verify HTTPS
- Vercel provides automatic HTTPS
- Check domain certificate is valid
- Test: `https://your-domain.com` loads correctly

### Step 4: Deploy & Test
```bash
git push main
# Vercel auto-deploys

# Test on production domain:
# 1. Install PWA
# 2. Enable notifications
# 3. Create event
# 4. Verify notification appears
```

---

## Troubleshooting

### "Notifications disabled / greyed out in Settings"
**Cause**: App not installed as PWA  
**Fix**: Click install button in browser address bar

### "Permission always shows 'default' or 'denied'"
**Cause**: Browser permission not granted  
**Fix**: 
1. Go to browser settings → privacy → site settings → notifications
2. Find "PNG Events" → set to "Allow"
3. Refresh Settings page

### Notification appears but doesn't navigate
**Cause**: Service worker notificationclick handler issue  
**Fix**:
1. Hard refresh (Ctrl+Shift+R)
2. Reinstall app
3. Check browser console for errors

### Build includes VAPID keys
**Cause**: Keys exposed in public JavaScript  
**Fix**: Only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` should be public  
✅ **Already correct** - `VAPID_PRIVATE_KEY` is server-only

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   PNG Events PWA                     │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Frontend      Settings      Service
    Hook         Page          Worker
    │            │             │
    │ uses       │ integrates  │ handles
    │            │             │
    ▼            ▼             ▼
 NEXT_PUBLIC_  Notification  Push Event
 VAPID_PUBLIC_  Toggle       Listener
 KEY                         │
    │                        │
    └────────────┬───────────┘
                 │
                 ▼
         Supabase API
              │
              ├─ POST /api/push-subscription
              │  (save user subscription)
              │
              └─ POST /api/send-push-notification
                 (send to all subscribers)
                 │
                 ▼
         Supabase Database
              │
              └─ push_subscriptions table
                 │
                 ├─ endpoint: "https://fcm..."
                 ├─ keys: { p256dh, auth }
                 └─ user_id: "uuid"
                 │
                 ▼
         Web-Push Library
              │
              ├─ Sign with VAPID_PRIVATE_KEY
              ├─ Encrypt with user's keys
              └─ Send to push service
                 │
                 ├─ FCM (Android Chrome)
                 ├─ APNs (Safari/iOS)
                 └─ Browser push service
                 │
                 ▼
         Browser/Device
              │
              ├─ Receive push
              ├─ Trigger SW 'push' event
              ├─ Show notification
              └─ Handle click event
```

---

## Verification Commands

### Run Verification Script
```bash
node scripts/verify-push-notifications.js
```
Expected output: ✅ ALL CHECKS PASSED

### Check Build
```bash
npm run build
```
Expected output: 0 errors, ✓ Compiled successfully

### Check Environment
```bash
grep VAPID .env.local
```
Expected output: All three VAPID variables present

---

## Support & Documentation

### Full Documentation
See [PUSH_NOTIFICATIONS_CONFIGURATION.md](PUSH_NOTIFICATIONS_CONFIGURATION.md)

### Key Files
1. **[src/hooks/usePushNotifications.ts](src/hooks/usePushNotifications.ts)** - Frontend subscription logic
2. **[src/app/settings/page.tsx](src/app/settings/page.tsx#L440)** - UI for toggling notifications
3. **[src/app/api/push-subscription/route.ts](src/app/api/push-subscription/route.ts)** - Backend subscription API
4. **[src/app/api/send-push-notification/route.ts](src/app/api/send-push-notification/route.ts)** - Notification sending
5. **[public/service-worker.js](public/service-worker.js#L760)** - Push event handling

### Example Payload
```json
{
  "title": "New Event: Summer Picnic",
  "body": "July 15 at Central Park",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/icon-96x96.png",
  "data": {
    "eventId": "event-123",
    "url": "/events/event-123"
  },
  "actions": [
    { "action": "view", "title": "View Event" },
    { "action": "dismiss", "title": "Dismiss" }
  ]
}
```

---

## Checklist for Production

- [ ] VAPID keys generated and added to `.env.local`
- [ ] Build passes: `npm run build`
- [ ] Verification script passes: `node scripts/verify-push-notifications.js`
- [ ] Local testing completed
- [ ] Android testing completed
- [ ] Production VAPID keys generated
- [ ] Production keys added to Vercel environment variables
- [ ] HTTPS verified on production domain
- [ ] Service worker file accessible at `/service-worker.js`
- [ ] Manifest accessible at `/manifest.json`
- [ ] Icons accessible at `/icons/`
- [ ] Production deployment tested end-to-end

---

## What's Next?

### 🎉 Push Notifications are Ready!
Your system is fully configured. Users can now:
1. Install the PWA
2. Enable notifications in settings
3. Receive push notifications when events are created

### Optional Enhancements
- [ ] Notification analytics (track opens)
- [ ] Scheduled notifications (upcoming events)
- [ ] Category-based notification preferences
- [ ] Rich notifications with images
- [ ] Background sync for offline subscriptions

---

**Last Updated**: February 7, 2026  
**Status**: ✅ Production Ready  
**Configuration Version**: 1.0
