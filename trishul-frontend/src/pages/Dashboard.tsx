import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useRole, buildRoleFilterParams } from '../contexts/RoleContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, FileText, CheckCircle, Clock, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const roleCtx = useRole();

  useEffect(() => {
    setLoading(true);
    const params = buildRoleFilterParams(roleCtx);
    api.getDashboard(params)
      .then((res) => setData(res))
      .catch((err) => console.error('Error loading dashboard:', err))
      .finally(() => setLoading(false));
  }, [roleCtx.role, roleCtx.filterState, roleCtx.filterDistrict]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground py-20">
        No dataset available
      </div>
    );
  }

  const { kpis, riskDistribution, recentAlerts, highRiskProjects } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Projects" value={kpis?.totalProjects} icon={<FileText className="text-blue-500" />} />
        <KPICard title="Avg Physical Progress" value={kpis?.fundsUtilized} icon={<CheckCircle className="text-emerald-500" />} />
        
        <div onClick={() => navigate('/alerts')} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <KPICard title="Critical / High Risk" value={kpis?.highRisk} icon={<AlertTriangle className="text-red-500" />} />
        </div>

        <div onClick={() => navigate('/projects')} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <KPICard title="Delayed Projects" value={kpis?.delayed} icon={<Clock className="text-orange-500" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Risk Distribution Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Risk Severity Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(riskDistribution || []).map((entry: any, index: number) => {
                    let color = '#22c55e';
                    const name = entry.name?.toUpperCase() || '';
                    if (name === 'CRITICAL') color = '#D92D20';
                    else if (name === 'HIGH') color = '#FC7005';
                    else if (name === 'MEDIUM') color = '#FF9E1B';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Lists */}
        <div className="space-y-6">
          {/* Active Alerts List */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[230px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Active Alerts</h3>
              <button onClick={() => navigate('/alerts')} className="text-xs text-primary font-semibold hover:underline">
                View Queue
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/investigation/${alert.projectId}`)}
                    className="flex items-start justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {alert.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">ID: {alert.projectId}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No alert details present</p>
              )}
            </div>
          </div>

          {/* High Risk Projects List */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[230px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">High Risk Projects</h3>
              <button onClick={() => navigate('/projects')} className="text-xs text-primary font-semibold hover:underline">
                All Projects
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
              {highRiskProjects && highRiskProjects.length > 0 ? (
                highRiskProjects.map((proj: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/investigation/${proj.id}`)}
                    className="group flex items-center justify-between border-b border-border pb-2.5 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                          {proj.name}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground">({proj.id})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{proj.district}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-600 font-mono">{proj.risk_score}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                        {proj.risk}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No high risk projects</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold mt-1">{value ?? 0}</p>
      </div>
      <div className="p-3 bg-slate-100 rounded-full">{icon}</div>
    </div>
  );
}
