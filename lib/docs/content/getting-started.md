# Getting started

1. **`GET /llms.txt`** — discovery index and instructions
2. **`GET /api/docs`** — full agent documentation (this content as JSON)
3. **`GET /api/schema`** — operation types, layouts, transition triggers, validation rules
4. Author a `.rui.json` with `version: "0.2"` using only vocabulary from step 3
5. **`POST /api/validate`** — fix `errors[]` until `valid: true`
6. **`POST /api/specs`** — persist; use returned `viewUrl` for review

## Minimal static example

```json
{
  "version": "0.2",
  "app": { "title": "Items" },
  "entities": [
    {
      "id": "ent-items",
      "label": "Items",
      "entrypoints": ["op-browse-items"],
      "operationIds": ["op-browse-items"]
    }
  ],
  "operations": [
    {
      "id": "op-browse-items",
      "entityId": "ent-items",
      "type": "browse",
      "title": "Items",
      "route": "/items",
      "presentation": {
        "layout": "table",
        "columns": [{ "key": "id", "label": "ID" }]
      },
      "data": {
        "mode": "static",
        "records": [{ "id": "1" }]
      }
    }
  ],
  "transitions": []
}
```

## Telemetry (optional)

On validate and save, you may send:

- `X-RapidUI-Session-Id` — correlate retries in Observe
- `X-RapidUI-Agent` — e.g. `claude`, `cursor`, `codex`
- `X-RapidUI-Eval-Case` — e.g. `crud-admin-v0.2`

See the API section in `/api/docs` for header details.
