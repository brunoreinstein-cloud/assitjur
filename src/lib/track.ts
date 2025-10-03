import { getConsent } from "@/lib/consent";

export function track(eventName: string, payload?: Record<string, any>) {
  try {
    if (getConsent().measure !== true) return;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventName,
        payload,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore errors
  }
}
