/** Parse `--key=value` and `--key value` CLI flags from process.argv. */
export function parseCliArgs(
  argv: string[],
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }

    const eq = arg.indexOf("=");
    if (eq !== -1) {
      result[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      result[key] = next;
      i++;
    } else {
      result[key] = true;
    }
  }

  return result;
}

export function requireArg(
  args: Record<string, string | boolean>,
  key: string,
): string {
  const value = args[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing required argument: --${key}`);
  }
  return value;
}

export function optionalArg(
  args: Record<string, string | boolean>,
  key: string,
): string | undefined {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

export function parseCommaList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return inner.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
}

export function parseOptionalInt(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid integer: "${raw}"`);
  }
  return value;
}
