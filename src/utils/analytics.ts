import { analyticsAllowed } from "@/middleware/consent";

export type AnalyticsEvent =
  | "beta_signup"
  | "created_first_map"
  | "nps_score"
  | string;

/** Track analytics events respecting user consent */
export const track = async (
  event: AnalyticsEvent,
  metadata: Record<string, any> = {},
): Promise<void> => {
  if (!(await analyticsAllowed())) return;

  // Remove common PII fields from metadata
  const sanitized = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !["email", "name"].includes(key),
    ),
  );

  // Mock analytics since analytics_events table doesn't exist yet
  console.log("Analytics event:", event, sanitized);
};
