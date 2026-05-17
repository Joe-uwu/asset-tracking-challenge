# Implementation Plan

## Phase 1: API Understanding and Shared Primitives

### Files Touched
- `lib/api-client.ts` (review only)
- `lib/types.ts` (review only)
- `docs/API_NOTES.md` (created)

### Acceptance Criteria
- Complete understanding of all API endpoints, schemas, and error codes
- Ability to make typed API calls without referring to documentation
- Identification of reusable components (`<ScanInput>`, auth helpers)
- Decision on whether custom API helpers are needed

### Smallest Validation Command
```bash
# Test API connection from starter directory
pnpm dev
# In another terminal:
curl http://localhost:3000/api/upstream/health
# Should return: {"ok":true,"version":"1.0.0"}
```

### Risks
- Misunderstanding state machine transitions
- Missing subtle differences between similar endpoints
- Overlooking edge cases in location schema

### New Package Needed
No - using existing API client and types

## Phase 2: Manager Dashboard

### Files Touched
- `app/manager/page.tsx` - Asset list with filtering
- `app/manager/assets/[tag]/page.tsx` - Asset detail page
- `components/` - Possible reusable components (asset card, event log)

### Acceptance Criteria
- Asset list shows data with pagination
- Filtering by state/site/custodian works
- Loading, empty, and error states handled
- Asset detail shows current state and event log (newest first)
- Links work between list and detail pages
- Mobile-responsive design

### Smallest Validation Command
```bash
# After implementing manager pages
pnpm dev
# Visit http://localhost:3000/manager
# Should see asset list or appropriate empty/loading state
```

### Risks
- Over-fetching data causing performance issues
- Complex filtering logic
- Handling real-time updates (though not required initially)
- Pagination implementation complexity

### New Package Needed
No - using React built-in state management initially

## Phase 3: Scan Workflows

### Files Touched
- Shared component: `components/ScanWorkflow.tsx` (to be created)
- `app/tech/receive/page.tsx`
- `app/tech/store/page.tsx`
- `app/tech/deploy/page.tsx`
- `app/tech/transfer/page.tsx`

### Acceptance Criteria
- Keyboard scanner path works for all workflows
- Clear success/error/recovery states
- Input remains focused after scans (glove-friendly)
- Proper validation and error messaging
- State transitions work correctly per API
- Mobile camera scanning considered but deferred until keyboard path solid

### Smallest Validation Command
```bash
# Test receive workflow
pnpm dev
# Visit http://localhost:3000/tech/receive
# Scan a valid tag (e.g., C0009001) - should create asset
# Scan same tag again - should show idempotent success
# Scan same tag with different serial - should show clear error
```

### Risks
- Input losing focus after errors/scans
- Complex state management between scan steps
- Camera scanning complexity and performance
- Handling duplicate scan attempts gracefully

### New Package Needed
Yes - for camera scanning: `@zxing/browser` or `html5-qrcode` (deferred until Phase 3)

## Phase 4: Write-Back Sync

### Files Touched
- `app/tech/deploy/page.tsx` - Add facilities+finance writes
- `app/tech/store/page.tsx` - Add facilities clear on store-from-in_service
- `lib/api-client.ts` - May need helper functions for mock updates

### Acceptance Criteria
- On successful deploy: writes to facilities (set rack location) and finance (capitalize)
- On store from in_service: writes to facilities with rack_location: null
- No writes for receive/store-from-received/transfer
- Token remains server-side (no exposure to browser)
- Write-backs verified via reconciliation report

### Smallest Validation Command
```bash
# After implementing deploy with write-backs
pnpm dev
# Visit http://localhost:3000/tech/deploy
# Scan asset in received/stored state, then scan complete location
# Visit http://localhost:3000/manager/reconcile
# Should show asset as matched (no drift) after deploy
```

### Risks
- Accidentally leaking token to client
- Writing to mocks when not appropriate (receive/store-received/transfer)
- Failures in write-backs not handled gracefully
- Race conditions between scan and write-back

### New Package Needed
No - extending existing API client

## Phase 5: Reconciliation

### Files Touched
- `app/api/reconcile/route.ts` - Server-side join logic
- `app/manager/reconcile/page.tsx` - Report display page
- Possible utility functions for categorization logic

### Acceptance Criteria
- Server-side route pulls operations, facilities, finance data
- Compares/synthesizes data into structured report
- Categorizes differences (expected variance, real drift, needs human review)
- Manager-friendly explanations for each category
- Page loads report and displays it clearly
- Handles loading, error, empty states

### Smallest Validation Command
```bash
# Test reconciliation endpoint directly
pnpm dev
# Visit http://localhost:3000/api/reconcile
# Should return JSON report (not 501 error)
# Then visit http://localhost:3000/manager/reconcile
# Should display the report
```

### Risks
- Complex join logic with inconsistent schemas
- Determining meaningful categorization without domain expertise
- Performance with larger datasets
- Explaining technical differences to non-technical users
- Token security in server route

### New Package Needed
No - using existing API client in route handler

## Phase 6: Barcodes and Submission Polish

### Files Touched
- `app/dev/barcodes/page.tsx` (or alternative location)
- `starter/README.md` - Updated with setup, tradeoffs, etc.
- `docs/DECISIONS.md` - "Three calls I nearly made the other way"
- Possible script or utility for barcode generation

### Acceptance Criteria
- Method to generate scannable barcodes for assets/locations
- Includes examples of interesting cases (drifted, ghost/orphan, disposed assets)
- Includes location codes and user badges
- README updated with all required sections
- Tradeoffs and skipped items documented
- Known bugs/issues listed if any
- Loom preparation points documented

### Smallest Validation Command
```bash
# Test barcode generation
pnpm dev
# Visit http://localhost:3000/dev/barcodes
# Should show/generate scannable barcodes
# Test with actual scanner or camera
```

### Risks
- Spending too much time on polish vs core functionality
- Barcode generation complexity or dependencies
- Ensuring barcodes are actually scannable
- Balancing completeness with submission deadline

### Package Needed
Yes - for barcode generation: `react-qr-code` or `jsbarcode` or similar

## Overall Validation
After each phase:
```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests (as applicable)
pnpm --filter @asset-tracking/starter test
```

Final validation:
```bash
# Full happy path test
pnpm dev
# Follow docs/happy-path.md steps 1-11
```