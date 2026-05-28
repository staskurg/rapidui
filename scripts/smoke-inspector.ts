import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { SavedSpec } from "../lib/db/types";
import { buildSpecUrl, buildViewUrl } from "../lib/db/urls";
import goldenRui from "../lib/registry/golden/support-dashboard.rui.json";
import type { Rui } from "../lib/registry";
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
  validationVersion: "0.1",
  registryVersion: "0.1",
  normalizedRui: goldenRui as Rui,
};

const html = renderToStaticMarkup(createElement(RuiInspector, { spec: goldenSpec }));

for (const label of ["Page", "Section", "Metric", "Table", "Text"]) {
  assert(html.includes(label), `Rendered HTML should contain "${label}"`);
}

assert(html.includes("Support Operations"), "HTML should include meta title");
assert(html.includes("GET"), "HTML should include binding method");
assert(html.includes("/api/tickets"), "HTML should include binding path");
assert(html.includes("Raw JSON"), "HTML should include collapsible raw JSON");

console.log("Inspector smoke test passed:");
console.log("- RuiInspector renders golden SavedSpec in-process");
console.log("- HTML contains Page, Section, Metric, Table, Text block labels");
console.log("- binding chips and raw JSON section present");
