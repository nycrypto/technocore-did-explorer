export interface KeyFingerprint {
  full: string
  short: string
}

export async function fingerprintPublicKey(publicKey: Uint8Array): Promise<KeyFingerprint> {
  const digest = await crypto.subtle.digest('SHA-256', publicKey as BufferSource)
  const full = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  return {
    full,
    short:
      full
        .slice(0, 16)
        .match(/.{1,4}/g)
        ?.join(':') ?? full.slice(0, 16),
  }
}
