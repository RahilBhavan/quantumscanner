import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { getClientIp } from './ip'

function makeRequest(headers: Record<string, string>) {
  return new NextRequest('http://localhost/test', { headers })
}

describe('getClientIp', () => {
  it('prefers x-vercel-forwarded-for', () => {
    const req = makeRequest({
      'x-vercel-forwarded-for': '1.2.3.4',
      'x-forwarded-for': '5.6.7.8',
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '5.6.7.8, 9.10.11.12' })
    expect(getClientIp(req)).toBe('5.6.7.8')
  })

  it('returns localhost when no headers present', () => {
    const req = makeRequest({})
    expect(getClientIp(req)).toBe('127.0.0.1')
  })

  it('ignores x-forwarded-for spoofing when x-vercel-forwarded-for is present', () => {
    const req = makeRequest({
      'x-vercel-forwarded-for': '203.0.113.1',
      'x-forwarded-for': '10.0.0.1',
    })
    // Must use vercel header, not the potentially-spoofed x-forwarded-for
    expect(getClientIp(req)).toBe('203.0.113.1')
  })
})
