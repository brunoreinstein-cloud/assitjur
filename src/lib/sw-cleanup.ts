/**
 * Service Worker Cleanup
 * 
 * Provides utilities to clean up old service workers that might be causing issues
 */

import { isClient } from './ssr-utils';

/**
 * Clean up all service worker registrations
 * This helps prevent issues with old cached versions
 */
export function cleanupServiceWorkers(): Promise<void> {
  if (!isClient) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve();
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        const unregisterPromises = registrations.map((registration) => {
          console.log('🧹 Unregistering old service worker:', registration.scope);
          return registration.unregister();
        });

        return Promise.all(unregisterPromises);
      })
      .then(() => {
        console.log('✅ All service workers cleaned up');
        resolve();
      })
      .catch((error) => {
        console.warn('⚠️ Error cleaning up service workers:', error);
        resolve(); // Don't fail the app if SW cleanup fails
      });
  });
}

/**
 * Clear all caches
 * This helps prevent issues with old cached assets
 */
export function clearAllCaches(): Promise<void> {
  if (!isClient) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (!('caches' in window)) {
      resolve();
      return;
    }

    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames.map((cacheName) => {
          console.log('🧹 Deleting cache:', cacheName);
          return caches.delete(cacheName);
        });

        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ All caches cleared');
        resolve();
      })
      .catch((error) => {
        console.warn('⚠️ Error clearing caches:', error);
        resolve(); // Don't fail the app if cache cleanup fails
      });
  });
}

/**
 * Perform complete cleanup of service workers and caches
 * Call this when you suspect old cached content is causing issues
 */
export async function performCompleteCleanup(): Promise<void> {
  if (!isClient) {
    return;
  }

  console.log('🧹 Starting complete cleanup...');
  
  try {
    await Promise.all([
      cleanupServiceWorkers(),
      clearAllCaches()
    ]);
    
    console.log('✅ Complete cleanup finished');
  } catch (error) {
    console.warn('⚠️ Error during complete cleanup:', error);
  }
}

/**
 * Check if there are any active service workers
 */
export function hasActiveServiceWorkers(): Promise<boolean> {
  if (!isClient) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        resolve(registrations.length > 0);
      })
      .catch(() => {
        resolve(false);
      });
  });
}
