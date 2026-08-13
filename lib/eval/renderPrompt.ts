import fs from "node:fs";
import path from "node:path";

import type { EvalCase, EvalEnv } from "../../eval/types";
import { EVAL_BASE_URLS } from "../../eval/types";

const MANUAL_DIR = path.join(process.cwd(), "eval/manual");

function formatMockApi(evalCase: EvalCase): string {
  const endpoints = evalCase.mockApi?.endpoints ?? [];
  if (endpoints.length === 0) {
    return "(see Task and planned conversation below — endpoints are delivered in-band)";
  }

  return endpoints
    .map((endpoint) => `- ${endpoint.method} ${endpoint.path} — ${endpoint.description}`)
    .join("\n");
}

function formatConversationScriptForManual(
  script: EvalCase["conversationScript"],
): string {
  if (!script?.length) {
    return "";
  }

  const turns = script
    .map(
      (entry, index) =>
        `Turn ${index + 2} (after agent reply):\n${entry.content.trim()}`,
    )
    .join("\n\n");

  return `\n\n## Planned conversation (eval script)\n\n${turns}`;
}

function buildTaskPrompt(evalCase: EvalCase): string {
  return `${evalCase.prompt.trim()}${formatConversationScriptForManual(evalCase.conversationScript)}`;
}

function loadWrapper(env: EvalEnv): string {
  const fileName = env === "prod" ? "wrapper_prod.txt" : "wrapper_local.txt";
  const filePath = path.join(MANUAL_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt wrapper not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

/** Merge shared wrapper template with eval case content. */
export function renderPrompt(evalCase: EvalCase, env: EvalEnv): string {
  const baseUrl = EVAL_BASE_URLS[env];
  const wrapper = loadWrapper(env);

  return wrapper
    .replaceAll("{{BASE_URL}}", baseUrl)
    .replaceAll("{{CASE_ID}}", evalCase.id)
    .replaceAll("{{TASK}}", buildTaskPrompt(evalCase))
    .replaceAll("{{MOCK_API}}", formatMockApi(evalCase));
}
