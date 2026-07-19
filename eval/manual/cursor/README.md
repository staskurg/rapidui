# Cursor agent — eval runner

Run a v0.2 eval case from an **empty directory** (no RapidUI repo checkout).

**Cases:** `static-browse-v0.2` · `crud-admin-v0.2` · `ai-review-queue-v0.2` · `spec-update-v0.2` (optional UC4)

## Prod

```bash
# In the rapidui repo — generate prompt (pick a case)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod
```

1. Copy the printed prompt into a new Cursor agent chat in an empty folder.
2. Let the agent complete the validate → save loop against `https://rapidui.dev`.
3. Optionally open the returned `view_url` in a browser.
4. Back in the rapidui repo, log the run:

```bash
npm run eval:log -- \
  --specId=<final_spec_id> \
  --case=crud-admin-v0.2 \
  --agent=cursor \
  --validate-count=<n> \
  --error-codes=<comma-separated-codes-if-any>
```

## Local (playground)

```bash
npm run eval:prompt -- --case=crud-admin-v0.2 --env=local
```

Start `npm run dev` first. The agent prints a `---EVAL_RESULT---` block — optional paste to personal notes. No Postgres row unless you run `eval:log`.
