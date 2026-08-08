import type { ClarifyingQuestion, ComprehensionRequest, ComprehensionResult } from "@/types/comprehension";
import { contextResolver as defaultContextResolver, type ContextResolver } from "./context-resolver";
import { destinationPredictor as defaultDestinationPredictor, type DestinationPredictor } from "./destination-predictor";
import { entityExtractor as defaultEntityExtractor, type EntityExtractor } from "./entity-extractor";
import { intentClassifier as defaultIntentClassifier, type IntentClassifier } from "./intent-classifier";
import { languageService as defaultLanguageService, type LanguageService } from "./language-service";
import { normalizationService as defaultNormalizationService, type NormalizationService } from "./normalization-service";

/** Below this, Delta asks a clarifying question instead of guessing. */
export const CONFIDENCE_THRESHOLD = 0.5;

function buildClarifyingQuestion(entities: ComprehensionResult["entities"]): ClarifyingQuestion {
  const ambiguousEntity = entities.find((entity) => (entity.alternatives?.length ?? 0) > 1);
  if (ambiguousEntity) {
    return { prompt: "Did you mean:", options: ambiguousEntity.alternatives ?? [] };
  }

  return { prompt: "I'm not confident I understood that — could you rephrase or add more detail?", options: [] };
}

/**
 * The first stage of every Delta interaction: User → Comprehension →
 * Knowledge Graph → Reasoning → Answer. Every collaborator is a
 * constructor parameter (defaulting to the deterministic mock singleton
 * below), so a future LLM-backed module can be swapped in for any single
 * stage without touching this orchestrator or any other module.
 */
export class DeltaComprehensionService {
  constructor(
    private readonly normalizationService: NormalizationService = defaultNormalizationService,
    private readonly languageService: LanguageService = defaultLanguageService,
    private readonly intentClassifier: IntentClassifier = defaultIntentClassifier,
    private readonly entityExtractor: EntityExtractor = defaultEntityExtractor,
    private readonly contextResolver: ContextResolver = defaultContextResolver,
    private readonly destinationPredictor: DestinationPredictor = defaultDestinationPredictor,
  ) {}

  comprehend(request: ComprehensionRequest): ComprehensionResult {
    const normalization = this.normalizationService.normalize(request.text);
    const language = this.languageService.process(normalization.normalized);
    const intent = this.intentClassifier.classify(language.translatedText);
    const entities = this.entityExtractor.extract(language.translatedText);
    const context = this.contextResolver.resolve(request.context ?? {});
    const destination = this.destinationPredictor.predict(language.translatedText);

    const confidences = [intent.confidence, destination.confidence, ...entities.map((entity) => entity.confidence)];
    const lowestConfidence = confidences.length > 0 ? Math.min(...confidences) : 1;
    const needsClarification = lowestConfidence < CONFIDENCE_THRESHOLD;

    return {
      input: request.text,
      normalization,
      language,
      intent,
      entities,
      context,
      destination,
      needsClarification,
      clarifyingQuestion: needsClarification ? buildClarifyingQuestion(entities) : undefined,
    };
  }
}

export const deltaComprehensionService = new DeltaComprehensionService();
