import { documentTypeLabel, priorityLabel } from '../utils/labels';
import type { Classification, Confidence } from '../types';

interface Props {
  classification: Classification | null;
  confidence: Confidence | null;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ConfidenceCalibrationRail({ value }: { value: number }) {
  return (
    <div className="relative h-2 w-full cursor-default" aria-hidden="true">
      <span className="absolute inset-x-0 bottom-0 h-px bg-[#D9D9D9]" />
      {[25, 50, 75].map(position => (
        <span
          key={position}
          className="absolute bottom-[-2px] h-1.5 w-px -translate-x-1/2 bg-[#C7C7C7]"
          style={{ left: `${position}%` }}
        />
      ))}
      <span
        className="absolute bottom-0 h-[5px] w-px -translate-x-1/2 bg-[#1A5FD0]"
        style={{ left: pct(value) }}
      />
      <span
        className="absolute bottom-[5px] h-2 w-2 border-[1.5px] border-[#1A5FD0] bg-white"
        style={{
          left: pct(value),
          transform: 'translateX(-50%) rotate(45deg)',
        }}
      />
    </div>
  );
}

function LabeledRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className="shrink-0 font-jakarta text-[13px] font-normal leading-5 text-[#737373]"
      >
        {label}
      </span>
      <span
        className="text-right font-jakarta text-[13px] font-medium leading-5 text-[#1A1A1A]"
      >
        {value}
      </span>
    </div>
  );
}

function SecondaryConfidence({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="font-jakarta text-xs font-normal leading-[18px] text-[#737373]"
        >
          {label}
        </span>
        <span
          className="font-jakarta text-xs font-medium text-[#1A1A1A]"
        >
          {pct(value)}
        </span>
      </div>
      <ConfidenceCalibrationRail value={value} />
    </div>
  );
}

export function ProcessingSummary({ classification, confidence }: Props) {
  const isUrgent = classification?.priority_level === 'URGENT';

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none">
      {/* Card header */}
      <div className="border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
          Resumen del procesamiento
        </h2>
      </div>

      {/* Card body — side by side when both blocks present */}
      <div className="flex flex-col divide-y divide-[#E5E5E5] sm:flex-row sm:divide-x sm:divide-y-0">

        {/* Classification column */}
        {classification !== null && (
          <div className="flex-1 space-y-2.5 p-5">
            <LabeledRow
              label="Tipo de documento"
              value={documentTypeLabel(classification.document_type)}
            />
            {classification.specialty !== null && (
              <LabeledRow label="Especialidad" value={classification.specialty} />
            )}
            <div className="flex items-center justify-between gap-4">
              <span
                className="font-jakarta text-[13px] font-normal leading-5 text-[#737373]"
              >
                Prioridad
              </span>
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium',
                  isUrgent
                    ? 'border-[rgba(255,107,53,0.30)] bg-[rgba(255,107,53,0.10)] text-[#D85A00]'
                    : 'border-[#E5E5E5] bg-[#F5F5F5] text-[#737373]',
                ].join(' ')}
              >
                {isUrgent && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {priorityLabel(classification.priority_level)}
              </span>
            </div>
          </div>
        )}

        {/* Confidence column */}
        {confidence !== null && (
          <div
            className="space-y-3 p-5"
            style={{ width: classification !== null ? 288 : undefined, flex: classification !== null ? undefined : 1 }}
          >
            {/* Global — primary */}
            <div className="space-y-1.5">
              <div className="flex items-end justify-between">
                <span
                  className="font-jakarta text-xs font-normal leading-[18px] text-[#737373]"
                >
                  Confianza global
                </span>
                <span className="font-jakarta text-2xl font-semibold leading-none text-[#1A1A1A]">
                  {pct(confidence.global)}
                </span>
              </div>
              <ConfidenceCalibrationRail value={confidence.global} />
            </div>

            {/* Secondary */}
            <SecondaryConfidence label="Confianza de clasificación" value={confidence.classification} />
            <SecondaryConfidence label="Confianza de extracción" value={confidence.extraction} />
          </div>
        )}
      </div>
    </div>
  );
}
