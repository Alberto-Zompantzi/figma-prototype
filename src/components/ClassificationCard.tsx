import { documentTypeLabel, priorityLabel } from '../utils/labels';
import type { Classification } from '../types';

interface Props {
  classification: Classification;
}

export function ClassificationCard({ classification }: Props) {
  const isUrgent = classification.priority_level === 'URGENT';

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Clasificación
        </h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <Row label="Tipo de documento" value={documentTypeLabel(classification.document_type)} />
        {classification.specialty !== null && (
          <Row label="Especialidad" value={classification.specialty} />
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12.5px] text-slate-500">Prioridad</span>
          <span
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border',
              isUrgent
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-50 text-slate-600 border-slate-200',
            ].join(' ')}
          >
            {isUrgent && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {priorityLabel(classification.priority_level)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[12.5px] text-slate-500 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
