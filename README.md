# RapidUI

Agent-first platform for generating, validating, and storing **RUIs** (RapidUI JSON documents) — **validate → correct → save**.

**Production:** [https://rapidui.dev](https://rapidui.dev)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API routes are available under `/api/*`.

### Environment variables

Copy the template and pull secrets from Vercel when linked:

```bash
cp .env.example .env.local
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Vercel Postgres connection string (used from §4 onward) |

## Health check

```bash
curl https://rapidui.dev/api/health
# → {"ok":true}
```

Use the apex domain (`rapidui.dev`) as the canonical API base URL. `www.rapidui.dev` redirects to the apex — that is expected Vercel behavior.

## Project structure

```txt
app/api/          # API route handlers
lib/registry/     # §1 vocabulary registry (RUI schemas)
lib/validate/     # §2 validation engine
lib/db/           # §4 Postgres client
eval/cases/       # §6 eval case definitions
```

## Documentation

Implementation plan and MVP scope live in `.cursor/`:

- [rapidui-mvp-v0.1-implementation.md](.cursor/rapidui-mvp-v0.1-implementation.md)
- [rapidui-mvp-v0.1.md](.cursor/rapidui-mvp-v0.1.md)

## Deployment

Pushes to `main` auto-deploy to Vercel at `https://rapidui.dev`.
