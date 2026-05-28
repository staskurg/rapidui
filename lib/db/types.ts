import type { Rui } from "@/lib/registry";

/** Flat saved spec returned by POST 201 and GET 200. */
export type SavedSpec = {
  specId: string;
  url: string;
  viewUrl: string;
  createdAt: string;
  contentHash: string;
  validationVersion: string;
  registryVersion: string;
  normalizedRui: Rui;
};

/** Postgres row shape for specs table. */
export type SpecRecord = {
  id: string;
  content_hash: string;
  validation_version: string;
  registry_version: string;
  rui: Rui;
  created_at: Date;
};

/** Metadata from validateSpec() success passed to insertSpec(). */
export type InsertSpecMeta = {
  validationVersion: string;
  registryVersion: string;
};

/** Machine-readable storage failure response. */
export type StoreFailure = {
  error: "STORAGE_UNAVAILABLE";
  message: string;
};
