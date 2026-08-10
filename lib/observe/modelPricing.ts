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
  "o4-mini": { input: 1.1, cachedInput: 0.275, output: 4.4 },
};

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

  const pricing = MODEL_PRICING_USD_PER_1M[model];
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
