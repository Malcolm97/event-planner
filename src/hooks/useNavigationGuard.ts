'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guards in-app navigation when there are unsaved changes.
 *
 * - Intercepts browser back/forward via `popstate`.
 * - Provides `guardedNavigate(url)` to use instead of `router.push()` when you
 *   want the guard to apply (e.g. the manual "Back to Dashboard" button).
 * - Returns `showModal` / `confirmLeave` / `cancelLeave` to drive the confirm dialog.
 *
 * NOTE: The `beforeunload` guard (browser close / hard navigation) should be set
 * separately in the page component, as it was before.
 */
export function useNavigationGuard(when: boolean) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  // Track whether we pushed a "sentinel" entry to intercept the next popstate.
  const sentinelPushed = useRef(false);

  // Push a sentinel history entry so the first browser-back press hits our handler
  // rather than actually leaving the page. We re-push it after each cancellation.
  useEffect(() => {
    if (!when) return;
    if (!sentinelPushed.current) {
      history.pushState(null, '', window.location.href);
      sentinelPushed.current = true;
    }

    const handlePopState = () => {
      // Re-push the sentinel so repeated back-button presses are also caught.
      history.pushState(null, '', window.location.href);
      setShowModal(true);
      // pendingUrl stays null for popstate — on confirm we just go back naturally.
      pendingUrl.current = null;
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when]);

  // Clean up sentinel when guard is no longer needed.
  useEffect(() => {
    if (!when) {
      sentinelPushed.current = false;
    }
  }, [when]);

  /**
   * Use this instead of `router.push(url)` for user-initiated navigation
   * (e.g. the "Back to Dashboard" button) so the guard can intercept it.
   */
  const guardedNavigate = useCallback(
    (url: string) => {
      if (!when) {
        router.push(url);
        return;
      }
      pendingUrl.current = url;
      setShowModal(true);
    },
    [when, router],
  );

  const confirmLeave = useCallback(() => {
    setShowModal(false);
    sentinelPushed.current = false;
    if (pendingUrl.current) {
      const url = pendingUrl.current;
      pendingUrl.current = null;
      router.push(url);
    } else {
      // Browser back — go back twice (once to undo sentinel, once to actually navigate).
      history.go(-2);
    }
  }, [router]);

  const cancelLeave = useCallback(() => {
    setShowModal(false);
    pendingUrl.current = null;
  }, []);

  return { showModal, confirmLeave, cancelLeave, guardedNavigate };
}
