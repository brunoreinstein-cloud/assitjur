import { supabase } from '@/integrations/supabase/client'
import type { MapaRequest, MapaResponse } from '@/contracts/mapaTestemunhas'

export async function callMapa(
  nomeFn: 'mapa-testemunhas-processos' | 'mapa-testemunhas-testemunhas',
  body: MapaRequest
) {
  console.log('➡️ Invocando', nomeFn, 'payload=', body)
  const { data, error } = await supabase.functions.invoke(nomeFn, { body })
  if (error) {
    console.error('❌ Edge Function error', error)
    throw error
  }
  return data as MapaResponse
}

