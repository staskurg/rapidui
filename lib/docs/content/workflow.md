# Agent workflow

Follow this loop to produce a valid RUI without out-of-band instructions.

## 1. Discover

```http
GET /llms.txt
GET /api/docs
GET /api/schema
```

Fetch the vocabulary before authoring. Do not guess block shapes or binding rules.

## 2. Author a RUI

Write a `.rui.json` document in memory or as a file. Use only blocks and bindings listed in `/api/schema` for v0.1.

Structure: `Page` → `Section` → `Metric` | `Table` | `Text`.

## 3. Validate (retry loop)

```http
POST /api/validate
Content-Type: application/json

<RUI JSON body>
```

- On **`valid: true`** — use `normalizedRui` as the canonical artifact
- On **`valid: false`** — read `errors[]` (each has `code`, `message`, `hint`, `path`); fix and retry
- Target: converge within **≤5 retries**

### Success response (HTTP 200)

```json
{
  "valid": true,
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

### Validation failed (HTTP 200)

```json
{
  "valid": false,
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "errors": [
    {
      "path": "pages[0].children[0].binding",
      "code": "MISSING_VALUE_PATH",
      "message": "Metric binding requires valuePath.",
      "hint": "Set valuePath to the scalar field (e.g. \"openCount\")."
    }
  ],
  "truncated": false
}
```

### Transport failure (HTTP 400)

Invalid JSON, wrong Content-Type, or body too large → HTTP 400 with `INVALID_JSON` (no `validationVersion`).

## 4. Save

```http
POST /api/specs
Content-Type: application/json

<RUI JSON body>
```

Re-validates inline — you may POST directly without a prior validate call. Invalid RUI never reaches Postgres.

### Success (HTTP 201)

```json
{
  "specId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://rapidui.dev/api/specs/550e8400-e29b-41d4-a716-446655440000",
  "viewUrl": "https://rapidui.dev/specs/550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-26T12:00:00.000Z",
  "contentHash": "sha256:…",
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

Flat SavedSpec — no nested `receipt`. Share **`viewUrl`** with the user for human review; use `url` for programmatic retrieve (`GET url` returns the same SavedSpec shape).

### Validation failed (HTTP 200)

Same shape as `POST /api/validate` — fix `errors[]` and retry.

### Storage unavailable (HTTP 503)

```json
{
  "error": "STORAGE_UNAVAILABLE",
  "message": "RUI store is temporarily unavailable."
}
```

## Demo prompt (Option A)

> Generate a RUI for an internal support dashboard. Bind to `GET /api/tickets` (ticket list) and `GET /api/tickets/stats` (open and urgent counts).

See the `examples.supportDashboard` section in `/api/docs` for the golden reference RUI.
