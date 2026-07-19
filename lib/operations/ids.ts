/** Lowercase kebab-case, 1–64 characters. */
export const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export const ID_MIN_LENGTH = 1;
export const ID_MAX_LENGTH = 64;

export function isValidId(id: string): boolean {
  return (
    id.length >= ID_MIN_LENGTH &&
    id.length <= ID_MAX_LENGTH &&
    ID_PATTERN.test(id)
  );
}

/** Minimal shape for id collection — avoids importing ./rui (breaks index ↔ ids cycle). */
type IdCollectibleRui = {
  entities: Array<{ id: string }>;
  operations: Array<{
    id: string;
    type: string;
    presentation?: unknown;
  }>;
};

/** Collect entity, operation, and embedded action ids from a parsed RUI. */
export function collectIdsFromRui(rui: IdCollectibleRui): string[] {
  const ids: string[] = [];

  for (const entity of rui.entities) {
    ids.push(entity.id);
  }

  for (const operation of rui.operations) {
    ids.push(operation.id);
    if (operation.type === "read" && operation.presentation) {
      const presentation = operation.presentation as {
        actions?: Array<{ id: string }>;
      };
      for (const action of presentation.actions ?? []) {
        ids.push(action.id);
      }
    }
  }

  return ids;
}

/** Extract `{param}` placeholders from a route or API path. */
export function extractPathParams(path: string): string[] {
  const params: string[] = [];
  const regex = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(path)) !== null) {
    params.push(match[1]!);
  }

  return params;
}
