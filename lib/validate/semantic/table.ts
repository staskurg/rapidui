import type { Rui } from "@/lib/registry";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

/** R17 duplicate column keys, R21 filter field must match column key. */
export function checkTables(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let pageIndex = 0; pageIndex < rui.pages.length; pageIndex++) {
    const page = rui.pages[pageIndex];

    for (let sectionIndex = 0; sectionIndex < page.children.length; sectionIndex++) {
      const section = page.children[sectionIndex];

      for (let blockIndex = 0; blockIndex < section.children.length; blockIndex++) {
        const block = section.children[blockIndex];
        if (block.type !== "Table") {
          continue;
        }

        const basePath = `pages[${pageIndex}].children[${sectionIndex}].children[${blockIndex}]`;
        const seenKeys = new Map<string, number>();

        block.columns.forEach((column, columnIndex) => {
          if (seenKeys.has(column.key)) {
            const path = `${basePath}.columns[${columnIndex}].key`;
            const { message, hint } = formatError("INVALID_COLUMNS");
            errors.push({ path, code: "INVALID_COLUMNS", message, hint });
          } else {
            seenKeys.set(column.key, columnIndex);
          }
        });

        if (block.filter) {
          const columnKeys = new Set(block.columns.map((column) => column.key));
          if (!columnKeys.has(block.filter.field)) {
            const path = `${basePath}.filter.field`;
            const { message, hint } = formatError("INVALID_FILTER_FIELD", {
              field: block.filter.field,
            });
            errors.push({ path, code: "INVALID_FILTER_FIELD", message, hint });
          }
        }
      }
    }
  }

  return errors;
}
