import type { AuditReason, Classification, RoutingDecision } from '../types';

export interface AuditReviewOnlyScenario {
  document_id: string;
  status: 'NEEDS_AUDIT';
  classification: null;
  initial_classification: {
    document_type: Classification['document_type'];
    specialty: '';
    priority_level: '';
  };
  extracted_data: Record<string, unknown>;
  validation: null;
  routing_decision: {
    primary_destination: RoutingDecision['primary_destination'];
    requires_human_review: true;
    audit_reasons: AuditReason[];
  };
}

export const auditReviewScenarios: Record<string, AuditReviewOnlyScenario> = {
  needs_audit_illegible: {
    document_id: 'DOC-2026-097103',
    status: 'NEEDS_AUDIT',
    classification: null,
    initial_classification: {
      document_type: 'IMAGING_REPORT',
      specialty: '',
      priority_level: '',
    },
    extracted_data: {},
    validation: null,
    routing_decision: {
      primary_destination: 'HUMAN_REVIEW',
      requires_human_review: true,
      audit_reasons: ['ILLEGIBLE_DOCUMENT'],
    },
  },
};
