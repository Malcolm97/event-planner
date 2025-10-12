# Pull-to-Refresh Feature

This document describes the pull-to-refresh feature implemented for the PNG Events PWA.

## Overview

The pull-to-refresh feature allows users on mobile and tablet devices who have saved the app to their homescreen to refresh the page by pulling down from the top, similar to native mobile apps.

## How It Works

1. **Detection**: The feature only activates when:
   - The app is running in standalone mode (saved to homescreen)
   - The device has touch capabilities
   - The user is at the top of the page (scroll position ≤ 10px)

2. **Gesture Recognition**:
   - Tracks single-touch downward pulls
   - Ignores horizontal scrolling gestures
   - Requires pulling down at least 80px to trigger refresh
   - Must complete the gesture within 1 second

3. **Visual Feedback**:
   - Shows a yellow gradient indicator with refresh icon
   - Animates based on pull progress
   - Displays "Pull to refresh" or "Release to refresh" text
   - Includes accessibility features for screen readers

4. **User Experience**:
   - Haptic feedback on refresh (if device supports it)
   - Smooth animations and transitions
   - Prevents conflicts with normal scrolling

## Technical Implementation

### Files Modified/Created

- `src/hooks/usePullToRefresh.ts` - Main hook for gesture detection with PWA optimizations
- `src/components/PullToRefreshIndicator.tsx` - Visual indicator component with hardware acceleration
- `src/components/Header.tsx` - Integration point

### Key Features

- **Performance Optimized**: Fixed useEffect dependencies, React.memo, and hardware acceleration
- **Device-Adaptive**: Adjusts threshold based on screen size and pixel density
- **Cache-Busting Refresh**: Bypasses service worker cache for true browser-like refresh
- **Multi-touch Safe**: Only handles single-touch gestures
- **Conflict Prevention**: Distinguishes between vertical pulls and horizontal scrolls
- **Accessibility**: Screen reader announcements and proper ARIA attributes
- **Development Testing**: Debug mode for testing without standalone mode
- **Cross-Platform**: Optimized for both iOS and Android PWA environments

## Testing

### Production Testing
1. Save the PWA to your mobile/tablet homescreen
2. Open the app from the homescreen
3. At the top of any page, pull down from the top
4. The indicator should appear and animate
5. Pull down 80px+ and release to refresh

### Development Testing
Add `?pullToRefreshDebug=true` to any URL or set `localStorage.setItem('pullToRefreshDebug', 'true')` to enable debug mode for testing on desktop or in browser.

Example: `http://localhost:3001?pullToRefreshDebug=true`

## Configuration

The hook accepts these options:

```typescript
interface PullToRefreshConfig {
  threshold?: number;     // Distance required to trigger refresh (default: 80px)
  onRefresh?: () => void; // Custom refresh function (default: window.location.reload)
  enabled?: boolean;      // Enable/disable the feature (default: true)
  debugMode?: boolean;    // Enable debug mode for development (default: false)
}
```

## Browser Support

- iOS Safari (PWA standalone mode)
- Android Chrome (PWA standalone mode)
- Any modern browser with touch support (in debug mode)

## Edge Cases Handled

- Multi-touch gestures
- Horizontal scrolling conflicts
- Rapid scrolling interruptions
- Touch events outside the pull area
- Different device orientations
- Various screen sizes

## Future Enhancements

- Custom refresh functions per page
- Pull distance customization per device
- Integration with service worker cache updates
- Analytics tracking for usage
