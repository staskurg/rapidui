# Claude CLI — eval runner

Same v0.2 eval loop as Cursor, invoked from an **empty directory** with no repo context.

**Cases:** `static-browse-v0.2` · `crud-admin-v0.2` · `ai-review-queue-v0.2` · `spec-update-v0.2` (optional UC4)

## Prod

```bash
# In the rapidui repo — generate prompt (pick a case)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod
```

1. Save the prompt to a file or pipe to Claude CLI, e.g. `claude -p "$(cat prompt.txt)"`.
2. Agent uses curl only against `https://rapidui.dev`.
3. Agent prints `final_spec_id`, `view_url`, `validate_count`, `error_codes`.
4. Log from the rapidui repo:

```bash
npm run eval:log -- \
  --specId=<final_spec_id> \
  --case=crud-admin-v0.2 \
  --agent=claude \
  --validate-count=<n>
```

## Local (playground)

Use `--env=local` with `npm run dev` running. Agent prints `---EVAL_RESULT---` for optional personal notes.
