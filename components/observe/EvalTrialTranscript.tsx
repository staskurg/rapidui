import { RawTranscriptJsonPanel } from "@/components/observe/RawTranscriptJsonPanel";
import { getToolLabel } from "@/lib/chat/toolLabels";
import { JsonCodeBlock } from "@/lib/review/JsonCodeBlock";

type TranscriptMessage = {
  role?: string;
  parts?: Array<Record<string, unknown>>;
};

type EvalTrialTranscriptProps = {
  messages: unknown[] | null;
};

const toolJsonScrollClass =
  "min-w-0 max-h-40 overflow-y-auto overflow-x-hidden overscroll-y-contain";

function getToolName(part: Record<string, unknown>): string | null {
  const type = String(part.type ?? "");
  if (type.startsWith("tool-")) {
    return type.slice("tool-".length);
  }
  if (type === "dynamic-tool" && typeof part.toolName === "string") {
    return part.toolName;
  }
  return null;
}

function roleLabel(role: string): string {
  if (role === "user") return "User";
  if (role === "assistant") return "Assistant";
  if (role === "system") return "System";
  return role;
}

function JsonValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return (
      <pre className="max-w-full overflow-x-auto font-mono text-micro whitespace-pre text-zinc-700 dark:text-zinc-300">
        {value}
      </pre>
    );
  }
  return <JsonCodeBlock value={value} />;
}

function ToolPayload({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 font-sans text-micro font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className={toolJsonScrollClass}>
        <JsonValue value={value} />
      </div>
    </div>
  );
}

function TranscriptToolRow({ part }: { part: Record<string, unknown> }) {
  const toolName = getToolName(part);
  if (!toolName) {
    return (
      <div className={toolJsonScrollClass}>
        <JsonCodeBlock value={part} />
      </div>
    );
  }

  const state = typeof part.state === "string" ? part.state : null;
  const isError = state === "output-error" || Boolean(part.errorText);
  const input =
    part.input !== undefined
      ? part.input
      : part.rawInput !== undefined
        ? part.rawInput
        : undefined;
  const output = part.output;
  const errorText = part.errorText ? String(part.errorText) : null;
  const defaultOpen = isError || (toolName === "save_rui" && output !== undefined && !isError);

  return (
    <details open={defaultOpen} className="min-w-0 text-caption">
      <summary className="cursor-pointer select-none font-medium text-zinc-700 dark:text-zinc-300">
        <span className="font-mono">{getToolLabel(toolName)}</span>
        {isError ? (
          <span className="ml-2 font-sans text-micro text-red-600 dark:text-red-400">failed</span>
        ) : null}
      </summary>
      <div className="mt-1.5 min-w-0 space-y-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
        {input !== undefined ? <ToolPayload label="In" value={input} /> : null}
        {output !== undefined ? <ToolPayload label="Out" value={output} /> : null}
        {errorText ? (
          <p className="text-micro text-red-700 dark:text-red-400">{errorText}</p>
        ) : null}
      </div>
    </details>
  );
}

function TranscriptText({ text }: { text: string }) {
  return (
    <p className="m-0 whitespace-pre-wrap text-ui leading-relaxed text-zinc-800 dark:text-zinc-200">
      {text}
    </p>
  );
}

function TranscriptReasoning({ text }: { text: string }) {
  if (!text.trim()) {
    return null;
  }

  return (
    <details className="text-caption">
      <summary className="cursor-pointer select-none font-medium text-zinc-500 dark:text-zinc-400">
        Reasoning
      </summary>
      <p className="mt-1.5 pl-3 whitespace-pre-wrap leading-relaxed text-zinc-600 dark:text-zinc-400">
        {text}
      </p>
    </details>
  );
}

function TranscriptPart({ part }: { part: Record<string, unknown> }) {
  const type = String(part.type ?? "unknown");

  if (type === "text") {
    return <TranscriptText text={String(part.text ?? "")} />;
  }
  if (type === "reasoning") {
    return <TranscriptReasoning text={String(part.text ?? "")} />;
  }
  if (type.startsWith("tool-") || type === "dynamic-tool") {
    return <TranscriptToolRow part={part} />;
  }

  return (
    <div className={toolJsonScrollClass}>
      <JsonCodeBlock value={part} />
    </div>
  );
}

function TranscriptTurn({ message, turnIndex }: { message: TranscriptMessage; turnIndex: number }) {
  const role = message.role ?? "unknown";
  const isUser = role === "user";
  const parts = message.parts ?? [];

  return (
    <div
      className={`min-w-0 px-4 py-3 ${
        isUser
          ? "border-l-2 border-l-violet-400/70 dark:border-l-violet-500/50"
          : "border-l-2 border-l-zinc-300 dark:border-l-zinc-600"
      }`}
    >
      <p className="mb-2 text-micro font-medium uppercase tracking-wide text-zinc-500">
        {roleLabel(role)}
        <span className="ml-2 font-normal normal-case tracking-normal text-zinc-400">
          #{turnIndex + 1}
        </span>
      </p>
      {parts.length > 0 ? (
        <div className="min-w-0 space-y-2">
          {parts.map((part, partIndex) => (
            <TranscriptPart key={partIndex} part={part} />
          ))}
        </div>
      ) : (
        <p className="text-ui text-zinc-500">Empty message</p>
      )}
    </div>
  );
}

export function EvalTrialTranscript({ messages }: EvalTrialTranscriptProps) {
  if (!messages || messages.length === 0) {
    return (
      <p className="text-ui text-zinc-500">No transcript stored for this trial.</p>
    );
  }

  const typedMessages = messages as TranscriptMessage[];

  return (
    <div className="min-w-0 space-y-3">
      <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {typedMessages.map((message, messageIndex) => (
            <TranscriptTurn key={messageIndex} message={message} turnIndex={messageIndex} />
          ))}
        </div>
      </div>

      <RawTranscriptJsonPanel messages={typedMessages} />
    </div>
  );
}
