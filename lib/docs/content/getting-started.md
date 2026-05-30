# Getting started

Platform docs for external agents. **Your task prompt is separate** — it describes what app to build. These docs describe *how* to speak RapidUI.

## Base URL

```
https://rapidui.dev
```

## Fetch order

1. `GET /llms.txt` — discovery index
2. `GET /api/docs` — workflow, API contracts, error catalog
3. `GET /api/schema` — block vocabulary and binding rules
4. Author RUI JSON that matches **your task prompt**
5. `POST /api/validate` — loop until `valid: true`
6. `POST /api/specs` — persist; receive flat SavedSpec (201)

## Authoring

Use only blocks and bindings from `/api/schema`. Structure: `Page` → `Section` → `Metric` | `Table` | `Text`.

Binding patterns (apply to whatever API paths your task specifies):

- **Table** — `GET` binding with `valuePath` selecting the row array in the response
- **Metric** — `GET` binding with `valuePath` selecting a scalar field in the response
- **Text** — static copy; no binding

Do not emit React or JSX.

## SavedSpec handoff (v0.1)

After `POST /api/specs` returns **201**, use the flat response:

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

Share **`viewUrl`** with the user for human review (type-colored block tree). Use `url` for programmatic retrieve via `GET url`.
