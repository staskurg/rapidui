/** USD-per-1M-token prices for Observe est. cost (OpenAI list rates + cached input). */

export type CostBasis = "list" | "cached";

export type SessionCostEstimate = {
  usd: number;
  basis: CostBasis;
};

const MODEL_PRICING_USD_PER_1M: Record<
  string,
  { input: number; cachedInput: number; output: number }
> = {
  "gpt-5.6-terra": { input: 2.0, cachedInput: 0.20, output: 12.0 },
};

export type SessionTokenBreakdown = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  hasCacheData: boolean;
};

function lookupModelPricing(model: string) {
  if (MODEL_PRICING_USD_PER_1M[model]) {
    return MODEL_PRICING_USD_PER_1M[model];
  }
  const base = model.includes(":") ? model.split(":").pop()! : model;
  return MODEL_PRICING_USD_PER_1M[base];
}

/** Prefer turn-level input/output; fall back to run total when turns lack a split. */
export function resolveTokensForCost(
  turnTokens: SessionTokenBreakdown,
  dbTotalTokens: number | null,
): SessionTokenBreakdown {
  if (turnTokens.inputTokens > 0 || turnTokens.outputTokens > 0) {
    return turnTokens;
  }
  if (dbTotalTokens !== null && dbTotalTokens > 0) {
    const inputTokens = Math.round(dbTotalTokens * 0.8);
    return {
      inputTokens,
      outputTokens: dbTotalTokens - inputTokens,
      cacheReadTokens: 0,
      hasCacheData: false,
    };
  }
  return turnTokens;
}

export function estimateSessionCostUsd(
  model: string | null,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
  hasCacheData = false,
): SessionCostEstimate | null {
  if (!model || (inputTokens === 0 && outputTokens === 0)) {
    return null;
  }

  const pricing = lookupModelPricing(model);
  if (!pricing) {
    return null;
  }

  if (hasCacheData) {
    const cached = Math.min(Math.max(0, cacheReadTokens), inputTokens);
    const uncachedInput = inputTokens - cached;
    return {
      usd:
        (uncachedInput * pricing.input +
          cached * pricing.cachedInput +
          outputTokens * pricing.output) /
        1e6,
      basis: "cached",
    };
  }

  return {
    usd: (inputTokens * pricing.input + outputTokens * pricing.output) / 1e6,
    basis: "list",
  };
}

export function formatEstCostUsd(
  value: number | null,
  basis?: CostBasis | null,
): string {
  if (value === null) {
    return "—";
  }

  let formatted: string;
  if (value >= 0.01) {
    formatted = `$${value.toFixed(2)}`;
  } else if (value >= 0.001) {
    formatted = `$${value.toFixed(3)}`;
  } else {
    formatted = `$${value.toFixed(4)}`;
  }

  return basis === "list" ? `~${formatted}` : formatted;
}

export function formatTokenCount(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return value.toLocaleString("en-US");
}
