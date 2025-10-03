/**
 * Session invalidation utilities for security events
 * Handles forced logout scenarios and session cleanup
 */

import { supabase } from "@/integrations/supabase/client";
import { AuthErrorHandler } from "@/utils/authErrorHandler";

export interface SessionInvalidationReason {
  type:
    | "password_change"
    | "security_breach"
    | "admin_action"
    | "suspicious_activity"
    | "device_change";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface SessionInvalidationOptions {
  reason: SessionInvalidationReason;
  preserveCurrentSession?: boolean;
  notifyUser?: boolean;
}

/**
 * Invalidate user sessions for security reasons
 */
export async function invalidateUserSessions(
  userId?: string,
  options: SessionInvalidationOptions = {
    reason: {
      type: "security_breach",
      message: "Security event",
      severity: "high",
    },
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      reason,
      preserveCurrentSession = false,
      notifyUser = true,
    } = options;

    // Get current session info
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    const targetUserId = userId || currentSession?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: "No user ID provided and no active session",
      };
    }

    // Log the invalidation event
    const { error: logError } = await supabase.from("audit_logs").insert({
      user_id: targetUserId,
      action: "SESSION_INVALIDATION",
      result: "SUCCESS",
      table_name: "sessions",
      resource: "session_security",
      metadata: {
        reason: reason.type,
        message: reason.message,
        severity: reason.severity,
        preserve_current: preserveCurrentSession,
        timestamp: new Date().toISOString(),
      },
    });

    if (logError) {
      console.error("Failed to log session invalidation:", logError);
    }

    // For high/critical severity, invalidate all sessions
    if (reason.severity === "high" || reason.severity === "critical") {
      // This would typically involve a server-side function to invalidate all user sessions
      // For now, we'll clear the current session and local storage
      if (!preserveCurrentSession) {
        await supabase.auth.signOut();

        // Clear all auth-related data
        sessionStorage.clear();
        localStorage.removeItem("supabase.auth.token");
        // Clear Supabase auth token from localStorage
        const storageKeys = Object.keys(localStorage).filter(
          (key) => key.includes("supabase") && key.includes("auth"),
        );
        storageKeys.forEach((key) => localStorage.removeItem(key));
      }
    }

    // Show notification if requested
    if (notifyUser && reason.severity !== "low") {
      const messages = {
        password_change:
          "Sua sessão foi encerrada devido à alteração de senha.",
        security_breach: "Sua sessão foi encerrada por motivos de segurança.",
        admin_action: "Sua sessão foi encerrada por ação administrativa.",
        suspicious_activity:
          "Atividade suspeita detectada. Sua sessão foi encerrada.",
        device_change:
          "Acesso de novo dispositivo detectado. Faça login novamente.",
      };

      // This would typically trigger a toast notification
      console.warn(
        "Session invalidated:",
        messages[reason.type] || reason.message,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Session invalidation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Monitor for security events that should trigger session invalidation
 */
export class SecurityEventMonitor {
  private static instance: SecurityEventMonitor;
  private eventHandlers: Map<string, (event: any) => void> = new Map();

  static getInstance(): SecurityEventMonitor {
    if (!this.instance) {
      this.instance = new SecurityEventMonitor();
    }
    return this.instance;
  }

  /**
   * Register handler for security events
   */
  onSecurityEvent(eventType: string, handler: (event: any) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Trigger security event
   */
  async triggerSecurityEvent(eventType: string, eventData: any): Promise<void> {
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`Security event handler failed for ${eventType}:`, error);
      }
    }

    // Always log security events
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: `SECURITY_EVENT_${eventType.toUpperCase()}`,
        result: "DETECTED",
        table_name: "security_events",
        resource: "session_monitoring",
        metadata: {
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      // Query recent audit logs for suspicious patterns
      const { data: recentLogs } = await supabase
        .from("audit_logs")
        .select("action, created_at, metadata")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order("created_at", { ascending: false });

      if (!recentLogs) return false;

      // Pattern 1: Too many failed attempts
      const failedAttempts = recentLogs.filter(
        (log) => log.action.includes("FAILED") || log.action.includes("DENIED"),
      ).length;

      if (failedAttempts > 10) {
        // More than 10 failures in an hour
        await this.triggerSecurityEvent("EXCESSIVE_FAILURES", {
          userId,
          failedAttempts,
          timeWindow: "1 hour",
        });
        return true;
      }

      // Pattern 2: Rapid successive actions
      const actionTimes = recentLogs.map((log) =>
        new Date(log.created_at).getTime(),
      );
      const rapidActions = actionTimes.filter((time, index) => {
        if (index === 0) return false;
        return time - actionTimes[index - 1] < 1000; // Less than 1 second apart
      }).length;

      if (rapidActions > 20) {
        // More than 20 rapid actions
        await this.triggerSecurityEvent("RAPID_ACTIONS", {
          userId,
          rapidActions,
          timeWindow: "1 hour",
        });
        return true;
      }

      // Pattern 3: Multiple device access
      const uniqueDevices = new Set(
        recentLogs
          .map((log) => log.metadata?.device_fingerprint)
          .filter(Boolean),
      ).size;

      if (uniqueDevices > 5) {
        // More than 5 different devices in an hour
        await this.triggerSecurityEvent("MULTIPLE_DEVICES", {
          userId,
          uniqueDevices,
          timeWindow: "1 hour",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Suspicious activity detection failed:", error);
      return false;
    }
  }
}

/**
 * Initialize security monitoring
 */
export function initializeSecurityMonitoring(): void {
  const monitor = SecurityEventMonitor.getInstance();

  // Handle password changes
  monitor.onSecurityEvent("PASSWORD_CHANGE", async (event) => {
    await invalidateUserSessions(event.userId, {
      reason: {
        type: "password_change",
        message: "Password was changed",
        severity: "medium",
      },
      preserveCurrentSession: true, // Keep current session active
      notifyUser: false, // Don't notify, this is expected
    });
  });

  // Handle security breaches
  monitor.onSecurityEvent("SECURITY_BREACH", async (event) => {
    await invalidateUserSessions(event.userId, {
      reason: {
        type: "security_breach",
        message: "Security breach detected",
        severity: "critical",
      },
      preserveCurrentSession: false,
      notifyUser: true,
    });
  });

  // Handle suspicious activity
  monitor.onSecurityEvent("SUSPICIOUS_ACTIVITY", async (event) => {
    await invalidateUserSessions(event.userId, {
      reason: {
        type: "suspicious_activity",
        message: "Suspicious activity detected",
        severity: "high",
      },
      preserveCurrentSession: false,
      notifyUser: true,
    });
  });
}
