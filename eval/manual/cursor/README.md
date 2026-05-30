# Cursor agent — eval runner

Run the primary eval case from an **empty directory** (no RapidUI repo checkout).

## Prod (MVP proof)

```bash
# In the rapidui repo — generate prompt
npm run eval:prompt -- --case=support-dashboard-v0.1 --env=prod
```

1. Copy the printed prompt into a new Cursor agent chat in an empty folder.
2. Let the agent complete the validate → save loop against `https://rapidui.dev`.
3. Optionally open the returned `view_url` in a browser (§5 inspector).
4. Back in the rapidui repo, log the run:

```bash
npm run eval:log -- \
  --specId=<final_spec_id> \
  --case=support-dashboard-v0.1 \
  --agent=cursor \
  --validate-count=<n> \
  --error-codes=R01,R02
```

## Local (playground)

```bash
npm run eval:prompt -- --case=support-dashboard-v0.1 --env=local
```

Start `npm run dev` first. The agent prints a `---EVAL_RESULT---` block — optional paste to personal notes. No Postgres row unless you run `eval:log`.
