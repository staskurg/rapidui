"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { AssistantRuntimeProvider, useThreadRuntime } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useAuiState } from "@assistant-ui/store";
import { DefaultChatTransport } from "ai";

import { ChatThread, StarterChips, useSendStarterPrompt } from "@/components/demo/ChatPanel";
import { ConfirmNewChatDialog } from "@/components/demo/ConfirmNewChatDialog";
import { OutputPanel } from "@/components/demo/OutputPanel";
import type { OutputTab } from "@/components/demo/OutputTabBar";
import { SessionBar } from "@/components/demo/SessionBar";
import { getAgentChatUrl } from "@/lib/demo/agent-url";
import { STARTER_PROMPTS, type StarterPrompt } from "@/lib/demo/starter-prompts";
import {
  consumePendingEvalCase,
  getOrCreateSessionId,
  rotateSessionId,
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

function DemoFooter({
  sessionId,
  onNewChat,
}: {
  sessionId: string;
  onNewChat: () => void;
}) {
  const messageCount = useAuiState((state) => state.thread.messages.length);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <footer className="shrink-0 border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SessionBar sessionId={sessionId} />
          <button
            type="button"
            onClick={() => {
              if (messageCount === 0) {
                onNewChat();
                return;
              }
              setConfirmOpen(true);
            }}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            New chat
          </button>
        </div>
      </footer>

      <ConfirmNewChatDialog
        open={confirmOpen}
        title="Start a new conversation?"
        message="Current chat and draft spec will be cleared."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onNewChat();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}

function DemoWorkspace({
  sessionId,
  panelResetKey,
  onSessionRotate,
  panelState,
  setPanelState,
  outputTab,
  setOutputTab,
}: {
  sessionId: string;
  panelResetKey: number;
  onSessionRotate: () => void;
  panelState: SpecPanelState;
  setPanelState: (state: SpecPanelState) => void;
  outputTab: OutputTab;
  setOutputTab: (tab: OutputTab) => void;
}) {
  const threadRuntime = useThreadRuntime();
  const sendStarterPrompt = useSendStarterPrompt();
  const messageCount = useAuiState((state) => state.thread.messages.length);
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  useSpecPanelListener({
    sessionId,
    resetKey: panelResetKey,
    onStateChange: setPanelState,
  });

  const resetWorkspace = useCallback(
    (options: { rotateSession: boolean }) => {
      threadRuntime.reset();
      if (options.rotateSession) {
        onSessionRotate();
      } else {
        setPanelState({ kind: "empty" });
      }
    },
    [onSessionRotate, setPanelState, threadRuntime],
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

  const sendChipPrompt = useCallback(
    (prompt: StarterPrompt, rotateSession: boolean) => {
      if (rotateSession) {
        resetWorkspace({ rotateSession: true });
      }
      sendStarterPrompt(prompt.prompt, prompt.id);
    },
    [resetWorkspace, sendStarterPrompt],
  );

  const handleChipClick = useCallback(
    (prompt: StarterPrompt) => {
      if (messageCount === 0) {
        sendChipPrompt(prompt, false);
        return;
      }
      requestConfirm(
        "Switch use case?",
        "Current chat and draft spec will be cleared before sending the new prompt.",
        () => sendChipPrompt(prompt, true),
      );
    },
    [messageCount, requestConfirm, sendChipPrompt],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[2fr_3fr] lg:grid-rows-[minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <StarterChips prompts={STARTER_PROMPTS} onChipClick={handleChipClick} disabled={isRunning} />
          <ChatThread />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <OutputPanel activeTab={outputTab} onTabChange={setOutputTab} panelState={panelState} />
        </section>
      </div>

      <DemoFooter sessionId={sessionId} onNewChat={handleNewChat} />

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

function useDemoSessionId(): string {
  return useSyncExternalStore(
    subscribeSessionId,
    () => getOrCreateSessionId(),
    () => "",
  );
}

export function MainDemo() {
  const sessionId = useDemoSessionId();
  const [panelResetKey, setPanelResetKey] = useState(0);
  const [panelState, setPanelState] = useState<SpecPanelState>({ kind: "empty" });
  const [outputTab, setOutputTab] = useState<OutputTab>("spec");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: getAgentChatUrl(),
        headers: () => {
          const headers: Record<string, string> = {
            "X-RapidUI-Session-Id": getOrCreateSessionId(),
            "X-RapidUI-Agent": "rapidui-agent-chat",
          };
          const evalCaseId = consumePendingEvalCase();
          if (evalCaseId) {
            headers["X-RapidUI-Eval-Case"] = evalCaseId;
          }
          return headers;
        },
      }),
    [],
  );

  const runtime = useChatRuntime({ transport });

  const handleSessionRotate = useCallback(() => {
    rotateSessionId();
    setPanelResetKey((value) => value + 1);
  }, []);

  if (!sessionId) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex min-h-0 flex-1 flex-col">
          <DemoWorkspace
            sessionId={sessionId}
            panelResetKey={panelResetKey}
            onSessionRotate={handleSessionRotate}
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
