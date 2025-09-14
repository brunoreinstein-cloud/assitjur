import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMfa } from '@/hooks/useMfa'

const enroll = vi.hoisted(() => vi.fn())
const challenge = vi.hoisted(() => vi.fn())
const verify = vi.hoisted(() => vi.fn())
const unenroll = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { mfa: { enroll, challenge, verify, unenroll } }
  }
}))

const enrollResponse = { id: 'factor123', totp: { uri: 'otpauth://totp/example' } }
const challengeResponse = { id: 'challenge123' }
const verifySuccess = {
  access_token: 'token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'refresh',
  user: { id: 'user1' },
  backup_codes: ['backup-1', 'backup-2']
}

enroll.mockResolvedValue({ data: enrollResponse, error: null })
challenge.mockResolvedValue({ data: challengeResponse, error: null })
verify.mockImplementation(async ({ code }: { code: string }) => {
  if (code === '123456') return { data: verifySuccess, error: null }
  if (code === 'backup-1') return { data: { ...verifySuccess, method: 'backup_code' }, error: null }
  if (code === '999999') return { data: null, error: new Error('Code expired') }
  return { data: null, error: new Error('Invalid code') }
})
unenroll.mockResolvedValue({ data: {}, error: null })

describe('MFA onboarding and recovery', () => {
  let enableMfa: ReturnType<typeof useMfa>['enableMfa']
  let verifyMfa: ReturnType<typeof useMfa>['verifyMfa']

  beforeEach(() => {
    vi.clearAllMocks()
    enroll.mockResolvedValue({ data: enrollResponse, error: null })
    challenge.mockResolvedValue({ data: challengeResponse, error: null })
    ;({ enableMfa, verifyMfa } = useMfa())
  })

  it('registers MFA via TOTP', async () => {
    const data = await enableMfa()
    expect(data).toEqual(enrollResponse)
    expect(enroll).toHaveBeenCalledWith({ factorType: 'totp' })
  })

  it('verifies MFA with valid code', async () => {
    const data = await verifyMfa('factor123', '123456')
    expect(challenge).toHaveBeenCalledWith({ factorId: 'factor123' })
    expect(verify).toHaveBeenCalledWith({ factorId: 'factor123', challengeId: 'challenge123', code: '123456' })
    expect(data.backup_codes).toContain('backup-1')
  })

  it('supports fallback to backup code', async () => {
    const data = await verifyMfa('factor123', 'backup-1')
    expect(data.method).toBe('backup_code')
  })

  it('rejects invalid codes', async () => {
    await expect(verifyMfa('factor123', '000000')).rejects.toThrow('Invalid code')
  })

  it('rejects expired codes', async () => {
    await expect(verifyMfa('factor123', '999999')).rejects.toThrow('Code expired')
  })
})
