import { useState } from 'react';
import { Copy } from 'lucide-react';
import { statusLabel } from '../utils/labels';
import type { ProcessingResult } from '../types';

interface Props {
  document_id: string;
  status: ProcessingResult['status'];
  metadataOnly?: boolean;
}

const chipStyles: Record<ProcessingResult['status'], string> = {
  PROCESSED: 'bg-[#EAF7F5] text-[#0B7573]',
  NEEDS_AUDIT: 'bg-[rgba(255,107,53,0.10)] text-[#D85A00]',
};

const chipDot: Record<ProcessingResult['status'], string> = {
  PROCESSED: 'bg-[#0B7573]',
  NEEDS_AUDIT: 'bg-[#FF6B35]',
};

export function ViewHeader({ document_id, status, metadataOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(document_id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const documentReference = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
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
          copied ? 'text-[#0B7573]' : 'text-[#1A5FD0] hover:bg-[#EEF4FF]',
        ].join(' ')}
      >
        <Copy aria-hidden="true" size={15} strokeWidth={1.25} />
        <span className="whitespace-nowrap">{copied ? 'Copiado' : 'Copiar ID'}</span>
      </button>
    </div>
  );

  const statusChip = (
    <span
        className={[
          'inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-full px-2.5 py-1',
          'font-jakarta text-xs font-medium',
          chipStyles[status],
        ].join(' ')}
      >
        <span className={['h-1.5 w-1.5 rounded-full', chipDot[status]].join(' ')} />
        {statusLabel(status)}
      </span>
  );

  if (metadataOnly) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEEEE] bg-white px-5 py-4">
        {documentReference}
        {statusChip}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="font-jakarta text-xl font-semibold leading-7 text-[#1A1A1A]">
          Resultado del procesamiento
        </h1>
        <p className="mt-1 font-jakarta text-xs font-normal leading-5 text-[#737373]">
          Revise la clasificación, los datos extraídos y el destino asignado al documento.
        </p>
        <div className="mt-3">{documentReference}</div>
      </div>
      {statusChip}
    </div>
  );
}
