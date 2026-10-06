import type { ReactNode } from 'react';
import { destinationLabel, storageStateLabel } from '../utils/labels';
import type { RoutingDecision, Storage } from '../types';

interface Props {
  routing_decision: RoutingDecision;
  storage: Storage;
}

const destinationIcons: Record<RoutingDecision['primary_destination'], ReactNode> = {
  MEDICAL_EMERGENCY: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  PHARMACY: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  AUTHORIZATION_AUDIT: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  MEDICAL_RECORD: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  HUMAN_REVIEW: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
};

const destinationIconColors: Record<RoutingDecision['primary_destination'], string> = {
  MEDICAL_EMERGENCY: 'text-[#1A5FD0]',
  PHARMACY: 'text-[#1A5FD0]',
  AUTHORIZATION_AUDIT: 'text-[#1A5FD0]',
  MEDICAL_RECORD: 'text-[#1A5FD0]',
  HUMAN_REVIEW: 'text-[#1A5FD0]',
};

const storageConfig: Record<Storage['state'], { icon: ReactNode; color: string }> = {
  SUCCESS: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    color: 'text-[#0B7573]',
  },
  PENDING: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: 'text-amber-600',
  },
  ERROR: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    color: 'text-rose-600',
  },
};

export function RoutingDecisionCard({ routing_decision, storage }: Props) {
  const { primary_destination, requires_human_review, justification } = routing_decision;
  const destIconColor = destinationIconColors[primary_destination];
  const store = storageConfig[storage.state];

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
          Enrutamiento
        </h2>
      </div>

      <div className="space-y-3 px-5 py-4">
        {/* Destination */}
        <div className="flex items-center gap-3 rounded-[8px] border border-[#EEEEEE] bg-[#FAFAFA] p-3">
          <span className={['shrink-0', destIconColor].join(' ')}>
            {destinationIcons[primary_destination]}
          </span>
          <div>
            <p className="font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
              Destino principal
            </p>
            <p className="font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
              {destinationLabel(primary_destination)}
            </p>
          </div>
        </div>

        {/* Human review */}
        {requires_human_review && (
          <div className="flex items-center justify-between">
            <span className="font-jakarta text-[13px] font-normal leading-5 text-[#737373]">
              Revisión humana
            </span>
            <span className="rounded-md bg-[rgba(255,107,53,0.10)] px-2 py-0.5 text-xs font-medium text-[#D85A00]">
              Requerida
            </span>
          </div>
        )}

        {/* Justification */}
        {justification && (
          <div className="border-t border-[#EEEEEE] pt-3">
            <p className="mb-1 font-jakarta text-xs font-normal leading-[18px] text-[#737373]">
              Justificación
            </p>
            <p className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
              {justification}
            </p>
          </div>
        )}

        {/* Storage — always at bottom */}
        <div className="flex items-center gap-2">
          <span className={store.color}>{store.icon}</span>
          <span className={['font-jakarta text-[13px] font-medium leading-5', store.color].join(' ')}>
            {storageStateLabel(storage.state)}
          </span>
        </div>
      </div>
    </div>
  );
}
