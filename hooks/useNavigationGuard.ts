/**
 * Navigation Guard Hook
 *
 * Prevents accidental double-tap navigation issues that can cause:
 * - Duplicate screen pushes
 * - Multiple note creations
 * - Race conditions in navigation stack
 *
 * Based on AllMail's navigation pattern.
 *
 * @example
 * ```tsx
 * const { guardNavigation } = useNavigationGuard();
 *
 * const handlePress = () => {
 *   guardNavigation(() => {
 *     router.push('/note/new');
 *   });
 * };
 * ```
 */

import { useRef, useCallback } from 'react';

interface NavigationGuardOptions {
  /**
   * Delay in milliseconds before allowing next navigation
   * @default 500
   */
  delay?: number;

  /**
   * Called when navigation is blocked
   */
  onBlock?: () => void;
}

export function useNavigationGuard(options: NavigationGuardOptions = {}) {
  const { delay = 500, onBlock } = options;
  const isNavigatingRef = useRef(false);

  /**
   * Guard a navigation action to prevent double-taps
   */
  const guardNavigation = useCallback(
    (navigationFn: () => void) => {
      if (isNavigatingRef.current) {
        console.log('[NAV_GUARD] Navigation blocked - already navigating');
        onBlock?.();
        return false;
      }

      isNavigatingRef.current = true;
      console.log('[NAV_GUARD] Navigation allowed');

      try {
        navigationFn();
      } catch (error) {
        console.error('[NAV_GUARD] Navigation error:', error);
        isNavigatingRef.current = false;
        return false;
      }

      // Reset flag after delay
      setTimeout(() => {
        isNavigatingRef.current = false;
        console.log('[NAV_GUARD] Navigation guard reset');
      }, delay);

      return true;
    },
    [delay, onBlock]
  );

  /**
   * Check if currently navigating
   */
  const isNavigating = useCallback(() => {
    return isNavigatingRef.current;
  }, []);

  /**
   * Manually reset the guard (use sparingly)
   */
  const reset = useCallback(() => {
    isNavigatingRef.current = false;
    console.log('[NAV_GUARD] Manually reset');
  }, []);

  return {
    guardNavigation,
    isNavigating,
    reset,
  };
}

/**
 * Action Guard Hook
 *
 * Similar to navigation guard but for any action that shouldn't be repeated
 * (e.g., API calls, form submissions, etc.)
 *
 * @example
 * ```tsx
 * const { guardAction } = useActionGuard();
 *
 * const handleSubmit = async () => {
 *   guardAction(async () => {
 *     await createNote(data);
 *   });
 * };
 * ```
 */
export function useActionGuard(options: NavigationGuardOptions = {}) {
  const { delay = 1000, onBlock } = options;
  const isProcessingRef = useRef(false);

  /**
   * Guard an action to prevent rapid repeated execution
   */
  const guardAction = useCallback(
    async <T,>(actionFn: () => Promise<T> | T): Promise<T | null> => {
      if (isProcessingRef.current) {
        console.log('[ACTION_GUARD] Action blocked - already processing');
        onBlock?.();
        return null;
      }

      isProcessingRef.current = true;
      console.log('[ACTION_GUARD] Action allowed');

      try {
        const result = await actionFn();
        return result;
      } catch (error) {
        console.error('[ACTION_GUARD] Action error:', error);
        throw error;
      } finally {
        // Reset flag after delay
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log('[ACTION_GUARD] Action guard reset');
        }, delay);
      }
    },
    [delay, onBlock]
  );

  /**
   * Check if currently processing
   */
  const isProcessing = useCallback(() => {
    return isProcessingRef.current;
  }, []);

  /**
   * Manually reset the guard
   */
  const reset = useCallback(() => {
    isProcessingRef.current = false;
    console.log('[ACTION_GUARD] Manually reset');
  }, []);

  return {
    guardAction,
    isProcessing,
    reset,
  };
}
