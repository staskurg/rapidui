import { describe, expect, it } from "vitest";

import {
  CRUD_ILLUSTRATION_SPEC,
  FORM_FIELD_TYPES,
  getSchemaExamples,
  getSchemaPayload,
  getSchemaShapes,
  HITL_ILLUSTRATION_SPEC,
  STATIC_BROWSE_ILLUSTRATION_SPEC,
  COLUMN_FORMATS,
} from "@/lib/operations";
import { validateSpec } from "@/lib/validate";

describe("getSchemaPayload", () => {
  it("includes shapes and neutral-domain examples", () => {
    const payload = getSchemaPayload();
    expect(payload.shapes.formPresentation.field.type).toEqual([...FORM_FIELD_TYPES]);
    expect(payload.examples.crudApiScoped).toEqual(CRUD_ILLUSTRATION_SPEC);
    expect(payload.examples.hitlReviewQueue).toEqual(HITL_ILLUSTRATION_SPEC);
    expect(payload.shapes.illustrationNote).toMatch(/neutral domain/i);
  });

  it("uses Zod-sourced enums in shapes (no duplicate strings)", () => {
    const shapes = getSchemaShapes();
    expect(shapes.formPresentation.field.type).toEqual([...FORM_FIELD_TYPES]);
    expect(shapes.tablePresentation.columns.item.format).toEqual([...COLUMN_FORMATS]);
  });

  it("validates all illustration examples", () => {
    const examples = getSchemaExamples();
    for (const [name, example] of Object.entries(examples)) {
      if (typeof example !== "object" || example === null || !("version" in example)) {
        continue;
      }
      const result = validateSpec(example);
      expect(result.valid, `example ${name} should validate`).toBe(true);
    }
  });

  it("does not leak eval or exploration domain content", () => {
    const serialized = JSON.stringify(getSchemaExamples());
    for (const forbidden of [
      "/api/users",
      "/api/companies",
      "companyId",
      "/api/drafts",
      "email",
      "op-browse-users",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).toContain("/api/projects");
    expect(serialized).toContain("/api/submissions");
  });

  it("serves mutatingOutcomes.cancel as a plain string (not object concatenation)", () => {
    const cancel = getSchemaShapes().mutatingOutcomes.createUpdateDelete.cancel;
    expect(typeof cancel).toBe("string");
    expect(cancel).not.toContain("[object Object]");
    expect(cancel).toMatch(/navigate.*stay/i);
  });

  it("includes static browse filter and header metrics example", () => {
    expect(getSchemaExamples().staticBrowseWithFilterAndMetrics).toEqual(
      STATIC_BROWSE_ILLUSTRATION_SPEC,
    );
    expect(getSchemaShapes().tablePresentation.filter).toBeDefined();
    expect(getSchemaShapes().tablePresentation.header).toBeDefined();
    expect(COLUMN_FORMATS.length).toBeGreaterThan(0);
  });
});
