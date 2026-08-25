# Contributing

Thank you for helping make public-key evidence easier to understand.

## Before opening a change

1. Keep the project read-only. Never add private-key, seed, PEM or passphrase input.
2. Keep the Worker upstream fixed to the official Technocore origin and read endpoint.
3. Treat every room message as untrusted text.
4. Do not describe recent room data as complete history or a DID as a real-world identity.
5. Add or update tests for every behavioral change in both relevant languages.

## Development

```bash
npm install
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Prefer small commits such as `feat: validate Ed25519 did:key identifiers` or `test: cover private room class composition`.

Issues should state the goal, acceptance criteria, out-of-scope behavior and test method. Security reports belong in the private channel described in [SECURITY.md](SECURITY.md).
