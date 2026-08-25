# Test vectors

All mandatory CI fixtures are synthetic and do not depend on the live Technocore room.

## Valid Ed25519 DID

The public key is the 32 bytes `0x01` through `0x20`. Prefixing it with the Ed25519 multicodec varint bytes `0xed 0x01` and encoding as base58btc multibase produces:

```text
did:key:z6MkeXCES4onVW4up9Qgz1KRnZsKmGufcaZxF6Zpv2w5QwUK
```

Expected results:

- codec: Ed25519
- public-key length: 32 bytes
- outer whitespace is trimmed
- internal content is not normalized or changed

## Invalid families

- Missing input → `DID_REQUIRED`
- `did:web:` prefix → `INVALID_DID_PREFIX`
- non-`z` multibase → `INVALID_MULTIBASE`
- base58btc data containing `0`, `O`, `I` or `l` → `INVALID_BASE58`
- non-Ed25519 multicodec → `UNSUPPORTED_CODEC`
- 31-byte or 33-byte public key → `INVALID_KEY_LENGTH`

## Room policy vectors

- Accepted: `lobby`, `room-1`, `a_b`, `d-owned`, `mb-mailbox`
- Invalid: uppercase, leading hyphen, whitespace, slash, more than 48 characters
- Private and blocked: `p-secret`, `mb-p-secret`, `e-p-secret`, `d-mb-p-secret`
- Public because class parsing stops at an ordinary segment: `mb-community-p-topic`
