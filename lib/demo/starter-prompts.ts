import aiReviewQueue from "@/eval/cases/ai-review-queue-v0.2.json";
import crudAdmin from "@/eval/cases/crud-admin-v0.2.json";
import staticBrowse from "@/eval/cases/static-browse-v0.2.json";

export type StarterPrompt = {
  id: string;
  title: string;
  prompt: string;
  chipLabel: string;
};

/**
 * Self-contained demo prompts for the /chat dropdown.
 *
 * Eval cases keep a minimal `prompt` plus `conversationScript` for guided
 * `eval:run` — the dropdown only pre-fills turn 1, so demo prompts must
 * carry the full contract up front (UC2-S2 / UC3-S2 style from chat exploration).
 */
const DEMO_PROMPT_BY_CASE_ID: Record<string, string> = {
  [staticBrowse.id]: staticBrowse.prompt,
  [crudAdmin.id]:
    "Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have id, email, role (admin|member), notes, and active (boolean). List and companies responses wrap arrays in `{items: [...]}`; company options use `id` + `name`. Delete goes on the detail screen with a confirm. Validate and save when it passes.",
  [aiReviewQueue.id]:
    "Review queue for AI-generated support replies. GET /api/drafts returns {items:[{id, ticketId, confidence, model, status, draftText}]}. GET /api/drafts/{draftId} for the full draft. Approve = POST /api/drafts/{draftId}/approve, reject = POST /api/drafts/{draftId}/reject — both as buttons on the detail screen, both go back to the queue on success. Status filter on the queue (pending/approved/rejected). Validate and save.",
};

/** UC1–3 demo use cases — one self-contained prompt per eval case id. */
export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: staticBrowse.id,
    title: staticBrowse.title,
    prompt: DEMO_PROMPT_BY_CASE_ID[staticBrowse.id],
    chipLabel: "UC1 — Static browse",
  },
  {
    id: crudAdmin.id,
    title: crudAdmin.title,
    prompt: DEMO_PROMPT_BY_CASE_ID[crudAdmin.id],
    chipLabel: "UC2 — CRUD admin",
  },
  {
    id: aiReviewQueue.id,
    title: aiReviewQueue.title,
    prompt: DEMO_PROMPT_BY_CASE_ID[aiReviewQueue.id],
    chipLabel: "UC3 — Review queue",
  },
];
