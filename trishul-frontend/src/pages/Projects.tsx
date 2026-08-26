import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ProjectItem } from '../services/api';
import { useRole, buildRoleFilterParams } from '../contexts/RoleContext';
import { Search, ChevronDown } from 'lucide-react';

export default function Projects() {
  const [data, setData] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const roleCtx = useRole();

  // Server-side filter values
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dynamic filter options populated from the data
  const [filterOptions, setFilterOptions] = useState<{ states: string[]; districts: string[] }>({
    states: [],
    districts: [],
  });

  useEffect(() => {
    api.getFilters()
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const roleParams = buildRoleFilterParams(roleCtx);
    const params: Record<string, string | undefined> = {
      ...roleParams,
      district: filterDistrict || roleParams.district || undefined,
      severity: filterSeverity || undefined,
      status: filterStatus || undefined,
    };
    api.getProjects(params)
      .then((res) => setData(res || []))
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  }, [roleCtx.role, roleCtx.filterState, roleCtx.filterDistrict, filterDistrict, filterSeverity, filterStatus]);

  // Client-side search filters within the server-returned result set
  const filteredData = data.filter((proj) =>
    proj.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proj.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proj.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by project name, district, or ID..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing {filteredData.length} of {data.length} projects
          </div>
        </div>

        {/* Server-side filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            id="filter-district"
            label="District"
            value={filterDistrict}
            onChange={setFilterDistrict}
            options={filterOptions.districts}
            placeholder="All Districts"
          />
          <FilterDropdown
            id="filter-severity"
            label="Severity"
            value={filterSeverity}
            onChange={setFilterSeverity}
            options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']}
            placeholder="All Severities"
          />
          <FilterDropdown
            id="filter-status"
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Active', 'Delayed', 'Completed']}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Project</th>
                <th className="px-6 py-4 font-semibold">District</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Risk</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No matching projects found
                  </td>
                </tr>
              ) : (
                filteredData.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => navigate(`/investigation/${proj.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      {proj.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground group-hover:text-primary transition-colors">
                      {proj.project_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{proj.district}</td>
                    <td className="px-6 py-4 font-medium">{proj.amount_sanctioned}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 min-w-[70px] max-w-[100px] overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${proj.progress_physical}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {proj.progress_physical}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{proj.risk_score}</span>
                        <RiskSeverityBadge severity={proj.risk_severity} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={proj.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        {label}:
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

function RiskSeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-risk-critical/10 text-risk-critical border-risk-critical/20',
    HIGH: 'bg-risk-high/10 text-risk-high border-risk-high/20',
    MEDIUM: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
    LOW: 'bg-risk-low/10 text-risk-low border-risk-low/20',
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        styles[severity] || styles['LOW']
      }`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Active: 'bg-blue-50 text-blue-600 border-blue-200',
    Delayed: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
}
