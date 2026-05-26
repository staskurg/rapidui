# What RapidUI is

RapidUI is an **agent-first platform** for generating, validating, and storing **RUIs** — JSON documents that describe an app's screens, blocks, and data bindings.

A **RUI** (`.rui.json`) is **not** React code, not a component library, and not a rendered UI. It is a structured specification that agents produce and the platform validates.

## v0.1 scope

- **In scope:** Read-only bindings (`GET`), blocks `Metric`, `Table`, `Text`, layout `Page` → `Section` → block, validation API, vocabulary schema
- **Out of scope:** Renderer, live API execution, write/action bindings, auth, MCP server

## Naming: RUI vs spec

Use **RUI** in all prose when referring to the JSON artifact. The HTTP path **`/api/specs`** stores a validated RUI — **a spec is a stored RUI**. Request bodies for validate and store use the raw RUI JSON shape, not a wrapper like `{ "rui": … }`.

## Base URL

Production: `https://rapidui.dev`

Start with `GET /llms.txt` or `GET /api/docs`, then `GET /api/schema` for the full vocabulary.
