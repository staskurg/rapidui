import type { Block, Table } from "@/lib/registry/blocks";
import type { ReadBinding } from "@/lib/registry/bindings";
import type { Page, Section } from "@/lib/registry/layouts";
import type { Meta, Navigation, NavigationItem, Rui } from "@/lib/registry/rui";

function orderObject<T extends Record<string, unknown>>(
  value: T,
  keyOrder: string[],
): T {
  const result = {} as T;

  for (const key of keyOrder) {
    if (key in value) {
      result[key as keyof T] = value[key as keyof T];
    }
  }

  return result;
}

function normalizeReadBinding(binding: ReadBinding): ReadBinding {
  const ordered = orderObject(binding as unknown as Record<string, unknown>, [
    "type",
    "method",
    "path",
    "valuePath",
  ]);

  return ordered as ReadBinding;
}

function normalizeColumn(column: Table["columns"][number]): Table["columns"][number] {
  const ordered = orderObject(column as unknown as Record<string, unknown>, [
    "key",
    "label",
    "type",
  ]);

  return ordered as Table["columns"][number];
}

function normalizeFilterOption(option: { value: string; label: string }) {
  return orderObject(option, ["value", "label"]);
}

function normalizeFilter(filter: NonNullable<Table["filter"]>): NonNullable<Table["filter"]> {
  return orderObject(
    {
      ...filter,
      options: [...filter.options]
        .sort((a, b) => a.value.localeCompare(b.value))
        .map(normalizeFilterOption),
    } as unknown as Record<string, unknown>,
    ["field", "label", "options"],
  ) as NonNullable<Table["filter"]>;
}

function normalizeBlock(block: Block): Block {
  switch (block.type) {
    case "Metric":
      return orderObject(
        {
          ...block,
          binding: normalizeReadBinding(block.binding),
        } as unknown as Record<string, unknown>,
        ["id", "type", "label", "format", "binding"],
      ) as Block;
    case "Table": {
      const normalized: Record<string, unknown> = {
        id: block.id,
        type: block.type,
        binding: normalizeReadBinding(block.binding),
        columns: [...block.columns]
          .sort((a, b) => a.key.localeCompare(b.key))
          .map(normalizeColumn),
      };

      if (block.title !== undefined) {
        normalized.title = block.title;
      }

      if (block.filter) {
        normalized.filter = normalizeFilter(block.filter);
      }

      return orderObject(normalized, [
        "id",
        "type",
        "title",
        "binding",
        "columns",
        "filter",
      ]) as Block;
    }
    case "Text":
      return orderObject(block as unknown as Record<string, unknown>, [
        "id",
        "type",
        "content",
      ]) as Block;
  }
}

function normalizeSection(section: Section): Section {
  const normalized: Record<string, unknown> = {
    id: section.id,
    type: section.type,
    direction: section.direction,
    children: [...section.children]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(normalizeBlock),
  };

  if (section.title !== undefined) {
    normalized.title = section.title;
  }

  return orderObject(normalized, [
    "id",
    "type",
    "title",
    "direction",
    "children",
  ]) as Section;
}

function normalizePage(page: Page): Page {
  const normalized: Record<string, unknown> = {
    id: page.id,
    type: page.type,
    title: page.title,
    children: [...page.children]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(normalizeSection),
  };

  if (page.description !== undefined) {
    normalized.description = page.description;
  }

  return orderObject(normalized, [
    "id",
    "type",
    "title",
    "description",
    "children",
  ]) as Page;
}

function normalizeNavigationItem(item: NavigationItem): NavigationItem {
  return orderObject(item as unknown as Record<string, unknown>, [
    "pageId",
    "label",
  ]) as NavigationItem;
}

function normalizeNavigation(navigation: Navigation): Navigation {
  return {
    items: [...navigation.items]
      .sort((a, b) => a.pageId.localeCompare(b.pageId))
      .map(normalizeNavigationItem),
  };
}

function normalizeMeta(meta: Meta): Meta {
  const normalized: Record<string, unknown> = {
    title: meta.title,
  };

  if (meta.description !== undefined) {
    normalized.description = meta.description;
  }

  return orderObject(normalized, ["title", "description"]) as Meta;
}

/** Phase 5 — deterministic sibling order and canonical key order. */
export function normalizeRui(rui: Rui): Rui {
  return {
    version: rui.version,
    meta: normalizeMeta(rui.meta),
    navigation: normalizeNavigation(rui.navigation),
    pages: [...rui.pages]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(normalizePage),
  };
}
