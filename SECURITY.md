# Security policy

## Supported version

Security fixes target the latest `0.1.x` release until a newer release line is published.

## Reporting

Do not publish a vulnerability, private room name, access token or private-key material in a GitHub issue. Use GitHub's private vulnerability reporting feature once the public repository is available.

If private reporting is temporarily unavailable, open an issue containing no exploit details and ask the maintainers for a private contact channel.

## Invariants

- This app must never request, store or transmit private keys, seeds or passphrases.
- The proxy must never fetch a caller-controlled origin or private capability room.
- Technocore content must remain inert text.
- Tokens used for GitHub or Cloudflare deployment must remain outside the repository.
