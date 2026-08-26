// ─────────────────────────────────────────────────────────────────────────────
// api.ts — Trishul frontend API service
// All data comes from the FastAPI backend at VITE_API_BASE_URL.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE_URL) {
  console.error(
    '[api] VITE_API_BASE_URL is not set. ' +
    'Add it to trishul-frontend/.env (e.g. VITE_API_BASE_URL=http://localhost:8000).'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Backend response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface BackendAnomaly {
  type: string;
  severity: string;
  message: string;
}

interface BackendProject {
  project_id: string;
  project_name: string;
  state: string;
  district: string;
  sector: string;
  sanctioned_amount: number;
  released_amount: number;
  utilized_amount: number;
  physical_progress: number;
  financial_progress: number;
  status: string;
  inspection_status: string;
  last_inspection_days: number;
  contractor?: string;
  risk_score: number;
  severity: string;
  anomalies: BackendAnomaly[];
}

interface BackendDashboard {
  total_projects: number;
  high_risk_projects: number;
  critical_projects: number;
  delayed_projects: number;
  total_sanctioned_amount: number;
  total_released_amount: number;
  total_utilized_amount: number;
  projects: BackendProject[];
}

interface BackendAlerts {
  total_alerts: number;
  alerts: Array<{
    project_id: string;
    project_name: string;
    district: string;
    severity: string;
    type: string;
    message: string;
    risk_score: number;
  }>;
}

interface BackendInvestigation {
  project_id: string;
  project_name: string;
  risk_score: number;
  severity: string;
  anomalies: BackendAnomaly[];
  investigation_report: {
    summary: string;
    key_findings: string[];
    risk_explanation: string;
    recommended_actions: string[];
    priority: string;
  };
}

interface BackendFilters {
  states: string[];
  districts: string[];
}

interface BackendAnalytics {
  riskByDistrict: Array<{ name: string; value: number }>;
  fundUtilization: Array<{ name: string; allocated: number; utilized: number }>;
  anomalyCategories: Array<{ name: string; value: number }>;
  projectStatus: Array<{ name: string; value: number }>;
}

interface BackendAuditTrail {
  events: Array<{
    timestamp: string;
    event_type: string;
    project_id: string;
    description: string;
    actor: string;
  }>;
}

interface BackendActionResponse {
  status: string;
  project_id: string;
  project_name: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontend interface (kept identical so all existing pages work unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectItem {
  id: string;
  project_name: string;
  district: string;
  state?: string;
  sector?: string;
  amount_sanctioned: string;
  progress_physical: number;
  progress_financial?: number;
  risk_score: number;
  risk_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  inspection_status?: string;
  last_inspection_days?: number;
  contractor?: string;
  risk_breakdown: {
    financial: number;
    operational: number;
    compliance: number;
  };
  anomalies: string[];
  alert_details: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizer — maps a BackendProject to ProjectItem
// ─────────────────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
}

/**
 * Derive sub-scores from anomaly list since the backend doesn't compute them.
 * Each anomaly type is bucketed into financial, operational, or compliance.
 * The base score is the project risk_score, weighted by how many anomalies
 * fall into each category.
 */
function deriveRiskBreakdown(
  anomalies: BackendAnomaly[],
  baseScore: number
): { financial: number; operational: number; compliance: number } {
  const CATEGORY_MAP: Record<string, 'financial' | 'operational' | 'compliance'> = {
    'cost_overrun':              'financial',
    'fund_misuse':               'financial',
    'over_utilization':          'financial',
    'financial_progress_ahead':  'financial',
    'underutilization':          'financial',
    'high_spending_low_progress':'financial',
    'progress_mismatch':         'operational',
    'slow_progress':             'operational',
    'delayed':                   'operational',
    'project_delay':             'operational',
    'inspection_overdue':        'compliance',
    'no_inspection':             'compliance',
  };

  const counts = { financial: 0, operational: 0, compliance: 0 };
  for (const a of anomalies) {
    const key = a.type.toLowerCase().replace(/ /g, '_');
    const bucket = CATEGORY_MAP[key];
    if (bucket) counts[bucket]++;
  }

  const totalAnomalies = anomalies.length || 1;

  // Weight the base risk score toward each category proportionally.
  // Minimum score is 5 so gauges don't show empty even for clean projects.
  return {
    financial:   Math.min(99, Math.max(5, Math.round((counts.financial   / totalAnomalies) * baseScore + 5))),
    operational: Math.min(99, Math.max(5, Math.round((counts.operational / totalAnomalies) * baseScore + 5))),
    compliance:  Math.min(99, Math.max(5, Math.round((counts.compliance  / totalAnomalies) * baseScore + 5))),
  };
}

function normalizeProject(p: BackendProject): ProjectItem {
  const anomalyStrings = p.anomalies.map((a) => a.type);
  const alertDetails =
    p.anomalies.length > 0
      ? p.anomalies.map((a) => a.message).join(' | ')
      : null;

  const severity = p.severity as ProjectItem['risk_severity'];

  return {
    id:                  p.project_id,
    project_name:        p.project_name,
    district:            p.district,
    state:               p.state,
    sector:              p.sector,
    amount_sanctioned:   formatAmount(p.sanctioned_amount),
    progress_physical:   p.physical_progress,
    progress_financial:  p.financial_progress,
    risk_score:          p.risk_score,
    risk_severity:       severity,
    status:              p.status,
    inspection_status:   p.inspection_status,
    last_inspection_days: p.last_inspection_days,
    contractor:          p.contractor,
    risk_breakdown:      deriveRiskBreakdown(p.anomalies, p.risk_score),
    anomalies:           anomalyStrings,
    alert_details:       alertDetails,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// Helper to build a query string from an object of optional params
function toQueryString(params: Record<string, string | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v != null && v !== ''
  ) as [string, string][];
  return entries.length > 0 ? '?' + new URLSearchParams(entries).toString() : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — interface matches what all existing pages expect
// ─────────────────────────────────────────────────────────────────────────────

export const api = {

  /** Fetch distinct states & districts for dropdown population. */
  getFilters: async (): Promise<{ states: string[]; districts: string[] }> => {
    return get<BackendFilters>('/api/filters');
  },

  /** Fetch all projects from the backend (with optional filters). */
  getProjects: async (params?: {
    district?: string;
    state?: string;
    severity?: string;
    status?: string;
  }): Promise<ProjectItem[]> => {
    const qs = params ? toQueryString(params) : '';
    const raw = await get<BackendProject[]>(`/api/projects${qs}`);
    return raw.map(normalizeProject);
  },

  /** Fetch a single project by ID. */
  getProject: async (id: string): Promise<ProjectItem | undefined> => {
    try {
      const raw = await get<BackendProject>(`/api/projects/${id}`);
      return normalizeProject(raw);
    } catch (err) {
      console.error(`[api.getProject] ${id}:`, err);
      return undefined;
    }
  },

  /** Fetch alerts (CRITICAL / HIGH anomalies across all projects). */
  getAlerts: async (params?: {
    state?: string;
    district?: string;
  }): Promise<ProjectItem[]> => {
    const qs = params ? toQueryString(params) : '';

    // Fetch alerts data for project ID set, and full projects for rendering
    const [alertsData, allProjects] = await Promise.all([
      get<BackendAlerts>(`/api/alerts${qs}`),
      get<BackendProject[]>(`/api/projects${qs}`),
    ]);

    const normalized = allProjects.map(normalizeProject);
    const alertProjectIds = new Set(alertsData.alerts.map((a) => a.project_id));

    return normalized.filter(
      (p) =>
        (p.risk_severity === 'CRITICAL' || p.risk_severity === 'HIGH') ||
        alertProjectIds.has(p.id)
    );
  },

  /** Fetch dashboard summary KPIs and project list. */
  getDashboard: async (params?: {
    state?: string;
    district?: string;
  }) => {
    const qs = params ? toQueryString(params) : '';
    const raw = await get<BackendDashboard>(`/api/dashboard${qs}`);

    const projects = raw.projects.map(normalizeProject);

    const totalProjects = raw.total_projects;
    const highRiskCount = raw.high_risk_projects + raw.critical_projects;
    const delayedCount  = raw.delayed_projects;

    const avgProgress =
      totalProjects > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + p.progress_physical, 0) / totalProjects
          )
        : 0;

    const riskDistribution = [
      { name: 'Critical', value: projects.filter((p) => p.risk_severity === 'CRITICAL').length },
      { name: 'High',     value: projects.filter((p) => p.risk_severity === 'HIGH').length },
      { name: 'Medium',   value: projects.filter((p) => p.risk_severity === 'MEDIUM').length },
      { name: 'Low',      value: projects.filter((p) => p.risk_severity === 'LOW').length },
    ];

    const recentAlerts = projects
      .filter((p) => p.alert_details && p.alert_details.trim().length > 0)
      .slice(0, 10)
      .map((p) => ({
        title:     p.alert_details,
        status:    p.status,
        projectId: p.id,
        severity:  p.risk_severity,
      }));

    const highRiskProjects = projects
      .filter((p) => p.risk_severity === 'CRITICAL' || p.risk_severity === 'HIGH')
      .map((p) => ({
        id:         p.id,
        name:       p.project_name,
        district:   p.district,
        risk:       p.risk_severity,
        risk_score: p.risk_score,
      }));

    return {
      kpis: {
        totalProjects,
        fundsUtilized: `${avgProgress}% Avg`,
        highRisk: highRiskCount,
        delayed:  delayedCount,
      },
      riskDistribution,
      recentAlerts,
      highRiskProjects,
    };
  },

  /** Analytics — fetched from the dedicated backend endpoint. */
  getAnalytics: async (params?: {
    state?: string;
    district?: string;
  }) => {
    const qs = params ? toQueryString(params) : '';
    return get<BackendAnalytics>(`/api/analytics${qs}`);
  },

  /** Audit trail — real persistent events from the backend. */
  getAuditTrail: async () => {
    const raw = await get<BackendAuditTrail>('/api/audit');
    return raw.events;
  },

  /**
   * AI investigation — calls the Gemini-powered backend endpoint.
   * Falls back to a client-side summary if the backend call fails
   * (e.g. missing API key, network error).
   */
  investigateProject: async (id: string) => {
    try {
      const raw = await post<BackendInvestigation>(`/api/investigate/${id}`);
      const report = raw.investigation_report;
      return {
        explanation:        `${report.summary}\n\n${report.risk_explanation}`,
        recommendedActions: report.recommended_actions,
        keyFindings:        report.key_findings,
        priority:           report.priority,
      };
    } catch (err) {
      console.warn('[api.investigateProject] Backend AI call failed, using local fallback:', err);
      // Graceful fallback — fetch project data and build a basic summary
      const project = await api.getProject(id);
      if (!project) throw new Error(`Project ${id} not found`);
      return {
        explanation: project.alert_details
          ? `Discrepancy detected for ${project.project_name} (${project.id}): ${project.alert_details}.`
          : `${project.project_name}: physical progress at ${project.progress_physical}%. Risk severity is ${project.risk_severity} (score ${project.risk_score}/100).`,
        recommendedActions: project.anomalies.length
          ? project.anomalies.map((a) => `Audit and verify: ${a}`)
          : ['Conduct routine physical inspection'],
        keyFindings: [],
        priority:    project.risk_severity,
      };
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Action endpoints (real API calls, not stubs)
  // ───────────────────────────────────────────────────────────────────────────

  /** Schedule a physical site inspection for a project. */
  scheduleInspection: async (projectId: string): Promise<BackendActionResponse> => {
    return post<BackendActionResponse>('/api/actions/schedule-inspection', {
      project_id: projectId,
    });
  },

  /** Initiate an expenditure verification for a project. */
  verifyExpenditure: async (projectId: string): Promise<BackendActionResponse> => {
    return post<BackendActionResponse>('/api/actions/verify-expenditure', {
      project_id: projectId,
    });
  },

  /** Request a contractor review for a project. */
  reviewContractor: async (projectId: string): Promise<BackendActionResponse> => {
    return post<BackendActionResponse>('/api/actions/review-contractor', {
      project_id: projectId,
    });
  },
};
