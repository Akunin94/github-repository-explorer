import { describe, it, expect } from 'vitest'
import {
  formatCount,
  formatNumber,
  formatRelativeDate,
  languageColor,
} from '@/utils/format'

describe('formatCount', () => {
  it('compacts thousands and millions', () => {
    expect(formatCount(999)).toBe('999')
    expect(formatCount(1234)).toBe('1.2K')
    expect(formatCount(1_500_000)).toBe('1.5M')
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })
})

describe('formatRelativeDate', () => {
  const now = new Date('2026-07-20T12:00:00Z')

  it('formats a past date', () => {
    expect(formatRelativeDate('2026-07-17T12:00:00Z', now)).toBe('3 days ago')
  })

  it('uses natural wording for yesterday', () => {
    expect(formatRelativeDate('2026-07-19T12:00:00Z', now)).toBe('yesterday')
  })

  it('returns empty string for invalid input', () => {
    expect(formatRelativeDate('not-a-date', now)).toBe('')
  })
})

describe('languageColor', () => {
  it('returns a known color', () => {
    expect(languageColor('TypeScript')).toBe('#3178c6')
  })

  it('falls back to grey for unknown languages', () => {
    expect(languageColor('Brainfuck')).toBe('#8b949e')
  })
})
