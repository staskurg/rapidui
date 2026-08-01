import type { ReactNode } from "react";

type JsonTokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation";

const TOKEN_CLASS: Record<JsonTokenType, string> = {
  key: "text-violet-600 dark:text-violet-400",
  string: "text-emerald-700 dark:text-emerald-400",
  number: "text-amber-700 dark:text-amber-400",
  boolean: "text-sky-700 dark:text-sky-400",
  null: "text-zinc-500 dark:text-zinc-400",
  punctuation: "text-zinc-500 dark:text-zinc-400",
};

const JSON_TOKEN_PATTERN =
  /(\"(?:\\.|[^"\\])*\")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]|\s+/g;

function classifyJsonToken(
  match: string,
  quoted?: string,
  colonSuffix?: string,
): JsonTokenType | null {
  if (/^\s+$/.test(match)) {
    return null;
  }
  if (quoted) {
    return colonSuffix ? "key" : "string";
  }
  if (match === "true" || match === "false") {
    return "boolean";
  }
  if (match === "null") {
    return "null";
  }
  if (/^-?\d/.test(match)) {
    return "number";
  }
  return "punctuation";
}

export function highlightJson(json: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;

  for (const match of json.matchAll(JSON_TOKEN_PATTERN)) {
    const [full, quoted, colonSuffix] = match;
    const tokenType = classifyJsonToken(full, quoted, colonSuffix);

    if (tokenType === null) {
      nodes.push(full);
      continue;
    }

    nodes.push(
      <span key={index} className={TOKEN_CLASS[tokenType]}>
        {full}
      </span>,
    );
    index += 1;
  }

  return nodes;
}

type JsonCodeBlockProps = {
  value: unknown;
  className?: string;
};

export function JsonCodeBlock({ value, className = "" }: JsonCodeBlockProps) {
  const json = JSON.stringify(value, null, 2);

  return (
    <pre
      className={`font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 ${className}`}
    >
      <code>{highlightJson(json)}</code>
    </pre>
  );
}
