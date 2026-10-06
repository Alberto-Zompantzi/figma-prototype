import { storageStateLabel } from '../utils/labels';
import type { Storage } from '../types';

interface Props {
  storage: Storage;
}

const stateConfig: Record<Storage['state'], { icon: React.ReactNode; color: string; bg: string }> = {
  SUCCESS: {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  PENDING: {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  ERROR: {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
};

export function StorageStatus({ storage }: Props) {
  const config = stateConfig[storage.state];

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Almacenamiento
        </h2>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg, config.color].join(' ')}>
            {config.icon}
          </div>
          <span className={['text-[13.5px] font-medium', config.color].join(' ')}>
            {storageStateLabel(storage.state)}
          </span>
        </div>
      </div>
    </div>
  );
}
