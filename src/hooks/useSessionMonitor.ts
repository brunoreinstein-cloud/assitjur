import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthErrorHandler } from "@/utils/authErrorHandler";

interface SessionMonitorOptions {
  checkInterval?: number; // minutes
  preemptiveRefresh?: number; // minutes before expiry
  inactivityTimeout?: number; // minutes of inactivity before logout
  enabled?: boolean;
}

export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    checkInterval = 5, // Check every 5 minutes
    preemptiveRefresh = 10, // Refresh 10 minutes before expiry
    inactivityTimeout = 0,
    enabled = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout>();
  const inactivityRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());
  const isCheckingRef = useRef(false);

  const checkAndRefreshSession = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        if (AuthErrorHandler.isAuthError(error)) {
          await AuthErrorHandler.handleAuthError(error);
        }
        return;
      }

      if (!session) return;

      // Check if token expires soon
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (expiresAt ?? 0) - now;
      const refreshThreshold = preemptiveRefresh * 60; // Convert to seconds

      if (timeUntilExpiry < refreshThreshold) {
        console.log("Token expiring soon, refreshing session...");

        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          if (AuthErrorHandler.isAuthError(refreshError)) {
            await AuthErrorHandler.handleAuthError(refreshError);
          }
        }
      }
    } catch (error) {
      console.error("Session monitor error:", error);
      if (AuthErrorHandler.isAuthError(error)) {
        await AuthErrorHandler.handleAuthError(error);
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkAndRefreshSession();

    // Set up periodic checks
    intervalRef.current = setInterval(
      checkAndRefreshSession,
      checkInterval * 60 * 1000,
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, checkInterval, preemptiveRefresh]);

  // Inactivity auto-logout
  useEffect(() => {
    if (!enabled || !inactivityTimeout) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click"];
    events.forEach((e) => window.addEventListener(e, resetActivity));

    inactivityRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > inactivityTimeout * 60 * 1000) {
        AuthErrorHandler.handleAuthError({ message: "session_inactive" });
      }
    }, 60 * 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      if (inactivityRef.current) clearInterval(inactivityRef.current);
    };
  }, [enabled, inactivityTimeout]);

  return {
    checkSession: checkAndRefreshSession,
  };
}
