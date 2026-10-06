import type { Confidence } from '../types';

interface Props {
  confidence: Confidence;
}

function confidenceBarColor(value: number): string {
  if (value >= 0.85) return 'bg-emerald-500';
  if (value >= 0.65) return 'bg-blue-500';
  if (value >= 0.50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function confidenceTextColor(value: number): string {
  if (value >= 0.85) return 'text-emerald-600';
  if (value >= 0.65) return 'text-blue-600';
  if (value >= 0.50) return 'text-amber-600';
  return 'text-rose-600';
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={['h-full rounded-full', confidenceBarColor(value)].join(' ')}
        style={{ width: pct(value) }}
      />
    </div>
  );
}

function SecondaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-slate-500">{label}</span>
        <span className={['text-[12px] font-semibold', confidenceTextColor(value)].join(' ')}>
          {pct(value)}
        </span>
      </div>
      <ConfidenceBar value={value} />
    </div>
  );
}

export function ConfidenceMetrics({ confidence }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Confianza del análisis
        </h2>
      </div>
      <div className="px-5 py-4">
        {/* Global — primary metric */}
        <div className="flex items-end gap-4 mb-5 pb-5 border-b border-slate-100">
          <div>
            <p className="text-[12px] text-slate-500 mb-0.5">Confianza global</p>
            <p className={['text-3xl font-bold', confidenceTextColor(confidence.global)].join(' ')}>
              {pct(confidence.global)}
            </p>
          </div>
          <div className="flex-1 pb-1.5">
            <ConfidenceBar value={confidence.global} />
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="space-y-3.5">
          <SecondaryMetric label="Confianza de clasificación" value={confidence.classification} />
          <SecondaryMetric label="Confianza de extracción" value={confidence.extraction} />
        </div>
      </div>
    </div>
  );
}
