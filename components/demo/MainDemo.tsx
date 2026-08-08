"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { AssistantRuntimeProvider, useThreadRuntime } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useAuiState } from "@assistant-ui/store";
import { DefaultChatTransport, type UIMessage } from "ai";

import { ChatConsentBanner } from "@/components/demo/ChatConsentBanner";
import { ChatSessionHeader, ChatThread, usePopulateStarterPrompt } from "@/components/demo/ChatPanel";
import { ChatSessionNotFoundBanner } from "@/components/demo/ChatSessionNotFoundBanner";
import { ConfirmNewChatDialog } from "@/components/demo/ConfirmNewChatDialog";
import { OutputPanel } from "@/components/demo/OutputPanel";
import type { OutputTab } from "@/components/demo/OutputTabBar";
import { RestoredSessionBanner } from "@/components/demo/RestoredSessionBanner";
import { usePersistChatTranscript } from "@/lib/chat/usePersistChatTranscript";
import { abandonAgentSession } from "@/lib/demo/abandon-session";
import { fetchWithAgentTimeout } from "@/lib/demo/agent-fetch";
import { getAgentChatUrl } from "@/lib/demo/agent-url";
import { STARTER_PROMPTS, type StarterPrompt } from "@/lib/demo/starter-prompts";
import {
  clearPendingSessionId,
  clearSessionId,
  consumePendingEvalCase,
  ensureSessionIdForSend,
  getSessionId,
  subscribeSessionId,
} from "@/lib/demo/session";
import {
  useSpecPanelListener,
  type SpecPanelState,
} from "@/lib/demo/useSpecPanelListener";

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

export type MainDemoProps = {
  urlSessionId?: string | null;
  initialMessages?: UIMessage[];
  restoredUpdatedAt?: string | null;
  isRestoredSession?: boolean;
  chatError?: string | null;
  onNavigateNewChat?: () => void;
  onSessionUrlAdopt?: (sessionId: string) => void;
};

function useStoredSessionId(): string | null {
  return useSyncExternalStore(
    subscribeSessionId,
    () => getSessionId(),
    () => null,
  );
}

function DemoWorkspace({
  sessionId,
  panelResetKey,
  onSessionRotate,
  onBeforeSessionEnd,
  panelState,
  setPanelState,
  outputTab,
  setOutputTab,
}: {
  sessionId: string | null;
  panelResetKey: number;
  onSessionRotate: (context: { hadMessages: boolean }) => void;
  onBeforeSessionEnd: () => void;
  panelState: SpecPanelState;
  setPanelState: (state: SpecPanelState) => void;
  outputTab: OutputTab;
  setOutputTab: (tab: OutputTab) => void;
}) {
  const threadRuntime = useThreadRuntime();
  const populateStarterPrompt = usePopulateStarterPrompt();
  const messageCount = useAuiState((state) => state.thread.messages.length);
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  useSpecPanelListener({
    sessionId: sessionId ?? "",
    resetKey: panelResetKey,
    onStateChange: setPanelState,
  });

  const resetWorkspace = useCallback(
    (options: { rotateSession: boolean }) => {
      if (options.rotateSession && messageCount > 0) {
        onBeforeSessionEnd();
      }
      threadRuntime.reset();
      setPanelState({ kind: "empty" });
      if (options.rotateSession) {
        onSessionRotate({ hadMessages: messageCount > 0 });
      }
    },
    [messageCount, onBeforeSessionEnd, onSessionRotate, setPanelState, threadRuntime],
  );

  const handleNewChat = useCallback(() => {
    resetWorkspace({ rotateSession: true });
  }, [resetWorkspace]);

  const requestConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setConfirm({ open: true, title, message, onConfirm });
    },
    [],
  );

  const applyPrompt = useCallback(
    (prompt: StarterPrompt, rotateSession: boolean) => {
      if (rotateSession) {
        resetWorkspace({ rotateSession: true });
      }
      populateStarterPrompt(prompt);
    },
    [populateStarterPrompt, resetWorkspace],
  );

  const handlePromptSelect = useCallback(
    (prompt: StarterPrompt) => {
      if (messageCount === 0) {
        applyPrompt(prompt, false);
        return;
      }
      requestConfirm(
        "Switch use case?",
        "Current chat and draft spec will be cleared before loading the new prompt.",
        () => applyPrompt(prompt, true),
      );
    },
    [applyPrompt, messageCount, requestConfirm],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[2fr_3fr] lg:grid-rows-[minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <ChatSessionHeader sessionId={sessionId} onNewChat={handleNewChat} />
          <ChatThread
            prompts={STARTER_PROMPTS}
            onPromptSelect={handlePromptSelect}
            promptsDisabled={isRunning}
          />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <OutputPanel activeTab={outputTab} onTabChange={setOutputTab} panelState={panelState} />
        </section>
      </div>

      <ConfirmNewChatDialog
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.open) {
            confirm.onConfirm();
          }
          setConfirm({ open: false });
        }}
      />
    </div>
  );
}

export function MainDemo({
  urlSessionId = null,
  initialMessages,
  restoredUpdatedAt = null,
  isRestoredSession = false,
  chatError = null,
  onNavigateNewChat,
  onSessionUrlAdopt,
}: MainDemoProps) {
  const storedSessionId = useStoredSessionId();
  const activeSessionId = urlSessionId ?? storedSessionId ?? "";

  const [panelResetKey, setPanelResetKey] = useState(0);
  const [panelState, setPanelState] = useState<SpecPanelState>({ kind: "empty" });
  const [outputTab, setOutputTab] = useState<OutputTab>("spec");
  const { onFinish, flushTranscript } = usePersistChatTranscript(activeSessionId);

  const handleSessionUrlAdopt = useCallback(
    (sessionId: string) => {
      onSessionUrlAdopt?.(sessionId);
    },
    [onSessionUrlAdopt],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: getAgentChatUrl(),
        fetch: fetchWithAgentTimeout,
        headers: () => {
          const sessionId = ensureSessionIdForSend(handleSessionUrlAdopt);
          const headers: Record<string, string> = {
            "X-RapidUI-Session-Id": sessionId,
            "X-RapidUI-Agent": "rapidui-agent-chat",
          };
          const evalCaseId = consumePendingEvalCase();
          if (evalCaseId) {
            headers["X-RapidUI-Eval-Case"] = evalCaseId;
          }
          return headers;
        },
      }),
    [handleSessionUrlAdopt],
  );

  const runtime = useChatRuntime({
    transport,
    onFinish,
    ...(initialMessages !== undefined ? { messages: initialMessages } : {}),
  });

  const handleBeforeSessionEnd = useCallback(() => {
    flushTranscript();
  }, [flushTranscript]);

  const handleSessionRotate = useCallback(
    (context: { hadMessages: boolean }) => {
      const priorId = getSessionId() ?? urlSessionId;
      if (priorId && context.hadMessages && panelState.kind !== "saved") {
        abandonAgentSession(priorId);
      }
      clearSessionId();
      clearPendingSessionId();
      setPanelResetKey((value) => value + 1);
      onNavigateNewChat?.();
    },
    [onNavigateNewChat, panelState.kind, urlSessionId],
  );

  const showRestoredBanner =
    isRestoredSession && activeSessionId.length > 0 && restoredUpdatedAt !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatConsentBanner />
      {chatError === "session-not-found" ? <ChatSessionNotFoundBanner /> : null}
      {showRestoredBanner ? (
        <RestoredSessionBanner
          sessionId={activeSessionId}
          updatedAt={restoredUpdatedAt}
        />
      ) : null}
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex min-h-0 flex-1 flex-col">
          <DemoWorkspace
            sessionId={activeSessionId || null}
            panelResetKey={panelResetKey}
            onSessionRotate={handleSessionRotate}
            onBeforeSessionEnd={handleBeforeSessionEnd}
            panelState={panelState}
            setPanelState={setPanelState}
            outputTab={outputTab}
            setOutputTab={setOutputTab}
          />
        </div>
      </AssistantRuntimeProvider>
    </div>
  );
}
