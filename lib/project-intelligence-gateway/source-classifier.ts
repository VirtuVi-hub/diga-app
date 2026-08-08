import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { ConfidenceLevel } from "@/types/evidence";
import type { SourceSubmissionInput, SourceType } from "@/types/project-intelligence-gateway";

/**
 * Module 3: Source Classification. Deterministic, dictionary-driven — no
 * OCR, no AI classification, no file parsing, matching every other
 * classifier in this codebase (`IntentClassifier`, `DrawingClassifier`).
 * Matches on filename keywords only; the architecture supports a real
 * content-based/OCR/ML classifier later behind this exact interface.
 */
const FILENAME_KEYWORD_RULES: [RegExp, SourceType][] = [
  [/drawing|floor plan|roof plan|elevation|section|site plan/i, SOURCE_TYPES.DRAWING],
  [/meeting|transcript|minutes/i, SOURCE_TYPES.MEETING],
  [/whatsapp|chat|sms/i, SOURCE_TYPES.CHAT],
  [/email|\.eml/i, SOURCE_TYPES.EMAIL],
  [/photo|image|\.jpe?g|\.png/i, SOURCE_TYPES.PHOTO],
  [/video|walkthrough|\.mp4/i, SOURCE_TYPES.VIDEO],
  [/voice|recording|\.mp3|\.wav/i, SOURCE_TYPES.VOICE],
  [/boq|bill of quantities|\.xlsx|spreadsheet/i, SOURCE_TYPES.SPREADSHEET],
  [/presentation|\.pptx|deck/i, SOURCE_TYPES.PRESENTATION],
  [/specification|\bspec\b/i, SOURCE_TYPES.SPECIFICATION],
  [/schedule/i, SOURCE_TYPES.SCHEDULE],
  [/site visit|site report|site note/i, SOURCE_TYPES.SITE_REPORT],
  [/brief|requirement|\.docx?/i, SOURCE_TYPES.DOCUMENT],
];

export type ClassifiedSource = {
  sourceType: SourceType;
  confidence: ConfidenceLevel;
};

export interface SourceClassifier {
  classify(input: SourceSubmissionInput): ClassifiedSource;
}

export class DictionarySourceClassifier implements SourceClassifier {
  classify(input: SourceSubmissionInput): ClassifiedSource {
    // A caller who already knows the type (e.g. an explicit upload-type
    // picker) is trusted directly — never second-guessed by the keyword
    // dictionary.
    if (input.declaredType) {
      return { sourceType: input.declaredType, confidence: "high" };
    }

    const haystack = input.filename ?? "";
    const match = FILENAME_KEYWORD_RULES.find(([pattern]) => pattern.test(haystack));
    if (!match) {
      return { sourceType: SOURCE_TYPES.UNKNOWN, confidence: "none" };
    }

    return { sourceType: match[1], confidence: "medium" };
  }
}

export const sourceClassifier: SourceClassifier = new DictionarySourceClassifier();
