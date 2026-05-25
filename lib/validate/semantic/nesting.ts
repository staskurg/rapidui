import type { ValidationError } from "../types";

/** R14 — defense-in-depth; Zod prevents Section-in-Section in v0.1. */
export function checkNesting(): ValidationError[] {
  return [];
}
