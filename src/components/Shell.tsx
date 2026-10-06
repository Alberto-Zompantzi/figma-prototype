import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Menu,
  Settings,
  X,
} from 'lucide-react';

const imgLogoMark = '/assets/f7cd5.svg';
const BP_DRAWER = 900;

export interface BreadcrumbSegment {
  label: string;
  bold?: boolean;
  href?: string;
}

interface ShellProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbSegment[];
  activeNav?: 'procesamiento' | 'auditoria';
}

function NavTooltip({
  label,
  children,
  enabled,
  placement = 'right',
}: {
  label: string;
  children: ReactNode;
  enabled: boolean;
  placement?: 'right' | 'top';
}) {
  return (
    <div className="group/nav-tip relative">
      {children}
      {enabled && (
        <span
          role="tooltip"
          className={[
            'pointer-events-none absolute z-[70] whitespace-nowrap rounded-[6px] bg-[#1A1A1A] px-2.5 py-1.5 font-jakarta text-xs font-normal text-white opacity-0 transition-opacity',
            'group-hover/nav-tip:opacity-100 group-focus-within/nav-tip:opacity-100',
            placement === 'top'
              ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
              : 'left-full top-1/2 ml-2.5 -translate-y-1/2',
          ].join(' ')}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function NavItem({
  label,
  description,
  href,
  active,
  showDetails,
  drawer,
  unavailable = false,
  children,
}: {
  label: string;
  description: string;
  href?: string;
  active?: boolean;
  showDetails: boolean;
  drawer: boolean;
  unavailable?: boolean;
  children: ReactNode;
}) {
  const classes = [
    'group/nav-item flex items-center rounded-[8px] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0] focus-visible:ring-offset-1 disabled:opacity-30',
    drawer
      ? 'w-full min-h-[52px] gap-3 px-3 py-2'
      : showDetails
        ? 'w-[216px] gap-3 px-2 py-2.5'
        : 'h-[46px] w-10 justify-center',
    unavailable
      ? 'cursor-default text-[#A9A9A9]'
      : active
      ? 'bg-[rgba(26,95,208,0.12)] text-[#1A5FD0]'
      : 'text-[#1A1A1A] hover:bg-[rgba(26,95,208,0.12)] hover:text-[#1A5FD0]',
  ].join(' ');

  const content = (
    <>
      <span className="shrink-0">{children}</span>
      {showDetails && (
        <span className="min-w-0 text-left">
          <span className={['block text-sm font-medium leading-5', active ? 'text-[#1A5FD0]' : 'text-current'].join(' ')}>
            {label}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs font-normal leading-4 text-[#737373]">
            {description}
          </span>
        </span>
      )}
    </>
  );

  return href ? (
    <a href={href} aria-label={label} className={classes}>{content}</a>
  ) : (
    <button
      type="button"
      aria-label={label}
      aria-disabled={unavailable || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}

export function Shell({ children, activeNav = 'procesamiento' }: ShellProps) {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [suppressTransientExpansion, setSuppressTransientExpansion] = useState(false);
  const drawer = viewportWidth < BP_DRAWER;
  const expanded = !drawer && (
    sidebarPinned ||
    (!suppressTransientExpansion && (sidebarHovered || sidebarFocused))
  );
  const showDetails = drawer || expanded;

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      if (width >= BP_DRAWER) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!drawer || !mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawer, mobileOpen]);

  const sidebar = (
    <aside
      id="primary-navigation"
      className={[
        'flex shrink-0 flex-col border-r border-[#E5E5E5] bg-white',
        drawer
          ? 'scrollbar-hidden fixed bottom-0 left-0 top-14 z-50 w-60 transform overflow-y-auto p-3 transition-transform duration-200'
          : ['relative items-center', expanded ? 'scrollbar-hidden overflow-y-auto' : 'overflow-visible'].join(' '),
        drawer && !mobileOpen ? '-translate-x-full' : 'translate-x-0',
      ].join(' ')}
      style={!drawer ? {
        width: expanded ? 240 : 65,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      } : undefined}
      aria-label="Navegación principal"
      onMouseEnter={() => {
        if (!drawer) setSidebarHovered(true);
      }}
      onMouseLeave={() => {
        if (!drawer) {
          setSidebarHovered(false);
          setSuppressTransientExpansion(false);
        }
      }}
      onFocusCapture={() => {
        if (!drawer && !suppressTransientExpansion) setSidebarFocused(true);
      }}
      onBlurCapture={event => {
        if (!drawer && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setSidebarFocused(false);
          setSuppressTransientExpansion(false);
        }
      }}
    >
      <nav className={['flex w-full flex-col items-center', drawer ? '' : 'mt-[22px]'].join(' ')}>
        {showDetails && (
          <p className={['mb-1 w-full px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#737373]', drawer ? '' : 'max-w-[216px]'].join(' ')}>
            Procesar
          </p>
        )}
        <NavTooltip label="Procesamiento" enabled={!showDetails}>
          <NavItem
            label="Procesamiento"
            description="Cargue y clasifique documentos clínicos"
            href="?view=processing"
            active={activeNav === 'procesamiento'}
            showDetails={showDetails}
            drawer={drawer}
          >
            <FileText size={22} strokeWidth={1.25} aria-hidden="true" />
          </NavItem>
        </NavTooltip>

        <div className={['my-2 h-px bg-[#E5E5E5]', drawer ? 'w-full' : 'w-[calc(100%-24px)]'].join(' ')} />
        {showDetails && (
          <p className={['mb-1 w-full px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#737373]', drawer ? '' : 'max-w-[216px]'].join(' ')}>
            Revisar
          </p>
        )}
        <NavTooltip label="Auditoría" enabled={!showDetails}>
          <NavItem
            label="Auditoría"
            description="Casos que requieren revisión humana"
            href="?view=audit"
            active={activeNav === 'auditoria'}
            showDetails={showDetails}
            drawer={drawer}
          >
            <ClipboardCheck size={22} strokeWidth={1.25} aria-hidden="true" />
          </NavItem>
        </NavTooltip>
      </nav>

      <div className="flex-1" />

      <div className={['mb-2 h-px bg-[#E5E5E5]', drawer ? 'w-full' : 'w-[calc(100%-24px)]'].join(' ')} />
      {showDetails && (
        <p className={['mb-1 w-full px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#737373]', drawer ? '' : 'max-w-[216px]'].join(' ')}>
          Ajustes
        </p>
      )}
      <div className="flex w-full flex-col items-center space-y-2">
        <NavTooltip
          label="No disponible en este prototipo"
          enabled
          placement={showDetails ? 'top' : 'right'}
        >
          <NavItem
            label="Centro de ayuda"
            description="Guía y soporte del prototipo"
            showDetails={showDetails}
            drawer={drawer}
            unavailable
          >
            <CircleHelp size={22} strokeWidth={1.25} aria-hidden="true" />
          </NavItem>
        </NavTooltip>
        <NavTooltip
          label="No disponible en este prototipo"
          enabled
          placement={showDetails ? 'top' : 'right'}
        >
          <NavItem
            label="Configuración"
            description="Preferencias de la aplicación"
            showDetails={showDetails}
            drawer={drawer}
            unavailable
          >
            <Settings size={22} strokeWidth={1.25} aria-hidden="true" />
          </NavItem>
        </NavTooltip>
      </div>

      {!drawer && expanded && (
        <NavTooltip
          label={sidebarPinned ? 'Contraer barra lateral' : 'Fijar barra lateral'}
          enabled
          placement="top"
        >
            <button
              type="button"
              aria-label={sidebarPinned ? 'Contraer barra lateral' : 'Fijar barra lateral'}
              onClick={event => {
                if (sidebarPinned) {
                  setSidebarPinned(false);
                  setSuppressTransientExpansion(true);
                  setSidebarFocused(false);
                  event.currentTarget.blur();
                } else {
                  setSidebarPinned(true);
                  setSuppressTransientExpansion(false);
                }
              }}
              className="flex h-[30px] w-[239px] items-center justify-center border-t border-[#E5E5E5] bg-white text-[#1A1A1A] transition-colors duration-150 hover:bg-[rgba(26,95,208,0.12)] hover:text-[#1A5FD0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A5FD0]"
            >
              {sidebarPinned
                ? <ChevronsLeft size={13} strokeWidth={1.75} aria-hidden="true" />
                : <ChevronsRight size={13} strokeWidth={1.75} aria-hidden="true" />}
            </button>
        </NavTooltip>
      )}
    </aside>
  );

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#FAFAFA] font-jakarta text-sm text-[#1A1A1A]">
      <header className="relative z-[60] flex h-14 w-full shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-3">
        <div className="flex items-center gap-2">
          {drawer && (
            <button
              type="button"
              aria-label={mobileOpen ? 'Cerrar navegación' : 'Abrir navegación'}
              aria-expanded={mobileOpen}
              aria-controls="primary-navigation"
              onClick={() => setMobileOpen(open => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-transparent text-[#1A1A1A] transition-colors hover:bg-[rgba(26,95,208,0.12)] hover:text-[#1A5FD0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5FD0] focus-visible:ring-offset-1"
            >
              {mobileOpen
                ? <X size={20} strokeWidth={1.25} aria-hidden="true" />
                : <Menu size={20} strokeWidth={1.25} aria-hidden="true" />}
            </button>
          )}
          <div className="flex h-10 items-center gap-2 rounded-[8px] bg-[#F5F5F5] px-2">
            <img src={imgLogoMark} alt="" className="h-7 w-7 shrink-0" />
            <span className="text-sm font-semibold text-[#1A1A1A]">MediFlow</span>
          </div>
        </div>

      </header>

      <div className="flex min-h-0 flex-1">
        {drawer && mobileOpen && (
          <button
            type="button"
            aria-label="Cerrar navegación"
            className="fixed inset-x-0 bottom-0 top-14 z-40 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
        )}
        {sidebar}
        <main
          className="min-w-0 flex-1 overflow-y-auto bg-[#FAFAFA]"
          style={{ transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
