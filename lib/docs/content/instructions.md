- **Emit a RUI** (`.rui.json`) — never React, JSX, or component code
- **Set** `version: "0.2"` — v0.1 page/block documents are rejected
- **Read** `GET /api/schema` before authoring; use only v0.2 operation types, presentations, transitions, and data modes. Property-level JSON shapes are in `shapes` and neutral-domain examples in `examples` — copy structure from there; derive entities, fields, and API paths from the user's request
- **Plan operations first** — entities, flows, outcomes, then map to JSON
- **Validate** with `POST /api/validate`; fix every item in `errors[]` using `code`, `message`, and `hint`
- **Retry** until `valid: true`; use `normalizedRui` as the canonical validated artifact
- **Save** with `POST /api/specs` — returns **201** flat SavedSpec (`specId`, `url`, `viewUrl`, audit fields, `normalizedRui`); re-validates inline
- **Handoff:** share **`viewUrl`** with the user for human review at `/specs/{specId}`; use `url` for programmatic retrieve via `GET url`
- **Naming:** say **RUI** in prose; `/api/specs` stores a validated RUI (a spec is a stored RUI)
- **Task intent:** comes from the user or session prompt — not from platform docs. Author the RUI that matches the request using vocabulary from `/api/schema`

## Session identity (required)

1. **`GET /llms.txt`** — no headers required
2. Generate **`SESSION_ID=<uuid>`** once per agent session (e.g. `uuidgen` or `crypto.randomUUID()`)
3. Send **`X-RapidUI-Session-Id: $SESSION_ID`** on every subsequent API call (docs, schema, validate, save, retrieve)
