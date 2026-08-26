import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ProjectItem } from '../services/api';
import { useRole, buildRoleFilterParams } from '../contexts/RoleContext';
import { ChevronRight, AlertCircle, ShieldAlert } from 'lucide-react';

export default function Alerts() {
  const [data, setData] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const roleCtx = useRole();

  useEffect(() => {
    setLoading(true);
    const params = buildRoleFilterParams(roleCtx);
    api.getAlerts(params)
      .then((res) => {
        // Strict filter: ONLY items with "CRITICAL" or "HIGH" risk severity
        const filtered = (res || []).filter(
          (item) => item.risk_severity === 'CRITICAL' || item.risk_severity === 'HIGH'
        );
        setData(filtered);
      })
      .catch((err) => console.error('Error fetching alerts:', err))
      .finally(() => setLoading(false));
  }, [roleCtx.role, roleCtx.filterState, roleCtx.filterDistrict]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={28} />
            AI Risk Alerts Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prioritized high-severity anomalies detected across MPLAD projects.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-full uppercase tracking-wider">
          {data.length} Critical / High Alerts
        </div>
      </div>

      {/* Prioritized Queue Cards */}
      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-xl text-muted-foreground shadow-sm">
            No CRITICAL or HIGH risk alerts detected in dataset.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/investigation/${item.id}`)}
              className="group cursor-pointer bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-2 ${
                  item.risk_severity === 'CRITICAL' ? 'bg-risk-critical' : 'bg-risk-high'
                }`}
              />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-2">
                {/* Left Section: Details & Badges */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded">
                      {item.id}
                    </span>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.project_name} — {item.district}
                    </h2>
                    <SeverityTag severity={item.risk_severity} />
                  </div>

                  {/* Alert details string exact match */}
                  {item.alert_details && (
                    <div className="flex items-start gap-2 p-3 bg-red-50/80 border border-red-100 rounded-lg text-red-900 text-sm font-medium">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item.alert_details}</span>
                    </div>
                  )}

                  {/* Anomalies List */}
                  {item.anomalies && item.anomalies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Detected Anomalies:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.anomalies.map((anomaly, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-medium"
                          >
                            • {anomaly}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section: Risk Score Badge & Navigation */}
                <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Risk Score
                    </p>
                    <div
                      className={`text-3xl font-black px-4 py-2 rounded-xl border ${
                        item.risk_score >= 90
                          ? 'bg-risk-critical/10 text-risk-critical border-risk-critical/20'
                          : 'bg-risk-high/10 text-risk-high border-risk-high/20'
                      }`}
                    >
                      {item.risk_score}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Investigate</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SeverityTag({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-risk-critical/10 text-risk-critical border-risk-critical/20',
    HIGH: 'bg-risk-high/10 text-risk-high border-risk-high/20',
    MEDIUM: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
    LOW: 'bg-risk-low/10 text-risk-low border-risk-low/20',
  };
  return (
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
        styles[severity] || styles['LOW']
      }`}
    >
      {severity}
    </span>
  );
}
