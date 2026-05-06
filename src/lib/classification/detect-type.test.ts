import { describe, it, expect } from 'vitest'
import { detectAddressType } from './detect-type'

describe('detectAddressType', () => {
  it('identifies P2PKH addresses starting with 1', () => {
    expect(detectAddressType('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(
      'P2PKH'
    )
    expect(detectAddressType('1BoatSLRHtKNngkdXEeobR76b53LETtpyT')).toBe(
      'P2PKH'
    )
  })

  it('identifies P2SH addresses starting with 3', () => {
    expect(detectAddressType('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe('P2SH')
    expect(detectAddressType('3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64')).toBe('P2SH')
  })

  it('identifies P2WPKH as bc1q with 20-byte witness program (39 chars total)', () => {
    // bc1q + 20-byte witness = 42 char bech32
    expect(
      detectAddressType('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')
    ).toBe('P2WPKH')
    expect(
      detectAddressType('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    ).toBe('P2WPKH')
  })

  it('identifies P2WSH as bc1q with 32-byte witness program (62 chars total)', () => {
    // bc1q + 32-byte witness = 62 char bech32
    expect(
      detectAddressType(
        'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'
      )
    ).toBe('P2WSH')
  })

  it('identifies P2TR addresses starting with bc1p', () => {
    expect(
      detectAddressType(
        'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr'
      )
    ).toBe('P2TR')
    expect(
      detectAddressType(
        'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0'
      )
    ).toBe('P2TR')
  })

  it('returns UNKNOWN for invalid checksum', () => {
    expect(detectAddressType('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf')).toBe(
      'UNKNOWN'
    )
  })

  it('returns UNKNOWN for testnet addresses', () => {
    // Testnet P2PKH starts with m or n
    expect(detectAddressType('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn')).toBe(
      'UNKNOWN'
    )
  })

  it('returns UNKNOWN for empty string', () => {
    expect(detectAddressType('')).toBe('UNKNOWN')
  })

  it('returns UNKNOWN for garbage input', () => {
    expect(detectAddressType('notanaddress')).toBe('UNKNOWN')
    expect(detectAddressType('0x1234567890abcdef')).toBe('UNKNOWN')
  })
})
