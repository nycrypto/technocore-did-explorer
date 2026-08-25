import { base58btc } from 'multiformats/bases/base58'

export type DidKeyErrorCode =
  | 'DID_REQUIRED'
  | 'INVALID_DID_PREFIX'
  | 'INVALID_MULTIBASE'
  | 'INVALID_BASE58'
  | 'UNSUPPORTED_CODEC'
  | 'INVALID_KEY_LENGTH'

export class DidKeyError extends Error {
  constructor(public readonly code: DidKeyErrorCode) {
    super(code)
    this.name = 'DidKeyError'
  }
}

export interface ParsedDidKey {
  did: string
  methodSpecificId: string
  codec: 'Ed25519'
  publicKey: Uint8Array
}

const ED25519_MULTICODEC = [0xed, 0x01] as const
const ED25519_KEY_LENGTH = 32

export function parseDidKey(input: string): ParsedDidKey {
  const did = input.trim()

  if (!did) {
    throw new DidKeyError('DID_REQUIRED')
  }
  if (!did.startsWith('did:key:')) {
    throw new DidKeyError('INVALID_DID_PREFIX')
  }

  const methodSpecificId = did.slice('did:key:'.length)
  if (!methodSpecificId.startsWith('z')) {
    throw new DidKeyError('INVALID_MULTIBASE')
  }

  let decoded: Uint8Array
  try {
    decoded = base58btc.decode(methodSpecificId)
  } catch {
    throw new DidKeyError('INVALID_BASE58')
  }

  if (decoded[0] !== ED25519_MULTICODEC[0] || decoded[1] !== ED25519_MULTICODEC[1]) {
    throw new DidKeyError('UNSUPPORTED_CODEC')
  }

  const publicKey = decoded.slice(ED25519_MULTICODEC.length)
  if (publicKey.length !== ED25519_KEY_LENGTH) {
    throw new DidKeyError('INVALID_KEY_LENGTH')
  }

  return { did, methodSpecificId, codec: 'Ed25519', publicKey }
}

export function abbreviateDid(did: string): string {
  return did.length > 32 ? `${did.slice(0, 20)}…${did.slice(-10)}` : did
}
