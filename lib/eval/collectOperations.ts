import type { Operation, Rui } from "@/lib/operations";

export type DataPathRef = {
  method: string;
  path: string;
};

export type CollectedOperations = {
  operationTypes: string[];
  embeddedActionTypes: string[];
  transitionTriggers: string[];
  dataPaths: DataPathRef[];
};

function addDataPath(paths: DataPathRef[], method: string, path: string): void {
  if (!paths.some((entry) => entry.method === method && entry.path === path)) {
    paths.push({ method, path });
  }
}

function collectFromOperation(operation: Operation, collected: CollectedOperations): void {
  collected.operationTypes.push(operation.type);

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

  if (operation.type === "read" && operation.presentation.actions) {
    for (const action of operation.presentation.actions) {
      collected.embeddedActionTypes.push(action.type);
      if ("invoke" in action) {
        addDataPath(collected.dataPaths, action.invoke.method, action.invoke.path);
      }
      if ("write" in action) {
        addDataPath(collected.dataPaths, action.write.method, action.write.path);
      }
    }
  }
}

/** Walk an operations RUI — collect types, transitions, and API paths. */
export function collectFromRui(rui: Rui): CollectedOperations {
  const collected: CollectedOperations = {
    operationTypes: [],
    embeddedActionTypes: [],
    transitionTriggers: [],
    dataPaths: [],
  };

  for (const operation of rui.operations) {
    collectFromOperation(operation, collected);
  }

  for (const transition of rui.transitions) {
    collected.transitionTriggers.push(transition.trigger);
  }

  return {
    operationTypes: [...new Set(collected.operationTypes)],
    embeddedActionTypes: [...new Set(collected.embeddedActionTypes)],
    transitionTriggers: [...new Set(collected.transitionTriggers)],
    dataPaths: collected.dataPaths,
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

export function dataPathRequirementMet(
  paths: DataPathRef[],
  requirement: string,
): boolean {
  const required = parseDataPathRequirement(requirement);
  const requiredPath = required.path.split("?")[0]!;
  return paths.some((path) => {
    const actualPath = path.path.split("?")[0]!;
    return path.method === required.method && actualPath === requiredPath;
  });
}

export function formatDataPathRef(path: DataPathRef): string {
  return `${path.method} ${path.path}`;
}
