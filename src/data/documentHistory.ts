import { scenarios } from './scenarios';
import type { DocumentResult, DocumentStatus, ProcessingResult } from '../types';

export type HistoryEventType = 'INITIAL_TRIAGE' | 'HUMAN_REVIEW';
export type HistoryDecision = 'APPROVE' | 'REJECT' | null;
export type HistoricalStatus = DocumentStatus;
export type HistoryResultSnapshot = DocumentResult;

export interface DocumentHistoryEvent {
  sequence: number;
  event_type: HistoryEventType;
  decision: HistoryDecision;
  occurred_at: string;
  result: HistoryResultSnapshot;
}

export interface DocumentHistoryFixture {
  scenario_key: string;
  document_id: string;
  events: DocumentHistoryEvent[];
}

function cloneCanonicalResult(
  result: ProcessingResult | HistoryResultSnapshot,
): HistoryResultSnapshot {
  return {
    ...result,
    classification: result.classification ? { ...result.classification } : null,
    confidence: result.confidence ? { ...result.confidence } : null,
    extracted_data: result.extracted_data ? { ...result.extracted_data } : null,
    validation: result.validation
      ? {
          missing_fields: [...result.validation.missing_fields],
          inconsistencies: [...result.validation.inconsistencies],
          warnings: [...result.validation.warnings],
        }
      : null,
    routing_decision: {
      ...result.routing_decision,
      audit_reasons: [...result.routing_decision.audit_reasons],
    },
    notification: { ...result.notification },
    storage: { ...result.storage },
  };
}

const initialProcessed = cloneCanonicalResult(scenarios.processed);
const initialNeedsAudit = cloneCanonicalResult(scenarios.needs_audit_partial);

const approvedAfterReview: HistoryResultSnapshot = {
  ...cloneCanonicalResult(scenarios.needs_audit_partial),
  status: 'APPROVED',
  confidence: null,
  extracted_data: {
    medico: 'Dra. Lorena Ibáñez',
    fecha: '11 de septiembre de 2026',
    medicamento: 'Levetiracetam 500 mg',
    dosis: '500 mg',
    frecuencia: 'Cada 12 horas',
    firma_medica: 'Dra. Lorena Ibáñez',
  },
  validation: {
    missing_fields: [],
    inconsistencies: [],
    warnings: [],
  },
  routing_decision: {
    primary_destination: 'PHARMACY',
    requires_human_review: false,
    audit_reasons: ['MISSING_CRITICAL_FIELDS', 'LOW_CONFIDENCE'],
    justification:
      'Información clínica completada y validada durante la revisión humana.',
  },
};

export const illegibleInitial: ProcessingResult = {
  document_id: 'DOC-2026-097103',
  status: 'NEEDS_AUDIT',
  classification: null,
  confidence: null,
  extracted_data: null,
  validation: null,
  routing_decision: {
    primary_destination: 'HUMAN_REVIEW',
    requires_human_review: true,
    audit_reasons: ['ILLEGIBLE_DOCUMENT'],
    justification:
      'El documento no permite una extracción confiable y requiere revisión humana.',
  },
  notification: { generated: false },
  storage: { provider: 'OCI_OBJECT_STORAGE', state: 'SUCCESS' },
};

const rejectedAfterReview: HistoryResultSnapshot = {
  ...cloneCanonicalResult(illegibleInitial),
  status: 'REJECTED',
  routing_decision: {
    primary_destination: 'HUMAN_REVIEW',
    requires_human_review: false,
    audit_reasons: ['ILLEGIBLE_DOCUMENT'],
    justification:
      'Documento rechazado durante la revisión humana porque su contenido no es legible.',
  },
};

export const documentHistories: DocumentHistoryFixture[] = [
  {
    scenario_key: 'processed',
    document_id: 'DOC-2026-087431',
    events: [
      {
        sequence: 1,
        event_type: 'INITIAL_TRIAGE',
        decision: null,
        occurred_at: '2026-09-12T10:18:00-06:00',
        result: initialProcessed,
      },
    ],
  },
  {
    scenario_key: 'needs_audit_partial',
    document_id: 'DOC-2026-091207',
    events: [
      {
        sequence: 1,
        event_type: 'INITIAL_TRIAGE',
        decision: null,
        occurred_at: '2026-09-11T14:32:00-06:00',
        result: initialNeedsAudit,
      },
      {
        sequence: 2,
        event_type: 'HUMAN_REVIEW',
        decision: 'APPROVE',
        occurred_at: '2026-09-11T15:04:00-06:00',
        result: approvedAfterReview,
      },
    ],
  },
  {
    scenario_key: 'needs_audit_illegible',
    document_id: 'DOC-2026-097103',
    events: [
      {
        sequence: 1,
        event_type: 'INITIAL_TRIAGE',
        decision: null,
        occurred_at: '2026-09-29T16:51:00-06:00',
        result: illegibleInitial,
      },
      {
        sequence: 2,
        event_type: 'HUMAN_REVIEW',
        decision: 'REJECT',
        occurred_at: '2026-09-29T17:08:00-06:00',
        result: rejectedAfterReview,
      },
    ],
  },
];

export function getDocumentHistory(scenarioKey: string, documentId?: string | null) {
  if (documentId) {
    const matchingDocument = documentHistories.find(
      fixture => fixture.document_id === documentId,
    );
    if (matchingDocument) return matchingDocument;
  }
  return documentHistories.find(fixture => fixture.scenario_key === scenarioKey);
}
