import { supabase } from "@/integrations/supabase/client";
import { applyPIIMask } from "@/utils/pii-mask";

export async function logAudit(
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, any> = {},
) {
  const masked = applyPIIMask(metadata, true);
  const { data } = await supabase.auth.getUser();
  const actor = data?.user?.id ?? "anonymous";
  const { error } = await supabase.from("audit_logs").insert({
    user_id: actor,
    action,
    result: "SUCCESS",
    table_name: "system",
    resource: resource,
    metadata: { ...masked, resourceId },
  });
  if (error) {
    console.error("logAudit error", error);
  }
}
