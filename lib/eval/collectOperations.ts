import type { Operation, Rui } from "@/lib/operations";

export type DataPathRef = {
  method: string;
  path: string;
};

export type OperationRef = {
  id: string;
  type: string;
  route: string | undefined;
  dataMode: "static" | "api" | undefined;
};

export type EmbeddedActionRef = {
  id: string;
  type: string;
  hostOperationId: string;
  hostOperationType: string;
};

export type CollectedOperations = {
  operations: OperationRef[];
  operationTypes: string[];
  embeddedActions: EmbeddedActionRef[];
  embeddedActionTypes: string[];
  transitionTriggers: string[];
  dataPaths: DataPathRef[];
  browseFilters: Array<{ operationId: string; field: string }>;
};

function addDataPath(paths: DataPathRef[], method: string, path: string): void {
  if (!paths.some((entry) => entry.method === method && entry.path === path)) {
    paths.push({ method, path });
  }
}

function collectFromOperation(operation: Operation, collected: CollectedOperations): void {
  collected.operations.push({
    id: operation.id,
    type: operation.type,
    route: "route" in operation ? operation.route : undefined,
    dataMode: operation.data.mode,
  });

  collected.operationTypes.push(operation.type);

  if (
    operation.type === "browse" &&
    "filter" in operation.presentation &&
    operation.presentation.filter?.field
  ) {
    collected.browseFilters.push({
      operationId: operation.id,
      field: operation.presentation.filter.field,
    });
  }

  if (operation.data.mode === "api") {
    if (operation.data.read) {
      addDataPath(collected.dataPaths, operation.data.read.method, operation.data.read.path);
    }
    if (operation.data.write) {
      addDataPath(collected.dataPaths, operation.data.write.method, operation.data.write.path);
    }
    if (operation.data.invoke) {
      addDataPath(collected.dataPaths, operation.data.invoke.method, operation.data.invoke.path);
    }
  }

  collectEmbeddedActions(operation, collected);
}

function collectEmbeddedActions(
  operation: Operation,
  collected: CollectedOperations,
): void {
  const presentation = operation.presentation;
  if (!("actions" in presentation) || !presentation.actions) {
    return;
  }

  for (const action of presentation.actions) {
    collected.embeddedActions.push({
      id: action.id,
      type: action.type,
      hostOperationId: operation.id,
      hostOperationType: operation.type,
    });
    collected.embeddedActionTypes.push(action.type);
    if ("invoke" in action) {
      addDataPath(collected.dataPaths, action.invoke.method, action.invoke.path);
    }
    if ("write" in action) {
      addDataPath(collected.dataPaths, action.write.method, action.write.path);
    }
  }
}

/** Walk an operations RUI — collect types, routes, embedded actions, transitions, and API paths. */
export function collectFromRui(rui: Rui): CollectedOperations {
  const collected: CollectedOperations = {
    operations: [],
    operationTypes: [],
    embeddedActions: [],
    embeddedActionTypes: [],
    transitionTriggers: [],
    dataPaths: [],
    browseFilters: [],
  };

  for (const operation of rui.operations) {
    collectFromOperation(operation, collected);
  }

  for (const transition of rui.transitions) {
    collected.transitionTriggers.push(transition.trigger);
  }

  return {
    operations: collected.operations,
    operationTypes: [...new Set(collected.operationTypes)],
    embeddedActions: collected.embeddedActions,
    embeddedActionTypes: [...new Set(collected.embeddedActionTypes)],
    transitionTriggers: [...new Set(collected.transitionTriggers)],
    dataPaths: collected.dataPaths,
    browseFilters: collected.browseFilters,
  };
}

/** Parse a requiredDataPaths entry like "GET /api/users". */
export function parseDataPathRequirement(requirement: string): DataPathRef {
  const space = requirement.indexOf(" ");
  if (space === -1) {
    throw new Error(
      `Invalid requiredDataPaths entry: "${requirement}" (expected "METHOD /path")`,
    );
  }

  return {
    method: requirement.slice(0, space),
    path: requirement.slice(space + 1),
  };
}

export function dataPathMatches(
  paths: DataPathRef[],
  method: string,
  path: string,
): boolean {
  const requiredPath = path.split("?")[0]!;
  return paths.some((entry) => {
    const actualPath = entry.path.split("?")[0]!;
    return entry.method === method && actualPath === requiredPath;
  });
}

export function dataPathRequirementMet(
  paths: DataPathRef[],
  requirement: string,
): boolean {
  const required = parseDataPathRequirement(requirement);
  return dataPathMatches(paths, required.method, required.path);
}

export function formatDataPathRef(path: DataPathRef): string {
  return `${path.method} ${path.path}`;
}
