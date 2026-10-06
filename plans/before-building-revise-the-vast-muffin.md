# Plan — View #20: Resultado del Procesamiento (Final Revised)

## Context

MediFlow is a clinical document processing application. View #20 displays the result of an automated document processing pipeline. It supports two primary states — PROCESSED and NEEDS_AUDIT — with partial data possible in either. The UI renders only what the response actually contains; nullable sections are omitted entirely (no empty placeholder cards). Design is extracted from the attached MediFlow Figma file before any code is written.

---

## First Build Step: Design Extraction

Before writing any UI code:
1. Run `figma attachments get <attachment-id>` on the attached MediFlow App Shell design.
2. Extract from the result: exact font families and weights, color values (background, surface, border, text, accent, status colors), spacing scale, border radius, component styling patterns (chips, cards, data rows, badges).
3. Wire fonts into `src/index.css` using the project's documented convention (Google Fonts CSS2 `@import` first if applicable).
4. Apply all tokens directly in JSX via Tailwind utilities or inline styles — do not invent token names not present in the design.

---

## Shell (Preserved Exactly)

- **Sidebar**: Light, as in the attached design. No color changes.
- **Active nav item**: Procesamiento.
- **Breadcrumb**: Extend the MediFlow App Shell convention exactly. Current pattern: `MediFlow / Procesamiento`. For this view: `MediFlow / Procesamiento / Resultado`.
- **No new nav items** introduced.
- The content area is the only zone this view modifies.

---

## Canonical Backend Contract

```typescript
type AuditReason =
  | "LOW_CONFIDENCE"
  | "ILLEGIBLE_DOCUMENT"
  | "MISSING_CRITICAL_FIELDS"
  | "INCONSISTENT_DATA"
  | "INVALID_AI_RESPONSE"
  | "AI_TIMEOUT"
  | "AI_UNAVAILABLE";

interface ProcessingResult {
  document_id: string;
  status: "PROCESSED" | "NEEDS_AUDIT";

  classification: {
    document_type:
      | "PRESCRIPTION"
      | "IMAGING_REPORT"
      | "STUDY_REPORT"
      | "PROCEDURE_ORDER"
      | "DISCHARGE_SUMMARY"
      | "MEDICAL_CERTIFICATE";
    specialty: string | null;       // omit specialty row in UI when null
    priority_level: "ROUTINE" | "URGENT";
  } | null;

  confidence: {
    classification: number;   // 0–1
    extraction: number;       // 0–1
    global: number;           // 0–1 — primary metric shown in UI
  } | null;

  extracted_data: Record<string, unknown> | null;  // dynamic; no fixed schema

  validation: {
    missing_fields: string[];
    inconsistencies: string[];
    warnings: string[];
  } | null;

  routing_decision: {
    primary_destination:
      | "MEDICAL_EMERGENCY"
      | "PHARMACY"
      | "AUTHORIZATION_AUDIT"
      | "MEDICAL_RECORD"
      | "HUMAN_REVIEW";
    requires_human_review: boolean;
    audit_reasons: AuditReason[];   // typed enum; never free text
    justification: string;
  };

  notification: {
    generated: boolean;
    type?: "MEDICAL_EMERGENCY";     // only supported value for current MVP
    message?: string;
  };

  storage: {
    provider: "OCI_OBJECT_STORAGE";
    state: "PENDING" | "SUCCESS" | "ERROR";
  };
}
```

---

## Spanish Label Mapping

### status
| Value | Label |
|---|---|
| `PROCESSED` | Procesado |
| `NEEDS_AUDIT` | Requiere revisión |

### classification.document_type
| Value | Label |
|---|---|
| `PRESCRIPTION` | Receta médica |
| `IMAGING_REPORT` | Informe de imagen |
| `STUDY_REPORT` | Informe de estudio |
| `PROCEDURE_ORDER` | Orden de procedimiento |
| `DISCHARGE_SUMMARY` | Resumen de alta |
| `MEDICAL_CERTIFICATE` | Certificado médico |

### classification.priority_level
| Value | Label |
|---|---|
| `ROUTINE` | Rutinaria |
| `URGENT` | Urgente |

### routing_decision.primary_destination
| Value | Label |
|---|---|
| `MEDICAL_EMERGENCY` | Urgencias Médicas |
| `PHARMACY` | Farmacia |
| `AUTHORIZATION_AUDIT` | Auditoría de Autorización |
| `MEDICAL_RECORD` | Expediente Clínico |
| `HUMAN_REVIEW` | Revisión Humana |

### routing_decision.audit_reasons (AuditReason enum)
| Value | Label |
|---|---|
| `LOW_CONFIDENCE` | Baja confianza |
| `ILLEGIBLE_DOCUMENT` | Documento ilegible |
| `MISSING_CRITICAL_FIELDS` | Faltan campos críticos |
| `INCONSISTENT_DATA` | Datos inconsistentes |
| `INVALID_AI_RESPONSE` | No se obtuvo una respuesta válida del servicio de análisis |
| `AI_TIMEOUT` | Tiempo de espera agotado |
| `AI_UNAVAILABLE` | Servicio de análisis no disponible |

Explanatory prose never lives inside `audit_reasons`. Prose belongs in `justification`.

### notification.type
| Value | Label |
|---|---|
| `MEDICAL_EMERGENCY` | Urgencia Médica |

### storage.state
| Value | Label |
|---|---|
| `SUCCESS` | Guardado correctamente |
| `PENDING` | Almacenamiento pendiente |
| `ERROR` | Problema de almacenamiento |

No raw enum values appear in the UI. `storage.provider`, bucket, namespace, and object key are never exposed.

---

## What Is Removed from All Previous Plan Versions

Never present in the UI:
- queue, SLA, assigned reviewer, reviewer assignment status
- notification channel, notification recipient, sent timestamp
- relative processing time
- filename
- Download or View original actions
- OCI bucket, namespace, object key, internal paths
- `priority_level` in routing_decision (it belongs in classification)
- top-level `audit_reasons` (it belongs in routing_decision)

---

## Information Hierarchy and Render Logic

Sections rendered in this order:

| # | Section | Condition |
|---|---|---|
| 1 | **Status Header** | Always |
| 2 | **Classification** | `classification !== null` |
| 3 | **Confidence Metrics** | `confidence !== null` |
| 4 | **Extracted Data** | `extracted_data !== null` |
| 5 | **Validation** | `validation !== null` |
| 6 | **Routing Decision** | Always |
| 7 | **Audit Context** | `status === "NEEDS_AUDIT"` |
| 8 | **Notification** | `notification.generated === true` |
| 9 | **Storage Status** | Always |

### Null omission rule (no placeholder cards)
- `classification === null` → omit Classification section entirely
- `confidence === null` → omit Confidence section entirely
- `extracted_data === null` → omit Extracted Data section entirely
- `validation === null` → omit Validation section entirely

The Audit Context panel (when NEEDS_AUDIT) explains why information may be absent, replacing the role of placeholder cards.

---

## Section Details

### 1. Status Header
- `document_id` (formatted display)
- Status chip with Spanish label
- Primary position; sets context for everything below

### 2. Classification Card
Rendered only when `classification !== null`.
- Document type (Spanish label)
- Specialty
- Priority level (Spanish label, with color coding: URGENT highlighted)

### 3. Confidence Metrics
Rendered only when `confidence !== null`.
- **Global confidence** as primary metric (prominent bar or ring)
- Classification confidence (secondary)
- Extraction confidence (secondary)
All displayed as percentages.

### 4. Extracted Data Panel
Rendered only when `extracted_data !== null`.
- Dynamic key-value rendering from `Record<string, unknown>`
- Keys humanized (snake_case / camelCase → readable label)
- Nested objects rendered as indented sub-rows
- Unknown types fall back to string representation

### 5. Validation Panel
Rendered only when `validation !== null`.
- If all three arrays are empty → single neutral line: "Sin hallazgos de validación"
- If any array is non-empty → render only the non-empty categories:
  - `missing_fields` → "Campos faltantes"
  - `inconsistencies` → "Inconsistencias"
  - `warnings` → "Advertencias"
- No invented statuses beyond these three.

### 6. Routing Decision Card
Always rendered.
- Primary destination (Spanish label)
- `requires_human_review` shown as boolean indicator
- `justification` rendered here (once — not duplicated in Audit Context)

### 7. Audit Context Panel
Rendered only when `status === "NEEDS_AUDIT"`.
- `routing_decision.audit_reasons` as itemized list
- `routing_decision.requires_human_review` as confirmation
- This panel explains why the document requires review and contextualizes missing information
- `justification` is NOT repeated here (it is shown in the Routing Decision card)

### 8. Notification Card
Rendered only when `notification.generated === true`.
- `notification.type` (Spanish label if mappable, else displayed as-is)
- `notification.message`

### 9. Storage Status
Always rendered.
- `storage.state` as readable Spanish label (see mapping table above)
- `storage.provider` and all internal paths never exposed

---

## Prototype State Switching

URL query parameter `?scenario=<value>`. React reads `new URLSearchParams(window.location.search).get('scenario')`. No visible toggle in the product UI.

### Scenario A — `?scenario=processed`
```typescript
{
  document_id: "DOC-2026-087431",
  status: "PROCESSED",
  classification: {
    document_type: "DISCHARGE_SUMMARY",
    specialty: "Cardiología",
    priority_level: "ROUTINE"
  },
  confidence: {
    classification: 0.94,
    extraction: 0.87,
    global: 0.91
  },
  extracted_data: {
    paciente: "Juan Martínez",
    fecha_alta: "2026-09-12",
    diagnostico_principal: "I21.0 – Infarto agudo de miocardio de pared anterior",
    medico_responsable: "Dr. Roberto Gutiérrez Vega",
    medicacion_alta: ["Ácido acetilsalicílico 100 mg/día", "Ramipril 5 mg/día", "Atorvastatina 80 mg/día"],
    indicaciones: "Reposo relativo 4 semanas. Control ambulatorio en 10 días."
  },
  validation: {
    missing_fields: [],
    inconsistencies: [],
    warnings: ["Diagnóstico secundario no codificado"]
  },
  routing_decision: {
    primary_destination: "MEDICAL_RECORD",
    requires_human_review: false,
    audit_reasons: [],
    justification: "Documento completo. Archivado en expediente del paciente."
  },
  notification: { generated: false },
  storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" }
}
```

### Scenario B — `?scenario=needs_audit_partial`
```typescript
{
  document_id: "DOC-2026-091207",
  status: "NEEDS_AUDIT",
  classification: {
    document_type: "PRESCRIPTION",
    specialty: "Neurología",
    priority_level: "URGENT"
  },
  confidence: {
    classification: 0.78,
    extraction: 0.52,
    global: 0.63
  },
  extracted_data: {
    medico_prescriptor: "Dra. Lorena Ibáñez",
    fecha_emision: "2026-09-11",
    medicamento: "Levetiracetam 500 mg"
  },
  validation: {
    missing_fields: ["dosis", "frecuencia", "firma_medica"],
    inconsistencies: [],
    warnings: ["Número de cédula profesional ilegible"]
  },
  routing_decision: {
    primary_destination: "HUMAN_REVIEW",
    requires_human_review: true,
    audit_reasons: ["MISSING_CRITICAL_FIELDS", "LOW_CONFIDENCE"],
    justification: "El documento contiene información incompleta que impide el procesamiento automático."
  },
  notification: { generated: false },
  storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" }
}
```

### Scenario C — `?scenario=needs_audit_empty`
```typescript
{
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
    justification: "El servicio de análisis no respondió dentro del tiempo configurado."
  },
  notification: { generated: false },
  storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" }
}
```

In scenario C, only Status Header, Routing Decision, Audit Context, and Storage Status are visible.

### Scenario D — `?scenario=processed_urgent`
```typescript
{
  document_id: "DOC-2026-094112",
  status: "PROCESSED",
  classification: {
    document_type: "PROCEDURE_ORDER",
    specialty: "Cirugía Cardiovascular",
    priority_level: "URGENT"
  },
  confidence: {
    classification: 0.96,
    extraction: 0.91,
    global: 0.93
  },
  extracted_data: {
    paciente: "Elena Ramos Villanueva",
    procedimiento: "Cateterismo cardíaco de urgencia",
    medico_solicitante: "Dr. Héctor Paredes Nieto",
    fecha_solicitud: "2026-09-29",
    prioridad_clinica: "Inmediata"
  },
  validation: {
    missing_fields: [],
    inconsistencies: [],
    warnings: []
  },
  routing_decision: {
    primary_destination: "MEDICAL_EMERGENCY",
    requires_human_review: false,
    audit_reasons: [],
    justification: "Orden de procedimiento urgente derivada a urgencias médicas para atención inmediata."
  },
  notification: {
    generated: true,
    type: "MEDICAL_EMERGENCY",
    message: "Se ha generado una alerta de urgencia médica para el documento DOC-2026-094112. El equipo de Urgencias ha sido notificado."
  },
  storage: { provider: "OCI_OBJECT_STORAGE", state: "SUCCESS" }
}
```

Scenario D exists only to exercise the Notification card in the prototype. It does not introduce a new product status.

---

## Component File Plan

```
src/
  App.tsx                           — mounts Shell + ProcessingResult; reads ?scenario param
  components/
    Shell.tsx                       — sidebar (light), topbar, breadcrumb per design
    ProcessingResult.tsx            — orchestrator; selects scenario; composes sections
    StatusHeader.tsx                — document_id + status chip
    ClassificationCard.tsx          — conditional; document_type + specialty + priority_level
    ConfidenceMetrics.tsx           — conditional; global (primary) + classification + extraction
    ExtractedDataPanel.tsx          — conditional; dynamic key-value from Record<string, unknown>
    ValidationPanel.tsx             — conditional; three arrays; "Sin hallazgos" when all empty
    RoutingDecisionCard.tsx         — always; destination + requires_human_review + justification
    AuditContextPanel.tsx           — NEEDS_AUDIT only; audit_reasons list
    NotificationCard.tsx            — conditional on notification.generated === true
    StorageStatus.tsx               — always; state-based Spanish label; no internal paths
  data/
    scenarios.ts                    — three typed ProcessingResult objects
  utils/
    labels.ts                       — all enum → Spanish label mapping functions
    humanizeKey.ts                  — snake_case/camelCase key humanizer for extracted_data
```

---

## Verification

1. `?scenario=processed` → Status Header, Classification (with specialty), Confidence, Extracted Data, Validation ("Advertencias" only), Routing Decision, Storage visible. Audit Context and Notification absent.
2. `?scenario=needs_audit_partial` → Status Header, Classification, Confidence, Extracted Data, Validation ("Campos faltantes" + "Advertencias"), Routing Decision, Audit Context (audit_reasons as Spanish enum labels), Storage visible. Notification absent (generated: false).
3. `?scenario=needs_audit_empty` → Only Status Header, Routing Decision, Audit Context ("AI_TIMEOUT" → "Tiempo de espera agotado"), Storage visible. No empty cards for null sections.
4. `?scenario=processed_urgent` → All sections visible. Notification card present (type: MEDICAL_EMERGENCY → "Urgencia Médica"). URGENT priority highlighted in Classification.
5. `routing_decision.justification` appears only in Routing Decision card — never duplicated in Audit Context.
6. `audit_reasons` renders Spanish enum labels only — no raw values, no free text.
7. `classification.specialty === null` → specialty row omitted from Classification card.
8. No OCI bucket, namespace, or object key text anywhere in rendered output.
9. No raw enum values in UI — all resolved through `labels.ts`.
10. Shell matches extracted MediFlow design: light sidebar, Procesamiento active, breadcrumb `MediFlow / Procesamiento / Resultado`.
11. `storage.state` drives the label — ERROR → "Problema de almacenamiento", PENDING → "Almacenamiento pendiente".
