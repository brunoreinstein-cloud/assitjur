import { adminClient } from "./auth.ts";

async function hashPayload(payload: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload ?? {}));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface AuditEntry {
  user_id: string;
  org_id: string;
  action: string;
  resource: string;
  before?: unknown;
  after?: unknown;
}

export async function audit(req: Request, entry: AuditEntry) {
  const supabase = adminClient();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "";
  const ua = req.headers.get("user-agent") || "";
  const before_hash = entry.before ? await hashPayload(entry.before) : null;
  const after_hash = entry.after ? await hashPayload(entry.after) : null;
  const { error } = await supabase.from("audit_log").insert({
    user_id: entry.user_id,
    org_id: entry.org_id,
    action: entry.action,
    resource: entry.resource,
    before_hash,
    after_hash,
    ip,
    user_agent: ua,
  });
  if (error) {
    console.error("Failed to record audit log", error);
  }
}
