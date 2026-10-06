import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { ViewHeader } from './ViewHeader';
import { ProcessingSummary } from './ProcessingSummary';
import { AuditContextPanel } from './AuditContextPanel';
import { ExtractedDataPanel } from './ExtractedDataPanel';
import { ValidationPanel } from './ValidationPanel';
import { RoutingDecisionCard } from './RoutingDecisionCard';
import { NotificationCard } from './NotificationCard';
import { DocumentViewer } from './ProcessingView';
import { resultDocumentPreviews } from '../data/documentPreviewFixtures';
import type { DocumentResult } from '../types';
import type { ProcessingSourceContext } from '../state/processingSourceSession';

interface Props {
  data: DocumentResult;
  sourceContext?: ProcessingSourceContext | null;
  scenarioKey?: string;
}

export function ProcessingResult({
  data,
  sourceContext = null,
  scenarioKey = 'processed',
}: Props) {
  const {
    document_id,
    status,
    classification,
    confidence,
    extracted_data,
    validation,
    routing_decision,
    notification,
    storage,
  } = data;

  const showSummary = classification !== null || confidence !== null;
  const sourceDocument = useMemo(() => {
    if (sourceContext?.kind === 'text') return null;
    if (sourceContext?.kind === 'file') return sourceContext.file;
    return new File([], `${document_id}.pdf`, { type: 'application/pdf' });
  }, [document_id, sourceContext]);
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  useEffect(() => {
    if (
      sourceContext?.kind !== 'file' ||
      !sourceDocument ||
      !(sourceContext.mimeType.startsWith('image/') || /\.(png|jpe?g)$/i.test(sourceContext.fileName))
    ) {
      setSourceImageUrl('');
      return;
    }
    const url = URL.createObjectURL(sourceDocument);
    setSourceImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceContext, sourceDocument]);
  const previewFixture = resultDocumentPreviews[document_id];
  const textSource = sourceContext?.kind === 'text' ? sourceContext.text : null;

  return (
    <div className="min-h-full bg-[#FAFAFA] px-4 text-[#1A1A1A] sm:px-7 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto w-full max-w-[1400px] lg:flex lg:h-full lg:flex-col">
        <header className="mb-3 flex h-[72px] shrink-0 flex-col justify-center border-b border-[#E5E5E5]">
          <h1 className="text-xl font-semibold leading-7 text-[#1A1A1A]">
            Resultado del procesamiento
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#737373]">
            Revise la clasificación, los datos extraídos y el destino asignado al documento.
          </p>
        </header>

        <div className="grid min-w-0 items-stretch gap-3 pb-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-0 lg:overflow-hidden">
          <div className="min-w-0 lg:min-h-0 lg:overflow-hidden lg:pr-1.5">
            <section className="flex min-h-[620px] flex-col overflow-hidden bg-white lg:h-full lg:min-h-0">
              <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-[#E5E5E5] px-3 text-sm font-medium leading-[22px] text-[#1A1A1A]">
                <span>Resultado</span>
                <a
                  href={`?view=history&scenario=${encodeURIComponent(scenarioKey)}&document=${encodeURIComponent(document_id)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-xs font-medium text-[#1A5FD0] transition-colors hover:bg-[rgba(26,95,208,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]"
                >
                  <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />
                  Ver historial
                </a>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                <ViewHeader document_id={document_id} status={status} metadataOnly />

                {routing_decision.audit_reasons.length > 0 && (
                  <div className="mt-5">
                    <AuditContextPanel
                      audit_reasons={routing_decision.audit_reasons}
                      requires_human_review={routing_decision.requires_human_review}
                    />
                  </div>
                )}

                {showSummary && (
                  <div className="mt-5">
                    <ProcessingSummary classification={classification} confidence={confidence} />
                  </div>
                )}

                {notification.generated && (
                  <div className="mt-5">
                    <NotificationCard notification={notification} />
                  </div>
                )}

                {extracted_data !== null && (
                  <div className="mt-5">
                    <ExtractedDataPanel extracted_data={extracted_data} />
                  </div>
                )}

                {validation !== null && (
                  <div className="mt-5">
                    <ValidationPanel validation={validation} />
                  </div>
                )}

                <div className="mt-5">
                  <RoutingDecisionCard routing_decision={routing_decision} storage={storage} />
                </div>
              </div>
            </section>
          </div>

          <div className="min-w-0 lg:min-h-0 lg:overflow-hidden lg:pl-1.5">
            <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden bg-white lg:h-full lg:min-h-0">
              <div className="flex h-8 min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[#E5E5E5] px-4">
                <h2 className="text-sm font-medium leading-[22px] text-[#1A1A1A]">
                  {textSource !== null ? 'Texto original' : 'Documento'}
                </h2>
                <span className="min-w-0 truncate text-xs font-normal text-[#A9A9A9]">
                  {textSource !== null ? 'Entrada de texto' : sourceDocument?.name}
                </span>
              </div>
              <div className="min-h-0 min-w-0 flex-1">
                {textSource !== null ? (
                  <div className="h-full overflow-y-auto bg-white p-6">
                    <p className="max-w-[720px] whitespace-pre-wrap [overflow-wrap:anywhere] font-jakarta text-sm font-normal leading-[22px] text-[#1A1A1A]">
                      {textSource}
                    </p>
                  </div>
                ) : sourceDocument ? (
                  <DocumentViewer
                    file={sourceDocument}
                    imageUrl={sourceImageUrl}
                    previewFixture={previewFixture}
                  />
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
