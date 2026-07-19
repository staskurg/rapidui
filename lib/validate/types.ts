import type { Rui } from "@/lib/operations";
import type { RuleCode } from "@/lib/operations";

export type ValidationError = {
  path: string;
  code: RuleCode;
  message: string;
  hint?: string;
};

export type ValidationSuccess = {
  valid: true;
  validationVersion: string;
  registryVersion: string;
  normalizedRui: Rui;
};

export type ValidationFailure = {
  valid: false;
  validationVersion: string;
  registryVersion: string;
  errors: ValidationError[];
  truncated?: boolean;
};

export type TransportFailure = {
  valid: false;
  errors: ValidationError[];
};

export type ValidationResult =
  | ValidationSuccess
  | ValidationFailure
  | TransportFailure;
