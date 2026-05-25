import type { Rui } from "./rui";

/** Lowercase kebab-case, 1–64 characters (R4). */
export const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export const ID_MIN_LENGTH = 1;
export const ID_MAX_LENGTH = 64;

export function isValidId(id: string): boolean {
  return (
    id.length >= ID_MIN_LENGTH &&
    id.length <= ID_MAX_LENGTH &&
    ID_PATTERN.test(id)
  );
}

/** Collect all node ids from a parsed RUI (for R3 uniqueness check in §2). */
export function collectIdsFromRui(rui: Rui): string[] {
  const ids: string[] = [];

  for (const page of rui.pages) {
    ids.push(page.id);
    for (const section of page.children) {
      ids.push(section.id);
      for (const block of section.children) {
        ids.push(block.id);
      }
    }
  }

  return ids;
}
