import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck } from 'lucide-react';

interface AuditEvent {
  timestamp: string;
  event_type: string;
  project_id: string;
  description: string;
  actor: string;
}

export default function Audit() {
  const [data, setData] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditTrail()
      .then(res => setData(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary" size={24} />
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
        </div>
        <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-full uppercase tracking-wider">
          {data.length} Events
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-44">Timestamp</th>
                <th className="px-6 py-4 font-semibold w-36">Event Type</th>
                <th className="px-6 py-4 font-semibold w-32">Project ID</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold w-36">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit events recorded yet. Events are logged when AI investigations are triggered or actions are taken on projects.
                  </td>
                </tr>
              ) : (
                data.map((log, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <EventTypeBadge type={log.event_type} />
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium">{log.project_id}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{log.description}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.actor}</td>
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

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    AI_INVESTIGATION: 'bg-purple-50 text-purple-700 border-purple-200',
    SCHEDULE_INSPECTION: 'bg-blue-50 text-blue-700 border-blue-200',
    VERIFY_EXPENDITURE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REVIEW_CONTRACTOR: 'bg-amber-50 text-amber-700 border-amber-200',
    PROJECT_ANALYZED: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const display = type.replace(/_/g, ' ');

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${
        styles[type] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {display}
    </span>
  );
}
