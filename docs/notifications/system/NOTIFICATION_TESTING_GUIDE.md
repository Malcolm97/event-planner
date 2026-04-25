# Quick Testing Guide - PNG Events Push Notifications

## What Was Implemented

✅ **Push Notifications for PWA Mode**
- Events created trigger notifications to all logged-in users
- Notifications display event name, location, and time
- Clicking notification opens event modal automatically
- Works on desktop, mobile web, and PWA-installed apps
- Prevents duplicate subscriptions and handles expired subscriptions

## Quick Test Steps

### Step 1: Verify Setup (One-time)
1. Open browser Developer Tools → Application → Service Workers
2. Confirm service worker is registered and active (green dot)
3. Go to Settings page and enable push notifications
4. Check browser notification permission is "Allow"

### Step 2: Create and Receive Notification
1. **Create Event:** Go to "Create Event" page, fill in details:
   - Name: "Tech Conference 2024"
   - Location: "Port Moresby"
   - Date/Time: Tomorrow 2:30 PM
   - Click Submit
   
2. **Watch for Notification:**
   - Desktop: Check system notification tray (bottom-right)
   - Mobile: Check notification bar at top of screen
   - PWA: May need to switch to another app to see it
   
3. **Verify Details:**
   - Title should be: "New Event Added!"
   - Body should show: "Tech Conference 2024\n📍 Port Moresby\n📅 Jan 15, 2024 2:30 PM"

### Step 3: Click and Route to Modal
1. Click the notification (or "View Event" button if shown)
2. App should open/come to foreground
3. Event modal should automatically appear showing the event
4. Verify all event details are displayed

### Step 4: Verify Logged-In Only
1. Open incognito/private window
2. **DO NOT log in** in this window
3. In main window, create a new event
4. Check incognito window - it should NOT receive the notification
5. This confirms only logged-in users get notifications

## Expected Behavior by Platform

### Desktop Chrome/Edge/Firefox
- Notification appears in system tray (bottom-right on Windows, top-right on Mac)
- Click notification → App opens if closed, event modal displays
- Clicking "View Event" button → Same result

### Mobile Chrome/Android
- Notification appears in notification bar at top
- Can swipe it away
- Click notification → App opens/comes to foreground, modal shows
- Works even if app was fully closed

### Mobile PWA (Installed App)
- Notification can be received in background
- May appear in lock screen or notification center
- Click notification → App opens with event modal
- Vibration pattern should feel in notification (if enabled on device)

### iOS Safari
- **Note:** Web Push API not supported
- Users can save as home screen shortcut but won't receive notifications
- In-app notifications recommended for iOS users

## Troubleshooting

### No Notification Appears
1. Check Settings → Notifications is enabled
2. Check browser notification permission (should be "Allow")
3. Check app is logged in as actual user (check profile)
4. Check service worker is active (Dev Tools → Application → Service Workers)
5. Try reloading page and enabling notifications again
6. Check browser console for errors

### Notification Appears But Click Doesn't Work
1. Check browser console for errors (F12 → Console)
2. Verify event exists in database
3. Try refreshing page before clicking next notification
4. Try clicking directly on notification body, not just action buttons

### Event Modal Opens But Shows Wrong Event
1. Check event ID in browser console logs
2. Verify event details in database
3. Try creating event with more distinctive details
4. Check if event was actually created (check Events page)

### Only Getting Notifications in One Window/Tab
- This is expected - service worker sends to all windows
- Click in one window will route to that modal
- If you want to test multiple, use separate browsers/profiles

## What to Verify for Production

Before deploying to production, test:

1. ✅ Desktop notification receipt and click routing
2. ✅ Mobile web notification receipt and click routing
3. ✅ PWA installed on Android - receive notification
4. ✅ Logged-out user does NOT receive notification
5. ✅ Event details display correctly in notification
6. ✅ Multiple events trigger multiple notifications
7. ✅ Clicking different notifications routes to correct event
8. ✅ Notification click works after app restart
9. ✅ Event details show location with emoji (📍)
10. ✅ Event details show date with emoji (📅)

## Browser Console Logs to Look For

### Good Signs (Should see these):
```
"Push notification received: PushEvent {..."
"Notification clicked: NotificationEvent {..."
"Notification click received: <eventId>"
```

### Bad Signs (These indicate problems):
```
"Failed to send push notifications: ..."
"Failed to show notification: ..."
"Failed to parse push notification data: ..."
```

## Monitoring the System

### Check Database
```sql
-- Verify push subscriptions are being saved
SELECT COUNT(*) FROM push_subscriptions;
SELECT * FROM push_subscriptions LIMIT 5;

-- Verify subscriptions are tied to logged-in users
SELECT user_id, COUNT(*) FROM push_subscriptions 
WHERE user_id IS NOT NULL 
GROUP BY user_id;
```

### Check Service Worker Cache
Open DevTools → Application → Cache Storage:
- Should see caches for static assets, pages, APIs
- Notification payload is NOT cached (sent fresh each time)

### Check Events
Go to Events page and verify new events appear immediately:
- Event should be visible after creation
- Event should have all details (name, location, date)

## Notes for Testing

- Service worker takes effect immediately after page refresh
- First time enabling notifications requires browser permission prompt
- Each new service worker activation clears old subscriptions
- Push subscriptions are tied to device + browser combination
- Different browser profiles = different subscriptions
- PWA icon changes when push notifications enabled (usually)

---

For detailed documentation, see: [NOTIFICATION_SYSTEM_IMPROVEMENTS.md](./NOTIFICATION_SYSTEM_IMPROVEMENTS.md)
