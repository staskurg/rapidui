export const PLANNED_BLOCKS = ["Form", "Button"] as const;
export const PLANNED_BINDINGS = ["write", "action"] as const;

export type PlannedBlock = (typeof PLANNED_BLOCKS)[number];
export type PlannedBinding = (typeof PLANNED_BINDINGS)[number];

export function getPlannedPayload() {
  return {
    blocks: [...PLANNED_BLOCKS],
    bindings: [...PLANNED_BINDINGS],
  };
}
