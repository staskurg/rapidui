import aiReviewQueue from "@/eval/cases/ai-review-queue-v0.2.json";
import crudAdmin from "@/eval/cases/crud-admin-v0.2.json";
import staticBrowse from "@/eval/cases/static-browse-v0.2.json";

export type StarterPrompt = {
  id: string;
  title: string;
  prompt: string;
  chipLabel: string;
};

/** UC1–3 canonical eval prompts for starter chips. */
export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: staticBrowse.id,
    title: staticBrowse.title,
    prompt: staticBrowse.prompt,
    chipLabel: "UC1 — Static browse",
  },
  {
    id: crudAdmin.id,
    title: crudAdmin.title,
    prompt: crudAdmin.prompt,
    chipLabel: "UC2 — CRUD admin",
  },
  {
    id: aiReviewQueue.id,
    title: aiReviewQueue.title,
    prompt: aiReviewQueue.prompt,
    chipLabel: "UC3 — Review queue",
  },
];
