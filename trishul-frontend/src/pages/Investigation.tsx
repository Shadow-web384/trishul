import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type ProjectItem } from '../services/api';
import { PLACEHOLDERS } from '../data/placeholders';
import { FlowButton } from '../components/ui/flow-button';
import { ArrowLeft, AlertCircle, CheckCircle, ShieldAlert, SearchCheck, Lightbulb, X, User } from 'lucide-react';

// ─── Toast notification component ─────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in fade-in slide-in-from-right-4 duration-300 ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <CheckCircle size={18} className={`mt-0.5 flex-shrink-0 ${t.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`} />
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Contractor Review Modal ──────────────────────────────────────────────────
interface ContractorData {
  contractor: string;
  project_name: string;
  project_id: string;
  district: string;
  state: string;
  risk_score: number;
  severity: string;
  anomalies: Array<{ type: string; severity: string; message: string }>;
}

function ContractorModal({ data, onClose }: { data: ContractorData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User size={20} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold">Contractor Review</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Contractor Name</span>
              <span className="font-bold">{data.contractor || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Project</span>
              <span className="font-semibold">{data.project_name}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Project ID</span>
              <span className="font-mono text-xs font-semibold">{data.project_id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Location</span>
              <span className="font-semibold">{data.district}, {data.state}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Risk Score</span>
              <span className="font-black" style={{ color: getRiskColorHex(data.risk_score) }}>
                {data.risk_score}/100
              </span>
            </div>
          </div>

          {data.anomalies && data.anomalies.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flagged Issues</p>
              <div className="space-y-1.5">
                {data.anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 text-xs font-medium">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!data.anomalies || data.anomalies.length === 0) && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium text-center">
              No flagged issues for this contractor.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Investigation component ─────────────────────────────────────────────
export default function Investigation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allProjects, setAllProjects] = useState<ProjectItem[]>([]);
  const [data, setData] = useState<ProjectItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [contractorData, setContractorData] = useState<ContractorData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  let nextToastId = 0;
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    const toastId = ++nextToastId + Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    api.getProjects()
      .then((projects) => {
        setAllProjects(projects);
        if (id) {
          const matched = projects.find((p) => p.id === id);
          setData(matched || projects[0]);
        } else if (projects.length > 0) {
          // Default to first project if accessed directly without :id
          setData(projects[0]);
        }
      })
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectProject = (selectedId: string) => {
    setAiResult(null);
    navigate(`/investigation/${selectedId}`);
  };

  const handleInvestigate = async () => {
    if (!data?.id) return;
    setInvestigating(true);
    try {
      const res = await api.investigateProject(data.id);
      setAiResult(res);
    } catch (err) {
      console.error(err);
      setAiResult({
        explanation: data?.alert_details
          ? `Discrepancy detected: ${data.alert_details}.`
          : `Physical progress is at ${data?.progress_physical}%.`,
        recommendedActions: data?.anomalies.map((a) => `Verify: ${a}`) || ['Conduct physical audit'],
        keyFindings: [],
      });
    } finally {
      setInvestigating(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!data?.id) return;
    setActionLoading('schedule');
    try {
      const res = await api.scheduleInspection(data.id);
      showToast(res.message, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule inspection. Please try again.', 'info');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyExpenditure = async () => {
    if (!data?.id) return;
    setActionLoading('verify');
    try {
      const res = await api.verifyExpenditure(data.id);
      showToast(res.message, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to verify expenditure. Please try again.', 'info');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewContractor = async () => {
    if (!data?.id) return;
    setActionLoading('review');
    try {
      const res = await api.reviewContractor(data.id);
      setContractorData(res as unknown as ContractorData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load contractor details. Please try again.', 'info');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <p className="text-lg font-medium">No project selected or found.</p>
        <button onClick={() => navigate('/projects')} className="text-primary hover:underline font-semibold">
          Back to Projects List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {contractorData && (
        <ContractorModal data={contractorData} onClose={() => setContractorData(null)} />
      )}

      {/* Top Controls: Back Button & Project Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Projects Table
        </button>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="project-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
            <SearchCheck size={16} className="text-primary" />
            Select Project:
          </label>
          <select
            id="project-select"
            value={data.id}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors w-full sm:w-auto"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.project_name} ({p.district}) [{p.risk_severity}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{data.project_name}</h1>
            <span className="px-3 py-1 bg-muted rounded-full text-xs font-mono font-bold">
              {data.id}
            </span>
          </div>
          <p className="text-muted-foreground">District: {data.district} | Status: {data.status}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScheduleInspection}
            disabled={actionLoading === 'schedule'}
            className="px-4 py-2 border border-border bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'schedule' ? 'Scheduling...' : PLACEHOLDERS.BUTTON_SCHEDULE_INSPECTION}
          </button>
          <button
            onClick={handleVerifyExpenditure}
            disabled={actionLoading === 'verify'}
            className="px-4 py-2 border border-border bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'verify' ? 'Verifying...' : PLACEHOLDERS.BUTTON_VERIFY_EXPENDITURE}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Risk Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Risk Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              <BreakdownCard title="Financial" score={data.risk_breakdown?.financial || 0} />
              <BreakdownCard title="Operational" score={data.risk_breakdown?.operational || 0} />
              <BreakdownCard title="Compliance" score={data.risk_breakdown?.compliance || 0} />
            </div>
          </div>

          {/* Alert Details & Anomalies */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldAlert className="text-red-500" /> Alert Details & Anomalies
            </h2>

            {data.alert_details ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm font-medium">
                <strong>Alert Detail:</strong> {data.alert_details}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
                No active critical alert details flagged for this project.
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Flagged Anomalies:</p>
              {data.anomalies && data.anomalies.length > 0 ? (
                <ul className="space-y-2">
                  {data.anomalies.map((ev, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 text-sm font-medium">
                      <div className="mt-1 w-2 h-2 rounded-full bg-amber-600 flex-shrink-0" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No anomalies flagged for this project.</p>
              )}
            </div>
          </div>

          {/* AI Deep Dive Block */}
          <div className="bg-card border-2 border-primary/20 rounded-xl p-6 shadow-sm bg-gradient-to-br from-card to-primary/5">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              {!aiResult && !investigating && (
                <>
                  <h3 className="text-xl font-bold">Deep Dive AI Investigation</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Cross-reference financial disbursements with physical satellite & ground reports.
                  </p>
                  <div onClick={handleInvestigate}>
                    <FlowButton text={PLACEHOLDERS.BUTTON_INVESTIGATE_AI} />
                  </div>
                </>
              )}
              {investigating && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse text-primary">Analyzing project telemetry...</p>
                </div>
              )}
              {aiResult && (
                <div className="w-full text-left space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  {/* AI Synthesis */}
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-primary">
                      <CheckCircle size={20} /> AI Synthesis
                    </h4>
                    <p className="mt-2 text-sm bg-background p-4 rounded-lg border border-border leading-relaxed whitespace-pre-line">
                      {aiResult.explanation}
                    </p>
                  </div>

                  {/* Key Findings */}
                  {aiResult.keyFindings && aiResult.keyFindings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2 text-amber-600">
                        <Lightbulb size={20} /> Key Findings
                      </h4>
                      <ul className="mt-2 space-y-2">
                        {aiResult.keyFindings.map((finding: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border border-border font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-red-600">
                      <AlertCircle size={20} /> Recommended Actions
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {(aiResult.recommendedActions || []).map((action: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border border-border font-medium">
                          <ArrowLeft className="rotate-180 text-primary w-4 h-4" /> {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall Risk Score</h3>
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r="56" fill="none" 
                  stroke={getRiskColorHex(data.risk_score)} 
                  strokeWidth="12" strokeDasharray="351.85" 
                  strokeDashoffset={351.85 - (351.85 * (data.risk_score || 0)) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-4xl font-bold">{data.risk_score}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getRiskBadgeClass(data.risk_severity)}`}>
              {data.risk_severity} RISK
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Metrics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Sanctioned Amount</span>
                <span className="font-semibold">{data.amount_sanctioned}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Physical Progress</span>
                <span className="font-semibold">{data.progress_physical}%</span>
              </div>
              {data.progress_financial !== undefined && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Financial Progress</span>
                  <span className="font-semibold">{data.progress_financial}%</span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">District</span>
                <span className="font-semibold">{data.district}</span>
              </div>
              <button
                onClick={handleReviewContractor}
                disabled={actionLoading === 'review'}
                className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'review' ? 'Loading...' : PLACEHOLDERS.BUTTON_REVIEW_CONTRACTOR}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({ title, score }: { title: string; score: number }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold" style={{ color: getRiskColorHex(score) }}>{score}</p>
    </div>
  );
}

function getRiskColorHex(score: number) {
  if (score >= 80) return '#D92D20';
  if (score >= 60) return '#FC7005';
  if (score >= 40) return '#FF9E1B';
  return '#22c55e';
}

function getRiskBadgeClass(severity: string) {
  if (severity === 'CRITICAL') return 'bg-risk-critical/10 text-risk-critical border border-risk-critical/20';
  if (severity === 'HIGH') return 'bg-risk-high/10 text-risk-high border border-risk-high/20';
  if (severity === 'MEDIUM') return 'bg-risk-medium/10 text-risk-medium border border-risk-medium/20';
  return 'bg-risk-low/10 text-risk-low border border-risk-low/20';
}
