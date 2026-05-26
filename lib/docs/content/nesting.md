# Nesting rules

RUIs use a fixed three-level hierarchy. Sections cannot nest inside sections.

```txt
RUI (root)
├── navigation.items[]     → pageId links to pages[].id
└── pages[]
    └── Page
        └── children[]     → Section only
            └── Section
                └── children[]   → Metric | Table | Text only
```

## Rules

| Level | Allowed children |
|-------|------------------|
| `Page` | `Section` only |
| `Section` | `Metric`, `Table`, `Text` only |
| Block | None (leaf nodes) |

## IDs

- Every `Page`, `Section`, and block needs a unique `id`
- Format: lowercase kebab-case (`^[a-z][a-z0-9-]*$`, 1–64 chars)
- Example: `table-tickets`, `metric-open`

## Navigation

- Every page must appear in `navigation.items` with matching `pageId`
- Every navigation item must reference an existing page

Fetch `GET /api/schema` for full prop definitions per node type.
