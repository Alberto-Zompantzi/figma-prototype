import type { AuditQueueItem } from '../data/auditQueue';
import { auditReasonLabel } from '../utils/labels';
import type { AuditReason } from '../types';
import { usePendingAuditQueue } from '../state/auditQueueSession';
import { UploadEmptyStateIllustration } from './ProcessingView';

// ── Date formatting ──────────────────────────────────────────────────────────
function formatQueueDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es-CR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Icons ────────────────────────────────────────────────────────────────────
function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Audit reason ─────────────────────────────────────────────────────────────
function ReasonItem({ reason }: { reason: AuditReason }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-start gap-1.5">
      <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#FF6B35]" />
      <span className="font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
        {auditReasonLabel(reason)}
      </span>
    </span>
  );
}

// ── Queue row ────────────────────────────────────────────────────────────────
function QueueRow({ item }: { item: AuditQueueItem }) {
  const href = `?view=audit-review&scenario=${item.scenario_key}&document=${item.document_id}`;

  return (
    <a
      href={href}
      className={[
        'group block rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-3.5',
        'transition-colors hover:bg-[#FAFAFA]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6ef2] focus-visible:ring-offset-2',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        {/* Type icon */}
        <div className="flex shrink-0 items-center justify-center pt-0.5 text-[#737373]">
          {item.input_type === 'file' ? <FileIcon /> : <TextIcon />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Desktop: single row with identity left, date+action right */}
          {/* Mobile: stacks naturally via flex-col */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">

            {/* Identity block */}
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-medium leading-5 text-[#1A1A1A]">
                {item.document_id}
              </p>
              <p className="mt-0.5 truncate font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
                {item.input_type === 'file' && item.file_name
                  ? item.file_name
                  : 'Texto'}
              </p>
            </div>

            {/* Date + action */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1.5 shrink-0">
              <span className="whitespace-nowrap font-jakarta text-xs font-normal leading-[18px] text-[#A9A9A9]">
                {formatQueueDate(item.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] bg-transparent px-2 py-1 font-jakarta text-[13px] font-medium leading-[18px] text-[#1A5FD0] transition-colors group-hover:bg-[#EEF4FF]">
                Revisar documento
                <ChevronRight />
              </span>
            </div>
          </div>

          {/* Bottom: document type + audit reasons */}
          <div className="mt-2.5 flex flex-wrap items-start gap-x-3 gap-y-1.5">
            <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
              {item.document_type ?? 'Sin clasificar'}
            </span>

            {item.audit_reasons.map(reason => (
              <ReasonItem key={reason} reason={reason} />
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <UploadEmptyStateIllustration />
      <p className="mt-2 font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
        No hay documentos pendientes
      </p>
      <p className="mt-1 font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
        Los documentos que requieran revisión humana aparecerán aquí.
      </p>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
export function AuditQueueView() {
  const items = usePendingAuditQueue();
  const count = items.length;

  return (
    <div className="min-h-full bg-[#FAFAFA] px-4 pb-10 text-[#1A1A1A] sm:px-7">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Page header */}
        <header className="flex h-[72px] flex-col justify-center border-b border-[#E5E5E5]">
          <h1 className="font-jakarta text-xl font-semibold leading-7 text-[#1A1A1A]">
            Auditoría de documentos
          </h1>
          <p className="mt-1 max-w-4xl font-jakarta text-xs font-normal leading-5 text-[#737373]">
            Revise los documentos derivados a revisión humana por baja confianza,
            ambigüedad, inconsistencias o condiciones técnicas.
          </p>
        </header>

        {/* Pending queue metadata */}
        {count > 0 && (
          <div className="flex h-12 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
            <span className="font-jakarta text-[13px] font-medium leading-5 text-[#1A1A1A]">
              {count} {count === 1 ? 'documento pendiente' : 'documentos pendientes'}
            </span>
          </div>
        )}

        {/* Queue list */}
        <div className="max-w-[1140px]">
          {count === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <QueueRow key={item.document_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
