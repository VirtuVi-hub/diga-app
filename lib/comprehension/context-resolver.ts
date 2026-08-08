import type { ComprehensionContextInput, ResolvedContext } from "@/types/comprehension";

/**
 * Resolves "where is the user right now" into a structured context, in
 * priority order: page → discussion → knowledge object → project, before
 * ever falling back to searching the whole project. The caller (a React
 * component already knows its own `discussionId`/`projectId`) supplies
 * what's on screen; this module's job is only to carry it through with a
 * consistent shape, so callers never have to force users to repeat
 * information already visible on screen.
 */
export interface ContextResolver {
  resolve(input: ComprehensionContextInput): ResolvedContext;
}

export class DefaultContextResolver implements ContextResolver {
  resolve(input: ComprehensionContextInput): ResolvedContext {
    return {
      page: input.page,
      discussionId: input.discussionId,
      knowledgeObjectId: input.knowledgeObjectId,
      projectId: input.projectId,
    };
  }
}

export const contextResolver: ContextResolver = new DefaultContextResolver();
