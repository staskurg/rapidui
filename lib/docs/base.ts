/** Canonical public base URL for agent docs and API links. */
export function getBaseUrl(): string {
  if (process.env.RAPIDUI_BASE_URL) {
    return process.env.RAPIDUI_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://rapidui.dev";
}
