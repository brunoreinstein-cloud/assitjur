/**
 * Enhanced session security monitoring hook
 * Integrates device fingerprinting, risk assessment, and security event handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  generateDeviceFingerprint, 
  calculateSessionRisk, 
  type DeviceFingerprint 
} from '@/utils/security/deviceFingerprinting';
import { 
  SecurityEventMonitor, 
  initializeSecurityMonitoring,
  invalidateUserSessions 
} from '@/utils/security/sessionInvalidation';
import { supabase } from '@/integrations/supabase/client';

export interface SessionSecurityOptions {
  enabled?: boolean;
  riskThreshold?: number; // 0-100, sessions above this risk score trigger security actions
  monitoringInterval?: number; // How often to check for suspicious activity (minutes)
  fingerprintingEnabled?: boolean;
}

export function useSessionSecurityMonitor(options: SessionSecurityOptions = {}) {
  const {
    enabled = true,
    riskThreshold = 70,
    monitoringInterval = 5,
    fingerprintingEnabled = true
  } = options;

  const { user, profile, session } = useAuth();
  const previousFingerprint = useRef<DeviceFingerprint | null>(null);
  const securityMonitor = useRef<SecurityEventMonitor | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize security monitoring
  useEffect(() => {
    if (!enabled || !session?.user) return;

    // Initialize security event monitoring
    initializeSecurityMonitoring();
    securityMonitor.current = SecurityEventMonitor.getInstance();

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [enabled, session?.user]);

  // Device fingerprinting and risk assessment
  const performSecurityCheck = useCallback(async () => {
    if (!enabled || !session?.user || !profile || !fingerprintingEnabled) return;

    try {
      // Generate current device fingerprint
      const currentFingerprint = generateDeviceFingerprint();

      // Calculate account age (in days)
      const accountAge = profile.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      // Get recent failed attempts from audit logs
      const { data: recentLogs } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(50);

      const recentFailedAttempts = recentLogs?.filter(log => 
        log.action.includes('FAILED') || log.action.includes('DENIED')
      ).length || 0;

      // Detect location change (simplified - in production would use geolocation API)
      const isNewLocation = previousFingerprint.current?.timezone !== currentFingerprint.timezone;

      // Calculate risk score
      const riskAssessment = calculateSessionRisk(
        currentFingerprint,
        previousFingerprint.current || undefined,
        accountAge,
        recentFailedAttempts,
        isNewLocation
      );

      // Log high-risk sessions
      if (riskAssessment.score >= riskThreshold) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: session.user.id,
            action: 'HIGH_RISK_SESSION_DETECTED',
            result: 'WARNING',
            table_name: 'session_security',
            resource: 'session_monitoring',
            metadata: {
              risk_score: riskAssessment.score,
              risk_factors: riskAssessment.factors,
              recommendation: riskAssessment.recommendation,
              device_fingerprint: currentFingerprint.fingerprint,
              timestamp: new Date().toISOString()
            }
          });

        // Trigger security event
        securityMonitor.current?.triggerSecurityEvent('HIGH_RISK_SESSION', {
          userId: session.user.id,
          riskScore: riskAssessment.score,
          factors: riskAssessment.factors,
          recommendation: riskAssessment.recommendation
        });

        // Take action based on risk level
        if (riskAssessment.recommendation === 'block') {
          await invalidateUserSessions(session.user.id, {
            reason: {
              type: 'suspicious_activity',
              message: `High risk session detected (score: ${riskAssessment.score})`,
              severity: 'critical'
            },
            preserveCurrentSession: false,
            notifyUser: true
          });
        } else if (riskAssessment.recommendation === 'challenge') {
          // In a real app, this would trigger step-up authentication
          console.warn('Step-up authentication recommended for high-risk session');
        }
      }

      // Store current fingerprint for next comparison
      previousFingerprint.current = currentFingerprint;

      // Check for suspicious activity patterns
      if (securityMonitor.current) {
        const isSuspicious = await securityMonitor.current.detectSuspiciousActivity(session.user.id);
        if (isSuspicious) {
          // Suspicious activity already triggers its own security events
          console.warn('Suspicious activity pattern detected');
        }
      }

    } catch (error) {
      console.error('Security check failed:', error);
    }
  }, [enabled, session?.user, profile, fingerprintingEnabled, riskThreshold]);

  // Start periodic security monitoring
  useEffect(() => {
    if (!enabled || !session?.user) return;

    // Initial security check
    performSecurityCheck();

    // Periodic monitoring
    monitoringIntervalRef.current = setInterval(
      performSecurityCheck,
      monitoringInterval * 60 * 1000 // Convert minutes to milliseconds
    );

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [enabled, session?.user, monitoringInterval, performSecurityCheck]);

  // Monitor for security-relevant events
  useEffect(() => {
    if (!enabled || !session?.user || !securityMonitor.current) return;

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // New login detected - perform immediate security check
        setTimeout(performSecurityCheck, 1000);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Password recovery initiated
        securityMonitor.current?.triggerSecurityEvent('PASSWORD_RECOVERY', {
          userId: session?.user?.id || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, session?.user, performSecurityCheck]);

  return {
    performSecurityCheck,
    isMonitoring: enabled && !!session?.user
  };
}