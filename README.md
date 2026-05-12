# Asset tracking challenge

A take-home challenge for software engineering interns. Candidates build a frontend on top of a small local backend that simulates the operational asset tracking system of a multi-site research lab.

This is a **monorepo** with two apps you run side by side:

- [`api/`](./api) — small Node/Fastify backend with a seeded SQLite database. Candidates don't modify it.
- [`starter/`](./starter) — the Next.js starter that candidates fork. Has the API client wired up, types, primitives, and stub pages.

## Quick start

```bash
pnpm install

# Runs the API on :8080 and the starter on :3000
pnpm dev
```

Open http://localhost:3000.

The starter reads `API_BASE_URL` and `API_TOKEN` from `starter/.env` (defaults: `http://localhost:8080/v1` and a placeholder token). Copy `starter/.env.example` to `starter/.env` if you don't have one. Both are server-side only — the browser talks to a proxy at `/api/upstream` that attaches the token, so it never reaches the client.

## What's in here

| Document | For |
|---|---|
| [`docs/CHALLENGE.md`](./docs/CHALLENGE.md) | The candidate-facing brief |
| [`docs/CONTEXT.md`](./docs/CONTEXT.md) | Background on the kind of system this is and why each piece exists. Optional. |
| [`api/README.md`](./api/README.md) | How to run and test the API |
| [`starter/README.md`](./starter/README.md) | How to run the starter |
| [`starter/docs/api-reference.md`](./starter/docs/api-reference.md) | The API contract |
| [`starter/docs/tips.md`](./starter/docs/tips.md) | Notes for candidates |
| [`starter/docs/happy-path.md`](./starter/docs/happy-path.md) | 10-step smoke test for candidates |

## Testing

```bash
pnpm test          # all packages
pnpm --filter @asset-tracking/api test
pnpm --filter @asset-tracking/starter test
```

## License

MIT. See [LICENSE](./LICENSE).
