import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { SavedSpec } from "../lib/db/types";
import { buildSpecUrl, buildViewUrl } from "../lib/db/urls";
import uc2Golden from "../lib/operations/golden/UC2-crud-admin-v0.2.rui.json";
import type { Rui } from "../lib/operations";
import { RuiInspector } from "../lib/review/RuiInspector";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const specId = "550e8400-e29b-41d4-a716-446655440000";

const goldenSpec: SavedSpec = {
  specId,
  url: buildSpecUrl(specId),
  viewUrl: buildViewUrl(specId),
  createdAt: "2026-05-26T12:00:00.000Z",
  contentHash: "sha256:abcdef0123456789",
  validationVersion: "0.2",
  registryVersion: "0.2",
  normalizedRui: uc2Golden as Rui,
};

const html = renderToStaticMarkup(
  createElement(RuiInspector, { spec: goldenSpec, variant: "page", badge: "saved" }),
);

assert(html.includes("User Admin"), "HTML should include app title");
assert(html.includes("op-browse-users"), "HTML should list operation ids from golden spec");
assert(html.includes("Transitions"), "HTML should include transitions section");
assert(html.includes("Embedded actions"), "HTML should show embedded delete on read");
assert(html.includes("GET /api/users"), "HTML should show API data chips");
assert(html.includes("Raw JSON"), "HTML should include collapsible raw JSON");
assert(!html.includes("Phase 5"), "HTML should not include placeholder copy");

console.log("Inspector smoke test passed:");
console.log("- RuiInspector renders full operations-first view for UC2 golden");
console.log("- entities, operations, transitions, embedded actions, and data chips present");
