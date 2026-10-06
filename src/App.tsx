import { useState, useEffect } from 'react';
import { Shell } from './components/Shell';
import { ProcessingView } from './components/ProcessingView';
import { ProcessingResult } from './components/ProcessingResult';
import { AuditQueueView } from './components/AuditQueueView';
import { AuditReviewView } from './components/AuditReviewView';
import { DocumentHistoryView, type HistoryViewState } from './components/DocumentHistoryView';
import { scenarios } from './data/scenarios';
import { auditQueue } from './data/auditQueue';
import { auditReviewScenarios } from './data/auditReviewScenarios';
import { getDocumentHistory } from './data/documentHistory';
import type { ProcessingResult as ProcessingResultData } from './types';
import { getProcessingSourceContext } from './state/processingSourceSession';

const processingBreadcrumbs = [
  { label: 'MediFlow' },
  { label: 'Procesamiento', bold: true },
];

const resultBreadcrumbs = [
  { label: 'MediFlow' },
  { label: 'Procesamiento', href: '?view=processing' },
  { label: 'Resultado', bold: true },
];

const historyBreadcrumbs = [
  { label: 'MediFlow' },
  { label: 'Procesamiento', href: '?view=processing' },
  { label: 'Resultado' },
  { label: 'Historial', bold: true },
];

const auditBreadcrumbs = [
  { label: 'MediFlow' },
  { label: 'Auditoría', bold: true },
];

const auditReviewBreadcrumbs = [
  { label: 'MediFlow' },
  { label: 'Auditoría', href: '?view=audit' },
  { label: 'Revisión', bold: true },
];

function RedirectAuditReviewToResult({
  scenarioKey,
  data,
}: {
  scenarioKey: string;
  data: ProcessingResultData;
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', 'result');
    params.set('scenario', scenarioKey);
    history.replaceState(null, '', `?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [scenarioKey]);

  return (
    <Shell breadcrumbs={resultBreadcrumbs} activeNav="procesamiento">
      <ProcessingResult
        data={data}
        sourceContext={getProcessingSourceContext(scenarioKey)}
        scenarioKey={scenarioKey}
      />
    </Shell>
  );
}

function RedirectInvalidAuditDocumentToQueue() {
  useEffect(() => {
    history.replaceState(null, '', '?view=audit');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return (
    <Shell breadcrumbs={auditBreadcrumbs} activeNav="auditoria">
      <AuditQueueView />
    </Shell>
  );
}

function parseRoute() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') ?? 'processing';
  const requestedHistoryState = params.get('historyState');
  const historyState: HistoryViewState =
    requestedHistoryState === 'loading' || requestedHistoryState === 'error'
      ? requestedHistoryState
      : 'ready';
  return {
    view,
    scenarioKey: params.get('scenario') ?? (view === 'result' ? 'needs_audit_partial' : 'processed'),
    documentId: params.get('document'),
    historyState,
  };
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const { view, scenarioKey, documentId, historyState } = route;
  const initialHistoryResult = getDocumentHistory(scenarioKey, documentId)?.events[0]?.result;
  const historyResultCanRender =
    initialHistoryResult?.status === 'PROCESSED' ||
    initialHistoryResult?.status === 'NEEDS_AUDIT';
  const data: ProcessingResultData =
    scenarios[scenarioKey] ??
    (historyResultCanRender ? initialHistoryResult : scenarios.processed);
  const sourceContext = getProcessingSourceContext(scenarioKey);

  if (view === 'result') {
    return (
      <Shell breadcrumbs={resultBreadcrumbs} activeNav="procesamiento">
        <ProcessingResult
          data={data}
          sourceContext={sourceContext}
          scenarioKey={scenarioKey}
        />
      </Shell>
    );
  }

  if (view === 'history') {
    return (
      <Shell breadcrumbs={historyBreadcrumbs} activeNav="procesamiento">
        <DocumentHistoryView
          key={`${scenarioKey}-${documentId ?? ''}`}
          scenarioKey={scenarioKey}
          documentId={documentId}
          state={historyState}
        />
      </Shell>
    );
  }

  if (view === 'audit') {
    return (
      <Shell breadcrumbs={auditBreadcrumbs} activeNav="auditoria">
        <AuditQueueView />
      </Shell>
    );
  }

  if (view === 'audit-review') {
    const reviewOnlyScenario = auditReviewScenarios[scenarioKey];
    if (!reviewOnlyScenario && data.status !== 'NEEDS_AUDIT') {
      return <RedirectAuditReviewToResult scenarioKey={scenarioKey} data={data} />;
    }
    const requestedDocumentId = new URLSearchParams(window.location.search).get('document');
    if (requestedDocumentId) {
      const requestedItem = auditQueue.find(item => item.document_id === requestedDocumentId);
      const reviewDocumentId = reviewOnlyScenario?.document_id ?? data.document_id;
      const coherentReview =
        requestedItem?.scenario_key === scenarioKey &&
        requestedItem.document_id === reviewDocumentId;
      if (!coherentReview) {
        return <RedirectInvalidAuditDocumentToQueue />;
      }
    }
    return (
      <Shell breadcrumbs={auditReviewBreadcrumbs} activeNav="auditoria">
        <AuditReviewView key={scenarioKey} scenarioKey={scenarioKey} />
      </Shell>
    );
  }

  return (
    <Shell breadcrumbs={processingBreadcrumbs} activeNav="procesamiento">
      <ProcessingView />
    </Shell>
  );
}
