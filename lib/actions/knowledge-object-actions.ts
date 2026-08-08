"use server";

import { findMatchingKnowledgeObject } from "@/lib/services/knowledge-object-matching";
import { KnowledgeObjectService } from "@/lib/services/knowledge-object-service";
import type { CreateKnowledgeObjectInput, ReviseKnowledgeObjectInput } from "@/types/knowledge-object";

export async function getAllKnowledgeObjects() {
  return KnowledgeObjectService.listAll();
}

export async function matchKnowledgeObject(input: { text: string; entities: string[] }) {
  const objects = await KnowledgeObjectService.listAll();
  return findMatchingKnowledgeObject(objects, input);
}

export async function getKnowledgeObjects(discussionId: string) {
  return KnowledgeObjectService.listByDiscussion(discussionId);
}

export async function getKnowledgeObjectCounts(discussionId: string) {
  return KnowledgeObjectService.countsByDiscussion(discussionId);
}

export async function getKnowledgeObject(id: string) {
  return KnowledgeObjectService.get(id);
}

export async function createKnowledgeObject(input: CreateKnowledgeObjectInput) {
  return KnowledgeObjectService.create(input);
}

export async function reviseKnowledgeObject(id: string, input: ReviseKnowledgeObjectInput) {
  return KnowledgeObjectService.revise(id, input);
}

export async function relinkKnowledgeObjectDiscussion(id: string, discussionId: string) {
  return KnowledgeObjectService.relinkDiscussion(id, discussionId);
}
