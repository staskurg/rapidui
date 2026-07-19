import type { Operation, Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

function checkBrowsePresentation(
  operation: Extract<Operation, { type: "browse" }>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const columns = operation.presentation.columns;

  if (columns.length === 0) {
    const { message, hint } = formatError("INVALID_COLUMNS", {
      operationId: operation.id,
    });
    errors.push({
      path: `operations[${operation.id}].presentation.columns`,
      code: "INVALID_COLUMNS",
      message,
      hint,
    });
  }

  const keys = new Set<string>();
  for (const column of columns) {
    if (keys.has(column.key)) {
      const { message, hint } = formatError("INVALID_COLUMNS", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].presentation.columns`,
        code: "INVALID_COLUMNS",
        message,
        hint,
      });
    }
    keys.add(column.key);
  }

  if (operation.presentation.filter) {
    const filterField = operation.presentation.filter.field;
    if (!keys.has(filterField)) {
      const { message, hint } = formatError("INVALID_FILTER_FIELD", {
        operationId: operation.id,
        field: filterField,
      });
      errors.push({
        path: `operations[${operation.id}].presentation.filter.field`,
        code: "INVALID_FILTER_FIELD",
        message,
        hint,
      });
    }
  }

  return errors;
}

function checkFormFields(operation: Operation): ValidationError[] {
  if (operation.type !== "create" && operation.type !== "update") {
    return [];
  }

  const errors: ValidationError[] = [];
  const fields = operation.presentation.fields;
  const names = new Set<string>();

  for (const field of fields) {
    if (names.has(field.name)) {
      const { message, hint } = formatError("INVALID_FORM_FIELD", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].presentation.fields`,
        code: "INVALID_FORM_FIELD",
        message,
        hint,
      });
    }
    names.add(field.name);

    if (field.type === "select" && (!field.options || field.options.length === 0)) {
      const { message, hint } = formatError("INVALID_FORM_FIELD", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].presentation.fields`,
        code: "INVALID_FORM_FIELD",
        message,
        hint,
      });
    }
  }

  if (operation.data.mode === "api" && operation.data.write?.bodyMap) {
    for (const formField of Object.values(operation.data.write.bodyMap)) {
      if (!names.has(formField)) {
        const { message, hint } = formatError("INVALID_FORM_FIELD", {
          operationId: operation.id,
        });
        errors.push({
          path: `operations[${operation.id}].data.write.bodyMap`,
          code: "INVALID_FORM_FIELD",
          message,
          hint,
        });
      }
    }
  }

  return errors;
}

/** O10 — presentation layout consistency (columns, form fields, filters). */
export function checkPresentations(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const operation of rui.operations) {
    if (operation.type === "browse") {
      errors.push(...checkBrowsePresentation(operation));
    }
    errors.push(...checkFormFields(operation));
  }

  return errors;
}
