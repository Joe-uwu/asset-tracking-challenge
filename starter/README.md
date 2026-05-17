# Asset tracking — challenge starter

Welcome. **Read [`../docs/CHALLENGE.md`](../docs/CHALLENGE.md) first** — it explains what you're building. If you want more narrative on *why* this kind of system exists, [`../docs/CONTEXT.md`](../docs/CONTEXT.md) is optional background.

This README is operational: how to install, run, and deploy.

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FREPLACE_WITH_YOUR_REPO%2Fasset-tracking-challenge%2Ftree%2Fmain%2Fstarter&env=API_BASE_URL,API_TOKEN&envDescription=Provided%20with%20your%20challenge%20brief)

(If you're forking and submitting, update the URL above to point at your fork.)

## Quick start

```bash
# From the monorepo root
pnpm install
pnpm dev
# API on :8080, starter on :3000
```

Or from this directory:

```bash
pnpm install      # if you haven't from the root
cp .env.example .env
# Edit .env with the API URL and token from your challenge email
pnpm dev
```

Open http://localhost:3000.

The starter expects the upstream API at `API_BASE_URL` (default `http://localhost:8080/v1`). Browser requests go through a same-origin proxy at `/api/upstream/*` — the proxy attaches the bearer token server-side, so `API_TOKEN` never reaches the client.

## What's prebuilt

| File | What |
|---|---|
| `lib/api-client.ts` | Typed wrapper around every `/v1/*` endpoint. In the browser it talks to `/api/upstream`; on the server it goes directly to `API_BASE_URL`. Throws `ApiError` with the structured error payload. |
| `lib/types.ts` | TypeScript mirror of the API schemas. |
| `lib/auth.ts` | Cookie-based role switcher between `tech-jane` and `manager-paul`. |
| `components/ScanInput.tsx` | Auto-focus, Enter-to-submit, glove-sized input. Use it or replace it. |
| `components/RoleSwitcher.tsx` | Header button to swap roles. |
| `app/api/upstream/[...path]/route.ts` | Same-origin proxy that adds the bearer token. Don't modify unless you have a reason. |
| `app/page.tsx` | Landing page. |
| `docs/api-reference.md` | API contract. |
| `docs/tips.md` | Notes you'll want to read before coding. |
| `docs/happy-path.md` | 10-step smoke test. Run before submitting. |

## What you'll build

These files are stubs you'll replace. Read [`../docs/CHALLENGE.md`](../docs/CHALLENGE.md) for the requirements behind each.

**Tech (mobile-first scan workflows):**

| File | Build |
|---|---|
| `app/tech/receive/page.tsx` | The dock-side receive scan. New tag → create. Duplicate tag + matching serial → idempotent. Duplicate tag + different serial → loud error. |
| `app/tech/store/page.tsx` | Asset scan → storage location scan → commit. |
| `app/tech/deploy/page.tsx` | Asset scan → deploy location scan (must include rack + ru) → commit. Should also write back to facilities + finance. |
| `app/tech/transfer/page.tsx` | Asset scan → receiving party's badge scan → custodian changes; state doesn't. |
| `app/tech/page.tsx` | Optional tech landing page. |

**Manager (desktop):**

| File | Build |
|---|---|
| `app/manager/page.tsx` | Asset list. Filter by state / site / custodian. Links to detail. |
| `app/manager/assets/[tag]/page.tsx` | Asset detail. Current state + event history. |
| `app/manager/reconcile/page.tsx` | Renders the reconciliation report from the route handler below. |
| `app/api/reconcile/route.ts` | **Server-side join.** Pulls ops, facilities, and finance. Classifies. Returns a structured report. Currently returns 501. |

**Barcode tooling (your call where it lives):**

A way to produce scannable barcodes for a handful of asset tags (pick interesting ones) + a handful of locations. Could be `app/dev/barcodes/page.tsx`, a printable PDF, a script under `scripts/`, whatever fits.

**Your README:**

A `README.md` at the root of your fork. Include:

- A **"Three calls I nearly made the other way"** section.
- Anything in the brief or starter you'd push back on — bugs, typos, confusing claims. Pushback is a positive signal.
- How to run your app locally and what env vars it needs.

## Scripts

```bash
pnpm dev          # Next dev server
pnpm build        # Production build
pnpm start        # Run the production build
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm lint         # next lint
```

## Environment variables

| Variable | Notes |
|---|---|
| `API_BASE_URL` | Upstream API including `/v1`, e.g. `http://localhost:8080/v1` |
| `API_TOKEN` | Server-only. Do **not** prefix with `NEXT_PUBLIC_`. Browser code hits `/api/upstream/*` instead. |

## Three calls I nearly made the other way

1. **Write-back location**: I considered putting write-back logic in client-side tech workflows (deploy/store), in dedicated API route handlers, or in server actions. I chose server actions because they keep the API token server-side (like the existing `/api/upstream` proxy), provide transactional semantics for multi-system updates, and can be easily extended with retry logic later if needed—without complicating the client code or compromising security.

2. **Data fetching approach**: I debated between using SWR for caching/revalidation versus direct fetch with useState/useEffect in each tech workflow. I chose SWR for the manager dashboard (where data freshness is less critical) but kept direct fetch with loading/error states in tech workflows because technicians need immediate, deterministic feedback on every scan—SWR's background revalidation could confuse users expecting instant scan results.

3. **Manager dashboard layout**: I considered showing the full asset list by default versus hiding it behind progressive disclosure. I chose to hide the asset list behind an expandable section because managers need to see critical validation discrepancies (missing capitalization, phantom items, etc.) within 60 seconds—the executive anomaly snapshot provides this instant visibility, while the full list is secondary detail available on demand.

## What I chose not to build

- **RMA workflow UI**: While the state machine supports RMA transitions, I skipped implementing a dedicated UI for RMA workflows because the challenge explicitly states the RMA workflow is NOT required to build—the state machine supports it but no UI is needed. This keeps the implementation focused on the core scanning workflows and reconciliation features that are central to the challenge.
  
- **Advanced filtering UI**: I skipped features like saved filter presets, column sorting, and bulk operations because the challenge emphasizes judgment over feature count, and the core filtering by state/site/custodian provides sufficient managerial oversight without over-engineering the interface.

- **Offline capabilities**: I deliberately omitted service workers or local data persistence since the challenge states offline mode is NOT required—the system assumes technicians have connectivity during scanning operations, and implementing offline sync would add significant complexity for minimal value in this context.

- **API rate limit handling**: I did not implement specific rate limit handling or queuing mechanisms because the challenge explicitly states backend hardening (including rate limit tuning) is NOT required—the provided 60 req/min limit is sufficient for the workflows, and adding client-side queuing would violate the principle of not building what's not required.

- **Detailed asset spec lookup**: In the receive workflow, I used deterministic test data based on asset tags rather than connecting to a purchase order/master asset database because the challenge focuses on UX judgment, not backend integration—this keeps the implementation focused on the frontend experience while still demonstrating proper state transitions and error handling.

## Bugs and inconsistencies found

1. **State machine inconsistency**: The API documentation states that assets in `rma_pending` state can transition back to `received` via `rma_receive_back` event, but there's no corresponding `rma_receive_back` scan endpoint—only `rma_open` exists. This creates an inconsistency where assets can enter RMA pending but cannot return to received state through the exposed scan APIs.

2. **Location schema ambiguity**: The `Location` type allows `room`, `row`, `rack`, and `ru` to be nullable, but the deploy endpoint requires `site`, `room`, `rack`, and `ru` to be present (per `incomplete_deploy_location` error). This creates confusion about whether `room` and `row` are truly optional—developers must infer from error messages rather than the schema definition alone.

## Write-back location rationale

Write-backs (deploy → facilities/finance POST) live in server actions rather than client-side or route handlers for three key reasons: First, **token security**—server actions keep the API token server-side like the existing `/api/upstream` proxy, preventing any risk of token exposure to the browser. Second, **transactional semantics**—server actions allow us to group multiple system updates (Operations via the deploy scan, then Facilities and Finance writes) into a logical unit where we can handle partial successes appropriately. Third, **separation of concerns**—this keeps tech workflows focused on scan UX while delegating system synchronization to dedicated server functions. If retry logic were needed later (though not required per challenge), it could be cleanly added to these server actions without complicating the client code or requiring token handling in the UI layer.

## How to run your app locally

1. Start the API: `pnpm --filter @asset-tracking-api dev` (or from the api/ directory: `pnpm dev`)
2. Install frontend deps: `pnpm install` (in starter/ directory)
3. Set up environment: Copy `.env.example` to `.env` and verify the values
4. Start the frontend: `pnpm dev` (in starter/ directory)
5. Visit http://localhost:3000

The app requires two environment variables in `starter/.env`:
- `API_BASE_URL`: The base URL of the API (including `/v1` suffix)
- `API_TOKEN`: The bearer token for server-to-server communication

## Known issues and tradeoffs

- **Location parsing**: The deploy workflow uses a simple string splitter for location input, which expects "Site/Room/Row/Rack/RU" format. For production, a more robust parser or structured input would be preferable, but this balances simplicity with functionality for the challenge scope.
- **Receive workflow data**: The receive workflow uses deterministic test data based on asset tags rather than looking up actual asset specifications. This keeps the focus on UX judgment while still demonstrating proper state machine transitions.
- **Error handling**: All major API error codes are handled with user-friendly messages, but network errors and timeout scenarios rely on SWR's default retry behavior (which is appropriate given requirements prohibit custom retry logic).