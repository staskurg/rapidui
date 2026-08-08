const SESSION_STORAGE_KEY = "rapidui-session-id";
const PENDING_SESSION_KEY = "rapidui-session-pending";
const PENDING_EVAL_CASE_KEY = "rapidui-pending-eval-case";
const SESSION_CHANGE_EVENT = "rapidui-session-change";

function notifySessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

/** Subscribe to session id changes (mint, clear, restore sync). */
export function subscribeSessionId(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
}

/** Read the current session id without minting. */
export function getSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

/** Persist session id to sessionStorage (URL restore or first-send mint). */
export function setSessionId(sessionId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  notifySessionChange();
}

/** Clear session id — New chat / fresh `/chat` visit. */
export function clearSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  notifySessionChange();
}

/** Mark a freshly minted id before the first transcript row exists (404 guard). */
export function setPendingSessionId(sessionId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(PENDING_SESSION_KEY, sessionId);
}

export function getPendingSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(PENDING_SESSION_KEY);
}

export function isPendingSessionId(sessionId: string): boolean {
  return getPendingSessionId() === sessionId;
}

export function clearPendingSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(PENDING_SESSION_KEY);
}

/**
 * Mint session id on first send when none exists.
 * Calls `onMint` so the caller can update the URL before POST /chat.
 */
export function ensureSessionIdForSend(onMint?: (sessionId: string) => void): string {
  const existing = getSessionId();
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  setSessionId(id);
  setPendingSessionId(id);
  onMint?.(id);
  return id;
}

/** @deprecated Use getSessionId / ensureSessionIdForSend — no auto-mint on read. */
export function getOrCreateSessionId(): string {
  return getSessionId() ?? ensureSessionIdForSend();
}

/** Set eval case header for the next chat transport request only. */
export function setPendingEvalCase(evalCaseId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(PENDING_EVAL_CASE_KEY, evalCaseId);
}

/** Read and clear the pending eval case header (called from transport headers). */
export function consumePendingEvalCase(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const evalCaseId = sessionStorage.getItem(PENDING_EVAL_CASE_KEY);
  if (evalCaseId) {
    sessionStorage.removeItem(PENDING_EVAL_CASE_KEY);
  }
  return evalCaseId;
}
