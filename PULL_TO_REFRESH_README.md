 Pull-to-Refresh Feature

This document describes the pull-to-refresh feature implemented for the PNG Events PWA.

## Overview

The pull-to-refresh feature allows users on mobile and tablet devices to refresh the page by pulling down from the top, similar to native mobile apps. **This works on ALL pages** throughout the application, not just specific pages.

## How It Works

1. **Detection**: The feature activates when:
   - The app is running in standalone PWA mode (saved to homescreen), OR
   - The device has touch capabilities (works in regular mobile browsers too)
   - The user is at the top of the page (scroll position ≤ 10px)

2. **Gesture Recognition**:
   - Tracks single-touch downward pulls
   - Ignores horizontal scrolling gestures
   - Requires pulling down at least 80px to trigger refresh
   - Applies resistance for natural feel

3. **Visual Feedback**:
   - Shows a yellow gradient indicator with refresh icon
   - Animates based on pull progress
   - Displays "Pull to refresh", "Release to refresh", or "Refreshing..." text
   - Includes accessibility features for screen readers

4. **User Experience**:
   - Haptic feedback on refresh (if device supports it)
   - Smooth animations and transitions
   - Prevents conflicts with normal scrolling
   - Spinning icon during refresh

## Technical Implementation

### Files Created/Modified

- `src/hooks/usePullToRefresh.ts` - Main hook for gesture detection with PWA optimizations
- `src/components/PullToRefreshIndicator.tsx` - Visual indicator component with hardware acceleration
- `src/components/PullToRefreshHandler.tsx` - Global handler component that wraps the hook and indicator
- `src/app/layout.tsx` - Integration point at root level (works on ALL pages)

### Key Features

- **Global Implementation**: Works on every page in the app
- **Performance Optimized**: React.memo, hardware acceleration, and passive event listeners
- **Device-Adaptive**: Adjusts threshold based on screen size and pixel density
- **Cache-Busting Refresh**: Clears service worker cache for true browser-like refresh
- **Multi-touch Safe**: Only handles single-touch gestures
- **Conflict Prevention**: Distinguishes between vertical pulls and horizontal scrolls
- **Scroll Detection**: Only activates when at the top of scrollable content
- **Accessibility**: Screen reader announcements and proper ARIA attributes
- **Development Testing**: Debug mode for testing without touch device
- **Cross-Platform**: Optimized for both iOS and Android PWA environments

## Testing

### Production Testing
1. Open the app on a mobile/tablet device
2. Navigate to any page (home, events, categories, profile, etc.)
3. Scroll to the top of the page
4. Pull down from the top
5. The indicator should appear and animate
6. Pull down 80px+ and release to refresh

### Development Testing
Add `?pullToRefreshDebug=true` to any URL or set `localStorage.setItem('pullToRefreshDebug', 'true')` to enable debug mode for testing on desktop.

Example: `http://localhost:3001?pullToRefreshDebug=true`

## Configuration

The PullToRefreshHandler component accepts these props:

```typescript
interface PullToRefreshHandlerProps {
  onRefresh?: () => void | Promise<void>;  // Custom refresh function
  threshold?: number;                       // Distance required to trigger refresh (default: 80px)
  debugMode?: boolean;                      // Enable debug mode (default: false)
}
```

The underlying hook accepts:

```typescript
interface PullToRefreshConfig {
  threshold?: number;                        // Distance required to trigger refresh (default: 80px)
  onRefresh?: () => void | Promise<void>;    // Custom refresh function
  enabled?: boolean;                         // Enable/disable the feature (default: true)
  debugMode?: boolean;                       // Enable debug mode for development (default: false)
}
```

## Browser Support

- iOS Safari (PWA standalone mode and regular browser)
- Android Chrome (PWA standalone mode and regular browser)
- Any modern browser with touch support

## Edge Cases Handled

- Multi-touch gestures
- Horizontal scrolling conflicts
- Rapid scrolling interruptions
- Touch events inside scrollable containers
- Nested scrollable elements
- Different device orientations
- Various screen sizes and pixel densities

## Architecture

The implementation uses a three-layer architecture:

1. **Hook Layer** (`usePullToRefresh.ts`): Handles all touch event detection, gesture recognition, and refresh logic.

2. **Indicator Layer** (`PullToRefreshIndicator.tsx`): Pure presentational component that displays the visual feedback.

3. **Handler Layer** (`PullToRefreshHandler.tsx`): Combines the hook and indicator, manages debug mode detection.

This separation allows for easy testing, customization, and potential future enhancements like custom refresh animations or per-page refresh behaviors.
