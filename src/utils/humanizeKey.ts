const keyLabels: Record<string, string> = {
  paciente: 'Paciente',
  fecha_alta: 'Fecha de alta',
  diagnostico_principal: 'Diagnóstico principal',
  medico_responsable: 'Médico responsable',
  medicacion_alta: 'Medicación al alta',
  indicaciones: 'Indicaciones',
  medico_prescriptor: 'Médico prescriptor',
  fecha_emision: 'Fecha de emisión',
  medicamento: 'Medicamento',
  procedimiento: 'Procedimiento',
  medico_solicitante: 'Médico solicitante',
  fecha_solicitud: 'Fecha de solicitud',
  prioridad_clinica: 'Prioridad clínica',
  medico: 'Médico',
  fecha: 'Fecha',
  dosis: 'Dosis',
  frecuencia: 'Frecuencia',
  firma: 'Firma',
  firma_medica: 'Firma médica',
  cedula_profesional: 'Cédula profesional',
};

export function humanizeKey(key: string): string {
  if (keyLabels[key]) return keyLabels[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}
