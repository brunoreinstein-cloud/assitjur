import { jwtVerify } from 'jose'

const secret = (typeof Deno !== 'undefined' ? Deno.env.get('JWT_SECRET') : process.env.JWT_SECRET)

export async function validateJWT(token: string | null): Promise<boolean> {
  if (!token || !secret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}
