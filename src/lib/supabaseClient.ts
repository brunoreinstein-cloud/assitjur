import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/getEnv";

let supabase: any = null;

try {
  const { supabaseUrl, supabaseKey } = getEnv();
  
  // Validar se não são valores dummy
  if (supabaseUrl === "https://dummy.supabase.local" || supabaseKey === "anon") {
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }
  
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} catch (error) {
  console.error("Erro ao inicializar Supabase:", error);
  // Criar cliente dummy para evitar crashes
  supabase = {
    auth: { 
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ 
      select: () => ({ 
        eq: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null }),
      }) 
    }),
  };
}

export { supabase };

export async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (error) {
    console.error("Erro ao obter token de acesso:", error);
    return null;
  }
}

export async function ensureSessionOrThrow() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error("Sessão não encontrada. Faça login.");
    }
    return session;
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    throw error;
  }
}

export function getProjectRef(): string {
  try {
    const { supabaseUrl } = getEnv();
    const match = /https:\/\/([^.]+)\.supabase\.co/.exec(supabaseUrl);
    return match ? match[1] : "";
  } catch (error) {
    console.error("Erro ao obter referência do projeto:", error);
    return "";
  }
}
