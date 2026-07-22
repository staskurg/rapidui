"use client";

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { useAuiState } from "@assistant-ui/store";
import type { ReasoningMessagePartProps, TextMessagePartProps } from "@assistant-ui/core/react";

import type { StarterPrompt } from "@/lib/demo/starter-prompts";
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

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start">
      <div className="max-w-[95%] space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <MessagePrimitive.If hasContent={false}>
          <ThinkingIndicator />
        </MessagePrimitive.If>
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

type StarterChipsProps = {
  prompts: StarterPrompt[];
  onChipClick: (prompt: StarterPrompt) => void;
  disabled?: boolean;
};

export function StarterChips({ prompts, onChipClick, disabled }: StarterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          disabled={disabled}
          onClick={() => onChipClick(prompt)}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title={prompt.title}
        >
          {prompt.chipLabel}
        </button>
      ))}
    </div>
  );
}

export function ChatThread() {
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
          <div className="flex justify-end">
            <ComposerPrimitive.Send className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-white">
              Send
            </ComposerPrimitive.Send>
          </div>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

/** Send a starter prompt through the composer (after optional confirm + reset). */
export function useSendStarterPrompt() {
  const composer = useComposerRuntime();

  return (prompt: string, evalCaseId?: string) => {
    if (evalCaseId) {
      setPendingEvalCase(evalCaseId);
    }
    composer.setText(prompt);
    composer.send();
  };
}
