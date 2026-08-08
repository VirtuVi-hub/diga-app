/**
 * Public shapes for the Delta Comprehension Engine (Sprint 4.1).
 * Every stage of the pipeline (Normalization → Language → Intent →
 * Entities → Context → Destination) returns one of these, always paired
 * with a 0–1 confidence score.
 */

export type ComprehensionConfidence = number;

export type SupportedLanguage = "en" | "hi" | "hinglish";

export type DeltaIntent =
  | "location"
  | "status"
  | "approval"
  | "reason"
  | "dimension"
  | "material"
  | "requirement"
  | "decision"
  | "action"
  | "issue"
  | "risk"
  | "conflict"
  | "evidence"
  | "impact"
  | "comparison"
  | "revision"
  | "related_knowledge";

export type DeltaDestination =
  | "delta_query"
  | "new_discussion"
  | "new_requirement"
  | "new_decision"
  | "new_issue"
  | "new_action";

export type NormalizationResult = {
  original: string;
  normalized: string;
  /** Which dictionary entries fired, for transparency/debugging. */
  appliedRules: string[];
};

export type LanguageResult = {
  detectedLanguage: SupportedLanguage;
  /** English text used internally by every later stage. */
  translatedText: string;
  confidence: ComprehensionConfidence;
};

export type ClassifiedIntent = {
  intent: DeltaIntent;
  confidence: ComprehensionConfidence;
};

/**
 * `type` is deliberately an open string, not a closed union — new entity
 * kinds (e.g. "dimension", "date") are a dictionary addition, not an
 * architecture change.
 */
export type ExtractedEntity = {
  type: string;
  value: string;
  confidence: ComprehensionConfidence;
  /** Other dictionary terms this could also plausibly mean, if any. */
  alternatives?: string[];
};

export type ComprehensionContextInput = {
  page?: string;
  discussionId?: string;
  knowledgeObjectId?: string;
  projectId?: string;
};

export type ResolvedContext = ComprehensionContextInput;

export type DestinationPrediction = {
  destination: DeltaDestination;
  confidence: ComprehensionConfidence;
};

export type ClarifyingQuestion = {
  prompt: string;
  options: string[];
};

export type ComprehensionRequest = {
  text: string;
  context?: ComprehensionContextInput;
};

export type ComprehensionResult = {
  input: string;
  normalization: NormalizationResult;
  language: LanguageResult;
  intent: ClassifiedIntent;
  entities: ExtractedEntity[];
  context: ResolvedContext;
  destination: DestinationPrediction;
  needsClarification: boolean;
  clarifyingQuestion?: ClarifyingQuestion;
};
