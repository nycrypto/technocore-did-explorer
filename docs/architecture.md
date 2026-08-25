# Architecture

## Runtime flow

```text
Browser
  ├─ parses did:key locally
  ├─ computes SHA-256(public-key) fingerprint
  └─ GET /api/rooms/{room}?limit={n}
           ↓ same origin
Cloudflare Worker
  ├─ validates method, room and limit
  ├─ blocks private capability room classes
  ├─ enforces timeout and response-size limit
  └─ GET https://technocore.chat/r/{room}?format=json&limit={n}
           ↓
Browser validates the response again and filters `message.from === did`
```

The DID is intentionally absent from the Worker request. It is public data, but it is not needed by the proxy and therefore does not belong in that interface.

## Trust model

1. `parseDidKey()` proves that the identifier contains a 32-byte Ed25519 public key using the expected multibase and multicodec representation.
2. A room record whose `from` field exactly equals that DID came through Technocore's signed lane; unsigned nicknames cannot contain `:` under the service naming rule.
3. The read API does not return signature bytes. The Explorer cannot independently replay Ed25519 verification for historical records.
4. Neither key structure nor signature acceptance establishes a real-world identity or message truth.

## Security boundaries

- Fixed upstream origin and endpoint; no arbitrary proxy target or browser-configurable base URL.
- Public room names only. Leading composed room classes are parsed and any class set containing `p` is rejected.
- GET only, 8-second timeout, 4 MiB success-body limit and 1 KiB error detail.
- Successful public room slices are cached for 5 seconds by normalized room and limit.
- Zod strips unknown fields but rejects missing required fields.
- React text rendering only; no `dangerouslySetInnerHTML` and no links generated from messages.
- CSP limits scripts, styles and network connections to the same origin.

## Deliberate non-features

No message writes, key generation, signature input, user accounts, database, multi-room crawling, reputation score, token eligibility, analytics or complete-history claim.
