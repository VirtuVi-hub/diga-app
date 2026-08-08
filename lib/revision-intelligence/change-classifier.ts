import { DESIGN_CHANGE_TYPES } from "@/types/revision-intelligence";
import type { ConfidenceLevel } from "@/types/evidence";
import type { DesignChangeDraft, DesignChangeType } from "@/types/revision-intelligence";

/**
 * `elementType.verb` → the specific, namespaced `DesignChangeType` (Module
 * 3). Unknown combinations fall back to the raw `elementType.verb` string
 * itself — a data-dictionary gap, not a pipeline failure, matching how
 * `EntityExtractor`'s dictionary degrades honestly for unrecognized terms.
 */
const CLASSIFICATION_TABLE: Record<string, DesignChangeType> = {
  "door.moved": DESIGN_CHANGE_TYPES.DOOR_MOVED,
  "wall.added": DESIGN_CHANGE_TYPES.WALL_ADDED,
  "wall.removed": DESIGN_CHANGE_TYPES.WALL_REMOVED,
  "room.resized": DESIGN_CHANGE_TYPES.ROOM_RESIZED,
  "room.renamed": DESIGN_CHANGE_TYPES.ROOM_RENAMED,
  "room.added": DESIGN_CHANGE_TYPES.ROOM_ADDED,
  "room.removed": DESIGN_CHANGE_TYPES.ROOM_DELETED,
  "staircase.moved": DESIGN_CHANGE_TYPES.STAIRCASE_SHIFTED,
  "entrance.resized": DESIGN_CHANGE_TYPES.ENTRANCE_WIDENED,
  "entrance.moved": DESIGN_CHANGE_TYPES.ENTRANCE_RELOCATED,
  "ramp.resized": DESIGN_CHANGE_TYPES.RAMP_MODIFIED,
  "ramp.modified": DESIGN_CHANGE_TYPES.RAMP_MODIFIED,
  "column.moved": DESIGN_CHANGE_TYPES.COLUMN_MOVED,
  "dimension.modified": DESIGN_CHANGE_TYPES.DIMENSION_CHANGED,
};

const VERB_PHRASE: Record<DesignChangeDraft["verb"], string> = {
  added: "added",
  removed: "removed",
  moved: "moved",
  resized: "resized",
  renamed: "renamed",
  modified: "modified",
};

export type ClassifiedChange = {
  changeType: DesignChangeType;
  detectedChange: string;
  confidence: ConfidenceLevel;
};

/**
 * Module: Change Classifier. Deterministic, dictionary-driven — no AI,
 * matching every other classifier in this codebase (`IntentClassifier`,
 * `DestinationPredictor`). Confidence reflects how much of the diff is
 * actually known: a real before/after pair is stronger signal than a bare
 * verb; a recognized element/verb combination is stronger than an unknown
 * one.
 */
export interface ChangeClassifier {
  classify(draft: DesignChangeDraft): ClassifiedChange;
}

export class DictionaryChangeClassifier implements ChangeClassifier {
  classify(draft: DesignChangeDraft): ClassifiedChange {
    const key = `${draft.elementType}.${draft.verb}`;
    const changeType = CLASSIFICATION_TABLE[key] ?? key;
    const isKnownCombination = key in CLASSIFICATION_TABLE;

    const diffPhrase = draft.before && draft.after ? ` (${draft.before} → ${draft.after})` : "";
    const detectedChange = `${draft.elementLabel} ${VERB_PHRASE[draft.verb]}${diffPhrase}`;

    const confidence: ConfidenceLevel = draft.before && draft.after ? "high" : isKnownCombination ? "medium" : "low";

    return { changeType, detectedChange, confidence };
  }
}

export const changeClassifier: ChangeClassifier = new DictionaryChangeClassifier();
