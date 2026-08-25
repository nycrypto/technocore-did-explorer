import { describe, expect, it } from 'vitest'
import { fingerprintPublicKey } from './fingerprint'

describe('fingerprintPublicKey', () => {
  it('returns a deterministic full and short SHA-256 fingerprint', async () => {
    const key = Uint8Array.from({ length: 32 }, (_, i) => i + 1)
    const first = await fingerprintPublicKey(key)
    const second = await fingerprintPublicKey(key)

    expect(first).toEqual(second)
    expect(first.full).toMatch(/^[a-f0-9]{64}$/)
    expect(first.short).toMatch(/^[a-f0-9]{4}(:[a-f0-9]{4}){3}$/)
    expect(first.short.replaceAll(':', '')).toBe(first.full.slice(0, 16))
  })
})
