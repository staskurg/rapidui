/** Extract session id from `/chat/{sessionId}`; null on plain `/chat`. */
export function parseChatPathSessionId(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([^/]+)\/?$/);
  if (!match?.[1]) {
    return null;
  }
  const sessionId = decodeURIComponent(match[1]).trim();
  return sessionId.length > 0 ? sessionId : null;
}
