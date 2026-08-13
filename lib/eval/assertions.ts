import type { Assertion, AssertionResult } from "../../eval/types";
import {
  collectFromRui,
  dataPathMatches,
  type CollectedOperations,
} from "./collectOperations";
import type { Rui } from "@/lib/operations";

function evaluateAssertion(
  assertion: Assertion,
  collected: CollectedOperations,
): AssertionResult {
  switch (assertion.kind) {
    case "operationCount": {
      const matching = collected.operations.filter((op) => op.type === assertion.type);
      const count = matching.length;
      const passed =
        count >= assertion.minCount &&
        (assertion.maxCount === undefined || count <= assertion.maxCount);
      return {
        id: assertion.id,
        passed,
        expected: {
          type: assertion.type,
          minCount: assertion.minCount,
          maxCount: assertion.maxCount,
        },
        actual: count,
        evidence: matching.map((op) => op.id).join(", ") || undefined,
      };
    }

    case "operationRoute": {
      const match = collected.operations.find(
        (op) => op.type === assertion.type && op.route === assertion.route,
      );
      return {
        id: assertion.id,
        passed: match !== undefined,
        expected: { type: assertion.type, route: assertion.route },
        actual: collected.operations
          .filter((op) => op.type === assertion.type)
          .map((op) => op.route),
        evidence: match?.id,
      };
    }

    case "dataMode": {
      const matching = collected.operations.filter((op) => op.type === assertion.type);
      const allMatch =
        matching.length > 0 &&
        matching.every((op) => op.dataMode === assertion.mode);
      return {
        id: assertion.id,
        passed: allMatch,
        expected: { type: assertion.type, mode: assertion.mode },
        actual: matching.map((op) => ({ id: op.id, dataMode: op.dataMode })),
        evidence: matching.map((op) => op.id).join(", ") || undefined,
      };
    }

    case "embeddedAction": {
      const matching = collected.embeddedActions.filter(
        (action) =>
          action.type === assertion.type &&
          action.hostOperationType === assertion.hostOperationType,
      );
      const count = matching.length;
      return {
        id: assertion.id,
        passed: count >= assertion.minCount,
        expected: {
          type: assertion.type,
          hostOperationType: assertion.hostOperationType,
          minCount: assertion.minCount,
        },
        actual: count,
        evidence: matching.map((action) => `${action.hostOperationId}:${action.id}`).join(", ") ||
          undefined,
      };
    }

    case "forbiddenEmbeddedAction": {
      const forbidden = collected.embeddedActions.filter(
        (action) =>
          action.type === assertion.type &&
          action.hostOperationType === assertion.hostOperationType,
      );
      return {
        id: assertion.id,
        passed: forbidden.length === 0,
        expected: {
          forbidden: {
            type: assertion.type,
            hostOperationType: assertion.hostOperationType,
          },
        },
        actual: forbidden.map(
          (action) => `${action.hostOperationType}:${action.id}`,
        ),
        evidence: forbidden[0]
          ? `${forbidden[0].hostOperationId}:${forbidden[0].id}`
          : undefined,
      };
    }

    case "transitionTriggers": {
      const missing = assertion.triggers.filter(
        (trigger) => !collected.transitionTriggers.includes(trigger),
      );
      return {
        id: assertion.id,
        passed: missing.length === 0,
        expected: assertion.triggers,
        actual: collected.transitionTriggers,
      };
    }

    case "dataPath": {
      const passed = dataPathMatches(
        collected.dataPaths,
        assertion.method,
        assertion.path,
      );
      const match = collected.dataPaths.find(
        (entry) =>
          entry.method === assertion.method &&
          entry.path.split("?")[0] === assertion.path.split("?")[0],
      );
      return {
        id: assertion.id,
        passed,
        expected: { method: assertion.method, path: assertion.path },
        actual: collected.dataPaths.map(
          (entry) => `${entry.method} ${entry.path}`,
        ),
        evidence: match ? `${match.method} ${match.path}` : undefined,
      };
    }

    case "browseFilter": {
      const match = collected.browseFilters.find(
        (filter) => filter.field === assertion.field,
      );
      return {
        id: assertion.id,
        passed: match !== undefined,
        expected: { type: assertion.type, field: assertion.field },
        actual: collected.browseFilters,
        evidence: match ? `${match.operationId}.filter.field=${match.field}` : undefined,
      };
    }
  }
}

function failedResult(
  assertion: Assertion,
  reason: string,
): AssertionResult {
  return {
    id: assertion.id,
    passed: false,
    expected: assertion,
    actual: reason,
  };
}

/** Evaluate all assertions against a normalized RUI. */
export function evaluateAssertions(
  rui: Rui,
  assertions: Assertion[],
): AssertionResult[] {
  const collected = collectFromRui(rui);
  return assertions.map((assertion) => evaluateAssertion(assertion, collected));
}

/** Evaluate assertions when the spec is missing — all fail. */
export function evaluateAssertionsSpecNotFound(
  assertions: Assertion[],
): AssertionResult[] {
  return assertions.map((assertion) =>
    failedResult(assertion, "spec not found"),
  );
}
