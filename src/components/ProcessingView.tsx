// @refresh reset
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  prescriptionDocumentPreview,
  type DocumentPreviewField,
  type DocumentPreviewFixture,
} from '../data/documentPreviewFixtures';
import { setProcessingSourceContext } from '../state/processingSourceSession';

const assetPathPrefix = '/assets';
const imgIconUpload = `${assetPathPrefix}/a9fec.svg`;
const imgIconText = `${assetPathPrefix}/18973.svg`;

type InputMode = 'file' | 'text';

interface ViewerActionItem {
  label: string;
  icon: React.ComponentType;
  action?: () => void;
  disabled?: boolean;
}

const ACCEPTED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ACCEPTED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const SUCCESS_SCENARIOS = new Set([
  'processed',
  'processed_urgent',
  'needs_audit_partial',
  'needs_audit_empty',
]);

function getExtension(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

function isValidFile(file: File): boolean {
  return ACCEPTED_MIME.has(file.type) || ACCEPTED_EXT.has(getExtension(file.name));
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || getExtension(file.name) === '.pdf';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileType(file: File): string {
  const extension = getExtension(file.name);
  if (extension === '.pdf' || file.type === 'application/pdf') return 'PDF';
  if (extension === '.png' || file.type === 'image/png') return 'PNG';
  return 'JPG';
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function UploadEmptyStateIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      width="160"
      height="152"
      viewBox="0 0 160 152"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M67.797 151.228C105.24 151.228 135.594 145.556 135.594 138.56C135.594 131.564 105.24 125.892 67.797 125.892C30.3537 125.892 0 131.564 0 138.56C0 145.556 30.3537 151.228 67.797 151.228Z" fill="#AEB8C2" />
      <path fillRule="evenodd" clipRule="evenodd" d="M122.034 101.344L98.1091 71.8991C96.9611 70.5131 95.2831 69.6741 93.5161 69.6741H42.0761C40.3101 69.6741 38.6321 70.5131 37.4841 71.8991L13.5601 101.344V114.727H122.035V101.344H122.034Z" fill="#AEB8C2" />
      <path fillRule="evenodd" clipRule="evenodd" d="M33.83 31.67H101.763C102.824 31.67 103.841 32.0915 104.591 32.8416C105.342 33.5918 105.763 34.6092 105.763 35.67V129.014C105.763 130.075 105.342 131.092 104.591 131.842C103.841 132.593 102.824 133.014 101.763 133.014H33.83C32.7691 133.014 31.7517 132.593 31.0015 131.842C30.2514 131.092 29.83 130.075 29.83 129.014V35.67C29.83 34.6092 30.2514 33.5918 31.0015 32.8416C31.7517 32.0915 32.7691 31.67 33.83 31.67Z" fill="#F5F5F5" />
      <path fillRule="evenodd" clipRule="evenodd" d="M42.678 41.623H92.915C93.4454 41.623 93.9541 41.8338 94.3292 42.2088C94.7043 42.5839 94.915 43.0926 94.915 43.623V68.58C94.915 69.1105 94.7043 69.6192 94.3292 69.9943C93.9541 70.3693 93.4454 70.58 92.915 70.58H42.678C42.1475 70.58 41.6388 70.3693 41.2637 69.9943C40.8887 69.6192 40.678 69.1105 40.678 68.58V43.623C40.678 43.0926 40.8887 42.5839 41.2637 42.2088C41.6388 41.8338 42.1475 41.623 42.678 41.623ZM42.94 81.437H92.653C93.2529 81.437 93.8282 81.6754 94.2524 82.0996C94.6766 82.5238 94.915 83.0991 94.915 83.699C94.915 84.299 94.6766 84.8743 94.2524 85.2985C93.8282 85.7227 93.2529 85.961 92.653 85.961H42.94C42.34 85.961 41.7647 85.7227 41.3405 85.2985C40.9163 84.8743 40.678 84.299 40.678 83.699C40.678 83.0991 40.9163 82.5238 41.3405 82.0996C41.7647 81.6754 42.34 81.437 42.94 81.437ZM42.94 93.2H92.653C93.253 93.2 93.8285 93.4384 94.2528 93.8627C94.6771 94.287 94.9155 94.8625 94.9155 95.4625C94.9155 96.0626 94.6771 96.6381 94.2528 97.0624C93.8285 97.4867 93.253 97.725 92.653 97.725H42.94C42.3399 97.725 41.7644 97.4867 41.3401 97.0624C40.9158 96.6381 40.6775 96.0626 40.6775 95.4625C40.6775 94.8625 40.9158 94.287 41.3401 93.8627C41.7644 93.4384 42.3399 93.2 42.94 93.2ZM121.813 136.702C121.038 139.773 118.316 142.062 115.078 142.062H20.515C17.277 142.062 14.555 139.772 13.781 136.702C13.6333 136.117 13.5588 135.516 13.559 134.912V101.345H39.877C42.784 101.345 45.127 103.793 45.127 106.765V106.805C45.127 109.776 47.497 112.175 50.404 112.175H85.189C88.096 112.175 90.466 109.754 90.466 106.782V106.77C90.466 103.798 92.809 101.344 95.716 101.344H122.034V134.913C122.034 135.53 121.957 136.129 121.813 136.702Z" fill="#DCE0E6" />
      <path fillRule="evenodd" clipRule="evenodd" d="M125.121 33.292L118.291 35.942C118.116 36.0102 117.924 36.0275 117.74 35.992C117.555 35.9564 117.384 35.8693 117.246 35.7408C117.108 35.6123 117.01 35.4476 116.962 35.2656C116.914 35.0836 116.918 34.8917 116.974 34.712L118.911 28.505C116.322 25.561 114.802 21.971 114.802 18.097C114.802 8.102 124.92 0 137.402 0C149.881 0 160 8.102 160 18.097C160 28.092 149.882 36.194 137.401 36.194C132.873 36.194 128.657 35.128 125.121 33.292Z" fill="#F5F5F5" />
      <path d="M146.304 21.365C147.878 21.365 149.153 20.1047 149.153 18.55C149.153 16.9953 147.878 15.735 146.304 15.735C144.731 15.735 143.455 16.9953 143.455 18.55C143.455 20.1047 144.731 21.365 146.304 21.365Z" fill="#AEB8C2" />
      <path fillRule="evenodd" clipRule="evenodd" d="M131.348 21.013H125.65L128.548 16.087L131.348 21.013ZM134.909 16.087H139.894V21.013H134.909V16.087Z" fill="#AEB8C2" />
    </svg>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="!text-sm !font-normal leading-[22px] text-[#1A1A1A]"
    >
      {children} <span className="text-[#FF6B35]">*</span>
    </label>
  );
}

function ThumbnailViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5,9.5c0,0.552-0.448,1-1,1h-8c-0.552,0-1-0.448-1-1v-8c0-0.552,0.448-1,1-1h8c0.552,0,1,0.448,1,1V9.5z M23.5,9.5c0,0.552-0.448,1-1,1h-8c-0.552,0-1-0.448-1-1v-8c0-0.552,0.448-1,1-1h8c0.552,0,1,0.448,1,1V9.5z M10.5,22.5 c0,0.552-0.448,1-1,1h-8c-0.552,0-1-0.448-1-1v-8c0-0.552,0.448-1,1-1h8c0.552,0,1,0.448,1,1V22.5z M23.5,22.5c0,0.552-0.448,1-1,1 h-8c-0.552,0-1-0.448-1-1v-8c0-0.552,0.448-1,1-1h8c0.552,0,1,0.448,1,1V22.5z" />
    </svg>
  );
}

function BookmarkViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5,1.5h11c0.552,0,1,0.448,1,1v20c0,0.552-0.448,1-1,1h-21c-0.552,0-1-0.448-1-1v-20c0-0.552,0.448-1,1-1h3 M11.5,10.5c0,0.55-0.3,0.661-0.659,0.248L8,7.5l-2.844,3.246c-0.363,0.414-0.659,0.3-0.659-0.247v-9c0-0.552,0.448-1,1-1h5 c0.552,0,1,0.448,1,1L11.5,10.5z M14.5,6.499h6 M14.5,10.499h6 M3.5,14.499h17 M3.5,18.499h16.497" />
    </svg>
  );
}

function AttachmentViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.618,15.345l8.666-8.666c0.78-0.812,2.071-0.838,2.883-0.058s0.838,2.071,0.058,2.883 c-0.019,0.02-0.038,0.039-0.058,0.058L7.461,21.305c-1.593,1.593-4.175,1.592-5.767,0s-1.592-4.175,0-5.767c0,0,0,0,0,0 L13.928,3.305c2.189-2.19,5.739-2.19,7.929-0.001s2.19,5.739,0,7.929l0,0L13.192,19.9" />
    </svg>
  );
}

function SearchViewerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5,0.5c5.523,0,10,4.477,10,10s-4.477,10-10,10s-10-4.477-10-10S4.977,0.5,10.5,0.5z M23.5,23.5 l-5.929-5.929" />
    </svg>
  );
}

function ArrowViewerIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'up'
        ? 'M23.535,18.373L12.409,5.8c-0.183-0.207-0.499-0.226-0.706-0.043C11.688,5.77,11.674,5.785,11.66,5.8 L0.535,18.373'
        : 'M0.541,5.627L11.666,18.2c0.183,0.207,0.499,0.226,0.706,0.043c0.015-0.014,0.03-0.028,0.043-0.043 L23.541,5.627'}
      />
    </svg>
  );
}

function ZoomViewerIcon({ type }: { type: 'minus' | 'plus' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={type === 'minus'
        ? 'M10.5,0.499c5.523,0,10,4.477,10,10s-4.477,10-10,10s-10-4.477-10-10S4.977,0.499,10.5,0.499z M23.5,23.499 l-5.929-5.929 M5.5,10.499h10'
        : 'M10.5,0.499c5.523,0,10,4.477,10,10s-4.477,10-10,10s-10-4.477-10-10S4.977,0.499,10.5,0.499z M23.5,23.499 l-5.929-5.929 M5.5,10.499h10 M10.5,5.499v10'}
      />
    </svg>
  );
}

function FullScreenViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M0.5 12L23.5 12" />
      <path d="M11.5 1L11.5 23" />
      <path d="M8.5 4L11.5 1 14.5 4" />
      <path d="M20.5 9L23.5 12 20.5 15" />
      <path d="M3.5 15L0.5 12 3.5 9" />
      <path d="M14.5 20L11.5 23 8.5 20" />
    </svg>
  );
}

function DownloadViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5,11.5c-.275,0-.341.159-.146.354l6.292,6.293a.5.5,0,0,0,.709,0l6.311-6.275c.2-.193.13-.353-.145-.355L15.5,11.5V1.5a1,1,0,0,0-1-1h-5a1,1,0,0,0-1,1V11a.5.5,0,0,1-.5.5Z" />
      <path d="M23.5,18.5v4a1,1,0,0,1-1,1H1.5a1,1,0,0,1-1-1v-4" />
    </svg>
  );
}

function PrintViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5,19.499h9 M7.5,16.499h9 M5.5,16.5h-3c-1.103-0.003-1.997-0.897-2-2v-6c0.003-1.103,0.897-1.997,2-2h19 c1.103,0.003,1.997,0.897,2,2v6c-0.003,1.103-0.897,1.997-2,2h-3 M5.5,4.5v-4h9.586c0.265,0,0.52,0.105,0.707,0.293l2.414,2.414 C18.395,3.394,18.5,3.649,18.5,3.914V4.5 M18.5,22.5c0,0.552-0.448,1-1,1h-11c-0.552,0-1-0.448-1-1v-9h13V22.5z M3.5,8.499 c0.552,0,1,0.448,1,1s-0.448,1-1,1s-1-0.448-1-1S2.948,8.499,3.5,8.499z M14.5,0.499v4h4" />
    </svg>
  );
}

function MoreViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12,0.5c1.381,0,2.5,1.119,2.5,2.5S13.381,5.5,12,5.5S9.5,4.381,9.5,3S10.619,0.5,12,0.5z M12,9.5 c1.381,0,2.5,1.119,2.5,2.5s-1.119,2.5-2.5,2.5S9.5,13.381,9.5,12S10.619,9.5,12,9.5z M12,18.5c1.381,0,2.5,1.119,2.5,2.5 s-1.119,2.5-2.5,2.5S9.5,22.381,9.5,21S10.619,18.5,12,18.5z" />
    </svg>
  );
}

function ThemeViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5,15.106l2.4-2.4a1,1,0,0,0,0-1.414l-2.4-2.4V5.5a1,1,0,0,0-1-1H15.106l-2.4-2.4a1,1,0,0,0-1.414,0l-2.4,2.4H5.5a1,1,0,0,0-1,1V8.894l-2.4,2.4a1,1,0,0,0,0,1.414l2.4,2.4V18.5a1,1,0,0,0,1,1H8.894l2.4,2.4a1,1,0,0,0,1.414,0l2.4-2.4H18.5a1,1,0,0,0,1-1Z" />
      <path d="M10,6.349a6,6,0,0,1,0,11.3,6,6,0,1,0,0-11.3Z" />
    </svg>
  );
}

type ViewerToolButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltipSide?: 'left' | 'right';
  leftControl?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
  dark?: boolean;
  children: React.ReactNode;
};

function ViewerToolButton({
  label,
  onClick,
  disabled,
  tooltipSide = 'right',
  leftControl = false,
  buttonRef,
  dark = false,
  children,
}: ViewerToolButtonProps) {
  return (
    <span className={[
      'group/viewer-tip relative shrink-0',
      leftControl ? 'flex h-[38px] w-9 items-center justify-center' : '',
    ].join(' ')}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
          disabled
            ? dark ? 'cursor-not-allowed text-white/30' : 'cursor-not-allowed text-[#1A1A1A]/30'
            : dark
              ? 'text-white hover:bg-white/10 active:bg-white/15'
              : 'text-[#1A1A1A] hover:bg-[rgba(0,0,0,0.06)] active:bg-black/10',
        ].join(' ')}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-[6px]',
          dark
            ? 'bg-white px-2 py-1 text-[11px] text-[#1A1A1A] opacity-0 transition-opacity duration-150'
            : 'bg-[#1A1A1A] px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150',
          'group-hover/viewer-tip:opacity-100 group-focus-within/viewer-tip:opacity-100',
          tooltipSide === 'left' ? 'right-full mr-1' : 'left-full ml-1',
        ].join(' ')}
      >
        {label}
      </span>
    </span>
  );
}

function PreviewFieldValue({ field }: { field: DocumentPreviewField }) {
  const valueClass = field.muted ? 'italic text-[#737373]' : '';

  if (Array.isArray(field.value)) {
    return (
      <ul className="space-y-1">
        {field.value.map(item => <li key={item}>• {item}</li>)}
      </ul>
    );
  }

  return <span className={valueClass}>{field.value}</span>;
}

function PreviewFields({ fields }: { fields: DocumentPreviewField[] }) {
  return (
    <div className="space-y-3 text-sm">
      {fields.map(field => (
        <div key={field.label} className="flex gap-3">
          <span className="w-32 shrink-0 text-[#737373]">{field.label}</span>
          <PreviewFieldValue field={field} />
        </div>
      ))}
    </div>
  );
}

function SimulatedPdfPage({
  page,
  highlightSearch,
  fixture,
}: {
  page: number;
  highlightSearch: boolean;
  fixture: DocumentPreviewFixture;
}) {
  return (
    <div className="h-full px-8 py-10 text-[#1A1A1A] sm:px-10">
      {page === 1 ? (
        <>
          {fixture.organization && (
            <div className="mb-6 border-b border-[#E5E5E5] pb-5">
              <p className="text-sm font-bold">{fixture.organization}</p>
              {fixture.organizationDetail && (
                <p className="mt-0.5 text-xs text-[#737373]">{fixture.organizationDetail}</p>
              )}
            </div>
          )}
          <p className="mb-6 text-center text-sm font-bold uppercase tracking-wide">
            <span className={highlightSearch ? 'bg-yellow-200/70' : ''}>{fixture.title}</span>
          </p>
          <PreviewFields fields={fixture.fields} />
          {fixture.footerFields && fixture.footerFields.length > 0 && (
            <div className="mt-8 border-t border-[#E5E5E5] pt-6">
              <PreviewFields fields={fixture.footerFields} />
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mb-6 text-center text-sm font-bold uppercase tracking-wide">
            {fixture.title} — Continuación
          </p>
          {fixture.continuationFields && <PreviewFields fields={fixture.continuationFields} />}
        </>
      )}
    </div>
  );
}

export function DocumentViewer({
  file,
  imageUrl,
  previewFixture = prescriptionDocumentPreview,
}: {
  file: File;
  imageUrl: string;
  previewFixture?: DocumentPreviewFixture;
}) {
  const pdf = isPdf(file);
  const totalPages = pdf ? 7 : 1;
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomPercent, setZoomPercent] = useState(130);
  const [zoomMode, setZoomMode] = useState<'fixed' | 'fit-width' | 'fit-page'>('fixed');
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [viewerDark, setViewerDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const [mountedRange, setMountedRange] = useState({ start: 1, end: 2 });
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchPopoverRef = useRef<HTMLDivElement>(null);
  const zoomSelectorRef = useRef<HTMLButtonElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const toolbarLayoutRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const userSelectedZoomRef = useRef(false);
  const initialZoomResolvedRef = useRef(false);
  const [viewerWidth, setViewerWidth] = useState(0);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const letterWidth = 612;
  const letterHeight = 792;
  const documentGutter = 16;
  const desktopRailWidth = 44;
  const desktopThumbnailWidth = 275;
  const secondaryActionsHidden = toolbarWidth > 0 && toolbarWidth < 560;
  const compactToolbar = toolbarWidth > 0 && toolbarWidth <= 400;
  const [compactChrome, setCompactChrome] = useState(false);
  const pageWidth = letterWidth * (zoomPercent / 100);
  const pageHeight = letterHeight * (zoomPercent / 100);
  const sheetInset = 4 * (zoomPercent / 100);
  const sheetWidth = 604 * (zoomPercent / 100);
  const sheetHeight = 784 * (zoomPercent / 100);

  const sampleText = [
    previewFixture.organization,
    previewFixture.organizationDetail,
    previewFixture.title,
    ...previewFixture.fields.flatMap(field =>
      [field.label, ...(Array.isArray(field.value) ? field.value : [field.value])]),
    ...(previewFixture.footerFields ?? []).flatMap(field =>
      [field.label, ...(Array.isArray(field.value) ? field.value : [field.value])]),
    ...(previewFixture.continuationFields ?? []).flatMap(field =>
      [field.label, ...(Array.isArray(field.value) ? field.value : [field.value])]),
  ].filter(Boolean).join(' ');
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const matchTotal = normalizedQuery && sampleText.toLocaleLowerCase().includes(normalizedQuery) ? 3 : 0;

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (!searchOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !searchTriggerRef.current?.contains(target) &&
        !searchPopoverRef.current?.contains(target)
      ) {
        setSearchOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        if (compactToolbar) {
          moreTriggerRef.current?.focus();
        } else {
          searchTriggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [compactToolbar, searchOpen]);

  useEffect(() => {
    if (!zoomMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !zoomSelectorRef.current?.contains(target) &&
        !zoomMenuRef.current?.contains(target)
      ) {
        setZoomMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomMenuOpen(false);
        zoomSelectorRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomMenuOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !moreTriggerRef.current?.contains(target) &&
        !moreMenuRef.current?.contains(target)
      ) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
        moreTriggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreMenuOpen]);

  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    const toolbar = toolbarLayoutRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !toolbar || !canvas) return;
    const updateSize = () => {
      setViewerWidth(viewer.clientWidth);
      setToolbarWidth(toolbar.clientWidth);
      setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewer);
    observer.observe(toolbar);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (toolbarWidth === 0 || canvasSize.width === 0) return;
    setCompactChrome(currentCompactChrome => {
      const desktopChromeWidth =
        desktopRailWidth + (thumbnailsOpen ? desktopThumbnailWidth : 0);
      const projectedDesktopCanvas = currentCompactChrome
        ? Math.max(0, canvasSize.width - desktopChromeWidth)
        : canvasSize.width;
      const projectedCompactDocument =
        projectedDesktopCanvas < letterWidth + documentGutter;
      return toolbarWidth < 560 || projectedCompactDocument;
    });
  }, [canvasSize.width, documentGutter, letterWidth, thumbnailsOpen, toolbarWidth]);

  useLayoutEffect(() => {
    if (canvasSize.width === 0 || userSelectedZoomRef.current) return;
    const defaultZoomRequiredWidth = letterWidth * 1.3 + documentGutter;
    if (!initialZoomResolvedRef.current) {
      initialZoomResolvedRef.current = true;
      if (canvasSize.width < defaultZoomRequiredWidth) setZoomMode('fit-width');
      return;
    }
    if (
      zoomMode === 'fixed' &&
      zoomPercent === 130 &&
      canvasSize.width < defaultZoomRequiredWidth
    ) {
      setZoomMode('fit-width');
    }
  }, [canvasSize.width, documentGutter, letterWidth, zoomMode, zoomPercent]);

  useLayoutEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;
    const availableWidth = Math.max(1, canvasSize.width - documentGutter);
    const availableHeight = Math.max(1, canvasSize.height - documentGutter);
    if (zoomMode === 'fit-width') {
      setZoomPercent(Math.max(1, (availableWidth / letterWidth) * 100));
    } else if (zoomMode === 'fit-page') {
      setZoomPercent(Math.min(
        availableWidth / letterWidth,
        availableHeight / letterHeight,
      ) * 100);
    }
  }, [canvasSize, documentGutter, zoomMode]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    canvasRef.current.scrollTo({
      top: (page - 1) * pageHeight,
    });
  }, [pageHeight, pdf]);

  const commitPageInput = () => {
    const requestedPage = Number(pageInput);
    if (Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= totalPages) {
      setPage(requestedPage);
      canvasRef.current?.scrollTo({
        top: (requestedPage - 1) * pageHeight,
      });
    } else {
      setPageInput(String(page));
    }
  };

  const navigateToPage = (requestedPage: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, requestedPage));
    setPage(nextPage);
    canvasRef.current?.scrollTo({
      top: (nextPage - 1) * pageHeight,
    });
  };

  const handleCanvasScroll = (canvas: HTMLDivElement) => {
    if (!pdf || pageHeight <= 0) return;
    const viewportTop = canvas.scrollTop;
    const viewportBottom = viewportTop + canvas.clientHeight;
    let dominantPage = 1;
    let dominantVisibleHeight = -1;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const pageTop = (pageNumber - 1) * pageHeight;
      const pageBottom = pageTop + pageHeight;
      const visibleHeight = Math.max(
        0,
        Math.min(pageBottom, viewportBottom) - Math.max(pageTop, viewportTop),
      );
      if (visibleHeight > dominantVisibleHeight) {
        dominantVisibleHeight = visibleHeight;
        dominantPage = pageNumber;
      }
    }

    if (dominantPage !== page) setPage(dominantPage);

    const firstVisible = Math.max(1, Math.floor(viewportTop / pageHeight) + 1);
    const lastVisible = Math.min(totalPages, Math.floor(Math.max(0, viewportBottom - 1) / pageHeight) + 1);
    const nextRange = {
      start: Math.max(1, firstVisible - 2),
      end: Math.min(totalPages, lastVisible + 1),
    };
    setMountedRange(current =>
      current.start === nextRange.start && current.end === nextRange.end
        ? current
        : nextRange,
    );
  };

  const zoomSteps = [50, 75, 100, 125, 130, 150, 200, 300, 400];

  const changeZoom = (direction: -1 | 1) => {
    const nextZoom = direction < 0
      ? [...zoomSteps].reverse().find(value => value < zoomPercent) ?? zoomSteps[0]
      : zoomSteps.find(value => value > zoomPercent) ?? zoomSteps[zoomSteps.length - 1];
    userSelectedZoomRef.current = true;
    setZoomMode('fixed');
    setZoomPercent(nextZoom);
  };

  const zoomLabel = `${Math.round(zoomPercent)}%`;

  const zoomMenuOptions = [
    { value: 'actual', label: 'Tamaño real' },
    { value: 'page', label: 'Ajustar a la página' },
    { value: 'width', label: 'Ajustar al ancho' },
    { value: '50', label: '50 %', dividerBefore: true },
    { value: '75', label: '75 %' },
    { value: '100', label: '100 %' },
    { value: '125', label: '125 %' },
    { value: '150', label: '150 %' },
    { value: '200', label: '200 %' },
    { value: '300', label: '300 %' },
    { value: '400', label: '400 %' },
  ];

  const sideControls = [
    { key: 'thumbnails', label: 'Miniaturas', icon: ThumbnailViewerIcon },
    { key: 'bookmarks', label: 'Marcadores', icon: BookmarkViewerIcon },
    { key: 'attachments', label: 'Adjuntos', icon: AttachmentViewerIcon },
  ];

  const moreMenuItems: ViewerActionItem[] = [
    ...(compactToolbar ? [
      {
        label: 'Buscar en el documento',
        icon: SearchViewerIcon,
        action: () => setSearchOpen(true),
      },
      {
        label: 'Reducir zoom',
        icon: () => <ZoomViewerIcon type="minus" />,
        action: () => changeZoom(-1),
      },
      {
        label: 'Aumentar zoom',
        icon: () => <ZoomViewerIcon type="plus" />,
        action: () => changeZoom(1),
      },
    ] : []),
    ...(compactChrome ? sideControls.map(control => ({
      label: control.label,
      icon: control.icon,
      disabled: !pdf && control.key === 'thumbnails',
      action: control.key === 'thumbnails'
        ? () => setThumbnailsOpen(open => !open)
        : undefined,
    })) : []),
    ...(secondaryActionsHidden ? [
      {
        label: viewerDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
        icon: ThemeViewerIcon,
        action: () => setViewerDark(value => !value),
      },
      { label: 'Pantalla completa', icon: FullScreenViewerIcon },
      { label: 'Descargar', icon: DownloadViewerIcon },
      { label: 'Imprimir', icon: PrintViewerIcon },
    ] : []),
  ];

  return (
    <div
      ref={viewerRef}
      className="flex h-full w-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden bg-white"
    >
      <div className="viewer-toolbar relative z-20 h-10 w-full shrink-0">
        <div className={[
          'flex h-full w-full flex-nowrap items-center overflow-hidden border-b p-0',
          viewerDark ? 'border-white/10 bg-[#292929] text-white' : 'border-black/10 bg-[#EEEEEE]',
        ].join(' ')}>
          <div
            ref={toolbarLayoutRef}
            className="viewer-toolbar-layout flex h-full w-full min-w-0 max-w-full flex-nowrap items-center overflow-hidden"
          >
          <div className="flex shrink-0 grow-0 items-center gap-0.5 whitespace-nowrap">
            <span className="viewer-search-action contents">
              <ViewerToolButton
                label="Buscar en el documento"
                leftControl
                buttonRef={searchTriggerRef}
                dark={viewerDark}
                onClick={() => setSearchOpen(open => !open)}
              >
                <SearchViewerIcon />
              </ViewerToolButton>
            </span>
            {pdf && (
              <>
                <ViewerToolButton
                  label="Página anterior"
                  leftControl
                  dark={viewerDark}
                  disabled={page === 1}
                  onClick={() => navigateToPage(page - 1)}
                >
                  <ArrowViewerIcon direction="up" />
                </ViewerToolButton>
                <span className={[
                  'viewer-page-control flex h-8 w-[77px] shrink-0 items-center gap-1 text-sm',
                  viewerDark ? 'text-white' : 'text-[#1A1A1A]',
                ].join(' ')}>
                  <input
                    value={pageInput}
                    inputMode="numeric"
                    aria-label="Página actual"
                    onChange={event => setPageInput(event.target.value.replace(/\D/g, ''))}
                    onBlur={commitPageInput}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        commitPageInput();
                        event.currentTarget.blur();
                      }
                    }}
                    className={[
                      'viewer-page-input h-8 w-12 rounded-[4px] border pr-2 text-right text-sm outline-none focus:border-[#1A5FD0]',
                      viewerDark
                        ? 'border-[#121212] bg-[#121212] text-white'
                        : 'border-black/20 bg-white text-[#1A1A1A]',
                    ].join(' ')}
                  />
                  <span>/ {totalPages}</span>
                </span>
                <ViewerToolButton
                  label="Página siguiente"
                  leftControl
                  dark={viewerDark}
                  disabled={page === totalPages}
                  onClick={() => navigateToPage(page + 1)}
                >
                  <ArrowViewerIcon direction="down" />
                </ViewerToolButton>
              </>
            )}
          </div>

          <div className="viewer-zoom-control flex min-w-0 flex-[1_1_140px] items-center justify-center gap-0.5">
            <span className="viewer-zoom-step-action contents">
              <ViewerToolButton label="Reducir zoom" leftControl dark={viewerDark} onClick={() => changeZoom(-1)}>
                <ZoomViewerIcon type="minus" />
              </ViewerToolButton>
            </span>
            <span className={[
              'flex h-8 items-center justify-center',
              'w-[68px]',
            ].join(' ')}>
              <button
                ref={zoomSelectorRef}
                type="button"
                aria-label="Seleccionar escala del documento"
                aria-haspopup="menu"
                aria-expanded={zoomMenuOpen}
                onClick={() => setZoomMenuOpen(open => !open)}
                className={[
                  'flex h-8 items-center justify-center gap-1.5 rounded-[4px] bg-transparent text-sm font-normal transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
                  viewerDark
                    ? 'text-white hover:bg-white/10 active:bg-white/15'
                    : 'text-[#1A1A1A] hover:bg-[rgba(0,0,0,0.06)] active:bg-black/10',
                  'w-16',
                ].join(' ')}
              >
                <span>{zoomLabel}</span>
                <span className={[
                  'block h-0 w-0 shrink-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent',
                  viewerDark ? 'border-t-white' : 'border-t-black/60',
                ].join(' ')} />
              </button>
            </span>
            <span className="viewer-zoom-step-action contents">
              <ViewerToolButton label="Aumentar zoom" leftControl dark={viewerDark} onClick={() => changeZoom(1)}>
                <ZoomViewerIcon type="plus" />
              </ViewerToolButton>
            </span>
          </div>

          <div className="flex shrink-0 grow-0 items-center justify-end gap-0.5 whitespace-nowrap">
            {!secondaryActionsHidden && <span className="viewer-secondary-action contents">
              <ViewerToolButton
                label={viewerDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                tooltipSide="left"
                dark={viewerDark}
                onClick={() => setViewerDark(value => !value)}
              >
                <ThemeViewerIcon />
              </ViewerToolButton>
              <ViewerToolButton label="Pantalla completa" tooltipSide="left" dark={viewerDark}>
                <FullScreenViewerIcon />
              </ViewerToolButton>
              <ViewerToolButton label="Descargar" tooltipSide="left" dark={viewerDark}>
                <DownloadViewerIcon />
              </ViewerToolButton>
              <ViewerToolButton label="Imprimir" tooltipSide="left" dark={viewerDark}>
                <PrintViewerIcon />
              </ViewerToolButton>
            </span>}
            <ViewerToolButton
              label="Más acciones"
              tooltipSide="left"
              dark={viewerDark}
              buttonRef={moreTriggerRef}
              onClick={() => setMoreMenuOpen(open => !open)}
            >
              <MoreViewerIcon />
            </ViewerToolButton>
          </div>
        </div>
        </div>

        {moreMenuOpen && (
          <div
            ref={moreMenuRef}
            role="menu"
            aria-label="Más acciones"
            className={[
              'viewer-overflow-menu absolute right-1 top-full z-50 mt-1 w-[220px] rounded-[4px] border py-1 shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
              viewerDark ? 'border-white/25 bg-[#292929]' : 'border-black/30 bg-white',
            ].join(' ')}
          >
            {moreMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.action?.();
                    setMoreMenuOpen(false);
                  }}
                  className={[
                    'flex h-8 w-full items-center gap-2 px-3 text-left text-sm transition-colors focus-visible:outline-none',
                    viewerDark
                      ? 'text-white hover:bg-white/10 focus-visible:bg-white/10'
                      : 'text-[#1A1A1A] hover:bg-black/[0.06] focus-visible:bg-black/[0.06]',
                    item.disabled ? 'cursor-not-allowed opacity-30' : '',
                  ].join(' ')}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {zoomMenuOpen && (
          <div
            ref={zoomMenuRef}
            role="menu"
            aria-label="Escala del documento"
            className={[
              'absolute left-1/2 top-full z-50 mt-1 w-[148px] -translate-x-1/2 rounded-[4px] border py-2',
              viewerDark ? 'border-white/25 bg-[#292929]' : 'border-black/30 bg-white',
            ].join(' ')}
          >
            {zoomMenuOptions.map(option => {
              const selected =
                (option.value === 'page' && zoomMode === 'fit-page') ||
                (option.value === 'width' && zoomMode === 'fit-width') ||
                (!['actual', 'page', 'width'].includes(option.value) &&
                  zoomMode === 'fixed' &&
                  Math.round(zoomPercent) === Number(option.value));
              return (
              <div key={option.value}>
                {option.dividerBefore && <div className={['my-1 h-px', viewerDark ? 'bg-white/15' : 'bg-black/10'].join(' ')} />}
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    userSelectedZoomRef.current = true;
                    if (option.value === 'actual') {
                      setZoomMode('fixed');
                      setZoomPercent(100);
                    } else if (option.value === 'page') {
                      setZoomMode('fit-page');
                    } else if (option.value === 'width') {
                      setZoomMode('fit-width');
                    } else {
                      setZoomMode('fixed');
                      setZoomPercent(Number(option.value));
                    }
                    setZoomMenuOpen(false);
                    requestAnimationFrame(() => zoomSelectorRef.current?.focus());
                  }}
                  className={[
                    'flex h-[30px] w-full items-center px-3 text-left text-sm transition-colors focus-visible:outline-none',
                    viewerDark
                      ? 'text-white hover:bg-white/10 focus-visible:bg-white/10'
                      : 'text-[#1A1A1A] hover:bg-black/[0.06] focus-visible:bg-black/[0.06]',
                    selected
                      ? viewerDark ? 'bg-white/10 font-medium' : 'bg-black/[0.06] font-medium'
                      : 'font-normal',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              </div>
            )})}
          </div>
        )}

        {searchOpen && (
          <div
            ref={searchPopoverRef}
            className={[
              'absolute left-2 top-full z-50 mt-1.5 h-[156px] w-[210px] rounded-[4px] border p-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
              viewerDark ? 'border-white/25 bg-[#292929]' : 'border-black/30 bg-white',
            ].join(' ')}
          >
            <span className={[
              'absolute -top-[5px] left-3 h-2.5 w-2.5 rotate-45 border-l border-t',
              viewerDark ? 'border-white/25 bg-[#292929]' : 'border-black/30 bg-white',
            ].join(' ')} />
            <div className="relative">
              <input
                autoFocus
                value={searchQuery}
                onChange={event => {
                  const value = event.target.value;
                  setSearchQuery(value);
                  const known = value.trim() && sampleText.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase());
                  setMatchIndex(known ? 1 : 0);
                }}
                placeholder="Escribir para buscar"
                className={[
                  'h-8 w-full rounded-[4px] border pl-2 pr-10 text-[13px] outline-none placeholder:text-[#737373] focus:border-[#1A5FD0]',
                  viewerDark ? 'border-white/20 bg-[#121212] text-white' : 'border-black/20 bg-white text-[#1A1A1A]',
                ].join(' ')}
              />
              <span className={[
                'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px]',
                viewerDark ? 'text-white/60' : 'text-[#737373]',
              ].join(' ')}>
                {matchTotal > 0 ? `${matchIndex}/${matchTotal}` : '0/0'}
              </span>
            </div>
            <label className={['mt-2 flex h-5 items-center gap-2 text-xs font-normal', viewerDark ? 'text-white' : 'text-[#1A1A1A]'].join(' ')}>
              <input
                type="checkbox"
                checked={matchCase}
                onChange={event => setMatchCase(event.target.checked)}
                className="h-3.5 w-3.5 accent-[#1A5FD0]"
              />
              Coincidir mayúsculas
            </label>
            <label className={['mt-1 flex h-5 items-center gap-2 text-xs font-normal', viewerDark ? 'text-white' : 'text-[#1A1A1A]'].join(' ')}>
              <input
                type="checkbox"
                checked={wholeWords}
                onChange={event => setWholeWords(event.target.checked)}
                className="h-3.5 w-3.5 accent-[#1A5FD0]"
              />
              Palabras completas
            </label>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                disabled={searchQuery.trim() === ''}
                onClick={() => {
                  if (matchTotal > 0) {
                    setMatchIndex(current => current >= matchTotal ? 1 : Math.max(1, current + 1));
                  }
                }}
                className={[
                  'h-7 rounded-[4px] px-3 text-xs font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-30',
                  viewerDark ? 'bg-white text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white',
                ].join(' ')}
              >
                Buscar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex w-full min-h-0 min-w-0 max-w-full flex-1 overflow-hidden">
        {!compactChrome && <div className={[
          'flex w-11 shrink-0 flex-col items-center gap-1 border-r py-2',
          viewerDark ? 'border-white/10 bg-[#292929]' : 'border-black/10 bg-[#EEEEEE]',
        ].join(' ')}>
          {sideControls.map(control => {
            const Icon = control.icon;
            const active = control.key === 'thumbnails' && thumbnailsOpen;
            const disabled = !pdf && control.key === 'thumbnails';
            return (
              <span key={control.key} className="group/rail-tip relative">
                <button
                  type="button"
                  aria-label={control.label}
                  aria-pressed={control.key === 'thumbnails' ? active : undefined}
                  disabled={disabled}
                  onClick={() => {
                    if (control.key === 'thumbnails') setThumbnailsOpen(open => !open);
                  }}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
                    disabled
                      ? viewerDark ? 'cursor-not-allowed text-white opacity-30' : 'cursor-not-allowed text-[#1A1A1A] opacity-30'
                      : active
                        ? viewerDark ? 'bg-[#1A5FD0] text-white' : 'bg-black/10 text-[#1A1A1A]'
                        : viewerDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A1A] hover:bg-black/5',
                  ].join(' ')}
                >
                  <Icon />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-40 ml-1 -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-[#1A1A1A] px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover/rail-tip:opacity-100 group-focus-within/rail-tip:opacity-100"
                >
                  {control.label}
                </span>
              </span>
            );
          })}
        </div>}

        {pdf && (
          <div
            className={[
              'shrink-0 overflow-hidden transition-[width,border-color] duration-200 ease-out',
              viewerDark ? 'bg-[#292929]' : 'bg-white',
              compactChrome
                ? [
                    'absolute bottom-0 left-0 top-0 z-10',
                    thumbnailsOpen
                      ? viewerDark
                        ? 'w-[min(275px,calc(100%-24px))] border-r border-white/10'
                        : 'w-[min(275px,calc(100%-24px))] border-r border-black/10'
                      : 'w-0 border-r border-transparent',
                  ].join(' ')
                : thumbnailsOpen
                  ? viewerDark ? 'w-[275px] border-r border-white/10' : 'w-[275px] border-r border-black/10'
                  : 'w-0 border-r border-transparent',
            ].join(' ')}
            aria-hidden={!thumbnailsOpen}
          >
            <div className={[
              'h-full overflow-y-auto p-2 transition-opacity duration-150',
              compactChrome ? 'w-full' : 'w-[275px]',
              thumbnailsOpen ? 'opacity-100' : 'opacity-0',
            ].join(' ')}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(thumbnailPage => (
                <button
                  key={thumbnailPage}
                  type="button"
                  tabIndex={thumbnailsOpen ? 0 : -1}
                  onClick={() => navigateToPage(thumbnailPage)}
                  className={[
                    'flex h-[170px] w-full flex-col items-center justify-start rounded-[6px] pt-2 transition-colors',
                    page === thumbnailPage
                      ? viewerDark ? 'bg-white/10' : 'bg-[#F5F5F5]'
                      : viewerDark ? 'hover:bg-white/5' : 'hover:bg-[#FAFAFA]',
                  ].join(' ')}
                >
                  <span className="block h-[129px] w-[100px] overflow-hidden bg-white shadow-[2px_2px_8px_rgba(0,0,0,0.20)]">
                    <span className="block h-full origin-top-left scale-[0.22] whitespace-nowrap p-2 text-[10px] text-[#1A1A1A]">
                      {previewFixture.title.toLocaleUpperCase()}
                    </span>
                  </span>
                  <span className={['mt-2 block text-center text-[10px]', viewerDark ? 'text-white/70' : 'text-[#737373]'].join(' ')}>Página {thumbnailPage}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={canvasRef}
          onScroll={event => handleCanvasScroll(event.currentTarget)}
          className={[
            'min-w-0 max-w-full flex-1 overflow-auto p-0 transition-[width] duration-200 ease-out',
            viewerDark ? 'bg-[#1A1A1A]' : 'bg-white',
          ].join(' ')}
        >
          {pdf ? (
            <div
              className="relative min-w-full"
              style={{
                width: pageWidth,
                height: totalPages * pageHeight,
              }}
            >
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(documentPage =>
                  documentPage >= mountedRange.start && documentPage <= mountedRange.end,
                )
                .map(documentPage => (
                  <div
                    key={documentPage}
                    className="absolute left-1/2 m-0 rounded-none border-0 bg-transparent"
                    style={{
                      width: pageWidth,
                      height: pageHeight,
                      top: (documentPage - 1) * pageHeight,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div
                      className="absolute bg-white shadow-[2px_2px_8px_rgba(0,0,0,0.20)]"
                      style={{
                        left: sheetInset,
                        top: sheetInset,
                        width: sheetWidth,
                        height: sheetHeight,
                        contain: 'layout paint',
                      }}
                    >
                      <SimulatedPdfPage
                        page={documentPage}
                        highlightSearch={matchTotal > 0 && documentPage === 1}
                        fixture={previewFixture}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Vista previa del documento seleccionado"
              className="mx-auto block object-contain"
              style={zoomMode === 'fit-width'
                ? {
                    width: 'calc(100% - 16px)',
                    minWidth: 0,
                    maxWidth: 'none',
                  }
                : {
                    width: `${Math.min(224, 56 * (zoomPercent / 100))}%`,
                    minWidth: 220,
                    maxWidth: Math.max(760, 560 * (zoomPercent / 100)),
                  }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface OriginFieldsProps {
  originId: string;
  originChannel: string;
  originOtro: string;
  disabled: boolean;
  onChannelChange: (value: string) => void;
  onOtherChange: (value: string) => void;
}

function OriginFields({
  originId,
  originChannel,
  originOtro,
  disabled,
  onChannelChange,
  onOtherChange,
}: OriginFieldsProps) {
  const isOtro = originChannel === 'Otro';
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={originId}>Canal de origen</FieldLabel>
      <select
        id={originId}
        value={originChannel}
        onChange={event => onChannelChange(event.target.value)}
        disabled={disabled}
        className={[
          "h-11 w-full appearance-none rounded-[8px] border border-[#E5E5E5] bg-[#FFFFFF] px-3 pr-10",
          "text-sm text-[#1A1A1A] outline-none transition-colors",
          "focus:border-[#1A5FD0] focus:ring-1 focus:ring-[#1A5FD0]",
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          originChannel === '' ? 'text-[#737373]' : '',
        ].join(' ')}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        <option value="" disabled>Seleccione un canal</option>
        <option value="Guardia de Emergencias">Guardia de Emergencias</option>
        <option value="Consulta Externa">Consulta Externa</option>
        <option value="Hospitalización">Hospitalización</option>
        <option value="Laboratorio">Laboratorio</option>
        <option value="Referencia Externa">Referencia Externa</option>
        <option value="Otro">Otro</option>
      </select>
      {isOtro && (
        <div className="space-y-2 pt-2">
          <FieldLabel htmlFor={`${originId}-otro`}>Especifique el canal</FieldLabel>
          <input
            id={`${originId}-otro`}
            type="text"
            value={originOtro}
            onChange={event => onOtherChange(event.target.value)}
            placeholder="Escriba el canal de origen"
            disabled={disabled}
            className="h-11 w-full rounded-[8px] border border-[#E5E5E5] bg-white px-3 text-sm text-[#1A1A1A] outline-none placeholder:text-[#737373] focus:border-[#1A5FD0] focus:ring-1 focus:ring-[#1A5FD0] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}

export function ProcessingView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const originId = useId();
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = new URLSearchParams(window.location.search).get('scenario') ?? 'processed';
  const [activeMode, setActiveMode] = useState<InputMode>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [originChannel, setOriginChannel] = useState('');
  const [originOtro, setOriginOtro] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedFile || isPdf(selectedFile)) {
      setImageUrl('');
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const isOtro = originChannel === 'Otro';
  const hasOrigin = originChannel !== '' && (!isOtro || originOtro.trim().length > 0);
  const isValid = activeMode === 'file'
    ? selectedFile !== null && hasOrigin
    : documentText.trim().length > 0 && hasOrigin;
  const hasClearableData =
    selectedFile !== null ||
    documentText.length > 0 ||
    originChannel !== '' ||
    originOtro.length > 0 ||
    validationError ||
    processingError;

  const handleFiles = useCallback((files: FileList | null) => {
    if (isProcessing || !files?.length) return;
    const file = files[0];
    if (!isValidFile(file)) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setProcessingError(false);
    setSelectedFile(file);
  }, [isProcessing]);

  const openPicker = () => {
    if (isProcessing) return;
    setValidationError(false);
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    if (isProcessing) return;
    setSelectedFile(null);
    setDocumentText('');
    setOriginChannel('');
    setOriginOtro('');
    setValidationError(false);
    setProcessingError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!isValid || isProcessing) return;
    setProcessingError(false);
    setIsProcessing(true);
    const resolvedScenario = SUCCESS_SCENARIOS.has(scenario) ? scenario : 'processed';
    const isError = scenario === 'http_error';

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (isError) {
        setIsProcessing(false);
        setProcessingError(true);
        return;
      }
      if (activeMode === 'file' && selectedFile) {
        setProcessingSourceContext(resolvedScenario, {
          kind: 'file',
          file: selectedFile,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        });
      } else if (activeMode === 'text') {
        setProcessingSourceContext(resolvedScenario, {
          kind: 'text',
          text: documentText.trim(),
        });
      }
      history.pushState(null, '', `?view=result&scenario=${resolvedScenario}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 1500);
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (isProcessing) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const actions = (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isProcessing || !isValid}
          onClick={handleSubmit}
          className={[
            "flex h-11 items-center gap-2 rounded-[8px] px-5 text-sm font-semibold transition-colors",
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0] focus-visible:ring-offset-2',
            isProcessing || isValid
              ? 'bg-[#1A5FD0] text-[#FFFFFF]'
              : 'cursor-not-allowed bg-[#F5F5F5] text-[#737373]',
            isProcessing ? 'cursor-not-allowed opacity-85' : isValid ? 'hover:bg-[#174fa9]' : '',
          ].join(' ')}
        >
          {isProcessing && <Spinner />}
          {isProcessing
            ? activeMode === 'text' ? 'Procesando texto…' : 'Procesando documento…'
            : processingError
              ? 'Reintentar'
              : activeMode === 'text' ? 'Procesar texto' : 'Procesar documento'}
        </button>
        <button
          type="button"
          disabled={isProcessing || !hasClearableData}
          onClick={handleClear}
          className="h-11 rounded-[8px] border border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#737373] transition-colors hover:border-[#1A5FD0] hover:text-[#1A5FD0] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Limpiar
        </button>
      </div>
      {isProcessing && (
        <p className="text-xs text-[#737373]">
          El procesamiento puede tardar unos segundos.
        </p>
      )}
    </div>
  );

  return (
    <div className={[
      'bg-[#FAFAFA] px-4 text-[#1A1A1A] sm:px-7',
      activeMode === 'file' && selectedFile !== null
        ? 'min-h-full pb-12 lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0'
        : 'min-h-full pb-12',
    ].join(' ')}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        disabled={isProcessing}
        onChange={event => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div className={[
        'mx-auto w-full max-w-[1400px]',
        activeMode === 'file' && selectedFile !== null ? 'lg:flex lg:h-full lg:flex-col' : '',
      ].join(' ')}>
        <header className="mb-3 flex h-[72px] shrink-0 flex-col justify-center border-b border-[#E5E5E5]">
          <h1 className="text-xl font-semibold leading-7 text-[#1A1A1A]">
            Procesamiento de documentos
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#737373]">
            Cargue un documento clínico o ingrese texto para iniciar su clasificación, extracción y enrutamiento.
          </p>
        </header>

        <div className="mb-5 flex h-10 shrink-0 items-end gap-6 border-b border-[#E5E5E5]" role="tablist">
          {([
            ['file', 'Archivo', imgIconUpload],
            ['text', 'Texto', imgIconText],
          ] as const).map(([mode, label, icon]) => (
            <button
              key={mode}
              role="tab"
              type="button"
              aria-selected={activeMode === mode}
              disabled={isProcessing}
              onClick={() => {
                setActiveMode(mode);
                setProcessingError(false);
              }}
              className={[
                'relative flex h-10 items-center gap-2 px-0.5 text-sm font-normal leading-[22px] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0]',
                activeMode === mode ? 'text-[#1A5FD0]' : 'text-[#1A1A1A]',
                isProcessing ? 'cursor-not-allowed opacity-50' : '',
              ].join(' ')}
            >
              <img src={icon} alt="" className="h-4 w-4" />
              {label}
              {activeMode === mode && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1A5FD0]" />}
            </button>
          ))}
        </div>

        {activeMode === 'file' && selectedFile === null && (
          <section
            aria-busy={isProcessing}
            className="mx-auto max-w-4xl rounded-[12px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 sm:p-7"
          >
            <div className="mb-3 text-sm font-semibold text-[#1A1A1A]">
              Documento <span className="text-[#FF6B35]">*</span>
            </div>
            <div
              onClick={openPicker}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={event => {
                event.preventDefault();
                setIsDragOver(false);
                handleFiles(event.dataTransfer.files);
              }}
              className={[
                'flex h-[296px] cursor-pointer flex-col items-center justify-center px-4 py-6 text-center transition-colors',
                isDragOver
                  ? 'rounded-[10px] border-[0.8px] border-dashed border-[#D3D3D3] bg-[#FBFBFB]'
                  : 'border-0 bg-white shadow-none',
              ].join(' ')}
            >
              <UploadEmptyStateIllustration />
              <p className="mt-2 text-sm font-normal leading-[22px] text-[#737373]">
                Agregue un archivo para previsualizarlo aquí
              </p>
              <p className="mt-1 text-xs font-normal leading-[18px] text-[#737373]">PDF, JPG o PNG</p>
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  openPicker();
                }}
                className="mt-2 flex h-8 shrink-0 items-center gap-2 rounded-[8px] border-0 bg-transparent px-3 py-2 text-sm font-medium text-[#1A5FD0] transition-colors hover:bg-[#EEF4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0] focus-visible:ring-offset-2"
              >
                <Plus aria-hidden="true" size={16} strokeWidth={2} />
                Seleccionar archivo
              </button>
            </div>
            {validationError && (
              <p className="mt-2 text-xs text-[#FF6B35]">
                Formato no admitido. Seleccione un archivo PDF, JPG o PNG.
              </p>
            )}

            <div className="mt-6 max-w-xl">
              <OriginFields
                originId={originId}
                originChannel={originChannel}
                originOtro={originOtro}
                disabled={isProcessing}
                onChannelChange={value => {
                  setOriginChannel(value);
                  setOriginOtro('');
                }}
                onOtherChange={setOriginOtro}
              />
            </div>
            <div className="mt-6 border-t border-[#E5E5E5] pt-5">{actions}</div>
          </section>
        )}

        {activeMode === 'file' && selectedFile !== null && (
          <div className="grid min-w-0 items-stretch pb-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
            <div className="min-w-0 pr-1.5 pt-3 lg:min-h-0 lg:overflow-hidden">
            <section
              aria-busy={isProcessing}
              className="flex h-full min-h-[620px] flex-col overflow-hidden bg-white lg:min-h-0"
            >
              <div className="flex h-9 shrink-0 items-center border-b border-[#E5E5E5] px-3 text-sm font-medium leading-[22px] text-[#1A1A1A]">
                Configuración del procesamiento
              </div>
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-5">
                <div>
                  <p className="mb-3 text-sm font-normal leading-[22px] text-[#1A1A1A]">
                    Archivo seleccionado
                  </p>
                  <div className="rounded-[10px] border border-[#E5E5E5] bg-[#F5F5F5] p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#F5F5F5] text-[10px] font-bold text-[#1A5FD0]">
                        {fileType(selectedFile)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1A1A1A]">{selectedFile.name}</p>
                        <p className="mt-0.5 text-xs text-[#737373]">
                          {fileType(selectedFile)} · {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 border-t border-[#E5E5E5] pt-3">
                      <button type="button" disabled={isProcessing} onClick={openPicker} className="text-xs font-semibold text-[#1A5FD0] hover:underline disabled:cursor-not-allowed disabled:opacity-45">
                        Cambiar archivo
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setSelectedFile(null);
                          setValidationError(false);
                          setProcessingError(false);
                        }}
                        className="text-xs font-semibold text-[#737373] hover:text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="my-6 h-px bg-[#E5E5E5]" />

                <OriginFields
                  originId={originId}
                  originChannel={originChannel}
                  originOtro={originOtro}
                  disabled={isProcessing}
                  onChannelChange={value => {
                    setOriginChannel(value);
                    setOriginOtro('');
                    setProcessingError(false);
                  }}
                  onOtherChange={value => {
                    setOriginOtro(value);
                    setProcessingError(false);
                  }}
                />

                {selectedFile && hasOrigin && !processingError && (
                  <div className="mt-5 flex items-center justify-between rounded-[8px] bg-[#F5F5F5] px-3.5 py-3">
                    <span className="text-xs text-[#737373]">Estado</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#0B7573]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0B7573]" />
                      Listo para procesar
                    </span>
                  </div>
                )}

                {processingError && (
                  <div className="mt-5 flex gap-3 rounded-[9px] border border-[#FF6B35] bg-[#FFF8E6] p-3.5">
                    <svg className="mt-0.5 shrink-0 text-[#FF6B35]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">No fue posible procesar el documento</p>
                      <p className="mt-1 text-xs leading-5 text-[#737373]">Conservamos la información ingresada. Intente nuevamente.</p>
                    </div>
                  </div>
                )}

              </div>
              <div className="flex min-h-[49px] shrink-0 items-center border-t border-[#D9D9D9] bg-white px-3 py-0.5">
                {actions}
              </div>
            </section>
            </div>

            <div className="min-w-0 pl-1.5 pt-3 lg:min-h-0 lg:overflow-hidden">
            <section className="flex h-full min-h-[620px] min-w-0 flex-col overflow-hidden bg-white lg:min-h-0">
              <div className="flex h-8 shrink-0 min-w-0 items-center justify-between gap-3 border-b border-[#E5E5E5] px-4">
                <h2 className="text-sm font-medium leading-[22px] text-[#1A1A1A]">Documento</h2>
                <span className="min-w-0 truncate text-xs font-normal text-[#A9A9A9]">{selectedFile.name}</span>
              </div>
              <div className="min-h-0 min-w-0 flex-1">
                <DocumentViewer file={selectedFile} imageUrl={imageUrl} />
              </div>
            </section>
            </div>
          </div>
        )}

        {activeMode === 'text' && (
          <section
            aria-busy={isProcessing}
            className="mx-auto w-full max-w-4xl rounded-[12px] border border-[#E5E5E5] bg-[#FFFFFF] p-6 shadow-none sm:p-7"
          >
            <div className="space-y-2">
              <FieldLabel htmlFor={textareaId}>Texto del documento</FieldLabel>
              <textarea
                id={textareaId}
                value={documentText}
                onChange={event => {
                  setDocumentText(event.target.value);
                  setProcessingError(false);
                }}
                placeholder="Ingrese o pegue el contenido clínico aquí."
                disabled={isProcessing}
                className="h-64 min-h-64 w-full resize-none rounded-[8px] border border-[#D9D9D9] bg-white p-3 font-jakarta text-sm font-normal leading-[22px] text-[#1A1A1A] outline-none transition-colors placeholder:text-[#A9A9A9] hover:border-[#A9A9A9] focus:border-[#1A5FD0] focus:ring-2 focus:ring-[rgba(26,95,208,0.10)] disabled:cursor-not-allowed disabled:border-[#E5E5E5] disabled:bg-[#FAFAFA] disabled:text-[#737373]"
              />
            </div>
            <div className="mt-6 max-w-xl">
              <OriginFields
                originId={`${originId}-text`}
                originChannel={originChannel}
                originOtro={originOtro}
                disabled={isProcessing}
                onChannelChange={value => {
                  setOriginChannel(value);
                  setOriginOtro('');
                  setProcessingError(false);
                }}
                onOtherChange={setOriginOtro}
              />
            </div>
            {processingError && (
              <div className="mt-5 rounded-[8px] border border-[rgba(255,107,53,0.35)] bg-[#FFFBF7] p-3.5 text-xs text-[#1A1A1A] shadow-none">
                No fue posible procesar el texto. La información ingresada se ha conservado.
              </div>
            )}
            <div className="mt-6 border-t border-[#E5E5E5] pt-5">{actions}</div>
          </section>
        )}
      </div>
    </div>
  );
}
