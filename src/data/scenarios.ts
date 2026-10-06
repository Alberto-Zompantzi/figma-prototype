import type { ProcessingResult } from "../types"

export const scenarios: Record<string, ProcessingResult> = {
  processed: {
    document_id: "DOC-2026-087431",
    status: "PROCESSED",
    classification: {
      document_type: "DISCHARGE_SUMMARY",
      specialty: "Cardiología",
      priority_level: "ROUTINE",
    },
    confidence: {
      classification: 0.94,
      extraction: 0.87,
      global: 0.91,
    },
    extracted_data: {
      paciente: "Diego Marin",
      fecha_alta: "12 de septiembre de 2026",
      diagnostico_principal:
        "I21.0 – Infarto agudo de miocardio de pared anterior",
      medico_responsable: "Dr. Roberto Gutiérrez Vega",
      medicacion_alta: [
        "Ácido acetilsalicílico 100 mg/día",
        "Ramipril 5 mg/día",
        "Atorvastatina 80 mg/día",
      ],
      indicaciones:
        "Reposo relativo 4 semanas. Control ambulatorio en 10 días.",
    },
    validation: {
      missing_fields: [],
      inconsistencies: [],
      warnings: ["Diagnóstico secundario no codificado"],
    },
    routing_decision: {
      primary_destination: "MEDICAL_RECORD",
      requires_human_review: false,
      audit_reasons: [],
      justification:
        "Documento completo. Archivado en expediente del paciente.",
    },
    notification: { generated: false },
    storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" },
  },

  processed_urgent: {
    document_id: "DOC-2026-094112",
    status: "PROCESSED",
    classification: {
      document_type: "PROCEDURE_ORDER",
      specialty: "Cirugía Cardiovascular",
      priority_level: "URGENT",
    },
    confidence: {
      classification: 0.96,
      extraction: 0.91,
      global: 0.93,
    },
    extracted_data: {
      paciente: "Elena Ramos Villanueva",
      procedimiento: "Cateterismo cardíaco de urgencia",
      medico_solicitante: "Dr. Héctor Paredes Nieto",
      fecha_solicitud: "29 de septiembre de 2026",
      prioridad_clinica: "Inmediata",
    },
    validation: {
      missing_fields: [],
      inconsistencies: [],
      warnings: [],
    },
    routing_decision: {
      primary_destination: "MEDICAL_EMERGENCY",
      requires_human_review: false,
      audit_reasons: [],
      justification:
        "Orden de procedimiento urgente derivada a urgencias médicas para atención inmediata.",
    },
    notification: {
      generated: true,
      type: "MEDICAL_EMERGENCY",
      message:
        "Se ha generado una alerta de urgencia médica para el documento DOC-2026-094112. El equipo de Urgencias ha sido notificado.",
    },
    storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" },
  },

  needs_audit_partial: {
    document_id: "DOC-2026-091207",
    status: "NEEDS_AUDIT",
    classification: {
      document_type: "PRESCRIPTION",
      specialty: "Neurología",
      priority_level: "URGENT",
    },
    confidence: {
      classification: 0.78,
      extraction: 0.52,
      global: 0.63,
    },
    extracted_data: {
      medico: "Dra. Lorena Ibáñez",
      fecha: "11 de septiembre de 2026",
      medicamento: "Levetiracetam 500 mg",
    },
    validation: {
      missing_fields: ["dosis", "frecuencia", "firma_medica"],
      inconsistencies: [],
      warnings: ["Número de cédula profesional ilegible"],
    },
    routing_decision: {
      primary_destination: "HUMAN_REVIEW",
      requires_human_review: true,
      audit_reasons: ["MISSING_CRITICAL_FIELDS", "LOW_CONFIDENCE"],
      justification:
        "El documento contiene información incompleta que impide el procesamiento automático.",
    },
    notification: { generated: false },
    storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" },
  },

  needs_audit_empty: {
    document_id: "DOC-2026-093845",
    status: "NEEDS_AUDIT",
    classification: null,
    confidence: null,
    extracted_data: null,
    validation: null,
    routing_decision: {
      primary_destination: "HUMAN_REVIEW",
      requires_human_review: true,
      audit_reasons: ["AI_TIMEOUT"],
      justification:
        "El servicio de análisis no respondió dentro del tiempo configurado.",
    },
    notification: { generated: false },
    storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" },
  },
}
