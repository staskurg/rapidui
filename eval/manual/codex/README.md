# Codex CLI — eval runner

Same eval loop as Cursor and Claude, from an **empty directory** with no repo context.

## Prod (MVP proof)

```bash
# In the rapidui repo — generate prompt
npm run eval:prompt -- --case=support-dashboard-v0.1 --env=prod
```

1. Pipe the generated prompt to Codex CLI in an empty working directory.
2. Agent uses curl only against `https://rapidui.dev`.
3. Agent prints `final_spec_id`, `view_url`, `validate_count`, `error_codes`.
4. Log from the rapidui repo:

```bash
npm run eval:log -- \
  --specId=<final_spec_id> \
  --case=support-dashboard-v0.1 \
  --agent=codex \
  --validate-count=<n>
```

## Local (playground)

Use `--env=local` with `npm run dev` running. Agent prints `---EVAL_RESULT---` for optional personal notes.
