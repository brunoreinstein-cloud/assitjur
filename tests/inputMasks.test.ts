import { describe, it, expect } from 'vitest'
import { formatCNPJ, formatOAB } from '@/utils/inputMasks'

describe('input masks', () => {
  it('formats CNPJ', () => {
    expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99')
  })

  it('formats OAB', () => {
    expect(formatOAB('sp123456')).toBe('SP 123456')
  })
})
