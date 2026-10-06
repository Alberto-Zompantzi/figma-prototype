import { auditQueue } from '../data/auditQueue';
import { getDocumentHistory, type DocumentHistoryFixture } from '../data/documentHistory';
import type { DocumentResult, ProcessingResult } from '../types';

const STORAGE_KEY = 'mediflow.prototype.reviews.v1';
type ReviewDecision = 'APPROVE' | 'REJECT';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return choices.some(choice => choice === value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

// Storage is a boundary: accept only complete canonical snapshots, never casts.
function isDocumentResult(value: unknown): value is DocumentResult {
  if (!isRecord(value)) return false;
  const { classification, confidence, validation, routing_decision: routing, notification, storage } = value;
  return typeof value.document_id === 'string'
    && isOneOf(value.status, ['PROCESSED', 'NEEDS_AUDIT', 'APPROVED', 'REJECTED'])
    && (classification === null || (isRecord(classification)
      && isOneOf(classification.document_type, ['PRESCRIPTION', 'IMAGING_REPORT', 'STUDY_REPORT', 'PROCEDURE_ORDER', 'DISCHARGE_SUMMARY', 'MEDICAL_CERTIFICATE'])
      && (classification.specialty === null || typeof classification.specialty === 'string')
      && isOneOf(classification.priority_level, ['ROUTINE', 'URGENT'])))
    && (confidence === null || (isRecord(confidence)
      && [confidence.classification, confidence.extraction, confidence.global].every(number => typeof number === 'number' && Number.isFinite(number))))
    && (value.extracted_data === null || isRecord(value.extracted_data))
    && (validation === null || (isRecord(validation)
      && isStringArray(validation.missing_fields) && isStringArray(validation.inconsistencies) && isStringArray(validation.warnings)))
    && isRecord(routing)
    && isOneOf(routing.primary_destination, ['MEDICAL_EMERGENCY', 'PHARMACY', 'AUTHORIZATION_AUDIT', 'MEDICAL_RECORD', 'HUMAN_REVIEW'])
    && typeof routing.requires_human_review === 'boolean'
    && Array.isArray(routing.audit_reasons)
    && routing.audit_reasons.every(reason => isOneOf(reason, ['LOW_CONFIDENCE', 'ILLEGIBLE_DOCUMENT', 'MISSING_CRITICAL_FIELDS', 'INCONSISTENT_DATA', 'INVALID_AI_RESPONSE', 'AI_TIMEOUT', 'AI_UNAVAILABLE']))
    && typeof routing.justification === 'string'
    && isRecord(notification) && typeof notification.generated === 'boolean'
    && (notification.type === undefined || notification.type === 'MEDICAL_EMERGENCY')
    && (notification.message === undefined || typeof notification.message === 'string')
    && isRecord(storage) && storage.provider === 'OCI_OBJECT_STORAGE'
    && isOneOf(storage.state, ['PENDING', 'SUCCESS', 'ERROR']);
}

function isReviewedHistory(value: unknown): value is DocumentHistoryFixture {
  if (!isRecord(value) || !Array.isArray(value.events) || value.events.length !== 2) return false;
  const [initial, review]: unknown[] = value.events;
  if (!isRecord(initial) || !isRecord(review)) return false;
  return auditQueue.some(item => item.document_id === value.document_id && item.scenario_key === value.scenario_key)
    && initial.event_type === 'INITIAL_TRIAGE' && initial.sequence === 1 && initial.decision === null
    && typeof initial.occurred_at === 'string' && Number.isFinite(Date.parse(initial.occurred_at))
    && isDocumentResult(initial.result) && initial.result.status === 'NEEDS_AUDIT'
    && initial.result.document_id === value.document_id
    && review.event_type === 'HUMAN_REVIEW' && review.sequence === 2
    && typeof review.occurred_at === 'string' && Number.isFinite(Date.parse(review.occurred_at))
    && isDocumentResult(review.result) && review.result.document_id === value.document_id
    && !review.result.routing_decision.requires_human_review
    && ((review.decision === 'APPROVE' && review.result.status === 'APPROVED')
      || (review.decision === 'REJECT' && review.result.status === 'REJECTED'));
}

function loadReviews(): Map<string, DocumentHistoryFixture> {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Map();
    return new Map(raw.filter(isReviewedHistory).map(history => [history.document_id, history]));
  } catch {
    return new Map();
  }
}

const reviews = loadReviews();

export function getReviewedResult(documentId: string): DocumentResult | undefined {
  return reviews.get(documentId)?.events.at(-1)?.result;
}

export function getSessionHistory(scenarioKey: string, documentId?: string | null): DocumentHistoryFixture | undefined {
  const baseline = getDocumentHistory(scenarioKey, documentId);
  const id = documentId ?? baseline?.document_id ?? auditQueue.find(item => item.scenario_key === scenarioKey)?.document_id;
  return (id ? reviews.get(id) : undefined) ?? baseline;
}

export function recordReview(
  scenarioKey: string,
  initialResult: ProcessingResult,
  finalResult: DocumentResult,
  decision: ReviewDecision,
): DocumentResult {
  const existing = getReviewedResult(finalResult.document_id);
  if (existing) return existing;
  const baseline = getDocumentHistory(scenarioKey, finalResult.document_id);
  const initialEvent = baseline?.events.find(event => event.event_type === 'INITIAL_TRIAGE') ?? {
    sequence: 1,
    event_type: 'INITIAL_TRIAGE',
    decision: null,
    occurred_at: auditQueue.find(item => item.document_id === finalResult.document_id)?.created_at ?? new Date().toISOString(),
    result: initialResult,
  };
  const history: DocumentHistoryFixture = structuredClone({
    scenario_key: scenarioKey,
    document_id: finalResult.document_id,
    events: [initialEvent, {
      sequence: initialEvent.sequence + 1,
      event_type: 'HUMAN_REVIEW',
      decision,
      occurred_at: new Date().toISOString(),
      result: finalResult,
    }],
  });
  // Persist one source of truth: the last event is also the current result and decision.
  const nextReviews = new Map(reviews).set(finalResult.document_id, history);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...nextReviews.values()]));
  reviews.set(finalResult.document_id, history);
  return history.events[1].result;
}
