import { scenarios } from './scenarios';

export interface DocumentPreviewField {
  label: string;
  value: string | string[];
  muted?: boolean;
}

export interface DocumentPreviewFixture {
  title: string;
  organization?: string;
  organizationDetail?: string;
  fields: DocumentPreviewField[];
  footerFields?: DocumentPreviewField[];
  continuationFields?: DocumentPreviewField[];
}

export const prescriptionDocumentPreview: DocumentPreviewFixture = {
  title: 'Receta Médica',
  organization: 'CLÍNICA NEUROLÓGICA SAN RAFAEL',
  organizationDetail: 'Cédula Jurídica 3-001-427831 · Tel. 2200-0000',
  fields: [
    { label: 'Médico', value: 'Dra. Lorena Ibáñez' },
    { label: 'Fecha', value: '11 de septiembre de 2026' },
    { label: 'Medicamento', value: 'Levetiracetam 500 mg' },
    { label: 'Dosis', value: '— no legible —', muted: true },
    { label: 'Frecuencia', value: '— no indicada —', muted: true },
  ],
  footerFields: [
    { label: 'Firma', value: '— ilegible —', muted: true },
    { label: 'Cédula prof.', value: '— ilegible —', muted: true },
  ],
  continuationFields: [
    { label: 'Indicaciones', value: '— sección dañada —', muted: true },
    { label: 'Diagnóstico', value: '— ilegible —', muted: true },
  ],
};

const processedData = scenarios.processed.extracted_data!;
const urgentData = scenarios.processed_urgent.extracted_data!;

export const resultDocumentPreviews: Record<string, DocumentPreviewFixture> = {
  'DOC-2026-087431': {
    title: 'Resumen de Alta',
    fields: [
      { label: 'Paciente', value: String(processedData.paciente) },
      { label: 'Fecha de alta', value: String(processedData.fecha_alta) },
      { label: 'Diagnóstico principal', value: String(processedData.diagnostico_principal) },
      { label: 'Médico responsable', value: String(processedData.medico_responsable) },
      {
        label: 'Medicación al alta',
        value: (processedData.medicacion_alta as unknown[]).map(String),
      },
      { label: 'Indicaciones', value: String(processedData.indicaciones) },
    ],
  },
  'DOC-2026-094112': {
    title: 'Orden de Procedimiento',
    fields: [
      { label: 'Paciente', value: String(urgentData.paciente) },
      { label: 'Procedimiento', value: String(urgentData.procedimiento) },
      { label: 'Médico solicitante', value: String(urgentData.medico_solicitante) },
      { label: 'Fecha de solicitud', value: String(urgentData.fecha_solicitud) },
      { label: 'Prioridad clínica', value: String(urgentData.prioridad_clinica) },
    ],
  },
  'DOC-2026-091207': prescriptionDocumentPreview,
  'DOC-2026-093845': {
    title: 'Documento clínico no clasificable',
    fields: [
      { label: 'Contenido', value: '— no legible —', muted: true },
    ],
    continuationFields: [
      { label: 'Contenido', value: '— documento de baja legibilidad —', muted: true },
    ],
  },
};
