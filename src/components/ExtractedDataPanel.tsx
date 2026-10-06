import { humanizeKey } from '../utils/humanizeKey';

interface Props {
  extracted_data: Record<string, unknown>;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(raw: string): string {
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function coerceString(value: unknown): string {
  return String(value);
}

type Layout = 'inline' | 'block';

function detectLayout(value: unknown): Layout {
  if (Array.isArray(value)) return 'block';
  if (typeof value === 'object' && value !== null) return 'block';
  if (typeof value === 'string' && value.length > 55) return 'block';
  return 'inline';
}

function RenderValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="font-jakarta text-[13px] font-normal text-[#737373]">—</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
        {value ? 'Sí' : 'No'}
      </span>
    );
  }
  if (typeof value === 'string') {
    const display = ISO_DATE_RE.test(value) ? formatDate(value) : value;
    return (
      <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
        {display}
      </span>
    );
  }
  if (typeof value === 'number') {
    return (
      <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
        {String(value)}
      </span>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[1px] shrink-0 text-[13px] text-[#737373]">•</span>
            <span className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
              {coerceString(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-1.5 border-l-2 border-[#E5E5E5] pl-3">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="shrink-0 font-jakarta text-xs font-normal text-[#737373]">
              {humanizeKey(k)}:
            </span>
            <span className="font-jakarta text-xs font-normal text-[#1A1A1A]">
              {coerceString(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <span className="font-mono font-jakarta text-xs font-normal text-[#1A1A1A]">
      {JSON.stringify(value)}
    </span>
  );
}

export function ExtractedDataPanel({ extracted_data }: Props) {
  const entries = Object.entries(extracted_data);

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none">
      <div className="border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
          Datos clínicos extraídos
        </h2>
      </div>

      <div className="divide-y divide-[#EEEEEE]">
        {entries.map(([key, value]) => {
          const layout = detectLayout(value);
          if (layout === 'block') {
            return (
              <div key={key} className="px-5 py-3">
                <span className="block font-jakarta text-[13px] font-normal leading-5 text-[#737373]">
                  {humanizeKey(key)}
                </span>
                <div className="mt-1.5">
                  <RenderValue value={value} />
                </div>
              </div>
            );
          }
          // Inline scalar: two-column on sm+, stacked on mobile
          return (
            <div key={key} className="px-5 py-2.5">
              {/* Mobile: stacked */}
              <div className="sm:hidden">
                <span className="block font-jakarta text-[13px] font-normal leading-5 text-[#737373]">
                  {humanizeKey(key)}
                </span>
                <div className="mt-0.5">
                  <RenderValue value={value} />
                </div>
              </div>
              {/* Desktop: inline two-column */}
              <div className="hidden sm:flex sm:items-baseline sm:gap-0">
                <span
                  className="shrink-0 font-jakarta text-[13px] font-normal leading-5 text-[#737373]"
                  style={{ width: 220 }}
                >
                  {humanizeKey(key)}
                </span>
                <div className="flex-1 min-w-0">
                  <RenderValue value={value} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
