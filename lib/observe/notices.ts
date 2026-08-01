export const OBSERVE_NOTICE_PARAM = "notice";

export const OBSERVE_NOTICE_SESSION_NOT_FOUND = "session-not-found" as const;

export type ObserveNoticeKey = typeof OBSERVE_NOTICE_SESSION_NOT_FOUND;

export type ObserveNotice = {
  title: string;
  message: string;
};

const NOTICE_KEYS: ObserveNoticeKey[] = [OBSERVE_NOTICE_SESSION_NOT_FOUND];

export function isObserveNoticeKey(value: string | undefined): value is ObserveNoticeKey {
  return NOTICE_KEYS.includes(value as ObserveNoticeKey);
}

export function buildMissingSessionAgentObserveHref(sessionId: string): string {
  const params = new URLSearchParams({
    session: sessionId,
    [OBSERVE_NOTICE_PARAM]: OBSERVE_NOTICE_SESSION_NOT_FOUND,
  });
  return `/observe/agent?${params.toString()}`;
}

export function getObserveNotice(
  key: ObserveNoticeKey,
  context?: { sessionId?: string },
): ObserveNotice {
  switch (key) {
    case "session-not-found": {
      const sessionHint = context?.sessionId
        ? ` (${context.sessionId})`
        : "";
      return {
        title: "Session not found",
        message: `No telemetry exists for this session ID${sessionHint}. It may have been deleted, or the agent has not reported the session to the server yet. Data usually appears after the first chat turn.`,
      };
    }
  }
}
