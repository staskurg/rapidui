# Operations-first RUI structure

v0.2 RUIs describe **what users do**, not a component tree. There is no `pages` / `Section` / block nesting.

## Top-level document

| Field | Purpose |
|-------|---------|
| `version` | Must be `"0.2"` |
| `app.title` | Application name |
| `entities[]` | Domain umbrellas — nav entrypoints, operation membership, optional scope selectors |
| `operations[]` | Screen operations with route, presentation, data, outcomes |
| `transitions[]` | All navigation edges (`row`, `link`, `cta`, `cancel`) |

## Entity

Groups operations for one domain object (e.g. Users, Drafts):

```json
{
  "id": "ent-users",
  "label": "Users",
  "entrypoints": ["op-browse-users"],
  "operationIds": ["op-browse-users", "op-read-user", "op-create-user"]
}
```

`entrypoints` appear in app nav. Every other screen is reached via `transitions[]`.

## Operation types

| Type | Presentation | Data |
|------|--------------|------|
| `browse` | `table` (+ optional filter, header metrics) | `static` records or `api` read GET |
| `read` | `detail` (+ optional embedded `actions[]`) | `static` or `api` read GET |
| `create` | `form` | `api` write POST + **outcomes** |
| `update` | `form` | `api` read + write PATCH + **outcomes** |
| `delete` | `confirm` | `api` write DELETE + **outcomes** |

Embedded on `read.presentation.actions[]` only: **`act`** (invoke POST) and **`delete`** (write DELETE) — each with `outcomes`.

## Transitions

```json
{
  "from": "op-browse-users",
  "to": "op-read-user",
  "trigger": "row",
  "map": { "userId": "id" }
}
```

- **`row`** — list → detail/update; `map` binds column keys to target `params`
- **`link`** — detail → edit or delete confirm
- **`cta`** — browse → create (required when both exist in an entity)
- **`cancel`** — form back navigation

## Outcomes (mutations)

```json
"outcomes": {
  "success": { "navigate": "op-browse-users" },
  "error": { "stay": true },
  "cancel": { "navigate": "op-browse-users" }
}
```

Forms require `success`, `error`, and `cancel`. Embedded actions require `success` and `error`.

## Data modes

- **`static`** — inline `records[]` (no API bindings)
- **`api`** — declarative `read` / `write` / `invoke` with HTTP method and path

Paths may include `{param}` placeholders matching `params[]`, and `{scope.selectorId}` when the entity declares scope selectors.

See `GET /api/schema` for the full rule catalog (O1–O20).
