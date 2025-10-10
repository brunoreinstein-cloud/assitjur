/**
 * SSR Utilities
 * 
 * Provides standardized SSR guards and utilities for client-side only code
 */

/**
 * Check if code is running on the client-side
 */
export const isClient = typeof window !== "undefined";

/**
 * Check if code is running on the server-side
 */
export const isServer = typeof window === "undefined";

/**
 * Check if code is running in prerender mode
 */
export const isPrerender = process.env.PRERENDER === "1";

/**
 * Check if code should run only on client-side
 */
export const shouldRunOnClient = isClient && !isPrerender;

/**
 * SSR-safe wrapper for client-only code
 * Returns null during SSR/prerender
 */
export function clientOnly<T>(fn: () => T): T | null {
  if (!shouldRunOnClient) return null;
  return fn();
}

/**
 * SSR-safe wrapper for client-only code with fallback
 */
export function clientOnlyWithFallback<T, F>(
  fn: () => T,
  fallback: F
): T | F {
  if (!shouldRunOnClient) return fallback;
  return fn();
}

/**
 * SSR-safe access to window object
 */
export function getWindow(): Window | null {
  return isClient ? window : null;
}

/**
 * SSR-safe access to document object
 */
export function getDocument(): Document | null {
  return isClient ? document : null;
}

/**
 * SSR-safe access to localStorage
 */
export function getLocalStorage(): Storage | null {
  return isClient ? localStorage : null;
}

/**
 * SSR-safe access to sessionStorage
 */
export function getSessionStorage(): Storage | null {
  return isClient ? sessionStorage : null;
}

/**
 * SSR-safe setTimeout
 */
export function safeSetTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> | null {
  if (!isClient) return null;
  return setTimeout(callback, delay);
}

/**
 * SSR-safe setInterval
 */
export function safeSetInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> | null {
  if (!isClient) return null;
  return setInterval(callback, delay);
}

/**
 * SSR-safe addEventListener
 */
export function safeAddEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  if (!isClient) return;
  element.addEventListener(event, handler, options);
}

/**
 * SSR-safe removeEventListener
 */
export function safeRemoveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: boolean | EventListenerOptions
): void {
  if (!isClient) return;
  element.removeEventListener(event, handler, options);
}
