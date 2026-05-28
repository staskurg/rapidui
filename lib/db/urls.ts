import { getBaseUrl } from "@/lib/base-url";

/** Platform retrieve link for a saved spec (v0.1 agent handoff). */
export function buildSpecUrl(specId: string): string {
  return `${getBaseUrl()}/api/specs/${specId}`;
}

/** Human inspector link for a saved spec (§5 block-tree review). */
export function buildViewUrl(specId: string): string {
  return `${getBaseUrl()}/specs/${specId}`;
}
