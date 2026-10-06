import type { AuditReason } from '../types';

// Prototype-only queue fields. Not part of ProcessingResult.
export interface AuditQueueItem {
  scenario_key: string;       // maps to existing result scenarios for "Ver revisión"
  document_id: string;
  input_type: 'file' | 'text';
  file_name: string | null;   // null when input_type === 'text'
  document_type: string | null; // null when not classified
  audit_reasons: AuditReason[];
  created_at: string;         // ISO 8601
}

export const auditQueue: AuditQueueItem[] = [
  {
    scenario_key: 'needs_audit_partial',
    document_id: 'DOC-2026-091207',
    input_type: 'file',
    file_name: 'neurologia_receta_20260911.pdf',
    document_type: 'Receta médica',
    audit_reasons: ['MISSING_CRITICAL_FIELDS', 'LOW_CONFIDENCE'],
    created_at: '2026-09-11T14:32:00',
  },
  {
    scenario_key: 'needs_audit_empty',
    document_id: 'DOC-2026-093845',
    input_type: 'text',
    file_name: null,
    document_type: null,
    audit_reasons: ['AI_TIMEOUT'],
    created_at: '2026-09-15T09:07:00',
  },
  {
    scenario_key: 'needs_audit_illegible',
    document_id: 'DOC-2026-097103',
    input_type: 'file',
    file_name: 'informe_rx_torax.png',
    document_type: 'Informe de imagen',
    audit_reasons: ['ILLEGIBLE_DOCUMENT'],
    created_at: '2026-09-29T16:51:00',
  },
];
