import { supabase } from "@/integrations/supabase/client";

export async function requestDataExport() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");

  const { data, error } = await supabase
    .from("lgpd_requests")
    .insert({
      org_id: profile.organization_id,
      user_id: user.id,
      request_type: "DATA_EXPORT",
      requested_by_email: profile.email,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function requestAccountDeletion(justification: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");

  const { data, error } = await supabase
    .from("lgpd_requests")
    .insert({
      org_id: profile.organization_id,
      user_id: user.id,
      request_type: "ACCOUNT_DELETION",
      requested_by_email: profile.email,
      justification,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
