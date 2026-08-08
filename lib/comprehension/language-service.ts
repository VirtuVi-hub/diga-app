import type { LanguageResult, SupportedLanguage } from "@/types/comprehension";

const DEVANAGARI_PATTERN = /[ऀ-ॿ]/;

/** Romanized Hindi tokens that signal Hinglish even without Devanagari script. */
const HINGLISH_MARKER_TOKENS = [
  "kahan",
  "kaisa",
  "kaisi",
  "kitna",
  "kitni",
  "kya",
  "hai",
  "hua",
  "bola",
  "tha",
  "the",
  "ne",
  "ka",
  "ki",
  "ko",
  "wala",
];

type TranslationRule = {
  pattern: RegExp;
  translate: (match: RegExpMatchArray) => string;
};

/**
 * Full-sentence structural rules. Hindi/Hinglish is SOV where English is
 * SVO, so a plain word-for-word dictionary can't turn "staircase kahan hai"
 * into "Where is the staircase?" — these patterns capture the reordering.
 * Checked in order; the first match wins.
 */
const HINGLISH_SENTENCE_RULES: TranslationRule[] = [
  {
    // "<subject> kahan hai" -> "Where is the <subject>?"
    pattern: /^(.+?)\s+kahan\s+hai\??$/i,
    translate: (m) => `Where is the ${m[1].trim()}?`,
  },
  {
    // "<subject> ka kya hua" -> "What is the status of the <subject>?"
    pattern: /^(.+?)\s+ka\s+kya\s+hua\??$/i,
    translate: (m) => `What is the status of the ${m[1].trim()}?`,
  },
  {
    // "<subject> ne <object> bola tha" -> "Did the <subject> request <object>?"
    pattern: /^(.+?)\s+ne\s+(.+?)\s+bola\s+tha\??$/i,
    translate: (m) => `Did the ${m[1].trim()} request ${m[2].trim()}?`,
  },
];

/** Best-effort per-token fallback when no full-sentence rule matches. */
const TOKEN_TRANSLATIONS: Record<string, string> = {
  kahan: "where",
  hai: "is",
  hua: "happened",
  kya: "what",
  bola: "said",
  tha: "",
  ne: "",
  ka: "of",
  ki: "of",
};

export interface LanguageService {
  process(input: string): LanguageResult;
}

function detectLanguage(input: string): SupportedLanguage {
  if (DEVANAGARI_PATTERN.test(input)) return "hi";

  const tokens = input
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[?.,!]/g, ""));
  const hasMarker = tokens.some((token) => HINGLISH_MARKER_TOKENS.includes(token));

  return hasMarker ? "hinglish" : "en";
}

export class RuleBasedLanguageService implements LanguageService {
  process(input: string): LanguageResult {
    const detectedLanguage = detectLanguage(input);

    if (detectedLanguage === "en") {
      return { detectedLanguage, translatedText: input, confidence: 1 };
    }

    for (const rule of HINGLISH_SENTENCE_RULES) {
      const match = input.match(rule.pattern);
      if (match) {
        return { detectedLanguage, translatedText: rule.translate(match), confidence: 0.9 };
      }
    }

    // Fallback: naive per-token substitution, lower confidence.
    const translatedText = input
      .split(/\s+/)
      .map((token) => {
        const lower = token.toLowerCase().replace(/[?.,]/g, "");
        return lower in TOKEN_TRANSLATIONS ? TOKEN_TRANSLATIONS[lower] : token;
      })
      .filter(Boolean)
      .join(" ");

    return { detectedLanguage, translatedText: translatedText || input, confidence: 0.5 };
  }
}

export const languageService: LanguageService = new RuleBasedLanguageService();
