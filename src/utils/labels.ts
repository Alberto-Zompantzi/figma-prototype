import type { AuditReason, Classification, RoutingDecision, Storage } from '../types';

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PROCESSED: 'Procesado',
    NEEDS_AUDIT: 'Requiere revisión',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
  };
  return map[status] ?? status;
}

export function documentTypeLabel(type: Classification['document_type']): string {
  const map: Record<string, string> = {
    PRESCRIPTION: 'Receta médica',
    IMAGING_REPORT: 'Informe de imagen',
    STUDY_REPORT: 'Informe de estudio',
    PROCEDURE_ORDER: 'Orden de procedimiento',
    DISCHARGE_SUMMARY: 'Resumen de alta',
    MEDICAL_CERTIFICATE: 'Certificado médico',
  };
  return map[type] ?? type;
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    ROUTINE: 'Rutinaria',
    URGENT: 'Urgente',
  };
  return map[priority] ?? priority;
}

export function destinationLabel(dest: RoutingDecision['primary_destination']): string {
  const map: Record<string, string> = {
    MEDICAL_EMERGENCY: 'Urgencias Médicas',
    PHARMACY: 'Farmacia',
    AUTHORIZATION_AUDIT: 'Auditoría de Autorización',
    MEDICAL_RECORD: 'Expediente Clínico',
    HUMAN_REVIEW: 'Revisión Humana',
  };
  return map[dest] ?? dest;
}

export function auditReasonLabel(reason: AuditReason): string {
  const map: Record<AuditReason, string> = {
    LOW_CONFIDENCE: 'Confianza de extracción por debajo del umbral requerido',
    ILLEGIBLE_DOCUMENT: 'Documento ilegible',
    MISSING_CRITICAL_FIELDS: 'Campos obligatorios no detectados: dosis y frecuencia',
    INCONSISTENT_DATA: 'Datos inconsistentes',
    INVALID_AI_RESPONSE: 'No se obtuvo una respuesta válida del servicio de análisis',
    AI_TIMEOUT: 'Tiempo de espera agotado',
    AI_UNAVAILABLE: 'Servicio de análisis no disponible',
  };
  return map[reason] ?? reason;
}

export function notificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    MEDICAL_EMERGENCY: 'Urgencia Médica',
  };
  return map[type] ?? type;
}

export function storageStateLabel(state: Storage['state']): string {
  const map: Record<string, string> = {
    SUCCESS: 'Guardado correctamente',
    PENDING: 'Almacenamiento pendiente',
    ERROR: 'Problema de almacenamiento',
  };
  return map[state] ?? state;
}
