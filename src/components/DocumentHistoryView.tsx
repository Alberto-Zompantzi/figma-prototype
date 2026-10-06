import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Clock3,
} from 'lucide-react';
import {
  getDocumentHistory,
  type DocumentHistoryEvent,
  type HistoricalStatus,
  type HistoryResultSnapshot,
} from '../data/documentHistory';
import { humanizeKey } from '../utils/humanizeKey';
import {
  auditReasonLabel,
  destinationLabel,
  documentTypeLabel,
  notificationTypeLabel,
  priorityLabel,
  statusLabel,
  storageStateLabel,
} from '../utils/labels';

export type HistoryViewState = 'ready' | 'loading' | 'error';
type SnapshotTab = 'summary' | 'json';

const statusStyles: Record<HistoricalStatus, string> = {
  PROCESSED: 'border-[#C9D8F2] bg-[#EEF4FD] text-[#1A5FD0]',
  NEEDS_AUDIT: 'border-[rgba(255,107,53,0.30)] bg-[rgba(255,107,53,0.10)] text-[#D85A00]',
  APPROVED: 'border-[rgba(11,117,115,0.25)] bg-[rgba(11,117,115,0.08)] text-[#0B7573]',
  REJECTED: 'border-[#E7C9C9] bg-[#FAEEEE] text-[#A64040]',
};

function StatusChip({ status }: { status: HistoricalStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        statusStyles[status],
      ].join(' ')}
    >
      {statusLabel(status)}
    </span>
  );
}

function formatOccurrence(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SnapshotSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'min-w-0 overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none',
        className,
      ].join(' ')}
    >
      <h3 className="border-b border-[#E5E5E5] px-4 py-2.5 text-sm font-medium leading-[22px] text-[#1A1A1A]">
        {title}
      </h3>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1 py-1.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <span className="text-xs font-normal leading-5 text-[#737373]">{label}</span>
      <div className="min-w-0 text-[13px] font-medium leading-5 text-[#1A1A1A]">
        {children}
      </div>
    </div>
  );
}

function RenderSnapshotValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index} className="flex items-start gap-2 font-normal">
            <span className="text-[#737373]">•</span>
            <span className="min-w-0 break-words">{String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-1 border-l-2 border-[#E5E5E5] pl-3">
        {Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => (
          <div key={key} className="flex min-w-0 flex-wrap gap-x-2 font-normal">
            <span className="text-[#737373]">{humanizeKey(key)}:</span>
            <span className="min-w-0 break-words">{String(nestedValue)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'boolean') return <>{value ? 'Sí' : 'No'}</>;
  return <span className="break-words font-normal">{String(value)}</span>;
}

function SnapshotSummary({ snapshot }: { snapshot: HistoryResultSnapshot }) {
  const extractedEntries = snapshot.extracted_data
    ? Object.entries(snapshot.extracted_data)
    : [];
  const validationHasContent =
    snapshot.validation !== null &&
    (snapshot.validation.missing_fields.length > 0 ||
      snapshot.validation.inconsistencies.length > 0 ||
      snapshot.validation.warnings.length > 0);
  const hasClassification = snapshot.classification !== null;
  const hasConfidence = snapshot.confidence !== null;
  const storagePresentation = {
    SUCCESS: {
      color: 'text-[#0B7573]',
      icon: CheckCircle2,
    },
    PENDING: {
      color: 'text-amber-600',
      icon: Clock3,
    },
    ERROR: {
      color: 'text-rose-600',
      icon: CircleAlert,
    },
  }[snapshot.storage.state];
  const StorageIcon = storagePresentation.icon;

  return (
    <div className="min-w-0 space-y-3">
      {(hasClassification || hasConfidence) && (
        <div className="grid min-w-0 items-start gap-3 md:grid-cols-12">
          {snapshot.classification !== null && (
            <SnapshotSection
              title="Clasificación"
              className={hasConfidence ? 'md:col-span-6' : 'md:col-span-12'}
            >
              <DetailRow label="Tipo de documento">
                {documentTypeLabel(snapshot.classification.document_type)}
              </DetailRow>
              {snapshot.classification.specialty !== null && (
                <DetailRow label="Especialidad">
                  {snapshot.classification.specialty}
                </DetailRow>
              )}
              <DetailRow label="Prioridad">
                {priorityLabel(snapshot.classification.priority_level)}
              </DetailRow>
            </SnapshotSection>
          )}

          {snapshot.confidence !== null && (
            <SnapshotSection
              title="Confianza"
              className={hasClassification ? 'md:col-span-6' : 'md:col-span-12'}
            >
              <DetailRow label="Global">
                {Math.round(snapshot.confidence.global * 100)}%
              </DetailRow>
              <DetailRow label="Clasificación">
                {Math.round(snapshot.confidence.classification * 100)}%
              </DetailRow>
              <DetailRow label="Extracción">
                {Math.round(snapshot.confidence.extraction * 100)}%
              </DetailRow>
            </SnapshotSection>
          )}
        </div>
      )}

      {extractedEntries.length > 0 && (
        <SnapshotSection title="Datos clínicos extraídos">
          <div className="divide-y divide-[#EEEEEE]">
            {extractedEntries.map(([key, value]) => (
              <DetailRow key={key} label={humanizeKey(key)}>
                <RenderSnapshotValue value={value} />
              </DetailRow>
            ))}
          </div>
        </SnapshotSection>
      )}

      <div className="grid min-w-0 items-start gap-3 md:grid-cols-12">
        {snapshot.validation !== null && (
          <SnapshotSection title="Validación" className="md:col-span-5">
            {validationHasContent ? (
              <div className="space-y-3">
                {snapshot.validation.missing_fields.length > 0 && (
                  <DetailRow label="Campos faltantes">
                    {snapshot.validation.missing_fields.map(humanizeKey).join(', ')}
                  </DetailRow>
                )}
                {snapshot.validation.inconsistencies.length > 0 && (
                  <DetailRow label="Inconsistencias">
                    {snapshot.validation.inconsistencies.join(', ')}
                  </DetailRow>
                )}
                {snapshot.validation.warnings.length > 0 && (
                  <DetailRow label="Advertencias">
                    {snapshot.validation.warnings.join(', ')}
                  </DetailRow>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#0B7573]">
                <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" />
                Sin hallazgos de validación
              </div>
            )}
          </SnapshotSection>
        )}

        <SnapshotSection
          title="Enrutamiento"
          className={snapshot.validation !== null ? 'md:col-span-7' : 'md:col-span-12'}
        >
          <DetailRow label="Destino">
            {destinationLabel(snapshot.routing_decision.primary_destination)}
          </DetailRow>
          <DetailRow label="Revisión humana">
            {snapshot.routing_decision.requires_human_review ? 'Requerida' : 'No requerida'}
          </DetailRow>
          {snapshot.routing_decision.audit_reasons.length > 0 && (
            <DetailRow label="Motivos registrados">
              <ul className="space-y-1 font-normal">
                {snapshot.routing_decision.audit_reasons.map(reason => (
                  <li key={reason}>{auditReasonLabel(reason)}</li>
                ))}
              </ul>
            </DetailRow>
          )}
          {snapshot.routing_decision.justification && (
            <DetailRow label="Justificación">
              <span className="font-normal">{snapshot.routing_decision.justification}</span>
            </DetailRow>
          )}
        </SnapshotSection>
      </div>

      {snapshot.notification.generated && (
        <SnapshotSection title="Notificación">
          {snapshot.notification.type && (
            <DetailRow label="Tipo">
              {notificationTypeLabel(snapshot.notification.type)}
            </DetailRow>
          )}
          {snapshot.notification.message && (
            <DetailRow label="Detalle">
              <span className="font-normal">{snapshot.notification.message}</span>
            </DetailRow>
          )}
        </SnapshotSection>
      )}

      <div className="border-t border-[#E5E5E5] pt-3">
        <div
          className={[
            'flex items-center gap-2 text-[13px] font-medium leading-5',
            storagePresentation.color,
          ].join(' ')}
        >
          <StorageIcon size={16} strokeWidth={1.5} aria-hidden="true" />
          {storageStateLabel(snapshot.storage.state)}
        </div>
      </div>
    </div>
  );
}

function SnapshotJson({
  event,
  copied,
  onCopy,
}: {
  event: DocumentHistoryEvent;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-3 py-2">
        <span className="font-mono text-xs text-[#737373]">result</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 items-center gap-2 rounded-[8px] px-2.5 text-xs font-medium text-[#1A5FD0] transition-colors hover:bg-[rgba(26,95,208,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]"
        >
          {copied
            ? <Check size={15} strokeWidth={1.5} aria-hidden="true" />
            : <Clipboard size={15} strokeWidth={1.5} aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar JSON'}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto bg-[#FAFAFA] p-4 font-mono text-[13px] font-normal leading-5 text-[#1A1A1A]">
        <code>{JSON.stringify(event.result, null, 2)}</code>
      </pre>
    </div>
  );
}

function HistoryLoading() {
  return (
    <div className="space-y-4" aria-label="Cargando historial" aria-busy="true">
      {[1, 2].map(item => (
        <div
          key={item}
          className="animate-pulse rounded-[8px] border border-[#E5E5E5] bg-white p-5"
        >
          <div className="h-4 w-40 rounded bg-[#E5E5E5]" />
          <div className="mt-3 h-3 w-56 max-w-full rounded bg-[#EEEEEE]" />
          <div className="mt-5 h-20 rounded bg-[#FAFAFA]" />
        </div>
      ))}
    </div>
  );
}

export function DocumentHistoryView({
  scenarioKey,
  documentId,
  state = 'ready',
}: {
  scenarioKey: string;
  documentId?: string | null;
  state?: HistoryViewState;
}) {
  const fixture = getDocumentHistory(scenarioKey, documentId);
  const events = useMemo(
    () => [...(fixture?.events ?? [])].sort((a, b) => a.sequence - b.sequence),
    [fixture],
  );
  const [expandedSequence, setExpandedSequence] = useState<number | null>(
    () => events.at(-1)?.sequence ?? null,
  );
  const [activeTabs, setActiveTabs] = useState<Record<number, SnapshotTab>>({});
  const [copiedSequence, setCopiedSequence] = useState<number | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestEvent = events.at(-1);
  const hasTimeline = events.length > 1;
  const returnScenario = fixture?.scenario_key ?? scenarioKey;
  const resultHref = `?view=result&scenario=${encodeURIComponent(returnScenario)}`;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copySnapshot = async (event: DocumentHistoryEvent) => {
    const json = JSON.stringify(event.result, null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(json);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = json;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopiedSequence(event.sequence);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedSequence(null), 1600);
  };

  return (
    <div className="min-h-full min-w-0 bg-[#FAFAFA] px-4 pb-12 text-[#1A1A1A] sm:px-7">
      <div className="mx-auto w-full max-w-[1160px]">
        <header className="mb-3 flex min-h-[72px] flex-col justify-center border-b border-[#E5E5E5] py-3">
          <h1 className="text-xl font-semibold leading-7">Historial del documento</h1>
          <p className="mt-1 max-w-3xl text-xs font-normal leading-5 text-[#737373]">
            Consulte los resultados registrados durante el procesamiento y las revisiones realizadas sobre este documento.
          </p>
        </header>

        <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-start gap-x-8 gap-y-3">
            <div className="min-w-0">
              <span className="block text-xs leading-5 text-[#737373]">Documento</span>
              <span className="block font-mono text-[13px] font-medium leading-5 text-[#1A1A1A]">
                {fixture?.document_id ?? documentId ?? '—'}
              </span>
            </div>
            <div>
              <span className="block text-xs leading-5 text-[#737373]">Estado actual</span>
              <div className="mt-0.5">
                {latestEvent && <StatusChip status={latestEvent.result.status} />}
              </div>
            </div>
            {latestEvent && (
              <div>
                <span className="block text-xs leading-5 text-[#737373]">Último evento</span>
                <time
                  dateTime={latestEvent.occurred_at}
                  className="block text-[13px] font-medium leading-5 text-[#1A1A1A]"
                >
                  {formatOccurrence(latestEvent.occurred_at)}
                </time>
              </div>
            )}
          </div>
          <a
            href={resultHref}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-[13px] font-medium text-[#1A5FD0] transition-colors hover:bg-[rgba(26,95,208,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Volver al resultado
          </a>
        </div>

        {state === 'loading' ? (
          <HistoryLoading />
        ) : state === 'error' ? (
          <div className="rounded-[8px] border border-[rgba(255,107,53,0.35)] bg-white px-5 py-8 text-center">
            <p className="text-sm font-medium text-[#1A1A1A]">
              No fue posible cargar el historial.
            </p>
            <p className="mt-1 text-xs text-[#737373]">Intente nuevamente.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[8px] border border-[#E5E5E5] bg-white px-5 py-10 text-center text-sm text-[#737373]">
            No hay eventos registrados para este documento.
          </div>
        ) : (
          <ol className="space-y-0">
            {events.map((event, index) => {
              const expanded = expandedSequence === event.sequence;
              const activeTab = activeTabs[event.sequence] ?? 'summary';
              const contentId = `history-event-${event.sequence}-content`;
              const summaryTabId = `history-event-${event.sequence}-summary-tab`;
              const jsonTabId = `history-event-${event.sequence}-json-tab`;
              const panelId = `history-event-${event.sequence}-${activeTab}-panel`;
              const reviewed = event.event_type === 'HUMAN_REVIEW';

              return (
                <li
                  key={event.sequence}
                  className={[
                    'relative min-w-0 pb-3',
                    hasTimeline ? 'grid grid-cols-[16px_minmax(0,1fr)] gap-2.5' : '',
                  ].join(' ')}
                >
                  {hasTimeline && index < events.length - 1 && (
                    <span
                      className="absolute -bottom-7 left-[7px] top-7 w-px bg-[#E5E5E5]"
                      aria-hidden="true"
                    />
                  )}
                  {hasTimeline && (
                    <span
                      className={[
                        'relative z-10 ml-0.5 mt-[22px] h-3 w-3 rounded-full',
                        event.decision === 'APPROVE'
                          ? 'bg-[#0B7573]'
                          : event.decision === 'REJECT'
                            ? 'bg-[#A64040]'
                            : 'bg-[#1A5FD0]',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  )}

                  <article className="min-w-0 overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium leading-[22px]">
                          {reviewed ? 'Revisión humana' : 'Triaje inicial'}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#737373]">
                          <span>Evento {event.sequence}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={event.occurred_at}>
                            {formatOccurrence(event.occurred_at)}
                          </time>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <StatusChip status={event.result.status} />
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={contentId}
                          onClick={() => setExpandedSequence(expanded ? null : event.sequence)}
                          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[8px] px-3 text-xs font-medium text-[#1A5FD0] transition-colors hover:bg-[rgba(26,95,208,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]"
                        >
                          {expanded ? 'Ocultar detalle' : 'Mostrar detalle'}
                          <ChevronDown
                            size={15}
                            strokeWidth={1.5}
                            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div id={contentId} className="min-w-0 border-t border-[#E5E5E5]">
                        <div
                          className="flex h-11 items-end gap-5 border-b border-[#E5E5E5] px-4 sm:px-5"
                          role="tablist"
                          aria-label={`Vista del evento ${event.sequence}`}
                        >
                          {(['summary', 'json'] as const).map(tab => {
                            const selected = activeTab === tab;
                            const tabId = tab === 'summary' ? summaryTabId : jsonTabId;
                            return (
                              <button
                                key={tab}
                                id={tabId}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={`history-event-${event.sequence}-${tab}-panel`}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setActiveTabs(current => ({
                                  ...current,
                                  [event.sequence]: tab,
                                }))}
                                onKeyDown={keyboardEvent => {
                                  if (
                                    keyboardEvent.key !== 'ArrowLeft' &&
                                    keyboardEvent.key !== 'ArrowRight' &&
                                    keyboardEvent.key !== 'Home' &&
                                    keyboardEvent.key !== 'End'
                                  ) return;
                                  keyboardEvent.preventDefault();
                                  const nextTab: SnapshotTab =
                                    keyboardEvent.key === 'ArrowLeft' ||
                                    keyboardEvent.key === 'Home'
                                      ? 'summary'
                                      : 'json';
                                  setActiveTabs(current => ({
                                    ...current,
                                    [event.sequence]: nextTab,
                                  }));
                                  const nextId =
                                    nextTab === 'summary' ? summaryTabId : jsonTabId;
                                  requestAnimationFrame(() => {
                                    document.getElementById(nextId)?.focus();
                                  });
                                }}
                                className={[
                                  'relative h-11 px-0.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
                                  selected ? 'text-[#1A5FD0]' : 'text-[#737373] hover:text-[#1A1A1A]',
                                ].join(' ')}
                              >
                                {tab === 'summary' ? 'Resumen' : 'JSON'}
                                {selected && (
                                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1A5FD0]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div
                          id={panelId}
                          role="tabpanel"
                          aria-labelledby={activeTab === 'summary' ? summaryTabId : jsonTabId}
                          className="min-w-0 bg-[#FAFAFA] p-3 sm:p-5"
                        >
                          {activeTab === 'summary' ? (
                            <SnapshotSummary snapshot={event.result} />
                          ) : (
                            <SnapshotJson
                              event={event}
                              copied={copiedSequence === event.sequence}
                              onCopy={() => void copySnapshot(event)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
