import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  User,
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auditService } from '../services/auditService';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/common/EmptyState';

const ACTION_COLOR_MAP = {
  BATCH_CREATE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  BATCH_UPDATE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  BATCH_DELETE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  BATCH_ACTION_UPDATE: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  REROUTE_DISPATCH: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  REROUTE_COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ROUTE_ISSUE_SIMULATED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  DISPATCH_CREATE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  DISPATCH_STATUS_UPDATE: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  SHIPMENT_ACCEPTED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  SHIPMENT_PARTIALLY_ACCEPTED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SHIPMENT_REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ALERT_ACKNOWLEDGE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ALERT_RESOLVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  INQUIRY_STATUS_UPDATE: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  INQUIRY_SUBMITTED: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  SYSTEM_DIAGNOSTICS: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

const ROLE_BADGE_MAP = {
  ADMIN: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  WAREHOUSE_MANAGER: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  SUPPLY_CHAIN_MANAGER: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  DESTINATION_RECEIVER: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  EXTERNAL: 'bg-slate-800 text-slate-300 border-slate-700'
};

export const AuditLogsPage = () => {
  const { theme, showNotification } = useApp() || {};
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAuditLogs({
        role: selectedRole,
        action: selectedAction,
        entity_type: selectedEntity,
        search: searchTerm,
        limit: 200
      });
      if (data?.logs) {
        setLogs(data.logs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch audit logs from backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedAction, selectedEntity, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const handleExportJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ripepulse_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('Export successful', 'Audit trail exported to JSON.', 'success');
    } catch {
      showNotification('Export failed', 'Could not export audit trail.', 'error');
    }
  };

  // Metrics
  const totalCount = logs.length;
  const batchActions = logs.filter((l) => l.entityType === 'BATCH').length;
  const dispatchActions = logs.filter((l) => l.entityType === 'DISPATCH').length;
  const receiptActions = logs.filter((l) => l.entityType === 'RECEIPT').length;
  const alertActions = logs.filter((l) => l.entityType === 'ALERT').length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="System Oversight"
        title="Admin System Audit Logs"
        subtitle="Immutable operational trace recorded in SQLite. Tracks all state mutations, actor roles, reroutes, and intake decisions."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                isDark
                  ? 'border-emerald-800/40 text-emerald-300 hover:bg-white/5 disabled:opacity-40'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
              }`}
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                isDark
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Trail
            </button>
          </div>
        }
      />

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900/40 bg-[#0e1a11]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Total Logged</span>
            <History className="h-4 w-4 text-emerald-400" />
          </div>
          <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCount}</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900/40 bg-[#0e1a11]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Batch Events</span>
            <Boxes className="h-4 w-4 text-cyan-400" />
          </div>
          <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{batchActions}</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900/40 bg-[#0e1a11]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Dispatch/Reroute</span>
            <Truck className="h-4 w-4 text-indigo-400" />
          </div>
          <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{dispatchActions}</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900/40 bg-[#0e1a11]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Receipt Verifications</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{receiptActions}</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900/40 bg-[#0e1a11]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Alert Actions</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{alertActions}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-800/40 bg-[#122015]' : 'border-emerald-200 bg-white shadow-sm'}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400/60" />
            <input
              type="text"
              placeholder="Search by action, actor, description, or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark
                  ? 'border-emerald-800/50 bg-[#0c1610] text-white placeholder-emerald-400/40'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${
                isDark
                  ? 'border-emerald-800/50 bg-[#0c1610] text-emerald-200'
                  : 'border-slate-300 bg-slate-50 text-slate-800'
              }`}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">System Admin</option>
              <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
              <option value="SUPPLY_CHAIN_MANAGER">Supply Chain Manager</option>
              <option value="DESTINATION_RECEIVER">Destination Receiver</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${
                isDark
                  ? 'border-emerald-800/50 bg-[#0c1610] text-emerald-200'
                  : 'border-slate-300 bg-slate-50 text-slate-800'
              }`}
            >
              <option value="ALL">All Entities</option>
              <option value="BATCH">Batch</option>
              <option value="DISPATCH">Dispatch</option>
              <option value="RECEIPT">Receipt</option>
              <option value="ALERT">Alert</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="AI_MODEL">AI Model</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${
                isDark
                  ? 'border-emerald-800/50 bg-[#0c1610] text-emerald-200'
                  : 'border-slate-300 bg-slate-50 text-slate-800'
              }`}
            >
              <option value="ALL">All Actions</option>
              <option value="BATCH_CREATE">Batch Create</option>
              <option value="BATCH_UPDATE">Batch Update</option>
              <option value="BATCH_DELETE">Batch Delete</option>
              <option value="REROUTE_DISPATCH">Reroute Dispatch</option>
              <option value="DISPATCH_CREATE">Dispatch Create</option>
              <option value="DISPATCH_STATUS_UPDATE">Dispatch Status</option>
              <option value="SHIPMENT_ACCEPTED">Shipment Accepted</option>
              <option value="SHIPMENT_PARTIALLY_ACCEPTED">Partial Acceptance</option>
              <option value="SHIPMENT_REJECTED">Shipment Rejected</option>
              <option value="ALERT_ACKNOWLEDGE">Alert Acknowledge</option>
              <option value="ALERT_RESOLVE">Alert Resolve</option>
              <option value="INQUIRY_STATUS_UPDATE">Inquiry Update</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content State */}
      {loading ? (
        <LoadingState label="Loading persistent audit logs from SQLite…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="NO AUDIT RECORDS FOUND"
          message="No matching audit logs were found for the selected filters. Clear filters to view all entries."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const actionStyle = ACTION_COLOR_MAP[log.action] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            const roleStyle = ROLE_BADGE_MAP[log.actorRole] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <article
                key={log.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isDark
                    ? 'border-emerald-800/30 bg-[#111f14]/80 hover:border-emerald-700/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-transform ${
                        isDark ? 'border-emerald-800/60 bg-white/5 text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                      } ${isExpanded ? 'rotate-90' : ''}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Event ID */}
                        <span className="font-mono text-[11px] font-bold text-emerald-400">
                          {log.id}
                        </span>

                        {/* Action Badge */}
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${actionStyle}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>

                        {/* Entity Badge */}
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          isDark ? 'border-white/10 bg-white/5 text-emerald-200/70' : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}>
                          {log.entityType} {log.entityId ? `• ${log.entityId}` : ''}
                        </span>
                      </div>

                      {/* Description */}
                      <p className={`mt-1 text-xs font-semibold ${isDark ? 'text-emerald-100/90' : 'text-slate-800'}`}>
                        {log.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Actor & Timestamp */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <User className="h-3 w-3 text-emerald-400" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {log.actorName}
                        </span>
                      </div>
                      <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border ${roleStyle}`}>
                        {log.actorRole?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-white/10">
                      <p className={`font-mono text-[11px] font-medium ${isDark ? 'text-emerald-300/60' : 'text-slate-500'}`}>
                        {log.timestamp}
                      </p>
                      {log.facility && (
                        <p className={`text-[10px] truncate max-w-[140px] ${isDark ? 'text-emerald-400/40' : 'text-slate-400'}`}>
                          {log.facility}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className={`border-t p-4 ${isDark ? 'border-emerald-800/30 bg-[#0a140c]' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${isDark ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                          Audit Event Metadata
                        </p>
                        <dl className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <dt className={`w-28 font-bold ${isDark ? 'text-emerald-300/50' : 'text-slate-400'}`}>Entity Target:</dt>
                            <dd className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.entityType} ({log.entityId || 'N/A'})</dd>
                          </div>
                          <div className="flex items-center gap-2">
                            <dt className={`w-28 font-bold ${isDark ? 'text-emerald-300/50' : 'text-slate-400'}`}>Transition:</dt>
                            <dd className="font-semibold text-xs">
                              {log.previousStatus ? (
                                <span className="text-rose-400">{log.previousStatus} → </span>
                              ) : null}
                              <span className="text-emerald-400 font-bold">{log.newStatus || 'N/A'}</span>
                            </dd>
                          </div>
                          <div className="flex items-center gap-2">
                            <dt className={`w-28 font-bold ${isDark ? 'text-emerald-300/50' : 'text-slate-400'}`}>Operational Facility:</dt>
                            <dd className={isDark ? 'text-white' : 'text-slate-900'}>{log.facility || 'Indore Regional Command'}</dd>
                          </div>
                        </dl>
                      </div>

                      {log.details && (
                        <div>
                          <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${isDark ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                            Payload Details (JSON)
                          </p>
                          <pre className={`max-h-36 overflow-auto rounded-xl p-3 font-mono text-[11px] leading-relaxed border ${
                            isDark
                              ? 'border-emerald-900/60 bg-black/40 text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-800'
                          }`}>
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
