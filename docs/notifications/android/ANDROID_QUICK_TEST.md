# Android Notifications - Quick Reference Card

## For Testing Team

### Before Testing
- [ ] Android device with API 24+ (Android 7.0+)
- [ ] Chrome, Firefox, Samsung Internet, or Edge browser
- [ ] Stable internet connection
- [ ] Access to create events (admin/creator account)

### Enable Notifications on Android Device

```
1. Open PNG Events app/web
2. Go to Settings
3. Find "Push Notifications" toggle
4. Toggle ON
5. Grant permission when prompted
6. See "Enabled" confirmation message
```

### Create Test Event

**On Desktop/Another Device:**
```
1. Click "Create Event"
2. Fill in:
   - Name: "Android Test - [Your Device]"
   - Location: "Port Moresby, Papua New Guinea"
   - Date: Tomorrow, 2:00 PM
   - Description: "Test event for Android notifications"
3. Click Submit
```

### Verify Notification Appears

**On Android Device:**
```
1. Look at top notification area
2. Should see: "New Event Added!"
3. Swipe down to read full notification
4. Should show:
   ✓ Event name
   ✓ 📍 Location
   ✓ 📅 Date & Time
```

### Click Notification

**Test 1 - Direct Click:**
```
1. Tap the notification itself (not buttons)
2. App should open/come to foreground
3. Event modal should appear automatically
4. Verify event details match what you created
```

**Test 2 - Action Button:**
```
1. Open notification again
2. If you see "View Event" button, tap it
3. Same result as Test 1
```

**Test 3 - Dismiss Action:**
```
1. Open notification
2. If you see "Dismiss" button, tap it
3. Notification closes without opening modal
```

### Console Check (Developer Mode)

**If something doesn't work:**

```
1. Connect Android to computer via USB
2. Open Chrome DevTools (chrome://inspect)
3. Select your Android app
4. Go to Console tab
5. Look for messages:
   ✓ "ServiceWorker registration successful"
   ✓ "Push subscription created successfully"
   ✓ "Notification clicked: NotificationEvent"
   
   ✗ Any red errors = problem
```

### What Each Message Means

| Message | Meaning |
|---------|---------|
| `ServiceWorker registration successful` | Good - service worker is active |
| `Push subscription created successfully` | Good - notifications are enabled |
| `Push notification received` | Good - notification arrived at device |
| `Notification clicked` | Good - user clicked notification |
| `Notification click received: <ID>` | Good - app received the event ID |
| Red errors | Bad - something failed, see guide for solutions |

### Test Scenarios Checklist

Run these scenarios to be thorough:

**Scenario 1 - App Open**
```
✓ App is open and visible
✓ Create event from another device
✓ Notification appears
✓ Click opens modal
```

**Scenario 2 - App Background**
```
✓ Open another app (or press home)
✓ Create event from another device
✓ Notification appears in notification bar
✓ Click brings app to foreground and opens modal
```

**Scenario 3 - App Closed**
```
✓ Close app completely
✓ Create event from another device
✓ Notification appears
✓ Click opens app with modal
```

**Scenario 4 - Multiple Notifications**
```
✓ Create 3 events from another device
✓ 3 notifications should appear
✓ Click each one
✓ Each shows correct event in modal
```

## Quick Troubleshooting

### No notification appears
```
1. Check notification permission: Settings → Apps → Notifications
2. Check browser settings: Browser → Settings → Notifications
3. Restart app and try again
4. Check console for errors
```

### Notification appears but click doesn't work
```
1. Try clicking center of notification (not edge)
2. Try "View Event" button if available
3. Check console for "clients.openWindow" error
4. If error, check: Settings → Battery → Battery Optimization → Disable for app
```

### Modal opens with wrong event
```
1. Check console for event ID
2. Verify event exists in Events list
3. Try creating another event and clicking its notification
```

### Notifications stop working after time
```
1. Go to Settings and toggle notifications OFF
2. Refresh page
3. Toggle notifications ON again
4. Should work again
```

## Browser Priority (For Testing)

**Most to Least Reliable on Android:**

1. **Chrome** - Best support, test this first
2. **Firefox** - Very good, good fallback
3. **Samsung Internet** - Good for Samsung devices
4. **Edge** - Similar to Chrome, good
5. **Opera** - Works but may have quirks

## Report Template

If notifications don't work, provide:

```
Device: [Brand/Model]
Android Version: [X.X]
Browser: [Name] v[X.X]
Issue: [What's not working]
Steps: [How to reproduce]
Console: [Screenshot of errors]
Date: [When tested]
```

## Success Indicators

When working correctly, you'll see:

✅ Notification appears within 5 seconds of event creation
✅ Notification shows all 3 details (name, location, time)
✅ Clicking notification opens event modal within 2 seconds
✅ Modal shows the exact event you created
✅ No errors in console logs
✅ Works consistently across multiple tests

## Success! 

If all checks pass, Android notifications are working correctly! 🎉

---

For detailed guides, see:
- [ANDROID_NOTIFICATIONS_GUIDE.md](./ANDROID_NOTIFICATIONS_GUIDE.md) - Full troubleshooting
- [ANDROID_NOTIFICATIONS_IMPLEMENTATION.md](./ANDROID_NOTIFICATIONS_IMPLEMENTATION.md) - Technical details
