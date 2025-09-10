import { getSessionContext } from './sessionContext';

export interface SessionRecord {
  id?: string;
  user_id: string;
  device_label?: string | null;
  last_ip?: string | null;
  last_seen?: string | null;
  risk_score?: number | null;
}

const SUSPICIOUS_ASN_PATTERNS = ['tor', 'vpn'];

export function calculateRiskScore(current: { last_ip?: string | null; timezone: string; hour?: number }, history: SessionRecord[]): number {
  let score = 0;
  const ip = current.last_ip;
  if (ip && !history.some((s) => s.last_ip === ip)) {
    score += 50; // new location
  }
  if (ip && SUSPICIOUS_ASN_PATTERNS.some((p) => ip.includes(p))) {
    score += 30; // suspicious ASN placeholder
  }
  const hour = current.hour ?? new Date().getHours();
  if (hour < 6 || hour > 22) {
    score += 20; // unusual hours
  }
  return score;
}

/**
 * Records a session entry and returns the calculated risk score.
 * If risk is high the caller should require step-up authentication.
 */
export async function recordSession(userId: string, ip?: string | null) {
  const { supabase } = await import('@/integrations/supabase/client');
  const ctx = getSessionContext();
  const { data: previous } = await supabase
    .from('sessions')
    .select('last_ip')
    .eq('user_id', userId);
  const history = (previous as SessionRecord[]) || [];
  const risk = calculateRiskScore({ last_ip: ip, timezone: ctx.timezone }, history);
  await supabase.from('sessions').insert({
    user_id: userId,
    device_label: ctx.platform,
    last_ip: ip,
    risk_score: risk,
  });
  if (risk >= 70) {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'session_anomaly',
      result: 'RISK',
      ip_address: ip,
      user_agent: ctx.userAgent,
      metadata: { risk },
    } as any);
  }
  return risk;
}

export async function terminateSession(sessionId: string) {
  const { supabase } = await import('@/integrations/supabase/client');
  await supabase.functions.invoke('end-sessions', {
    body: { session_id: sessionId },
  });
}
