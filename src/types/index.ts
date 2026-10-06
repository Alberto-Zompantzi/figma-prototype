export type AuditReason =
  | 'LOW_CONFIDENCE'
  | 'ILLEGIBLE_DOCUMENT'
  | 'MISSING_CRITICAL_FIELDS'
  | 'INCONSISTENT_DATA'
  | 'INVALID_AI_RESPONSE'
  | 'AI_TIMEOUT'
  | 'AI_UNAVAILABLE';

export interface Classification {
  document_type:
    | 'PRESCRIPTION'
    | 'IMAGING_REPORT'
    | 'STUDY_REPORT'
    | 'PROCEDURE_ORDER'
    | 'DISCHARGE_SUMMARY'
    | 'MEDICAL_CERTIFICATE';
  specialty: string | null;
  priority_level: 'ROUTINE' | 'URGENT';
}

export interface Confidence {
  classification: number;
  extraction: number;
  global: number;
}

export interface Validation {
  missing_fields: string[];
  inconsistencies: string[];
  warnings: string[];
}

export interface RoutingDecision {
  primary_destination:
    | 'MEDICAL_EMERGENCY'
    | 'PHARMACY'
    | 'AUTHORIZATION_AUDIT'
    | 'MEDICAL_RECORD'
    | 'HUMAN_REVIEW';
  requires_human_review: boolean;
  audit_reasons: AuditReason[];
  justification: string;
}

export interface Notification {
  generated: boolean;
  type?: 'MEDICAL_EMERGENCY';
  message?: string;
}

export interface Storage {
  provider: 'OCI_OBJECT_STORAGE';
  state: 'PENDING' | 'SUCCESS' | 'ERROR';
}

export interface ProcessingResult {
  document_id: string;
  status: 'PROCESSED' | 'NEEDS_AUDIT';
  classification: Classification | null;
  confidence: Confidence | null;
  extracted_data: Record<string, unknown> | null;
  validation: Validation | null;
  routing_decision: RoutingDecision;
  notification: Notification;
  storage: Storage;
}
