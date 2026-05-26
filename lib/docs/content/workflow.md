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

## 4. Save (§4)

```http
POST /api/specs
```

**Not available in v0.1** — returns **501** with `status: "planned"`. Keep `normalizedRui` locally until persistence ships.

## Demo prompt (Option A)

> Generate a RUI for an internal support dashboard. Bind to `GET /api/tickets` (ticket list) and `GET /api/tickets/stats` (open and urgent counts).

See the `examples.supportDashboard` section in `/api/docs` for the golden reference RUI.
