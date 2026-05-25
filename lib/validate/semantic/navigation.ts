import type { Rui } from "@/lib/registry";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

/** R10 invalid nav pageId, R11 orphan pages. */
export function checkNavigation(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const pageIds = new Set(rui.pages.map((page) => page.id));
  const linkedPageIds = new Set<string>();

  rui.navigation.items.forEach((item, index) => {
    if (!pageIds.has(item.pageId)) {
      const path = `navigation.items[${index}].pageId`;
      const { message, hint } = formatError("INVALID_NAV_PAGE_ID", {
        pageId: item.pageId,
      });
      errors.push({ path, code: "INVALID_NAV_PAGE_ID", message, hint });
    } else {
      linkedPageIds.add(item.pageId);
    }
  });

  rui.pages.forEach((page, index) => {
    if (!linkedPageIds.has(page.id)) {
      const path = `pages[${index}].id`;
      const { message, hint } = formatError("ORPHAN_PAGE", { id: page.id });
      errors.push({ path, code: "ORPHAN_PAGE", message, hint });
    }
  });

  return errors;
}
