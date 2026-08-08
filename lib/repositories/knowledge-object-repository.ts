import { knowledgeObjects as seedKnowledgeObjects } from "@/data/knowledge-objects";
import type {
  CreateKnowledgeObjectInput,
  KnowledgeObject,
  ReviseKnowledgeObjectInput,
  ValidationState,
} from "@/types/knowledge-object";

export interface KnowledgeObjectRepository {
  listAll(): Promise<KnowledgeObject[]>;
  listByDiscussion(discussionId: string): Promise<KnowledgeObject[]>;
  get(id: string): Promise<KnowledgeObject | null>;
  create(input: CreateKnowledgeObjectInput): Promise<KnowledgeObject>;
  revise(id: string, input: ReviseKnowledgeObjectInput): Promise<KnowledgeObject>;
  relinkDiscussion(id: string, discussionId: string): Promise<KnowledgeObject>;
  setValidationState(id: string, validationState: ValidationState): Promise<KnowledgeObject>;
}

let store: KnowledgeObject[] = [...seedKnowledgeObjects];
let sequence = 0;

function nextId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class MockKnowledgeObjectRepository implements KnowledgeObjectRepository {
  async listAll(): Promise<KnowledgeObject[]> {
    return store;
  }

  async listByDiscussion(discussionId: string): Promise<KnowledgeObject[]> {
    return store.filter((item) => item.discussionId === discussionId);
  }

  async get(id: string): Promise<KnowledgeObject | null> {
    return store.find((item) => item.id === id) ?? null;
  }

  async create(input: CreateKnowledgeObjectInput): Promise<KnowledgeObject> {
    const now = new Date().toISOString();

    const firstRevision = {
      id: nextId("revision"),
      revisionNumber: 1,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      relatedTopics: input.relatedTopics,
      raisedTo: input.raisedTo,
      approvalRequiredFrom: input.approvalRequiredFrom,
      notify: input.notify,
      createdAt: now,
      createdBy: input.createdBy,
    };

    const object: KnowledgeObject = {
      id: nextId(input.type),
      projectId: input.projectId,
      discussionId: input.discussionId,
      type: input.type,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      relatedTopics: input.relatedTopics,
      raisedTo: input.raisedTo,
      approvalRequiredFrom: input.approvalRequiredFrom,
      notify: input.notify,
      validationState: "pending",
      revisions: [firstRevision],
      relatedDiscussions: [input.discussionId],
      relatedDocuments: [],
      relatedDrawings: [],
      approvals: [],
      createdAt: now,
      updatedAt: now,
    };

    store = [...store, object];
    return object;
  }

  async revise(id: string, input: ReviseKnowledgeObjectInput): Promise<KnowledgeObject> {
    const target = store.find((item) => item.id === id);
    if (!target) {
      throw new Error(`Knowledge object not found: ${id}`);
    }

    const now = new Date().toISOString();
    const nextRevisionNumber = target.revisions.length + 1;

    const revision = {
      id: nextId("revision"),
      revisionNumber: nextRevisionNumber,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      relatedTopics: input.relatedTopics,
      raisedTo: input.raisedTo,
      approvalRequiredFrom: input.approvalRequiredFrom,
      notify: input.notify,
      createdAt: now,
      createdBy: input.createdBy,
    };

    const updated: KnowledgeObject = {
      ...target,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      relatedTopics: input.relatedTopics,
      raisedTo: input.raisedTo,
      approvalRequiredFrom: input.approvalRequiredFrom,
      notify: input.notify,
      revisions: [...target.revisions, revision],
      updatedAt: now,
    };

    store = store.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  async relinkDiscussion(id: string, discussionId: string): Promise<KnowledgeObject> {
    const target = store.find((item) => item.id === id);
    if (!target) {
      throw new Error(`Knowledge object not found: ${id}`);
    }

    const updated: KnowledgeObject = {
      ...target,
      discussionId,
      relatedDiscussions: Array.from(new Set([...target.relatedDiscussions, discussionId])),
      updatedAt: new Date().toISOString(),
    };

    store = store.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  async setValidationState(id: string, validationState: ValidationState): Promise<KnowledgeObject> {
    const target = store.find((item) => item.id === id);
    if (!target) {
      throw new Error(`Knowledge object not found: ${id}`);
    }

    const updated: KnowledgeObject = {
      ...target,
      validationState,
      updatedAt: new Date().toISOString(),
    };

    store = store.map((item) => (item.id === id ? updated : item));
    return updated;
  }
}

export const knowledgeObjectRepository: KnowledgeObjectRepository = new MockKnowledgeObjectRepository();
