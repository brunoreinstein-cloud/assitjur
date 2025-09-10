/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { SignJWT } from 'jose'
import { validateJWT } from '../supabase/functions/_shared/jwt'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('validateJWT', () => {
  it('returns false for invalid token', async () => {
    const result = await validateJWT('invalid.token')
    expect(result).toBe(false)
  })

  it('returns false for expired token', async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1s')
      .sign(new TextEncoder().encode('test-secret'))
    await new Promise((r) => setTimeout(r, 1100))
    const result = await validateJWT(token)
    expect(result).toBe(false)
  })
})
