import { getAccessToken, getProjectRef } from './supabaseClient'

export async function callAssistjurProcessos(body = {}) {
  const projectRef = getProjectRef()
  const jwt = await getAccessToken()
  const correlationId = crypto.randomUUID()

  const url = `https://${projectRef}.functions.supabase.co/assistjur-processos`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      'x-correlation-id': correlationId,
    },
    body: JSON.stringify(body),
  })

  return { data: await response.json(), correlationId, status: response.status }
}

