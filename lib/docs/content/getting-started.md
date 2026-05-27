# Getting started

Copy-paste block for agent evals and external sessions.

## Base URL

```
https://rapidui.dev
```

## Fetch order

1. `GET https://rapidui.dev/llms.txt`
2. `GET https://rapidui.dev/api/schema`
3. Author RUI JSON
4. `POST https://rapidui.dev/api/validate` — loop until `valid: true`
5. `POST https://rapidui.dev/api/specs` — persist; receive flat SavedSpec (201)

## Support dashboard prompt

```
Generate a RUI for an internal support dashboard. Bind to GET /api/tickets (ticket list) and GET /api/tickets/stats (open and urgent counts).
```

## Expected shape

- Metric row: open tickets, urgent count (`GET /api/tickets/stats`)
- Filterable Table: id, subject, status, assignee, created (`GET /api/tickets`, `valuePath: "items"`)
- Blocks: at least `Metric` and `Table`

## Golden reference

The full golden RUI is in `/api/docs` → `sections` → `examples.supportDashboard.goldenRui`.

Validate your output against `POST /api/validate` — do not emit React or JSX.

## SavedSpec handoff (v0.1)

After `POST /api/specs` returns **201**, use the flat response:

```json
{
  "specId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://rapidui.dev/api/specs/550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-26T12:00:00.000Z",
  "contentHash": "sha256:…",
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

Share `url` as temporary proof-of-save. `GET url` returns the same SavedSpec shape.
