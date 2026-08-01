"use client";

import { useState } from "react";
import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} from "@assistant-ui/react";
import { useMessageError } from "@assistant-ui/core/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { useAuiState } from "@assistant-ui/store";
import type { ReasoningMessagePartProps, TextMessagePartProps } from "@assistant-ui/core/react";

import { ConfirmNewChatDialog } from "@/components/demo/ConfirmNewChatDialog";
import { SessionBar } from "@/components/demo/SessionBar";
import type { StarterPrompt } from "@/lib/demo/starter-prompts";
import { formatAgentChatError } from "@/lib/demo/format-agent-chat-error";
import { setPendingEvalCase } from "@/lib/demo/session";

import { demoToolComponents } from "./ToolFallback";

function ThinkingIndicator({ label = "Thinking…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s] dark:bg-zinc-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s] dark:bg-zinc-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function PendingAssistantReply() {
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const lastRole = useAuiState((state) => {
    const messages = state.thread.messages;
    return messages[messages.length - 1]?.role;
  });

  if (!isRunning || lastRole === "assistant") {
    return null;
  }

  return (
    <div className="flex justify-start pb-2">
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <ThinkingIndicator />
      </div>
    </div>
  );
}

function looksLikeDataPaste(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return true;
  }
  const firstLine = trimmed.split("\n")[0] ?? "";
  return firstLine.includes(",") && firstLine.split(",").length >= 2;
}

function UserTextPart(props: TextMessagePartProps) {
  const text = props.text ?? "";
  if (looksLikeDataPaste(text)) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {text}
      </pre>
    );
  }
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>;
}

function AssistantTextPart() {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <MarkdownTextPrimitive />
    </div>
  );
}

function ReasoningPart(props: ReasoningMessagePartProps) {
  const isStreaming = props.status?.type === "running";
  const text = props.text?.trim() ?? "";

  if (!text && isStreaming) {
    return (
      <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <ThinkingIndicator label="Reasoning…" />
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      {props.text}
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="max-w-[95%] rounded-lg bg-zinc-900 px-3 py-2 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
        <MessagePrimitive.Parts components={{ Text: UserTextPart }} />
      </div>
    </MessagePrimitive.Root>
  );
}

function ChatErrorBanner({ error }: { error: string }) {
  const { title, hint } = formatAgentChatError(error);

  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-red-800 dark:text-red-300">{hint}</p>
    </div>
  );
}

function AssistantStatusPlaceholder() {
  const error = useMessageError();

  if (error !== undefined) {
    const message = typeof error === "string" ? error : String(error);
    return <ChatErrorBanner error={message} />;
  }

  return (
    <MessagePrimitive.If hasContent={false}>
      <ThinkingIndicator />
    </MessagePrimitive.If>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start">
      <div className="max-w-[95%] space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <AssistantStatusPlaceholder />
        <MessagePrimitive.Parts
          components={{
            Text: AssistantTextPart,
            Reasoning: ReasoningPart,
            tools: demoToolComponents,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

type ChatSessionHeaderProps = {
  sessionId: string;
  onNewChat: () => void;
};

export function ChatSessionHeader({ sessionId, onNewChat }: ChatSessionHeaderProps) {
  const messageCount = useAuiState((state) => state.thread.messages.length);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleNewChatClick() {
    if (messageCount === 0) {
      onNewChat();
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <SessionBar sessionId={sessionId} showObserveLink={messageCount > 0} />
        <button
          type="button"
          onClick={handleNewChatClick}
          className="shrink-0 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          New chat
        </button>
      </div>

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

type PromptSelectorProps = {
  prompts: StarterPrompt[];
  onSelect: (prompt: StarterPrompt) => void;
  disabled?: boolean;
};

function PromptSelector({ prompts, onSelect, disabled }: PromptSelectorProps) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm sm:max-w-md">
      <span className="shrink-0 font-medium text-zinc-700 dark:text-zinc-300">Prompt:</span>
      <select
        disabled={disabled}
        defaultValue=""
        onChange={(event) => {
          const prompt = prompts.find((item) => item.id === event.target.value);
          if (!prompt) {
            return;
          }
          onSelect(prompt);
          event.target.value = "";
        }}
        className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <option value="" disabled>
          Select a use case…
        </option>
        {prompts.map((prompt) => (
          <option key={prompt.id} value={prompt.id}>
            {prompt.chipLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

type ChatThreadProps = {
  prompts: StarterPrompt[];
  onPromptSelect: (prompt: StarterPrompt) => void;
  promptsDisabled?: boolean;
};

export function ChatThread({ prompts, onPromptSelect, promptsDisabled }: ChatThreadProps) {
  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
        <PendingAssistantReply />
      </ThreadPrimitive.Viewport>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <ComposerPrimitive.Root className="flex flex-col gap-2">
          <ComposerPrimitive.Input
            rows={3}
            placeholder="Describe your UI, or paste JSON / CSV sample data…"
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PromptSelector
              prompts={prompts}
              onSelect={onPromptSelect}
              disabled={promptsDisabled}
            />
            <ComposerPrimitive.Send className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-white">
              Send
            </ComposerPrimitive.Send>
          </div>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

/** Fill the composer with a starter prompt (does not send). */
export function usePopulateStarterPrompt() {
  const composer = useComposerRuntime();

  return (prompt: StarterPrompt) => {
    setPendingEvalCase(prompt.id);
    composer.setText(prompt.prompt);
  };
}
