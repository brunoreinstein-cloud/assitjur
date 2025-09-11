import { createHash } from 'crypto';

export interface FlagRow {
  flag_id: string;
  key: string;
  rollout_percentage?: number | null;
  user_segments?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  enabled?: boolean;
}

export function hashPercentage(flagId: string, userId: string): number {
  const hash = createHash('sha256').update(flagId + userId).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export function inRollout(flagId: string, userId: string, rollout: number): boolean {
  if (rollout >= 100) return true;
  return hashPercentage(flagId, userId) < rollout;
}

export function evaluateFlags(
  flags: FlagRow[],
  userId: string,
  segments: string[],
  killed: string[],
  now: Date = new Date(),
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const flag of flags) {
    if (!flag.enabled) continue;
    if (flag.start_time && new Date(flag.start_time) > now) continue;
    if (flag.end_time && new Date(flag.end_time) < now) continue;
    let enabled = true;
    if (killed.includes(flag.flag_id)) {
      enabled = false;
    }
    if (enabled && typeof flag.rollout_percentage === 'number' && flag.rollout_percentage < 100) {
      enabled = inRollout(flag.flag_id, userId, flag.rollout_percentage);
    }
    if (enabled && Array.isArray(flag.user_segments) && flag.user_segments.length > 0) {
      const inter = segments.filter((s) => flag.user_segments!.includes(s));
      enabled = inter.length > 0;
    }
    result[flag.key] = enabled;
  }
  return result;
}
