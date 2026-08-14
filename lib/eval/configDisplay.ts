import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import { EVAL_BASE_URLS } from "../../eval/types";

export function formatTrialModelLabel(
  model: string | null,
  provider: string | null,
): string | null {
  if (model && provider) {
    return `${model} · ${provider}`;
  }
  return model ?? provider;
}

export function resolveTrialPlatformEnv(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/$/, "");
  if (normalized === EVAL_BASE_URLS.local) {
    return "local";
  }
  if (normalized === EVAL_BASE_URLS.prod) {
    return "prod";
  }
  if (/localhost|127\.0\.0\.1/i.test(normalized)) {
    return "local";
  }
  if (/rapidui\.dev/i.test(normalized)) {
    return "prod";
  }
  return normalized;
}

export type ConfigSnapshotVariant = "case";

type ConfigSnapshotField = {
  label: string;
  value: string | null;
};

export function configSnapshotFields(trial: EvalTrialRecord): ConfigSnapshotField[] {
  return [
    { label: "Case", value: trial.eval_case_id },
    { label: "Case hash", value: trial.case_hash },
    {
      label: "Model",
      value: formatTrialModelLabel(trial.model, trial.provider),
    },
    { label: "Prompt", value: trial.prompt_version },
    { label: "Eval mode", value: trial.eval_mode },
    { label: "Environment", value: resolveTrialPlatformEnv(trial.base_url) },
    { label: "Validation version", value: trial.validation_version },
    { label: "Registry version", value: trial.registry_version },
  ];
}
