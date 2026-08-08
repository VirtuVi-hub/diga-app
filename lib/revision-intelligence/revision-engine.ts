import { changeClassifier as defaultChangeClassifier, type ChangeClassifier } from "./change-classifier";
import { changeExtractor as defaultChangeExtractor, type ChangeExtractor } from "./change-extractor";
import { impactAnalyzer as defaultImpactAnalyzer, type ImpactAnalyzer } from "./impact-analyzer";
import { revisionComparator as defaultRevisionComparator, type RevisionComparator } from "./revision-comparator";
import { revisionOrchestrator as defaultRevisionOrchestrator, type RevisionOrchestrator } from "./revision-orchestrator";
import { revisionReasoner as defaultRevisionReasoner, type RevisionReasoner } from "./revision-reasoner";
import type { ContextScope } from "@/types/intelligence-engine";
import type { CreateRevisionInput, DetectRevisionInput } from "@/types/revision-intelligence";

/**
 * Module 1: Revision Engine — the top-level assembler, constructor-injected
 * exactly like `IntelligenceEngine` (Sprint 4.2): every collaborator is a
 * parameter defaulting to its own singleton, so a future real DWG/Revit/IFC/
 * Computer-Vision parser can replace `RevisionComparator` alone (or any
 * other single stage) without touching this class or any other. Pure
 * computation only — no repository writes, no Knowledge/Relationship/Event
 * creation. That happens one layer up, in `RevisionService`, matching how
 * `IntelligenceEngine.process()` itself never writes anything either.
 *
 * Pipeline: Drawing Revision → Detected Design Changes (Comparator →
 * Extractor → Classifier) → Impact Analysis (reused Evidence Engine) →
 * Reasoning → Orchestration (suggested relationships/actions).
 */
export class RevisionEngine {
  constructor(
    private readonly comparator: RevisionComparator = defaultRevisionComparator,
    private readonly extractor: ChangeExtractor = defaultChangeExtractor,
    private readonly classifier: ChangeClassifier = defaultChangeClassifier,
    private readonly reasoner: RevisionReasoner = defaultRevisionReasoner,
    private readonly impactAnalyzer: ImpactAnalyzer = defaultImpactAnalyzer,
    private readonly orchestrator: RevisionOrchestrator = defaultRevisionOrchestrator,
  ) {}

  async process(input: DetectRevisionInput): Promise<CreateRevisionInput[]> {
    const rawChanges = await this.comparator.compare(input);
    const drafts = this.extractor.extract(rawChanges);

    const scopes: ContextScope[] = [{ level: "project", projectId: input.projectId }];

    const results: CreateRevisionInput[] = [];
    for (const draft of drafts) {
      const classified = this.classifier.classify(draft);
      const { evidence, impacts, relatedKnowledge } = await this.impactAnalyzer.analyze({ elementLabel: draft.elementLabel, scopes });
      const reasoning = this.reasoner.explain({
        elementLabel: draft.elementLabel,
        detectedChange: classified.detectedChange,
        evidence,
        confidence: classified.confidence,
      });
      const { suggestedRelationships, suggestedActions } = this.orchestrator.decide({
        elementType: draft.elementType,
        impacts,
        relatedKnowledge,
      });

      results.push({
        projectId: input.projectId,
        sourceDrawing: input.sourceDrawing,
        previousRevisionLabel: input.previousRevisionLabel,
        currentRevisionLabel: input.currentRevisionLabel,
        elementType: draft.elementType,
        elementLabel: draft.elementLabel,
        changeType: classified.changeType,
        detectedChange: classified.detectedChange,
        before: draft.before,
        after: draft.after,
        confidence: classified.confidence,
        evidence,
        impacts,
        relatedKnowledge,
        suggestedRelationships,
        suggestedActions,
        reasoning,
        createdBy: input.createdBy,
      });
    }

    return results;
  }
}

export const revisionEngine: RevisionEngine = new RevisionEngine();
