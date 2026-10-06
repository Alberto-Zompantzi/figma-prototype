import type { Validation } from '../types';
import { humanizeKey } from '../utils/humanizeKey';

interface Props {
  validation: Validation;
}

interface CategoryProps {
  label: string;
  items: string[];
  variant: 'missing' | 'inconsistency' | 'warning';
}

const variantStyles = {
  missing: {
    dot: 'bg-[#FF6B35]',
    label: 'text-[#D85A00]',
    item: 'text-[#737373]',
  },
  inconsistency: {
    dot: 'bg-orange-500',
    label: 'text-orange-700',
    item: 'text-[#737373]',
  },
  warning: {
    dot: 'bg-[#FF6B35]',
    label: 'text-[#D85A00]',
    item: 'text-[#737373]',
  },
};

function Category({ label, items, variant }: CategoryProps) {
  if (items.length === 0) return null;
  const s = variantStyles[variant];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={['w-1.5 h-1.5 rounded-full shrink-0', s.dot].join(' ')} />
        <span
          className={['font-jakarta text-[13px] font-medium leading-5', s.label].join(' ')}
        >
          {label}
        </span>
      </div>
      <ul className="space-y-1 pl-3.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#c8d4e6] mt-[3px] shrink-0" style={{ fontSize: 12 }}>—</span>
            <span
              className={['font-jakarta text-[13px] font-normal leading-5', s.item].join(' ')}
            >
              {variant === 'missing' ? humanizeKey(item) : item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValidationPanel({ validation }: Props) {
  const hasAny =
    validation.missing_fields.length > 0 ||
    validation.inconsistencies.length > 0 ||
    validation.warnings.length > 0;

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white shadow-none">
      <div className="border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#1A1A1A]">
          Hallazgos de validación
        </h2>
      </div>
      <div className="px-5 py-4">
        {!hasAny ? (
          <div className="flex items-center gap-2.5 text-emerald-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span
              className="font-jakarta font-medium not-italic"
              style={{ fontSize: 13 }}
            >
              Sin hallazgos de validación
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <Category label="Campos faltantes"  items={validation.missing_fields}  variant="missing" />
            <Category label="Inconsistencias"    items={validation.inconsistencies} variant="inconsistency" />
            <Category label="Advertencias"       items={validation.warnings}        variant="warning" />
          </div>
        )}
      </div>
    </div>
  );
}
