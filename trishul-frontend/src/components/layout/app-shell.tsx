import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  AlertTriangle,
  BarChart2,
  ShieldCheck,
  SearchCheck,
  Link as LinkIcon,
  HelpCircle,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';

import {
  SidebarProvider,
  DesktopSidebar,
  MobileSidebar,
  SidebarLink,
  useSidebar,
} from '../ui/sidebar';
import { PLACEHOLDERS } from '../../data/placeholders';
import { useRole, type Role } from '../../contexts/RoleContext';
import { api } from '../../services/api';
import trishulLogo from '../../assets/trishul-logo.png';

// ─── Main nav links ───────────────────────────────────────────────────────────
const mainNavLinks = [
  { label: 'Dashboard',        to: '/dashboard',        icon: <LayoutDashboard size={20} /> },
  { label: 'Projects',         to: '/projects',         icon: <Folder size={20} /> },
  { label: 'AI Alerts',        to: '/alerts',           icon: <AlertTriangle size={20} /> },
  { label: 'Analytics',        to: '/analytics',        icon: <BarChart2 size={20} /> },
  { label: 'Audit Trail',      to: '/audit',            icon: <ShieldCheck size={20} /> },
  { label: 'Investigation',    to: '/investigation',    icon: <SearchCheck size={20} /> },
  { label: 'Know Your Source', to: '/know-your-source', icon: <LinkIcon size={20} /> },
];

const bottomNavLinks = [
  { label: 'FAQ',        to: '/faq',     icon: <HelpCircle size={18} /> },
  { label: 'Contact Us', to: '/contact', icon: <Mail size={18} /> },
];

const ROLES: Role[] = ['Ministry', 'State Authority', 'District Authority', 'MP'];

// ─── Sidebar Header (logo + wordmark + toggle) ────────────────────────────────
function SidebarHeader() {
  const { open, setOpen } = useSidebar();

  if (open) {
    // Expanded: [Logo + TRISHUL wordmark]   [PanelLeftClose toggle]
    return (
      <div className="flex items-center justify-between px-2 py-2 mb-4">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          aria-label="Go to home"
        >
          <div className="flex items-center justify-center rounded-full bg-white/90 h-9 w-9 flex-shrink-0 shadow-sm group-hover:bg-white transition-colors">
            <img src={trishulLogo} alt="Trishul logo" className="h-7 w-7 object-contain" />
          </div>
          <span className="font-trishul text-[#00AFD7] text-lg font-bold tracking-wide whitespace-nowrap">
            TRISHUL
          </span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          aria-label="Collapse sidebar"
          className="text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>
    );
  }

  // Collapsed: centered column — [Logo] then [PanelLeftOpen] below
  return (
    <div className="flex flex-col items-center gap-3 py-2 mb-4">
      <Link
        to="/"
        className="flex items-center justify-center rounded-full bg-white/90 h-9 w-9 shadow-sm hover:bg-white transition-colors"
        aria-label="Go to home"
      >
        <img src={trishulLogo} alt="Trishul logo" className="h-7 w-7 object-contain" />
      </Link>
      <button
        onClick={() => setOpen(true)}
        aria-label="Expand sidebar"
        className="text-white/60 hover:text-white transition-colors"
      >
        <PanelLeftOpen size={20} />
      </button>
    </div>
  );
}


// ─── Role Selector in header ──────────────────────────────────────────────────
function RoleSelector() {
  const { role, setRole, filterState, setFilterState, filterDistrict, setFilterDistrict } = useRole();
  const [filterOptions, setFilterOptions] = useState<{ states: string[]; districts: string[] }>({
    states: [],
    districts: [],
  });

  useEffect(() => {
    api.getFilters()
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const showStatePicker = role === 'State Authority';
  // TODO: For 'MP', this should eventually come from an authenticated user's
  // assigned constituency rather than a manual district selection.
  const showDistrictPicker = role === 'District Authority' || role === 'MP';

  return (
    <div className="flex items-center gap-3">
      {/* Role dropdown */}
      <div className="relative">
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="appearance-none bg-card border border-border rounded-lg pl-4 pr-9 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      {/* State picker (for State Authority) */}
      {showStatePicker && (
        <div className="relative">
          <select
            id="state-filter-select"
            value={filterState || ''}
            onChange={(e) => setFilterState(e.target.value || null)}
            className="appearance-none bg-card border border-border rounded-lg pl-4 pr-9 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <option value="">All States</option>
            {filterOptions.states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {/* District picker (for District Authority / MP) */}
      {showDistrictPicker && (
        <div className="relative">
          <select
            id="district-filter-select"
            value={filterDistrict || ''}
            onChange={(e) => setFilterDistrict(e.target.value || null)}
            className="appearance-none bg-card border border-border rounded-lg pl-4 pr-9 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <option value="">All Districts</option>
            {filterOptions.districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      )}
    </div>
  );
}


// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [open, setOpen] = useState(false);

  if (isHome) {
    return (
      <div className="min-h-screen bg-background font-sans text-foreground">
        <Outlet />
      </div>
    );
  }

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={true}>
      <div className="flex flex-col md:flex-row h-screen bg-background font-sans text-foreground overflow-hidden">

        {/* ── Mobile Sidebar Topbar (hidden on desktop) ── */}
        <MobileSidebar>
          <SidebarHeader />
          <nav className="flex-1 space-y-2 mt-6">
            {mainNavLinks.map((link) => (
              <SidebarLink
                key={link.to}
                link={link}
                isActive={location.pathname === link.to}
              />
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-white/15 space-y-2">
            {bottomNavLinks.map((link) => (
              <SidebarLink
                key={link.to}
                link={link}
                isActive={location.pathname === link.to}
              />
            ))}
          </div>
        </MobileSidebar>

        {/* ── Desktop Sidebar (hidden on mobile) ── */}
        <DesktopSidebar className="flex flex-col">
          <SidebarHeader />

          {/* Main nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
            {mainNavLinks.map((link) => (
              <SidebarLink
                key={link.to}
                link={link}
                isActive={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
              />
            ))}
          </nav>

          {/* Bottom links */}
          <div className="mt-4 pt-4 border-t border-white/15 space-y-1">
            {bottomNavLinks.map((link) => (
              <SidebarLink
                key={link.to}
                link={link}
                isActive={location.pathname === link.to}
              />
            ))}
          </div>
        </DesktopSidebar>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold capitalize">
                {location.pathname.substring(1).replace(/-/g, ' ').split('/')[0] || 'Dashboard'}
              </h1>
            </div>
            <RoleSelector />
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <Outlet />
          </main>

          <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border flex-shrink-0">
            {PLACEHOLDERS.FOOTER_RESTRICTED}
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
