import { statusLabel } from '../utils/labels';
import type { ProcessingResult } from '../types';

interface Props {
  document_id: string;
  status: ProcessingResult['status'];
}

const chipStyles: Record<ProcessingResult['status'], string> = {
  PROCESSED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  NEEDS_AUDIT: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const chipDot: Record<ProcessingResult['status'], string> = {
  PROCESSED: 'bg-emerald-500',
  NEEDS_AUDIT: 'bg-amber-500',
};

export function StatusHeader({ document_id, status }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Identificador de documento
        </p>
        <p className="text-lg font-semibold text-slate-900 font-mono tracking-tight">
          {document_id}
        </p>
      </div>
      <span
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold shrink-0',
          chipStyles[status],
        ].join(' ')}
      >
        <span className={['w-1.5 h-1.5 rounded-full', chipDot[status]].join(' ')} />
        {statusLabel(status)}
      </span>
    </div>
  );
}
