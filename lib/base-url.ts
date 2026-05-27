/**
 * Public base URL for absolute API links (SavedSpec.url, agent docs).
 *
 * Resolution order:
 * 1. RAPIDUI_BASE_URL — set in Vercel production (e.g. https://rapidui.dev)
 * 2. VERCEL_URL — auto-set on Vercel deployments (preview + prod without custom env)
 * 3. localhost — local `next dev` / `next start`
 */
export function getBaseUrl(): string {
  if (process.env.RAPIDUI_BASE_URL) {
    return process.env.RAPIDUI_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}
