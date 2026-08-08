import { annotationExtractor as defaultAnnotationExtractor, type AnnotationExtractor } from "./annotation-extractor";
import { drawingClassifier as defaultDrawingClassifier, type DrawingClassifier } from "./drawing-classifier";
import { drawingOrchestrator as defaultDrawingOrchestrator, type DrawingOrchestrator } from "./drawing-orchestrator";
import { drawingParser as defaultDrawingParser, type DrawingParser } from "./drawing-parser";
import { drawingReasoner as defaultDrawingReasoner, type DrawingReasoner } from "./drawing-reasoner";
import { sheetAnalyzer as defaultSheetAnalyzer, type SheetAnalyzer } from "./sheet-analyzer";
import { titleBlockExtractor as defaultTitleBlockExtractor, type TitleBlockExtractor } from "./title-block-extractor";
import { viewExtractor as defaultViewExtractor, type ViewExtractor } from "./view-extractor";
import type { ContextScope } from "@/types/intelligence-engine";
import type { CreateDrawingInput, DrawingUploadInput } from "@/types/drawing-intelligence";

/**
 * Module 1: Drawing Intelligence Engine — the top-level assembler,
 * constructor-injected exactly like `IntelligenceEngine` (Sprint 4.2) and
 * `RevisionEngine` (Sprint 5.0): every collaborator is a parameter
 * defaulting to its own singleton, so a future real DWG/DXF/IFC/Revit/
 * image/CAD-API parser can replace `DrawingParser` alone — or any other
 * single stage — without touching this class or any other. Pure
 * computation only — no repository writes, no Knowledge/Relationship/Event
 * creation. That happens one layer up, in `DrawingService`, matching how
 * `RevisionEngine.process()` itself never writes anything either.
 *
 * Pipeline: Input → Parse (format-agnostic) → Classify → Analyze Sheet →
 * Extract Title Block / Views / Annotations → Reason (reused Evidence
 * Engine) → Orchestrate (suggested relationships).
 */
export class DrawingIntelligenceEngine {
  constructor(
    private readonly parser: DrawingParser = defaultDrawingParser,
    private readonly classifier: DrawingClassifier = defaultDrawingClassifier,
    private readonly sheetAnalyzer: SheetAnalyzer = defaultSheetAnalyzer,
    private readonly titleBlockExtractor: TitleBlockExtractor = defaultTitleBlockExtractor,
    private readonly viewExtractor: ViewExtractor = defaultViewExtractor,
    private readonly annotationExtractor: AnnotationExtractor = defaultAnnotationExtractor,
    private readonly reasoner: DrawingReasoner = defaultDrawingReasoner,
    private readonly orchestrator: DrawingOrchestrator = defaultDrawingOrchestrator,
  ) {}

  async process(input: DrawingUploadInput): Promise<CreateDrawingInput | null> {
    const raw = await this.parser.parse(input);
    if (!raw) return null;

    const { drawingType, confidence } = this.classifier.classify(raw);
    const { sheetNumber, scale, discipline } = this.sheetAnalyzer.analyze(raw, drawingType);
    const titleBlock = this.titleBlockExtractor.extract(raw);
    const views = this.viewExtractor.extract(raw);
    const annotations = this.annotationExtractor.extract(raw);

    const scopes: ContextScope[] = [
      { level: "node", node: { id: input.drawingId, type: "drawing" } },
      { level: "project", projectId: input.projectId },
    ];
    const searchText = [titleBlock.sheetTitle, ...annotations.map((annotation) => annotation.label)].join(" ");
    const { evidence, reasoning } = await this.reasoner.explain({ title: titleBlock.sheetTitle, searchText, scopes });
    const { suggestedRelationships } = this.orchestrator.decide({ evidence });

    return {
      id: input.drawingId,
      projectId: input.projectId,
      drawingType,
      sheetNumber,
      title: titleBlock.sheetTitle,
      scale,
      discipline,
      sourceFormat: raw.sourceFormat,
      titleBlock,
      views,
      annotations,
      currentRevisionLabel: raw.titleBlock.revision,
      previousRevisionLabel: raw.titleBlock.previousRevision,
      confidence,
      evidence,
      suggestedRelationships,
      reasoning,
      createdBy: input.createdBy,
    };
  }
}

export const drawingIntelligenceEngine: DrawingIntelligenceEngine = new DrawingIntelligenceEngine();
