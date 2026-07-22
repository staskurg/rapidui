import type { SavedSpec } from "@/lib/db/types";

export class FetchSpecError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "FetchSpecError";
  }
}

/** Client fetch for saved specs — requires the same session header as chat. */
export async function fetchSpecById(
  specId: string,
  sessionId: string,
): Promise<SavedSpec> {
  const response = await fetch(`/api/specs/${specId}`, {
    headers: {
      "X-RapidUI-Session-Id": sessionId,
    },
  });

  if (!response.ok) {
    throw new FetchSpecError(
      `Failed to load spec ${specId}: ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<SavedSpec>;
}
