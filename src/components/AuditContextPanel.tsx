import { auditReasonLabel } from '../utils/labels';
import type { AuditReason } from '../types';

interface Props {
  audit_reasons: AuditReason[];
  requires_human_review: boolean;
}

export function AuditContextPanel({ audit_reasons, requires_human_review }: Props) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[rgba(255,107,53,0.35)] bg-[#FFFBF7] shadow-none">
      <div className="border-b border-[rgba(255,107,53,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D85A00" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#D85A00]">
            Motivos de revisión
          </h2>
        </div>
      </div>
      <div className="space-y-3 px-4 pb-4 pt-3">
        {requires_human_review && (
          <p className="font-jakarta text-[13px] font-normal leading-5 text-[#737373]">
            Este documento ha sido derivado a revisión manual. La información disponible puede ser parcial o no verificada.
          </p>
        )}
        {audit_reasons.length > 0 && (
          <ul className="space-y-1.5">
            {audit_reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B35]" />
                <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
                  {auditReasonLabel(reason)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
