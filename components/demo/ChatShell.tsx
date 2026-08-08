"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UIMessage } from "ai";

import { ChatTranscriptLoadErrorBanner } from "@/components/demo/ChatTranscriptLoadErrorBanner";
import { MainDemo } from "@/components/demo/MainDemo";
import { fetchChatTranscript } from "@/lib/chat/fetchTranscript";
import { parseChatPathSessionId } from "@/lib/chat/parseChatPath";
import {
  clearPendingSessionId,
  clearSessionId,
  isPendingSessionId,
  setSessionId,
} from "@/lib/demo/session";

function ChatLoadingShell() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 text-ui text-zinc-500 dark:bg-zinc-950">
      Loading…
    </div>
  );
}

function ChatShellInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = parseChatPathSessionId(pathname);

  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(
    undefined,
  );
  const [restoredUpdatedAt, setRestoredUpdatedAt] = useState<string | null>(null);
  const [isRestoredSession, setIsRestoredSession] = useState(false);
  const [runtimeEpoch, setRuntimeEpoch] = useState(0);
  const [loadUnavailable, setLoadUnavailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const chatError = searchParams.get("error");

  useEffect(() => {
    let cancelled = false;

    async function loadSession(): Promise<void> {
      setLoadUnavailable(false);

      if (!urlSessionId) {
        clearSessionId();
        clearPendingSessionId();
        setInitialMessages(undefined);
        setRestoredUpdatedAt(null);
        setIsRestoredSession(false);
        setRuntimeEpoch((value) => value + 1);
        if (!cancelled) {
          setLoadState("ready");
        }
        return;
      }

      setSessionId(urlSessionId);

      if (isPendingSessionId(urlSessionId)) {
        clearPendingSessionId();
        if (!cancelled) {
          setLoadState("ready");
        }
        return;
      }

      if (!cancelled) {
        setLoadState("loading");
      }

      const result = await fetchChatTranscript(urlSessionId);
      if (cancelled) {
        return;
      }

      if (result.status === "not-found") {
        router.replace("/chat?error=session-not-found");
        return;
      }

      if (result.status === "unavailable") {
        if (!cancelled) {
          setLoadUnavailable(true);
          setLoadState("ready");
        }
        return;
      }

      const { messages, updatedAt } = result.transcript;
      setInitialMessages(messages as UIMessage[]);
      setRestoredUpdatedAt(updatedAt);
      setIsRestoredSession(messages.length > 0);
      setRuntimeEpoch((value) => value + 1);
      setLoadState("ready");
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [urlSessionId, router, retryCount]);

  if (loadState === "loading") {
    return <ChatLoadingShell />;
  }

  if (loadUnavailable && urlSessionId) {
    return (
      <ChatTranscriptLoadErrorBanner
        onRetry={() => {
          setLoadState("loading");
          setRetryCount((value) => value + 1);
        }}
      />
    );
  }

  return (
    <MainDemo
      key={runtimeEpoch}
      urlSessionId={urlSessionId}
      initialMessages={initialMessages}
      restoredUpdatedAt={restoredUpdatedAt}
      isRestoredSession={isRestoredSession}
      chatError={chatError}
      onNavigateNewChat={() => router.push("/chat")}
      onSessionUrlAdopt={(sessionId) => {
        router.replace(`/chat/${sessionId}`, { scroll: false });
      }}
    />
  );
}

export function ChatShell() {
  return (
    <Suspense fallback={<ChatLoadingShell />}>
      <ChatShellInner />
    </Suspense>
  );
}
