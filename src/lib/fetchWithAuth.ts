import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface FetchResult<T = any> {
  data: T;
  status: number;
  cid: string;
}

export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<FetchResult<T>> {
  const cid = uuidv4();
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      const err = new Error("Usuário não autenticado");
      (err as any).cid = cid;
      throw err;
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-correlation-id", cid);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...options, headers });

    let responseData: any = null;
    try {
      responseData = await response.json();
    } catch {}

    const responseCid =
      response.headers.get("x-correlation-id") || responseData?.cid || cid;

    return { data: responseData as T, status: response.status, cid: responseCid };
  } catch (error) {
    if (error && typeof error === "object") {
      (error as any).cid = (error as any).cid || cid;
    }
    throw error;
  }
}
