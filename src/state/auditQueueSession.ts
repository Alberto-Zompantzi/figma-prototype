import { useSyncExternalStore } from 'react';
import { auditQueue, type AuditQueueItem } from '../data/auditQueue';
import { scenarios } from '../data/scenarios';
import { auditReviewScenarios } from '../data/auditReviewScenarios';
import { getReviewedResult } from './reviewSession';

const canonicalPendingItems = auditQueue.filter(
  item =>
    scenarios[item.scenario_key]?.status === 'NEEDS_AUDIT' ||
    auditReviewScenarios[item.scenario_key]?.status === 'NEEDS_AUDIT',
);
let pendingItems: AuditQueueItem[] = canonicalPendingItems.filter(item => !getReviewedResult(item.document_id));
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return pendingItems;
}

export function usePendingAuditQueue() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function refreshAuditQueue() {
  pendingItems = canonicalPendingItems.filter(item => !getReviewedResult(item.document_id));
  listeners.forEach(listener => listener());
}
