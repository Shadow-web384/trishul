import React, { createContext, useContext, useState, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Role types
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'Ministry' | 'State Authority' | 'District Authority' | 'MP';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  /** Non-null when role is 'State Authority' and user has picked a state. */
  filterState: string | null;
  setFilterState: (state: string | null) => void;
  /** Non-null when role is 'District Authority' or 'MP' and user has picked a district. */
  filterDistrict: string | null;
  setFilterDistrict: (district: string | null) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function RoleProvider({ children }: { children: ReactNode }) {
  // Ministry = top-of-hierarchy, no filters applied
  const [role, setRoleRaw] = useState<Role>('Ministry');
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);

  const setRole = (newRole: Role) => {
    setRoleRaw(newRole);
    // Reset sub-filters when role changes so stale selections don't persist
    setFilterState(null);
    setFilterDistrict(null);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        filterState,
        setFilterState,
        filterDistrict,
        setFilterDistrict,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
}

/**
 * Build query params object from current role context values.
 * Returns an object suitable for passing to api.getProjects(params).
 */
export function buildRoleFilterParams(ctx: RoleContextValue): {
  state?: string;
  district?: string;
} {
  const params: { state?: string; district?: string } = {};

  if (ctx.role === 'State Authority' && ctx.filterState) {
    params.state = ctx.filterState;
  }

  // TODO: For 'MP', this should eventually come from an authenticated user's
  // assigned constituency rather than a manual district selection.
  if ((ctx.role === 'District Authority' || ctx.role === 'MP') && ctx.filterDistrict) {
    params.district = ctx.filterDistrict;
  }

  return params;
}
