/**
 * Sprint 5.4's Onboarding Wizard was replaced by Project Setup in Sprint
 * 5.7 (see `lib/types/project-setup.ts`, `lib/services/project-setup-service.ts`).
 * This file is kept only for the two shapes still genuinely reused by
 * real, unrelated features: `QuestionnaireResponse` (the real
 * `project_questionnaire_responses` table, reused verbatim by
 * `ProjectSetupService`) and `UploadCategory`/`UPLOAD_CATEGORIES` (Sprint
 * 5.6's Existing Project Import reuses the exact same category vocabulary
 * so an imported document and an uploaded one share one namespace).
 */

export type QuestionnaireResponse = {
  id: string;
  project_id: string;
  question_key: string;
  question_label: string;
  answer_text: string | null;
  knowledge_object_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Sprint 5.4's original 8 upload categories, mapped onto real `document_types` names and Project Intelligence Gateway `SourceType`s. */
export type UploadCategory = {
  key: string;
  label: string;
  documentTypeName: string;
  sourceType: string;
};

export const UPLOAD_CATEGORIES: UploadCategory[] = [
  { key: "client_brief", label: "Client Brief", documentTypeName: "Brief", sourceType: "document" },
  { key: "agreement", label: "Agreement / Contract", documentTypeName: "Agreement", sourceType: "document" },
  { key: "drawings", label: "Existing Drawings", documentTypeName: "Drawing", sourceType: "drawing" },
  { key: "boq", label: "BOQ", documentTypeName: "BOQ", sourceType: "spreadsheet" },
  { key: "specifications", label: "Specifications", documentTypeName: "Specification", sourceType: "specification" },
  { key: "reports", label: "Reports", documentTypeName: "Report", sourceType: "document" },
  { key: "site_photos", label: "Site Photos", documentTypeName: "Site Photograph", sourceType: "photo" },
  { key: "other", label: "Other Documents", documentTypeName: "Other", sourceType: "document" },
];
