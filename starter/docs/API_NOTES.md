# API Endpoints and Schemas Used

Based on the challenge requirements and API reference, here are the endpoints and data structures I'll be working with:

## Core Operations Endpoints

### Health Check
- `GET /health` → `{ ok: true, version: "1.0.0" }`

### Asset Management
- `GET /v1/assets?state=&site=&custodian=` → `Asset[]` (filtered)
- `GET /v1/assets/:asset_tag` → `Asset`
- `GET /v1/assets/:asset_tag/events` → `Event[]` (newest first)

### Scan Operations (All return Asset type)
- `POST /v1/scans/receive` → Asset
  - Body: full asset data for new assets, or tag/serial/location/user/scan_payload for existing
  - Success: 201 (new) or 200 (idempotent duplicate)
  - Errors: 
    - 400 invalid_tag_format
    - 409 and_match_failed (tag exists, serial mismatch)
    - 422 invalid_location
    - 422 invalid_transition

- `POST /v1/scans/store` → Asset
  - Body: { asset_tag, location, user_id, scan_payload }
  - Success: 200
  - Errors: 404 unknown_asset, 422 invalid_transition

- `POST /v1/scans/deploy` → Asset
  - Body: { asset_tag, location, user_id, scan_payload }
  - Requires: location.site, location.room, location.rack, location.ru
  - Success: 200
  - Errors: 404 unknown_asset, 422 invalid_transition, 422 incomplete_deploy_location

- `POST /v1/scans/transfer` → Asset
  - Body: { asset_tag, to_custodian, user_id, scan_payload }
  - Success: 200
  - Errors: 404 unknown_asset, 422 invalid_transition, 422 same_custodian

### Mock Systems (For Write-Backs)
- `GET /v1/mock/facilities/spaces` → `{ space_id, tagged_id, rack_location, last_observed }[]`
- `POST /v1/mock/facilities/spaces` → 
  - Body: { tagged_id, rack_location (string|null) }
  - Success: 200
  - rack_location: null removes the entry

- `GET /v1/mock/finance/equipment` → `{ finance_id, tag, site, book_value_usd, status, capitalized_on }[]`
- `POST /v1/mock/finance/equipment` → 
  - Body: { tag, site?, status, book_value_usd?, capitalized_on? }
  - Success: 200

### System Operations
- `POST /v1/reset` → `{ ok: true, reseeded_at: ISO string }`
  - Clears all data and reseeds ~1,000 assets

## Key Data Structures

### Asset
```typescript
{
  asset_tag: string (format: /^C\d{7}$/);
  serial: string;
  model: string;
  manufacturer: string;
  asset_class: "instrument" | "compute" | "network" | "power" | "consumable_durable";
  state: "unreceived" | "received" | "stored" | "in_service" | "rma_pending" | "disposed";
  location: {
    site: string;
    room: string | null;
    row: string | null;
    rack: string | null;
    ru: string | null;
  };
  custodian: string;
  parent_asset_tag: string | null;
  procurement_note: string | null;
  created_at: string (ISO 8601);
  updated_at: string (ISO 8601);
}
```

### Event
```typescript
{
  id: string (ULID);
  asset_tag: string;
  event_type: "receive" | "store" | "deploy" | "rma_open" | "rma_receive_back" | "dispose" | "duplicate_receive" | "transfer_custody";
  from_state: string | null;
  to_state: string;
  from_location: Location | null;
  to_location: Location;
  user_id: string;
  scan_payload: string;
  timestamp: string (ISO 8601);
}
```

### Location
```typescript
{
  site: string (required for deploy);
  room: string | null;
  row: string | null;
  rack: string | null (required for deploy);
  ru: string | null (required for deploy);
}
```

### Facilities Record
```typescript
{
  space_id: string;
  tagged_id: string (matches Asset.asset_tag);
  rack_location: string (format: "Site/Room/Row/Rack/RU");
  last_observed: string (ISO 8601);
}
```

### Finance Record
```typescript
{
  finance_id: string;
  tag: string (matches Asset.asset_tag);
  site: string (building level only);
  book_value_usd: number;
  status: "capitalized" | "pending_receipt" | "retired" | "impaired";
  capitalized_on: string | null (ISO 8601 or null);
}
```

## Error Codes
- `unknown_asset`: 404
- `and_match_failed`: 409 (receive scan: tag exists, serial doesn't match)
- `invalid_transition`: 422 (state machine rejects)
- `invalid_location`: 422 (Location doesn't conform to schema)
- `invalid_payload`: 422 (Mock write body fails validation)
- `incomplete_deploy_location`: 422 (Deploy missing site/room/rack/ru)
- `invalid_tag_format`: 400 (asset_tag doesn't match `/^C\d{7}$/`)
- `same_custodian`: 422 (Transfer to_custodian matches current custodian)
- `internal_error`: 500

## State Machine Transitions
```
unreceived → received → stored ⇄ in_service → rma_pending → received (back from RMA)
                            ↓                       ↓  
                        disposed                disposed
```