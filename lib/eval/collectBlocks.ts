import type { Rui } from "@/lib/registry";

export type BindingRef = {
  method: string;
  path: string;
};

export type CollectedRui = {
  blockTypes: string[];
  bindings: BindingRef[];
};

/** Walk a RUI tree — collect block types and read bindings. */
export function collectFromRui(rui: Rui): CollectedRui {
  const blockTypes: string[] = [];
  const bindings: BindingRef[] = [];

  for (const page of rui.pages) {
    for (const section of page.children) {
      for (const block of section.children) {
        blockTypes.push(block.type);
        if ("binding" in block && block.binding) {
          bindings.push({
            method: block.binding.method,
            path: block.binding.path,
          });
        }
      }
    }
  }

  return {
    blockTypes: [...new Set(blockTypes)],
    bindings,
  };
}

/** Parse a requiredBindings entry like "GET /api/tickets". */
export function parseBindingRequirement(requirement: string): BindingRef {
  const space = requirement.indexOf(" ");
  if (space === -1) {
    throw new Error(`Invalid requiredBinding format: "${requirement}" (expected "METHOD /path")`);
  }

  return {
    method: requirement.slice(0, space),
    path: requirement.slice(space + 1),
  };
}

export function bindingRequirementMet(
  bindings: BindingRef[],
  requirement: string,
): boolean {
  const required = parseBindingRequirement(requirement);
  return bindings.some(
    (binding) =>
      binding.method === required.method && binding.path === required.path,
  );
}

export function formatBindingRef(binding: BindingRef): string {
  return `${binding.method} ${binding.path}`;
}
