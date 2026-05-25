import { isValidId, type Rui } from "@/lib/registry";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

type IdOccurrence = { id: string; path: string };

function collectIdOccurrences(rui: Rui): IdOccurrence[] {
  const occurrences: IdOccurrence[] = [];

  for (let pageIndex = 0; pageIndex < rui.pages.length; pageIndex++) {
    const page = rui.pages[pageIndex];
    occurrences.push({ id: page.id, path: `pages[${pageIndex}].id` });

    for (let sectionIndex = 0; sectionIndex < page.children.length; sectionIndex++) {
      const section = page.children[sectionIndex];
      occurrences.push({
        id: section.id,
        path: `pages[${pageIndex}].children[${sectionIndex}].id`,
      });

      for (let blockIndex = 0; blockIndex < section.children.length; blockIndex++) {
        const block = section.children[blockIndex];
        occurrences.push({
          id: block.id,
          path: `pages[${pageIndex}].children[${sectionIndex}].children[${blockIndex}].id`,
        });
      }
    }
  }

  return occurrences;
}

/** R3 duplicate ids, R4 id format. */
export function checkIds(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();
  const occurrences = collectIdOccurrences(rui);

  for (const { id, path } of occurrences) {
    if (!isValidId(id)) {
      const { message, hint } = formatError("INVALID_ID_FORMAT", { id });
      errors.push({ path, code: "INVALID_ID_FORMAT", message, hint });
    }

    if (seen.has(id)) {
      const { message, hint } = formatError("DUPLICATE_ID", { id });
      errors.push({ path, code: "DUPLICATE_ID", message, hint });
    } else {
      seen.set(id, path);
    }
  }

  return errors;
}
