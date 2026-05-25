/** Converts a Zod path array to bracket notation (e.g. pages[0].children[1]). */
export function formatZodPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "";
  }

  let result = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      result += `[${segment}]`;
    } else {
      result += result === "" ? String(segment) : `.${String(segment)}`;
    }
  }
  return result;
}

/** Reads a value at a Zod-style path from a parsed JSON object. */
export function getAtPath(root: unknown, path: PropertyKey[]): unknown {
  let current: unknown = root;

  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[segment];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[String(segment)];
    } else {
      return undefined;
    }
  }

  return current;
}

/** Returns the block type at a block-level binding path, if present. */
export function getBlockTypeAtBindingPath(
  root: unknown,
  bindingPath: PropertyKey[],
): string | undefined {
  if (bindingPath.length < 2 || bindingPath[bindingPath.length - 1] !== "binding") {
    return undefined;
  }

  const blockPath = bindingPath.slice(0, -1);
  const block = getAtPath(root, blockPath);
  if (block && typeof block === "object" && "type" in block) {
    const type = (block as { type?: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }

  return undefined;
}
