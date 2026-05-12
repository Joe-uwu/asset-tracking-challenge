# Tips

Short notes before you start coding.

## The scan input

`<ScanInput onScan={fn} />` is a thin wrapper around an `<input>`. It auto-focuses on mount, fires `onScan(trimmed)` on Enter, clears, and re-focuses. That's all. If you want a different shape — multi-line, paste handling, barcode auto-submit on a specific length — replace it. It's there as a starting point, not a constraint.

Two things worth keeping if you build your own:
- Focus doesn't leave the input when an error appears. The tech's next action is the next scan; don't make them tap the input again.
- Enter on an empty value is a no-op. Otherwise idle Enter presses fire scans.

## Errors

The API returns structured errors:

```json
{ "error": { "code": "and_match_failed", "message": "...", "details": { ... } } }
```

The provided `ApiError` class in `lib/api-client.ts` exposes `status`, `code`, and `details`. Branch on `code`, not on message strings. Codes you'll see most:

- `and_match_failed` — receive scan with mismatched serial. Surface the existing serial in your UI so the tech can compare.
- `invalid_transition` — wrong state for this scan. Show the asset's current state.
- `incomplete_deploy_location` — deploy without rack or ru.
- `unknown_asset` — scanned tag isn't in the database.

Generic catch-all messages ("Something went wrong") are worse than no error message. Read the code and tell the user what to do.

## How the token wiring works

The bearer token stays server-side. There are two patterns in the starter:

- **From the browser** (your scan pages, the manager list, asset detail): use `api` from `lib/api-client.ts` as normal. Under the hood it talks to `/api/upstream/*` — a same-origin proxy in `app/api/upstream/[...path]/route.ts` that attaches the token before forwarding. You don't pass `API_TOKEN` to anything in client code.
- **From a server route handler** (your reconciliation route): use the same `api` import. On the server it skips the proxy and talks to `API_BASE_URL` directly with `API_TOKEN`. One less hop.

You should not reach for `NEXT_PUBLIC_API_TOKEN`. If you find yourself wanting to, route through the proxy instead.

## Why reconciliation lives server-side

Keep the join logic in `app/api/reconcile/route.ts`, not in the page. Two reasons:

1. The join is the interesting bit of work. Keeping it in one server route makes it testable.
2. The page stays small — it fetches one JSON document and renders it.

The page at `/manager/reconcile` should just fetch from `/api/reconcile`.

## Tailwind defaults are visible

`bg-gray-100 p-4 rounded` everywhere reads as "I didn't think about this." A few minutes spent on typographic hierarchy, density, and contrast will be noticed. Don't go overboard on custom theming — taste shows up in restraint.

## Use the reset endpoint

`POST /v1/reset` wipes the database back to the seeded ~1,000 assets. Hit it before recording your Loom so the demo runs against known state. The starter's `api.reset()` helper does this.

If you want a "reset" button somewhere in the dev UI, that's a reasonable call; just don't leave it in a production-looking surface.

## Things candidates often miss

- The AND-match logic on receive (tag + serial). It's a real-world constraint at the dock.
- Showing the asset's current state on the store / deploy screens *after* scanning the tag, before committing the scan. Lets a tech catch "wait, this isn't supposed to be here yet."
- Empty states. The asset list, the event log, the reconciliation report — what does each look like with zero rows?
- The event log is in *desc* order. Render it that way.
