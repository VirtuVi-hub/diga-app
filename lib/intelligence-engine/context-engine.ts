import type { ResolvedContext } from "@/types/comprehension";
import type { ContextScope } from "@/types/intelligence-engine";

/**
 * Module 2 — Context Engine. Turns "where is the user right now" (already
 * resolved by the Comprehension Engine's `ContextResolver`) into an ORDERED
 * list of concrete scopes to search, narrowest first — so a caller can
 * search the current context before expanding to the entire project,
 * instead of only ever searching (or not searching) one fixed scope.
 *
 * Only `discussionId` becomes a node-level scope: a `RelationshipNodeRef`
 * needs a known `type`, and "discussion" is the only context id whose node
 * type is derivable without an extra repository lookup this sprint doesn't
 * add. `knowledgeObjectId` (type depends on which of the 5 Knowledge Object
 * types it is) and `page` (no corresponding concept in `RelationshipQuery`)
 * stay metadata-only on `ResolvedContext` — real node-scoping for either is
 * follow-up work, matching Sprint 4.1's own documented limitation.
 */
export interface ContextEngine {
  resolveScopes(context: ResolvedContext): ContextScope[];
}

export class DefaultContextEngine implements ContextEngine {
  resolveScopes(context: ResolvedContext): ContextScope[] {
    const scopes: ContextScope[] = [];

    if (context.discussionId) {
      scopes.push({ level: "node", node: { id: context.discussionId, type: "discussion" } });
    }

    if (context.projectId) {
      scopes.push({ level: "project", projectId: context.projectId });
    }

    return scopes;
  }
}

export const contextEngine: ContextEngine = new DefaultContextEngine();
