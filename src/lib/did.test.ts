import { base58btc } from 'multiformats/bases/base58'
import { describe, expect, it } from 'vitest'
import { DidKeyError, parseDidKey } from './did'
import { VALID_DID } from '../test/fixtures'

function didFor(codec: number[], keyLength = 32): string {
  const bytes = new Uint8Array([...codec, ...Array.from({ length: keyLength }, (_, i) => i + 1)])
  return `did:key:${base58btc.encode(bytes)}`
}

function expectCode(value: string, code: string) {
  try {
    parseDidKey(value)
    throw new Error('Expected parsing to fail')
  } catch (error) {
    expect(error).toBeInstanceOf(DidKeyError)
    expect((error as DidKeyError).code).toBe(code)
  }
}

describe('parseDidKey', () => {
  it('resolves a valid Ed25519 did:key and trims outer whitespace', () => {
    const parsed = parseDidKey(`  ${VALID_DID}\n`)
    expect(parsed.did).toBe(VALID_DID)
    expect(parsed.codec).toBe('Ed25519')
    expect(parsed.publicKey).toEqual(Uint8Array.from({ length: 32 }, (_, i) => i + 1))
  })

  it('rejects missing and malformed prefixes', () => {
    expectCode('', 'DID_REQUIRED')
    expectCode(VALID_DID.replace('did:key:', 'did:web:'), 'INVALID_DID_PREFIX')
  })

  it('rejects non-base58 multibase and invalid base58 characters', () => {
    expectCode('did:key:f1234', 'INVALID_MULTIBASE')
    expectCode('did:key:z0OIl', 'INVALID_BASE58')
  })

  it('rejects unsupported multicodecs', () => {
    expectCode(didFor([0xe7, 0x01]), 'UNSUPPORTED_CODEC')
  })

  it.each([31, 33])('rejects a %i-byte public key', (length) => {
    expectCode(didFor([0xed, 0x01], length), 'INVALID_KEY_LENGTH')
  })
})
