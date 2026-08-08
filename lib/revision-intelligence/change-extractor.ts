import type { DesignChangeDraft, RawDetectedChange } from "@/types/revision-intelligence";

/**
 * Module: Change Extractor. Normalizes `RevisionComparator`'s raw output
 * into a consistent draft shape — the seam where a future parser's messier
 * raw format (differently-cased labels, stray whitespace, vendor-specific
 * element codes) gets cleaned up once, so `ChangeClassifier` never has to
 * care where the diff came from.
 */
export interface ChangeExtractor {
  extract(raw: RawDetectedChange[]): DesignChangeDraft[];
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export class NormalizingChangeExtractor implements ChangeExtractor {
  extract(raw: RawDetectedChange[]): DesignChangeDraft[] {
    return raw.map((change) => ({
      elementType: clean(change.elementType).toLowerCase(),
      elementLabel: clean(change.elementLabel),
      verb: change.verb,
      before: change.before ? clean(change.before) : undefined,
      after: change.after ? clean(change.after) : undefined,
    }));
  }
}

export const changeExtractor: ChangeExtractor = new NormalizingChangeExtractor();
