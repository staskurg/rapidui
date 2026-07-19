# Agent workflow

Follow this loop to produce a valid RUI without out-of-band instructions.

## 1. Discover

```http
GET /llms.txt
GET /api/docs
GET /api/schema
```

Fetch the vocabulary before authoring. Do not guess operation shapes, transition rules, or outcome requirements.

## 2. Plan operations

From the user message, list:

- Domain **entities** (Users, Drafts, …)
- **Operations** per entity (`browse`, `read`, `create`, `update`, `delete`)
- **Transitions** (`row`, `link`, `cta`, `cancel`) and **outcomes** on mutations
- **Data bindings** (`static` or `api` paths)

Optional: summarize the plan in chat before composing JSON.

## 3. Map → RUI

Build a document with top-level shape:

```json
{
  "version": "0.2",
  "app": { "title": "…" },
  "entities": [],
  "operations": [],
  "transitions": []
}
```

Wire `entities[].entrypoints`, operation `route` + `params`, presentations, `data.mode`, and embedded actions on `read` detail screens.

## 4. Validate (retry loop)

```http
POST /api/validate
Content-Type: application/json

<RUI JSON body>
```

- On **`valid: true`** — use `normalizedRui` as the canonical artifact
- On **`valid: false`** — read `errors[]` (`code`, `message`, `hint`, `path`); fix and retry
- Target: converge within **≤5 retries**

Errors reference **operation ids** and **transitions**, e.g. `operations[op-browse-users].data.read`.

## 5. Save

```http
POST /api/specs
Content-Type: application/json

<RUI JSON body>
```

Re-validates inline. Invalid RUI never reaches Postgres. Success returns **201** with `specId`, `viewUrl`, and `normalizedRui`.

Share **`viewUrl`** for human review at `/specs/{specId}`.
