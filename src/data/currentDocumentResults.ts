import { documentHistories, illegibleInitial } from './documentHistory';
import { scenarios } from './scenarios';
import type { DocumentResult, ProcessingResult } from '../types';

// Processing stays initial; explicit document URLs can preview final baseline cases.
export function getInitialDocumentResult(scenarioKey: string, documentId?: string | null): ProcessingResult | undefined {
  const initialResults = [...Object.values(scenarios), illegibleInitial];
  if (documentId) return initialResults.find(result => result.document_id === documentId);
  return scenarioKey === 'needs_audit_illegible' ? illegibleInitial : scenarios[scenarioKey];
}

export function getFinalDocumentResult(documentId: string): DocumentResult | undefined {
  const result = documentHistories.find(fixture => fixture.document_id === documentId)?.events.at(-1)?.result;
  return result?.status === 'APPROVED' || result?.status === 'REJECTED' ? result : undefined;
}
