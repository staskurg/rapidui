import { describe, expect, it } from "vitest";

import uc1Golden from "@/lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import uc2Golden from "@/lib/operations/golden/UC2-crud-admin-v0.2.rui.json";
import uc3Golden from "@/lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json";
import { evaluateAssertions } from "@/lib/eval/assertions";
import { loadCase } from "@/lib/eval/loadCase";
import { validateCase } from "@/lib/eval/validateCase";
import type { Rui } from "@/lib/operations";

/** Mutation helper — browse table schema has no actions; grader still must detect them. */
function injectBrowseActions(
  rui: Rui,
  actions: Array<Record<string, unknown>>,
): Rui {
  const mutated = structuredClone(rui);
  const browseOp = mutated.operations.find((op) => op.type === "browse");
  if (browseOp?.type === "browse") {
    Object.assign(browseOp.presentation, { actions });
  }
  return mutated;
}

describe("golden assertions", () => {
  it("UC1 golden passes static-browse-v0.2 criteria", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const results = evaluateAssertions(
      uc1Golden as Rui,
      evalCase.successCriteria.assertions,
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("UC2 golden passes crud-admin-v0.2 criteria", () => {
    const evalCase = loadCase("crud-admin-v0.2");
    const results = evaluateAssertions(
      uc2Golden as Rui,
      evalCase.successCriteria.assertions,
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("UC3 golden passes ai-review-queue-v0.2 criteria", () => {
    const evalCase = loadCase("ai-review-queue-v0.2");
    const results = evaluateAssertions(
      uc3Golden as Rui,
      evalCase.successCriteria.assertions,
    );
    expect(results.every((result) => result.passed)).toBe(true);
  });
});

describe("mutation fixtures", () => {
  it("UC1 one-browse fails uc1-browse-count", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const mutated = structuredClone(uc1Golden) as Rui;
    mutated.operations = mutated.operations.filter((op) => op.route === "/incidents");

    const results = evaluateAssertions(mutated, evalCase.successCriteria.assertions);
    const browseCount = results.find((result) => result.id === "uc1-browse-count");

    expect(browseCount?.passed).toBe(false);
  });

  it("UC1 one-browse fails uc1-route-teams", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const mutated = structuredClone(uc1Golden) as Rui;
    mutated.operations = mutated.operations.filter((op) => op.route === "/incidents");

    const results = evaluateAssertions(mutated, evalCase.successCriteria.assertions);
    const routeTeams = results.find((result) => result.id === "uc1-route-teams");

    expect(routeTeams?.passed).toBe(false);
  });

  it("UC2 delete on browse fails uc2-delete-on-read", () => {
    const evalCase = loadCase("crud-admin-v0.2");
    const mutated = structuredClone(uc2Golden) as Rui;
    const readOp = mutated.operations.find((op) => op.type === "read");

    if (readOp?.type === "read" && readOp.presentation.actions) {
      readOp.presentation.actions = [];
    }

    const withBrowseDelete = injectBrowseActions(mutated, [
      {
        id: "op-delete-on-browse",
        type: "delete",
        label: "Delete",
        variant: "danger",
        confirm: { message: "Delete?" },
        write: {
          method: "DELETE",
          path: "/api/users/{userId}",
        },
        outcomes: {
          success: { stay: true },
          error: { stay: true },
        },
      },
    ]);

    const results = evaluateAssertions(
      withBrowseDelete,
      evalCase.successCriteria.assertions,
    );
    const deleteOnRead = results.find((result) => result.id === "uc2-delete-on-read");

    expect(deleteOnRead?.passed).toBe(false);
  });

  it("UC3 single-act fails uc3-act-on-detail", () => {
    const evalCase = loadCase("ai-review-queue-v0.2");
    const mutated = structuredClone(uc3Golden) as Rui;
    const readOp = mutated.operations.find((op) => op.type === "read");

    if (readOp?.type === "read" && readOp.presentation.actions) {
      readOp.presentation.actions = readOp.presentation.actions.slice(0, 1);
    }

    const results = evaluateAssertions(mutated, evalCase.successCriteria.assertions);
    const actOnDetail = results.find((result) => result.id === "uc3-act-on-detail");

    expect(actOnDetail?.passed).toBe(false);
    expect(actOnDetail?.actual).toBe(1);
  });

  it("forbiddenEmbeddedAction fails when act exists on browse", () => {
    const mutated = injectBrowseActions(uc3Golden as Rui, [
      {
        id: "op-row-approve",
        type: "act",
        label: "Approve",
        variant: "primary",
        invoke: {
          method: "POST",
          path: "/api/drafts/{draftId}/approve",
        },
        outcomes: {
          success: { stay: true },
          error: { stay: true },
        },
      },
    ]);

    const results = evaluateAssertions(mutated, [
      {
        id: "v4-no-row-act",
        kind: "forbiddenEmbeddedAction",
        type: "act",
        hostOperationType: "browse",
      },
    ]);

    expect(results[0]?.passed).toBe(false);
  });
});

describe("case validation", () => {
  it("rejects case JSON missing assertions", () => {
    expect(() =>
      validateCase({
        id: "bad-case",
        title: "Bad",
        prompt: "Build something",
        successCriteria: {
          requiredOperations: ["browse"],
        },
      }),
    ).toThrow();
  });

  it("rejects assertion with unknown kind", () => {
    expect(() =>
      validateCase({
        id: "bad-case",
        title: "Bad",
        prompt: "Build something",
        successCriteria: {
          assertions: [
            {
              id: "bad",
              kind: "unknownKind",
              type: "browse",
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("rejects id mismatch between filename and JSON", () => {
    const evalCase = loadCase("static-browse-v0.2");
    expect(() => validateCase(evalCase, "other-id")).toThrow(/id mismatch/);
  });
});
