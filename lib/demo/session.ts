const SESSION_STORAGE_KEY = "rapidui-session-id";
const PENDING_EVAL_CASE_KEY = "rapidui-pending-eval-case";
const SESSION_CHANGE_EVENT = "rapidui-session-change";

function notifySessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

/** Subscribe to session id changes (New chat / starter chip rotation). */
export function subscribeSessionId(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
}

/** Read or mint the active demo session id (Observe + API headers). */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  notifySessionChange();
  return id;
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

/** Read the current session id without minting a new one. */
export function getSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

/** Mint a new session id — New chat and post-confirm starter chips. */
export function rotateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  notifySessionChange();
  return id;
}
