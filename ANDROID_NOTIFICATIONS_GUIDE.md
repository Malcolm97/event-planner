# Android Push Notifications - Setup & Testing Guide

## Android-Specific Improvements Made

The notification system has been enhanced for Android devices with the following improvements:

### 1. **Enhanced Push Event Data Parsing**
- Fallback text parsing for push events that may not be pure JSON on Android
- Better error handling and logging for data parsing issues
- Graceful degradation if event data is malformed

### 2. **Improved Window Matching for Android**
- Broader window URL matching to handle Android's various URL patterns
- Checks for both exact path match and partial path match
- Supports different hostname formats (localhost, 127.0.0.1, full domain)
- Better origin matching for cross-origin scenarios

### 3. **Android-Optimized Notification Options**
- `silent: false` - Enables sound notifications on Android
- `timestamp: Date.now()` - Helps Android display notification time correctly
- Longer delay (1000ms instead of 500ms) for new window readiness on Android
- Vibration pattern support (200ms, 100ms, 200ms)

### 4. **Better Service Worker Activation**
- Explicit logging of service worker claim operations
- Ensures service worker takes control of all clients immediately
- Important for Android PWA installations

### 5. **Improved Subscription Logging**
- Detailed logging at each step of subscription process
- Better error messages for debugging on Android devices
- Service worker readiness verification before subscription

## Testing on Android Devices

### Prerequisites
1. Android device (API 24+, Android 7.0+)
2. Chrome, Firefox, Samsung Internet, or Edge browser
3. Stable internet connection
4. PWA app installed OR web app open

### Step 1: Enable Developer Console on Android

**For Chrome/Edge:**
```
1. Connect Android device to computer via USB
2. Enable USB Debugging on Android: Settings → Developer Options → USB Debugging
3. Open Chrome/Edge on desktop
4. Go to chrome://inspect (or edge://inspect)
5. Select your device and app
6. DevTools will open
```

**For Firefox:**
```
1. On Android: Settings → About Firefox (tap 7 times) → Developer Settings
2. Enable USB Debugging
3. Connect to desktop via USB
4. Open Firefox → Menu → Developer Tools → Settings → Advanced
5. Enable Remote Debugging
```

### Step 2: Watch for Service Worker Registration
In the Console, look for:
```
✓ ServiceWorker registration successful with scope: /
✓ Service worker ready for subscription
✓ Service Worker claimed all clients
```

### Step 3: Enable Notifications and Subscribe
1. Go to Settings page
2. Toggle "Enable Notifications" ON
3. Grant notification permission when prompted
4. Watch console for:
   ```
   ✓ Push subscription created successfully
   ✓ Subscription saved to database successfully
   ```

### Step 4: Create a Test Event
On desktop:
1. Create a new event with:
   - Name: "Android Test Event"
   - Location: "Port Moresby"
   - Date: Tomorrow at 2:00 PM
2. Click Submit

Watch Android device console for:
```
✓ Push notification received: PushEvent {...}
✓ Notification should appear in notification tray
```

### Step 5: Test Notification Click
1. Look at Android notification tray/center
2. Click the notification
3. Watch console for:
   ```
   ✓ Notification clicked: NotificationEvent {...}
   ✓ Found existing app window (or new window opened)
   ✓ Notification click received: <eventId>
   ```
4. Event modal should open automatically
5. Verify it shows the correct event details

## Common Android Issues & Solutions

### Issue 1: Notification Permission Blocked
**Symptom:** Toggle button disabled or permission denied error

**Solution:**
1. Go to Android Settings → Apps → PNG Events (or Browser)
2. Permissions → Notifications → Allow
3. Return to app and enable notifications
4. Refresh page
5. Try again

### Issue 2: Notifications Not Appearing
**Symptom:** Event created but no notification shows

**Causes & Solutions:**
1. **Check notification settings:**
   ```
   Settings → Apps & Notifications → Notifications
   - Ensure app notifications are enabled
   - Check notification importance level
   ```

2. **Check browser notification settings:**
   ```
   Browser Settings → Site Settings → Notifications
   - Ensure PNG Events is allowed
   - Toggle off and on if showing "blocked"
   ```

3. **Check service worker:**
   - In DevTools, go to Application → Service Workers
   - Ensure service worker is active and running
   - Check for any errors in console

4. **Restart browser/PWA:**
   - Close app completely
   - Clear browser cache (if web version)
   - Reopen and re-enable notifications

### Issue 3: App Doesn't Open When Clicking Notification
**Symptom:** Notification clicked but app doesn't open

**Causes & Solutions:**
1. **App background restrictions:**
   ```
   Settings → Battery → Battery Optimization
   - Find app and remove from optimization
   - This allows app to launch from notifications
   ```

2. **Link handling:**
   ```
   Android Settings → Apps → Default Apps
   - Check if app is set as default for opening links
   - If not, manually open notification
   ```

3. **Check console logs:**
   - Look for "clients.openWindow not available" error
   - May need to enable popup windows in browser settings

4. **Try on different browser:**
   - Chrome: Generally most reliable
   - Firefox: Also good support
   - Samsung Internet: May have different behavior
   - Edge: Similar to Chrome

### Issue 4: Notifications Stop Working After Time
**Symptom:** Notifications work initially but stop after hours/days

**Causes & Solutions:**
1. **Subscription expired:**
   - Service worker version change can invalidate subscriptions
   - Solution: Re-enable notifications in settings

2. **App cache cleared:**
   - If browser cache is cleared, service worker is removed
   - Solution: Re-enable notifications

3. **Subscription key rotated:**
   - VAPID key changed or expired
   - Solution: Check that VAPID keys are properly configured

### Issue 5: Different Behavior on PWA vs Web
**Symptom:** Works on web but not when installed as PWA, or vice versa

**PWA Specific:**
- PWA may need re-installation after service worker updates
- Notifications may only work if app is in notification list
- May need to clear app data: Android Settings → Apps → PNG Events → Storage

**Web Specific:**
- Notifications require browser to be in foreground for some actions
- Closing browser may prevent background notifications
- Try using browser's PWA installation option

## Testing Checklist

Run through this checklist on Android device(s):

### Basic Functionality
- [ ] Notification permission dialog appears
- [ ] Permission is granted successfully
- [ ] Console shows "Subscription saved to database successfully"
- [ ] Toggle shows "Notifications enabled"

### Notification Receipt
- [ ] Create event on another device
- [ ] Notification appears on Android
- [ ] Notification shows correct event name
- [ ] Notification shows location with 📍 emoji
- [ ] Notification shows date/time with 📅 emoji

### Notification Interaction
- [ ] Notification can be swiped to dismiss
- [ ] Clicking notification opens app
- [ ] Event modal displays automatically
- [ ] Correct event is shown in modal

### Edge Cases
- [ ] App is closed when notification arrives
- [ ] App is in background when notification arrives
- [ ] Multiple events trigger multiple notifications
- [ ] Dismissing notification via swipe still works
- [ ] PWA installed mode works same as web version

### Cross-Device
- Test on at least 2 different Android devices:
  - [ ] Different manufacturer (Samsung, OnePlus, Xiaomi, etc.)
  - [ ] Different Android versions (if available)
  - [ ] Different browsers (Chrome, Firefox, Samsung Internet)

## Android Version Support

| Android Version | Support | Notes |
|---|---|---|
| **Android 7.0** | ✅ Full | Minimum for Web Push |
| **Android 8.0-9.0** | ✅ Full | Good support |
| **Android 10-11** | ✅ Full | Excellent support |
| **Android 12+** | ✅ Full | Best support |

## Browser Support on Android

| Browser | Push | Notifications | Click | Rating |
|---------|------|---|---|---|
| **Chrome** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ Best |
| **Firefox** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ Good |
| **Samsung Internet** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ Good |
| **Edge** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ Good |
| **Opera** | ✅ | ⚠️ | ✅ | ⭐⭐⭐ Fair |

## Performance Optimization for Android

### Battery Usage
- Notifications are minimal impact (event-driven, not polling)
- Service worker only activates when needed
- No background syncing by default

### Data Usage
- Notification payload is small (~500 bytes)
- Initial subscription is ~300 bytes
- Minimal ongoing data usage

### Storage
- Service worker cache is limited by browser
- Database stores only active subscriptions
- Expired subscriptions auto-cleaned

## Debugging Console Logs

### Expected Log Sequence

When notifications work correctly, you should see:

```javascript
// Page load
ServiceWorker registration successful with scope: /
Service worker ready for subscription

// Enable notifications
Notification.requestPermission() → granted
Service worker ready for subscription
Push subscription created successfully
Subscription saved to database successfully

// Receive notification
Push notification received: PushEvent {...}

// Click notification
Notification clicked: NotificationEvent {...}
Found 1 open clients
Found existing app window: https://...
Notification click received: <eventId>
```

### Error Log Examples

If something goes wrong:

```javascript
// No VAPID key
Error: VAPID public key not configured

// Permission denied
Error: Notification permission denied

// Service worker not ready
Error: Service worker not available

// Push parsing error
Failed to parse push notification data: SyntaxError: Unexpected token
Push data as text: [fallback text data]

// Window matching failure
No existing window found, opening new one: /
Failed to open window (clients.openWindow not available)
```

## Advanced Debugging

### Check Service Worker File
```
In DevTools → Application → Service Workers
- Check "Show all" checkbox
- Verify service-worker.js is active
- Click "Inspect" to see service worker context
```

### Check Push Subscriptions in Database
```sql
SELECT user_id, subscription, created_at 
FROM push_subscriptions 
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC
LIMIT 5;
```

### Test Direct Notification
In service worker console:
```javascript
self.registration.showNotification('Test Notification', {
  body: 'This is a test from console',
  icon: '/icons/icon-192x192.png'
})
```

### Monitor Network Requests
In DevTools → Network:
1. Filter by XHR/Fetch
2. Look for POST to `/api/send-push-notification`
3. Check response status and payload

## Reporting Issues

If notifications don't work after checking all above, provide:

1. **Device Info:**
   - Android version
   - Device manufacturer/model
   - Browser name and version

2. **Console Logs:**
   - Screenshot of console errors
   - Full error messages with stack traces

3. **Reproduction Steps:**
   - Exact steps to reproduce issue
   - Device state (fresh install? cached?)

4. **Database Check:**
   - Run query above to verify subscription exists
   - Check subscription endpoint is valid

---

**Last Updated:** February 7, 2026
**Notification System Version:** 1.1.0 (Android Enhanced)
