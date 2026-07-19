# What RapidUI is

RapidUI is an **agent-first platform** for generating, validating, and storing **RUIs** — JSON documents that describe operational UI workflows.

A **RUI** (`.rui.json`) is **not** React code. It is a structured specification: **entities**, **operations** (browse, read, create, update, delete), **transitions**, and **data bindings**. Agents produce RUIs; the platform validates them; a future renderer compiles them to screens.

## v0.2 scope

- **In scope:** Operations-first schema (`version: "0.2"`), entities + entrypoints, presentations (`table`, `form`, `detail`, `confirm`), explicit transitions (`row`, `link`, `cta`, `cancel`), outcomes on mutations, embedded `act`/`delete` on detail screens, `static` and `api` data modes
- **Out of scope:** Renderer, live API execution, charts, modals, v0.1 page/block documents

## Naming: RUI vs spec

Use **RUI** in prose for the JSON artifact. **`POST /api/specs`** stores a validated RUI — **a spec is a stored RUI**. Request bodies are the raw RUI object, not `{ "rui": … }`.

## Base URL

Production: `https://rapidui.dev`

Start with `GET /llms.txt` or `GET /api/docs`, then `GET /api/schema` for the full vocabulary.
