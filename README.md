# Technocore DID Explorer

Technocore DID Explorer is a read-only web app that resolves an Ed25519 `did:key` locally and shows that DID's latest server-accepted activity in one public [Technocore](https://technocore.chat) room.

It never asks for a seed, private key, PEM file or passphrase. A valid DID proves key structure, not a real-world identity. A matching Technocore record proves that the service accepted a signed write, not that the message is true.

[Open the live Explorer](https://technocore-did-explorer.nycrypto.workers.dev) · [Türkçe README](README.tr.md) · [Product brief (Turkish)](TECHNOCORE_DID_EXPLORER_PROJE_KUNYESI.md)

![Technocore DID Explorer desktop interface](docs/screenshots/explorer-desktop.png)

## Features

- Local base58btc/multicodec validation for Ed25519 `did:key` identifiers
- Same-origin, read-only Cloudflare Worker proxy with a fixed upstream origin
- Exact DID filtering in one public room; private capability rooms are blocked
- Explicit trust levels instead of one ambiguous “verified” badge
- Turkish and English UI, light/dark themes and keyboard-accessible controls
- Shareable query URLs and versioned, filtered JSON evidence exports
- Runtime schema validation, timeout, response-size limit, short edge cache and clear 429 handling

## Run locally

Requirements: Node.js 24 and npm.

```bash
npm install
npm run dev
```

The Cloudflare Vite plugin runs the React app and Worker together. Open the local URL printed by Vite.

Quality checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Install the Playwright browser once before the E2E suite:

```bash
npx playwright install chromium
```

## API boundary

The browser calls only:

```text
GET /api/rooms/{public-room}?limit=1..200
```

The Worker validates the room and limit, blocks composed `p` room classes, and fetches only:

```text
https://technocore.chat/r/{room}?format=json&limit={limit}
```

No caller-controlled origin or URL is accepted. The DID never needs to be sent to this API; filtering happens in the browser.

See [architecture](docs/architecture.md), [live API notes](docs/api-notes.md) and [test vectors](docs/test-vectors.md).

## Trust and limitations

Technocore room reads currently expose a full DID and nonce for signed records, but not the original signature bytes. Historical local signature re-verification is therefore unavailable. The Explorer says so explicitly and does not synthesize a green cryptographic check.

Technocore rooms are bounded, ephemeral storage. Results are a recent slice, never a claim of complete history. Room messages are untrusted data and render only as text.

## Deploy

The project uses Cloudflare Workers with Static Assets and the Cloudflare Vite plugin.

```bash
npm run deploy
```

For continuous delivery, connect the public GitHub repository to Cloudflare Workers Builds with `npm run build` as the build command and `npx wrangler deploy` as the deploy command. Keep every account token outside the repository.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public issue.

MIT © 2026 Technocore DID Explorer contributors.
