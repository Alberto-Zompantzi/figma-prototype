import { useState, useRef, useEffect, useId, useCallback, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { scenarios } from '../data/scenarios';
import { auditQueue } from '../data/auditQueue';
import { resultDocumentPreviews } from '../data/documentPreviewFixtures';
import { auditReviewScenarios } from '../data/auditReviewScenarios';
import { auditReasonLabel } from '../utils/labels';
import { humanizeKey } from '../utils/humanizeKey';
import type { AuditReason, Classification, DocumentResult, RoutingDecision } from '../types';
import { DocumentViewer } from './ProcessingView';
import { refreshAuditQueue } from '../state/auditQueueSession';
import { getInitialDocumentResult } from '../data/currentDocumentResults';
import { recordReview } from '../state/reviewSession';

// ─────────────────────────────────────────────────────────────────────────────
// Reason chip
// ─────────────────────────────────────────────────────────────────────────────

function ReviewReason({ reason }: { reason: AuditReason }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
      <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
        {auditReasonLabel(reason)}
      </span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Doc ID block
// ─────────────────────────────────────────────────────────────────────────────

function DocIdBlock({ document_id }: { document_id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(document_id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#EEEEEE] bg-white px-5 py-4">
      <span className="shrink-0 font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
        Documento
      </span>
      <span className="font-mono whitespace-nowrap font-medium leading-[18px] text-[#1A1A1A]">
        {document_id}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className={[
          'flex shrink-0 items-center gap-1.5 rounded-[6px] border-0 bg-transparent px-2 py-1.5',
          'font-jakarta text-xs font-medium leading-[18px] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
          copied
            ? 'text-[#0B7573]'
            : 'text-[#1A5FD0] hover:bg-[#EEF4FF]',
        ].join(' ')}
      >
        <Copy aria-hidden="true" size={15} strokeWidth={1.25} />
        <span className="whitespace-nowrap">{copied ? 'Copiado' : 'Copiar ID'}</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text source preview
// ─────────────────────────────────────────────────────────────────────────────

function TextDocumentPreview({ content }: { content: string }) {
  return (
    <div className="h-full overflow-y-auto bg-white px-6 py-7 sm:px-10 sm:py-9">
      <p className="max-w-4xl whitespace-pre-line font-jakarta text-sm leading-7 text-[#374151]">
        {content}
      </p>
    </div>
  );
}

function isImageFileName(name: string | null): boolean {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject confirmation dialog
// ─────────────────────────────────────────────────────────────────────────────

function RejectDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Trap focus within dialog
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => { prev?.focus(); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,27,60,0.35)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
    >
      <div
        className="bg-white rounded-[12px] border border-[#dce4ee] px-7 py-6 w-full max-w-sm"
        style={{ boxShadow: '0 8px 32px 0 rgba(15,27,60,0.18)' }}
      >
        <h2
          id="reject-dialog-title"
          className="font-jakarta font-semibold not-italic text-[#0f1b3c]"
          style={{ fontSize: 17, lineHeight: '24px' }}
        >
          Rechazar documento
        </h2>
        <p
          className="font-jakarta font-normal not-italic text-[#4a597a] mt-2"
          style={{ fontSize: 14, lineHeight: '21px' }}
        >
          Esta acción registrará el documento como rechazado. ¿Desea continuar?
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-[7px] px-4 py-2.5 border border-[#c8d4e6] bg-white text-[#4a597a] hover:border-[#808ca6] hover:text-[#0f1b3c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6ef2] focus-visible:ring-offset-2"
            style={{ fontSize: 14 }}
          >
            <span className="font-jakarta font-medium not-italic">Cancelar</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[7px] px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            style={{ fontSize: 14 }}
          >
            <span className="font-jakarta font-semibold not-italic">Confirmar rechazo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsaved-changes confirm
// ─────────────────────────────────────────────────────────────────────────────

function UnsavedDialog({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,27,60,0.30)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-[12px] border border-[#dce4ee] px-7 py-6 w-full max-w-sm"
        style={{ boxShadow: '0 8px 32px 0 rgba(15,27,60,0.18)' }}
      >
        <h2
          className="font-jakarta font-semibold not-italic text-[#0f1b3c]"
          style={{ fontSize: 17, lineHeight: '24px' }}
        >
          Cambios sin guardar
        </h2>
        <p
          className="font-jakarta font-normal not-italic text-[#4a597a] mt-2"
          style={{ fontSize: 14, lineHeight: '21px' }}
        >
          Se realizaron modificaciones que no han sido registradas. ¿Desea salir de todas formas?
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onStay}
            autoFocus
            className="rounded-[7px] px-4 py-2.5 border border-[#c8d4e6] bg-white text-[#4a597a] hover:border-[#808ca6] hover:text-[#0f1b3c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6ef2] focus-visible:ring-offset-2"
            style={{ fontSize: 14 }}
          >
            <span className="font-jakarta font-medium not-italic">Continuar editando</span>
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-[7px] px-4 py-2.5 bg-[#1e6ef2] text-white hover:bg-[#1660d8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6ef2] focus-visible:ring-offset-2"
            style={{ fontSize: 14 }}
          >
            <span className="font-jakarta font-medium not-italic">Salir sin registrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form field components
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  label,
  required,
  refined = false,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  refined?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={[
        'flex cursor-default gap-0.5 font-jakarta font-medium',
        refined ? 'text-[#1A1A1A]' : 'text-[#0f1b3c]',
      ].join(' ')}
      style={{ fontSize: 13, lineHeight: '20px' }}
    >
      {label}
      {required && <span className={refined ? 'text-[#FF6B35]' : 'text-[#d62d2d]'}> *</span>}
    </label>
  );
}

function TextInput({
  id, value, onChange, placeholder, disabled, hasError, refined = false, missingOrigin = false, ariaDescription,
}: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; hasError?: boolean; refined?: boolean; missingOrigin?: boolean; ariaDescription?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-description={ariaDescription}
      className={[
        'w-full border bg-white px-3 font-jakarta font-normal transition-colors focus:outline-none',
        refined
          ? [
              'rounded-[8px] text-[#1A1A1A] hover:border-[#A9A9A9] focus:ring-2 focus:ring-[rgba(26,95,208,0.10)]',
              missingOrigin ? 'placeholder:text-[#A9A9A9]' : 'placeholder:text-[#737373]',
            ].join(' ')
          : 'rounded-[7px] text-[#0f1b3c] placeholder:text-[#808ca6] focus:ring-1',
        hasError
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400'
          : refined
            ? 'border-[#D9D9D9] focus:border-[#1A5FD0]'
            : 'border-[#afc2db] focus:border-[#1e6ef2] focus:ring-[#1e6ef2]',
        disabled
          ? refined
            ? 'cursor-not-allowed border-[#E5E5E5] bg-[#FAFAFA] text-[#737373]'
            : 'cursor-not-allowed opacity-60'
          : '',
      ].join(' ')}
      style={{ height: 40, fontSize: refined ? 13 : 13.5 }}
    />
  );
}

function SelectInput<Value extends string>({
  id, value, onChange, options, disabled, hasError, refined = false,
}: {
  id?: string;
  value: Value | '';
  onChange: (v: Value | '') => void;
  options: { value: Value; label: string }[];
  disabled?: boolean;
  hasError?: boolean;
  refined?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(options.find(option => option.value === e.target.value)?.value ?? '')}
      disabled={disabled}
      className={[
        'w-full appearance-none border bg-white px-3 font-jakarta font-normal transition-colors focus:outline-none',
        refined
          ? 'rounded-[8px] hover:border-[#A9A9A9] focus:ring-2 focus:ring-[rgba(26,95,208,0.10)]'
          : 'rounded-[7px] focus:ring-1',
        hasError
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400'
          : refined
            ? 'border-[#D9D9D9] focus:border-[#1A5FD0]'
            : 'border-[#afc2db] focus:border-[#1e6ef2] focus:ring-[#1e6ef2]',
        value === '' ? 'text-[#808ca6]' : refined ? 'text-[#1A1A1A]' : 'text-[#0f1b3c]',
        disabled
          ? refined
            ? 'cursor-not-allowed border-[#E5E5E5] bg-[#FAFAFA] text-[#737373]'
            : 'cursor-not-allowed opacity-60'
          : 'cursor-pointer',
      ].join(' ')}
      style={{
        height: 40, fontSize: refined ? 13 : 13.5,
        backgroundImage: refined
          ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23808ca6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 36,
      }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ReviewModule({
  title,
  meta,
  children,
  bodyClassName = 'p-6',
  id,
  refined = false,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  id?: string;
  refined?: boolean;
}) {
  return (
    <section
      id={id}
      className={[
        'scroll-mt-[52px] overflow-hidden border bg-white',
        refined
          ? 'rounded-[8px] border-[#E5E5E5] shadow-none'
          : 'rounded-[12px] border-[#dce4ee] shadow-[0_2px_8px_rgba(31,46,71,0.04)]',
      ].join(' ')}
    >
      <div className={[
        'flex flex-wrap items-center gap-x-3 gap-y-1 border-b',
        refined ? 'border-[#E5E5E5] px-5 py-3' : 'h-11 border-[#e7edf5] px-6',
      ].join(' ')}>
        <h2 className={[
          'font-jakarta',
          refined
            ? 'text-sm font-medium leading-[22px] text-[#1A1A1A]'
            : 'text-[11px] font-semibold uppercase tracking-[0.13em] text-[#5a698b]',
        ].join(' ')}>
          {title}
        </h2>
        {meta}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action feedback banner
// ─────────────────────────────────────────────────────────────────────────────

function ActionBanner({ action }: { action: 'approved' | 'rejected' }) {
  const isApproved = action === 'approved';
  return (
    <div className={[
      'flex items-start gap-3 rounded-[10px] px-4 py-4 border',
      isApproved
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-[#f4f8fd] border-[#dce4ee]',
    ].join(' ')}>
      <svg
        className={isApproved ? 'text-emerald-500 shrink-0 mt-0.5' : 'text-[#5a698b] shrink-0 mt-0.5'}
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        {isApproved
          ? <polyline points="20 6 9 17 4 12" />
          : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
        }
      </svg>
      <div>
        <p className={[
          'font-jakarta font-semibold not-italic',
          isApproved ? 'text-emerald-700' : 'text-[#0f1b3c]',
        ].join(' ')} style={{ fontSize: 14 }}>
          {isApproved ? 'Revisión aprobada' : 'Documento rechazado'}
        </p>
        <p className="font-jakarta font-normal not-italic text-[#4a597a] mt-0.5" style={{ fontSize: 13 }}>
          Redirigiendo al resultado…
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Extracted fields config
// ─────────────────────────────────────────────────────────────────────────────

interface ExtractedField {
  key: string;
  label: string;
  required: boolean;
  initialValue: string;
}

function getExtractedFields(
  scenarioKey: string,
  extractedData: Record<string, unknown> | null,
): ExtractedField[] {
  const data = extractedData ?? {};
  const value = (...keys: string[]) => {
    const key = keys.find(candidate => data[candidate] !== undefined && data[candidate] !== null);
    return key ? String(data[key]) : '';
  };

  if (scenarioKey === 'needs_audit_partial') {
    return [
      { key: 'medico_prescriptor', label: 'Médico prescriptor', required: false, initialValue: value('medico_prescriptor', 'medico') },
      { key: 'fecha_emision',      label: 'Fecha de emisión',   required: false, initialValue: value('fecha_emision', 'fecha') },
      { key: 'medicamento',        label: 'Medicamento',        required: false, initialValue: value('medicamento') },
      { key: 'dosis',              label: 'Dosis',              required: false, initialValue: value('dosis') },
      { key: 'frecuencia',         label: 'Frecuencia',         required: false, initialValue: value('frecuencia') },
      { key: 'firma_medica',       label: 'Firma médica',       required: false, initialValue: value('firma_medica', 'firma') },
    ];
  }
  return [
    { key: 'paciente',           label: 'Paciente',                required: false, initialValue: value('paciente') },
    { key: 'fecha_documento',    label: 'Fecha del documento',     required: false, initialValue: value('fecha_documento', 'fecha') },
    { key: 'medico_responsable', label: 'Médico responsable',      required: false, initialValue: value('medico_responsable', 'medico') },
    { key: 'diagnostico',        label: 'Diagnóstico / contenido', required: false, initialValue: value('diagnostico', 'diagnostico_principal') },
    { key: 'indicaciones',       label: 'Indicaciones',            required: false, initialValue: value('indicaciones') },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS: { value: Classification['document_type']; label: string }[] = [
  { value: 'PRESCRIPTION',       label: 'Receta médica' },
  { value: 'IMAGING_REPORT',     label: 'Informe de imagen' },
  { value: 'STUDY_REPORT',       label: 'Informe de estudio' },
  { value: 'PROCEDURE_ORDER',    label: 'Orden de procedimiento' },
  { value: 'DISCHARGE_SUMMARY',  label: 'Resumen de alta' },
  { value: 'MEDICAL_CERTIFICATE',label: 'Certificado médico' },
];

const PRIORITY_OPTIONS: { value: Classification['priority_level']; label: string }[] = [
  { value: 'ROUTINE', label: 'Rutinaria' },
  { value: 'URGENT',  label: 'Urgente' },
];

const DESTINATION_OPTIONS: { value: RoutingDecision['primary_destination']; label: string }[] = [
  { value: 'MEDICAL_EMERGENCY',   label: 'Emergencias Médicas' },
  { value: 'PHARMACY',            label: 'Farmacia' },
  { value: 'AUTHORIZATION_AUDIT', label: 'Auditoría de Autorizaciones' },
  { value: 'MEDICAL_RECORD',      label: 'Expediente Clínico' },
  { value: 'HUMAN_REVIEW',        label: 'Revisión Humana' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

const reviewOnlyScenarioLookup: Partial<typeof auditReviewScenarios> = auditReviewScenarios;

export function AuditReviewView({ scenarioKey }: { scenarioKey: string }) {
  const reviewOnlyScenario = reviewOnlyScenarioLookup[scenarioKey];
  const result = reviewOnlyScenario ?? scenarios[scenarioKey] ?? scenarios.needs_audit_partial;
  const requestedDocumentId = new URLSearchParams(window.location.search).get('document');
  const queueItem =
    auditQueue.find(item => item.document_id === requestedDocumentId) ??
    auditQueue.find(item => item.scenario_key === scenarioKey) ??
    auditQueue[0];

  // ── Classification ──
  const reviewOnlyClassification = reviewOnlyScenario?.initial_classification;
  const initialDocType  =
    reviewOnlyClassification?.document_type ?? result.classification?.document_type ?? '';
  const initialPriority =
    reviewOnlyClassification?.priority_level ?? result.classification?.priority_level ?? '';
  const initialSpecialty =
    reviewOnlyClassification?.specialty ?? result.classification?.specialty ?? '';

  const [docType,   setDocType]   = useState<Classification['document_type'] | ''>(initialDocType);
  const [priority,  setPriority]  = useState<Classification['priority_level'] | ''>(initialPriority);
  const [specialty, setSpecialty] = useState<string>(initialSpecialty);

  // ── Extracted fields ──
  const extractedFields = useMemo(
    () => getExtractedFields(scenarioKey, result.extracted_data),
    [scenarioKey, result.extracted_data],
  );
  const initialFieldValues = useMemo(
    () => Object.fromEntries(extractedFields.map(f => [f.key, f.initialValue])),
    [extractedFields],
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => ({ ...initialFieldValues }));

  // ── Destination ──
  const initialDestination = result.routing_decision.primary_destination;
  const [destination, setDestination] = useState<RoutingDecision['primary_destination'] | ''>(initialDestination);

  // ── Final human-reviewed validation ──
  type ValidationGroupKey = 'missing_fields' | 'inconsistencies' | 'warnings';
  const initialValidationValues = useMemo<Record<ValidationGroupKey, string[]>>(() => ({
    missing_fields: [...(result.validation?.missing_fields ?? [])],
    inconsistencies: [...(result.validation?.inconsistencies ?? [])],
    warnings: [...(result.validation?.warnings ?? [])],
  }), [result.validation]);
  const originalMissingFields = new Set(result.validation?.missing_fields ?? []);
  const [validationValues, setValidationValues] = useState<Record<ValidationGroupKey, string[]>>(
    () => initialValidationValues,
  );
  const [validationDrafts, setValidationDrafts] = useState<Record<ValidationGroupKey, string>>({
    missing_fields: '',
    inconsistencies: '',
    warnings: '',
  });
  const [validationConfirmed, setValidationConfirmed] = useState(false);
  const [activeReviewSection, setActiveReviewSection] = useState('review-classification');
  const reviewScrollBodyRef = useRef<HTMLDivElement>(null);

  const relevantContentChanged =
    docType !== initialDocType ||
    priority !== initialPriority ||
    specialty !== initialSpecialty ||
    destination !== initialDestination ||
    extractedFields.some(field => (fieldValues[field.key] ?? '') !== field.initialValue);

  const validationConfirmationRequired = result.validation === null || relevantContentChanged;

  // ── Dirty state (for cancel warning) ──
  const isDirty = useCallback(() => {
    if (docType !== initialDocType) return true;
    if (priority !== initialPriority) return true;
    if (specialty !== initialSpecialty) return true;
    if (destination !== initialDestination) return true;
    for (const f of extractedFields) {
      if ((fieldValues[f.key] ?? '') !== f.initialValue) return true;
    }
    if (JSON.stringify(validationValues) !== JSON.stringify(initialValidationValues)) return true;
    if (validationConfirmed) return true;
    return false;
  }, [
    docType,
    priority,
    specialty,
    destination,
    fieldValues,
    validationValues,
    validationConfirmed,
    initialDocType,
    initialPriority,
    initialSpecialty,
    initialDestination,
    extractedFields,
    initialValidationValues,
  ]);

  // ── Can approve ──
  const hasValidExtractedData =
    typeof fieldValues === 'object' &&
    fieldValues !== null &&
    !Array.isArray(fieldValues);

  const approvalRequirementsMet =
    docType !== '' &&
    priority !== '' &&
    hasValidExtractedData &&
    destination !== '' &&
    destination !== 'HUMAN_REVIEW';

  const validationReady = !validationConfirmationRequired || validationConfirmed;
  const canApprove = approvalRequirementsMet && validationReady;

  const addValidationItem = (group: ValidationGroupKey) => {
    const value = validationDrafts[group].trim();
    if (!value || committed) return;
    setValidationValues(previous => ({
      ...previous,
      [group]: [...previous[group], value],
    }));
    setValidationDrafts(previous => ({ ...previous, [group]: '' }));
    setValidationConfirmed(false);
  };

  const removeValidationItem = (group: ValidationGroupKey, index: number) => {
    if (committed) return;
    setValidationValues(previous => ({
      ...previous,
      [group]: previous[group].filter((_, itemIndex) => itemIndex !== index),
    }));
    setValidationConfirmed(false);
  };

  const auditReasons = result.routing_decision.audit_reasons;

  // ── Action state ──
  type FormState = 'idle' | 'approved' | 'rejected';
  const [formState, setFormState] = useState<FormState>('idle');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const committed = formState !== 'idle';
  const navigateToAudit = useCallback(() => {
    history.pushState(null, '', '?view=audit');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const navigateToResult = () => {
    history.pushState(null, '', `?view=result&scenario=${encodeURIComponent(scenarioKey)}&document=${encodeURIComponent(queueItem.document_id)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const saveReview = (decision: 'APPROVE' | 'REJECT') => {
    const initialResult = getInitialDocumentResult(scenarioKey, queueItem.document_id);
    if (!initialResult) return false;
    const classificationChanged = docType !== initialDocType || priority !== initialPriority || specialty !== initialSpecialty;
    const extractionChanged = extractedFields.some(field => fieldValues[field.key] !== field.initialValue);
    const aliases: Record<string, string[]> = {
      medico_prescriptor: ['medico'], fecha_emision: ['fecha'], firma_medica: ['firma'],
      fecha_documento: ['fecha'], medico_responsable: ['medico'], diagnostico: ['diagnostico_principal'],
    };
    const effectiveData = { ...initialResult.extracted_data };
    for (const field of extractedFields) {
      if (fieldValues[field.key] === field.initialValue) continue;
      const sourceKey = [field.key, ...(aliases[field.key] ?? [])].find(key =>
        initialResult.extracted_data?.[key] !== undefined && initialResult.extracted_data[key] !== null,
      ) ?? field.key;
      effectiveData[sourceKey] = fieldValues[field.key];
    }
    const validationChanged = JSON.stringify(validationValues) !== JSON.stringify(initialValidationValues);
    const finalResult: DocumentResult = {
      ...initialResult,
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      // An incomplete rejected draft cannot manufacture a canonical classification.
      classification: docType !== '' && priority !== '' && (decision === 'APPROVE' || classificationChanged)
        ? { document_type: docType, specialty: specialty || null, priority_level: priority }
        : initialResult.classification,
      confidence: relevantContentChanged ? null : initialResult.confidence,
      extracted_data: decision === 'APPROVE' || extractionChanged ? effectiveData : initialResult.extracted_data,
      validation: decision === 'APPROVE' || validationChanged || validationConfirmed ? validationValues : initialResult.validation,
      routing_decision: {
        ...initialResult.routing_decision,
        primary_destination: destination || initialResult.routing_decision.primary_destination,
        requires_human_review: false,
        justification: decision === 'APPROVE'
          ? 'Destino confirmado durante la revisión humana.'
          : 'Documento rechazado durante la revisión humana.',
      },
    };
    recordReview(scenarioKey, initialResult, finalResult, decision);
    refreshAuditQueue();
    return true;
  };

  const handleApprove = () => {
    if (!canApprove || committed) return;
    if (!saveReview('APPROVE')) return;
    setFormState('approved');
    timerRef.current = setTimeout(navigateToResult, 2200);
  };

  const handleRejectRequest = () => {
    if (committed) return;
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (committed || !saveReview('REJECT')) return;
    setShowRejectDialog(false);
    setFormState('rejected');
    timerRef.current = setTimeout(navigateToResult, 2200);
  };

  const handleCancel = () => {
    if (isDirty()) {
      setShowUnsavedDialog(true);
    } else {
      navigateToAudit();
    }
  };

  // ── IDs ──
  const docTypeId   = useId();
  const specialtyId = useId();
  const priorityId  = useId();
  const destId      = useId();

  // ── Preview type ──
  const previewType: 'pdf' | 'image' | 'text' =
    queueItem?.input_type === 'file'
      ? (isImageFileName(queueItem.file_name) ? 'image' : 'pdf')
      : 'text';
  const sourceReference = previewType === 'text' ? 'Texto ingresado' : queueItem.file_name;
  const sourceFile = useMemo(() => {
    const name = queueItem.file_name ?? `${result.document_id}.txt`;
    const type = previewType === 'image'
      ? 'image/png'
      : previewType === 'pdf'
        ? 'application/pdf'
        : 'text/plain';
    return new File([], name, { type });
  }, [previewType, queueItem.file_name, result.document_id]);
  const documentPreview = resultDocumentPreviews[result.document_id];
  const textSource = documentPreview
    ? documentPreview.fields.map(field => {
        const value = Array.isArray(field.value) ? field.value.join('\n') : field.value;
        return `${field.label}: ${value}`;
      }).join('\n')
    : 'Contenido: — no legible —';

  useEffect(() => {
    const root = reviewScrollBodyRef.current;
    if (!root) return;

    const sectionIds = [
      'review-classification',
      'review-extracted-data',
      'review-validation',
      'review-destination',
    ];
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    let frame: number | null = null;
    const syncActiveSection = () => {
      const rootRect = root.getBoundingClientRect();
      const readingLine = rootRect.top + 52;
      const atBottom = root.scrollHeight - root.scrollTop - root.clientHeight <= 2;
      let current = sections[0].id;

      if (atBottom) {
        current = sections[sections.length - 1].id;
      } else {
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= readingLine) {
            current = section.id;
          } else {
            break;
          }
        }
      }

      setActiveReviewSection(previous => previous === current ? previous : current);
    };
    const scheduleSync = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncActiveSection);
    };

    const observer = new IntersectionObserver(scheduleSync, {
      root,
      rootMargin: '-52px 0px -55% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    sections.forEach(section => observer.observe(section));
    root.addEventListener('scroll', scheduleSync, { passive: true });
    scheduleSync();

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('scroll', scheduleSync);
    };
  }, []);

  const validationGroups: {
    key: ValidationGroupKey;
    label: string;
    emptyLabel: string;
  }[] = [
    {
      key: 'missing_fields',
      label: 'Campos faltantes',
      emptyLabel: 'Sin campos faltantes',
    },
    {
      key: 'inconsistencies',
      label: 'Inconsistencias',
      emptyLabel: 'Sin inconsistencias',
    },
    {
      key: 'warnings',
      label: 'Advertencias',
      emptyLabel: 'Sin advertencias',
    },
  ];

  return (
    <>
      {/* Dialogs */}
      {showRejectDialog && (
        <RejectDialog
          onCancel={() => setShowRejectDialog(false)}
          onConfirm={handleRejectConfirm}
        />
      )}
      {showUnsavedDialog && (
        <UnsavedDialog
          onStay={() => setShowUnsavedDialog(false)}
          onLeave={navigateToAudit}
        />
      )}

      <div className="min-h-full bg-[#FAFAFA] px-4 text-[#1A1A1A] sm:px-7 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] lg:flex lg:h-full lg:flex-col">
          <header className="mb-3 flex h-[72px] shrink-0 flex-col justify-center border-b border-[#E5E5E5]">
            <h1 className="text-xl font-semibold leading-7 text-[#1A1A1A]">Revisión clínica</h1>
            <p className="mt-1 max-w-4xl text-xs leading-5 text-[#737373]">
              Compare el documento original con la información procesada, realice las correcciones necesarias y registre una decisión.
            </p>
          </header>

          <div className="grid min-w-0 items-stretch gap-3 pb-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-0 lg:overflow-hidden">
            <div className="order-2 min-w-0 lg:min-h-0 lg:overflow-hidden lg:pl-1.5">
              <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden bg-white lg:h-full lg:min-h-0">
                <div className="flex h-8 min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[#E5E5E5] px-4">
                  <h2 className="text-sm font-medium leading-[22px] text-[#1A1A1A]">Documento</h2>
                  <span className="min-w-0 truncate text-xs font-normal text-[#A9A9A9]">
                    {sourceReference}
                  </span>
                </div>
                <div className="min-h-0 min-w-0 flex-1">
                  {previewType === 'text' ? (
                    <TextDocumentPreview content={textSource} />
                  ) : (
                    <DocumentViewer
                      file={sourceFile}
                      imageUrl={previewType === 'image' ? '/assets/audit-xray.svg' : ''}
                      previewFixture={documentPreview}
                    />
                  )}
                </div>
              </section>
            </div>

            <div className="order-1 min-w-0 lg:min-h-0 lg:overflow-hidden lg:pr-1.5">
              <section className="flex min-h-[620px] flex-col overflow-hidden bg-white lg:h-full lg:min-h-0">
                <div className="flex h-9 shrink-0 items-center border-b border-[#E5E5E5] px-3 text-sm font-medium leading-[22px] text-[#1A1A1A]">
                  Revisión
                </div>

                <div ref={reviewScrollBodyRef} className="min-h-0 flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-5 px-3 pb-5 pt-5">
                    <DocIdBlock document_id={result.document_id} />

                    <div className="-mb-1 -mt-1 rounded-[8px] border border-[rgba(255,107,53,0.35)] bg-[#FFFBF7] p-4 shadow-none">
                      <div className="flex items-center gap-2 text-[#D85A00]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span className="font-jakarta text-sm font-medium leading-[22px]">Requiere revisión</span>
                      </div>
                      {auditReasons.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {auditReasons.map(reason => <ReviewReason key={reason} reason={reason} />)}
                        </ul>
                      )}
                    </div>

                    <nav
                      aria-label="Secciones de la revisión"
                      className="sticky top-0 z-10 -mx-3 h-10 overflow-x-auto border-b border-[#E5E5E5] bg-white px-3"
                    >
                      <div className="flex h-full min-w-max items-center gap-0">
                        {[
                          ['Clasificación', 'review-classification'],
                          ['Datos extraídos', 'review-extracted-data'],
                          ['Validación', 'review-validation'],
                          ['Destino', 'review-destination'],
                        ].map(([label, target]) => (
                          <button
                            key={target}
                            type="button"
                            onClick={() => {
                              setActiveReviewSection(target);
                              document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={[
                              'relative flex h-full items-center whitespace-nowrap px-3 font-jakarta text-sm font-normal leading-[22px]',
                              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A5FD0]',
                              activeReviewSection === target
                                ? 'text-[#1A5FD0]'
                                : 'text-[#1A1A1A] hover:text-[#1A5FD0]',
                            ].join(' ')}
                          >
                            {label}
                            {activeReviewSection === target && (
                              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#1A5FD0]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </nav>

          <ReviewModule
            id="review-classification"
            title="Clasificación"
            bodyClassName="px-5 pb-5 pt-4"
            refined
          >
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={docTypeId} label="Tipo de documento" required refined />
                <SelectInput
                  id={docTypeId}
                  value={docType}
                  onChange={value => {
                    setDocType(value);
                    setValidationConfirmed(false);
                  }}
                  options={DOC_TYPE_OPTIONS}
                  disabled={committed}
                  refined
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={specialtyId} label="Especialidad" refined />
                <TextInput
                  id={specialtyId}
                  value={specialty}
                  onChange={value => {
                    setSpecialty(value);
                    setValidationConfirmed(false);
                  }}
                  placeholder="Ej. Neurología"
                  disabled={committed}
                  refined
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={priorityId} label="Prioridad" required refined />
                <SelectInput
                  id={priorityId}
                  value={priority}
                  onChange={value => {
                    setPriority(value);
                    setValidationConfirmed(false);
                  }}
                  options={PRIORITY_OPTIONS}
                  disabled={committed}
                  refined
                />
              </div>
            </div>
          </ReviewModule>

          <ReviewModule
            id="review-extracted-data"
            title="Datos extraídos"
            bodyClassName="px-5 pb-5 pt-4"
            refined
          >
            <div className="grid grid-cols-1 gap-x-[14px] gap-y-4 md:grid-cols-2">
              {extractedFields.map(field => {
                const fid = `${field.key}-input`;
                const val = fieldValues[field.key] ?? '';
                const wasMissing = originalMissingFields.has(field.key);
                return (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <FieldLabel htmlFor={fid} label={field.label} required={field.required} refined />
                    </div>
                    <div className="relative">
                      {wasMissing && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0.5 top-1/2 z-10 h-5 w-0.5 -translate-y-1/2 rounded-[1px] bg-[#FF6B35]"
                        />
                      )}
                      <TextInput
                        id={fid}
                        value={val}
                        onChange={value => {
                          setFieldValues(previous => ({ ...previous, [field.key]: value }));
                          setValidationConfirmed(false);
                        }}
                        placeholder={val === '' ? 'Sin valor' : ''}
                        disabled={committed}
                        refined
                        missingOrigin={wasMissing}
                        ariaDescription={wasMissing
                          ? 'Campo identificado como faltante en el procesamiento automático'
                          : undefined}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ReviewModule>

          <ReviewModule
            id="review-validation"
            title="Validación"
            bodyClassName="px-5 pb-5 pt-4"
            refined
          >
            <div className="divide-y divide-[#EEEEEE]">
              {validationGroups.map(group => (
                <div key={group.key} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-jakarta text-[13px] font-medium leading-5 text-[#1A1A1A]">
                    {group.label}
                  </p>

                  {validationValues[group.key].length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {validationValues[group.key].map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="flex min-h-8 items-center gap-2 rounded-[6px] border border-[#EEEEEE] bg-[#FAFAFA] px-2.5 py-1"
                        >
                          <span className="h-5 w-0.5 shrink-0 rounded-[1px] bg-[#FF6B35]" />
                          <span className="min-w-0 flex-1 break-words font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
                            {group.key === 'missing_fields' ? humanizeKey(item) : item}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeValidationItem(group.key, index)}
                            disabled={committed}
                            aria-label={`Eliminar ${item}`}
                            title="Eliminar"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-transparent text-[#737373] transition-colors hover:bg-[#EEEEEE] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 font-jakarta text-xs font-normal text-[#A9A9A9]">{group.emptyLabel}</p>
                  )}

                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      value={validationDrafts[group.key]}
                      onChange={event => setValidationDrafts(previous => ({
                        ...previous,
                        [group.key]: event.target.value,
                      }))}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addValidationItem(group.key);
                        }
                      }}
                      disabled={committed}
                      aria-label={`Agregar a ${group.label.toLowerCase()}`}
                      placeholder="Agregar observación"
                      className="h-9 min-w-0 flex-1 rounded-[8px] border border-[#D9D9D9] bg-white px-3 font-jakarta text-xs font-normal text-[#1A1A1A] outline-none transition-colors placeholder:text-[#A9A9A9] hover:border-[#A9A9A9] focus:border-[#1A5FD0] focus:ring-2 focus:ring-[rgba(26,95,208,0.10)] disabled:cursor-not-allowed disabled:border-[#E5E5E5] disabled:bg-[#FAFAFA] disabled:text-[#737373]"
                    />
                    <button
                      type="button"
                      onClick={() => addValidationItem(group.key)}
                      disabled={committed || validationDrafts[group.key].trim() === ''}
                      className="h-9 shrink-0 rounded-[8px] border border-[#D9D9D9] bg-white px-3 font-jakarta text-xs font-medium text-[#1A1A1A] transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,95,208,0.10)] disabled:cursor-not-allowed disabled:border-[#E5E5E5] disabled:bg-[#FAFAFA] disabled:text-[#A9A9A9]"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#EEEEEE] pt-3.5">
              <label className="inline-flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={validationConfirmed}
                  onChange={event => setValidationConfirmed(event.target.checked)}
                  disabled={committed}
                  className="h-4 w-4 rounded-[4px] border border-[#D9D9D9] accent-[#1A5FD0] disabled:cursor-not-allowed"
                />
                <span className="font-jakarta text-[13px] font-medium text-[#1A1A1A]">
                  Validación revisada
                </span>
              </label>
              {validationConfirmationRequired && !validationConfirmed && !committed && (
                <p className="mt-1.5 font-jakarta text-xs font-normal text-[#737373]">
                  Confirme la validación después de revisar los cambios realizados.
                </p>
              )}
            </div>
          </ReviewModule>

          <ReviewModule
            id="review-destination"
            title="Destino"
            bodyClassName="px-5 pb-5 pt-4"
            refined
          >
            <div className="max-w-xl">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={destId} label="Destino principal" required refined />
                <SelectInput
                  id={destId}
                  value={destination}
                  onChange={value => {
                    setDestination(value);
                    setValidationConfirmed(false);
                  }}
                  options={DESTINATION_OPTIONS}
                  disabled={committed}
                  refined
                />
                <p className="font-jakarta text-xs font-normal text-[#737373]">
                  {destination === 'HUMAN_REVIEW'
                    ? 'Seleccione un destino final para poder aprobar la revisión.'
                    : 'El destino se aplicará al aprobar la revisión.'}
                </p>
              </div>
            </div>
          </ReviewModule>

          {committed && <ActionBanner action={formState as 'approved' | 'rejected'} />}
                  </div>
                </div>

                <div className="z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] bg-white px-3 py-2 sm:h-14">
            {!committed && isDirty() ? (
              <p className="flex items-center gap-2 font-jakarta text-xs font-normal text-[#737373]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                Cambios sin registrar
              </p>
            ) : null}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={committed}
                onClick={handleCancel}
                className={[
                  'h-9 rounded-[8px] border-0 bg-transparent px-3 font-jakarta text-[13px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0] focus-visible:ring-offset-2',
                  committed ? 'cursor-not-allowed text-[#A9A9A9]' : 'cursor-pointer text-[#737373] hover:bg-[#FAFAFA]',
                ].join(' ')}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={committed}
                onClick={handleRejectRequest}
                className={[
                  'h-9 rounded-[8px] border px-3.5 font-jakarta text-[13px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  committed
                    ? 'cursor-not-allowed border-[#E5E5E5] text-[#A9A9A9]'
                    : 'cursor-pointer border-[#D92D20] bg-white text-[#D92D20] hover:bg-[#FFF5F4] focus-visible:ring-[#D92D20]',
                ].join(' ')}
              >
                Rechazar
              </button>
              <button
                type="button"
                disabled={!canApprove || committed}
                onClick={handleApprove}
                className={[
                  'h-9 rounded-[8px] border px-4 font-jakarta text-[13px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  (!canApprove || committed)
                    ? 'cursor-not-allowed border-[#EEF1F5] bg-[#EEF1F5] text-[#9AA3B2] focus-visible:ring-[#C7CDD6]'
                    : 'cursor-pointer border-[#1A5FD0] bg-[#1A5FD0] text-white hover:border-[#174FA9] hover:bg-[#174FA9] focus-visible:ring-[#1A5FD0]',
                ].join(' ')}
              >
                Aprobar revisión
              </button>
            </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
