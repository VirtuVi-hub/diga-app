"use server";

import { RelationshipService } from "@/lib/services/relationship-service";
import type { CreateRelationshipInput, RelationshipNodeRef, RelationshipQuery } from "@/types/relationship";

export async function createRelationship(input: CreateRelationshipInput) {
  return RelationshipService.create(input);
}

export async function removeRelationship(id: string) {
  return RelationshipService.remove(id);
}

export async function queryRelationships(filter?: RelationshipQuery) {
  return RelationshipService.query(filter);
}

export async function getEvidenceForNode(node: RelationshipNodeRef) {
  return RelationshipService.getEvidence(node);
}

export async function getImpactsForNode(node: RelationshipNodeRef) {
  return RelationshipService.getImpacts(node);
}
