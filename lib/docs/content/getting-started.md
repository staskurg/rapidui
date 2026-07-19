# Getting started

1. **`GET /llms.txt`** — discovery index and instructions (no session header)
2. Generate **`SESSION_ID=<uuid>`** once per agent session
3. **`GET /api/docs`** — full agent documentation (JSON); requires `X-RapidUI-Session-Id`
4. **`GET /api/schema`** — operation types, layouts, transition triggers, validation rules; requires session header
5. Author a `.rui.json` with `version: "0.2"` using only vocabulary from step 4
6. **`POST /api/validate`** — fix `errors[]` until `valid: true`; requires session header
7. **`POST /api/specs`** — persist; use returned `viewUrl` for review; requires session header

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

## Telemetry headers

**Required** on all guarded routes after `GET /llms.txt`:

- `X-RapidUI-Session-Id` — one UUID per agent session; correlates events in Observe

**Recommended:**

- `X-RapidUI-Agent` — e.g. `claude`, `cursor`, `codex`, `rapidui-agent`
- `X-RapidUI-Eval-Case` — e.g. `crud-admin-v0.2`
- `X-RapidUI-Intent` — short goal label

See the API section in `/api/docs` for header details and curl examples.
