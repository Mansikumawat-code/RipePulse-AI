import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes, AlertTriangle, Flame, Leaf, DollarSign, Plus,
  Activity, Cpu, Wifi, Server, ArrowRight, RefreshCw,
  Truck, CheckCircle2, Clock, Shield, Users, BarChart2,
  Inbox, Zap, Radio, Thermometer, Package, TrendingUp,
  MapPin, ChevronRight, Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  display, formatDaysFromHours, formatHours, formatKg, needsAction, parseRecoveredValue,
} from '../utils/format';
import { inquiryService } from '../services/inquiryService';

// ─── Shared sub-components ────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon: Icon, tone = 'text-emerald-400', bg = 'border-emerald-800/40', subtext }) => (
  <div className={`rounded-2xl border ${bg} bg-[#18261a]/70 p-4`}>
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/50">{label}</p>
      <Icon className={`h-4 w-4 ${tone}`} />
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
    {subtext && <p className="mt-1 text-[10px] text-emerald-200/40">{subtext}</p>}
  </div>
);

const SysStatusRow = ({ label, ok, icon: Icon }) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-2 text-emerald-200/60">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-500'}`} />
      </span>
      <span className={`font-bold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{ok ? 'Active' : 'Offline'}</span>
    </div>
  </div>
);

const QuickLink = ({ label, to, primary }) => (
  <Link
    to={to}
    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
      primary
        ? 'bg-emerald-500/80 text-slate-950 hover:bg-emerald-400'
        : 'border border-emerald-800/40 text-emerald-200/70 hover:bg-white/5 hover:text-white'
    }`}
  >
    {label}
    <ArrowRight className="h-3.5 w-3.5" />
  </Link>
);

// ─── WAREHOUSE MANAGER Overview ───────────────────────────────────────────────

const WarehouseOverview = ({ batches, alerts, dispatches, health, backendOnline, wsConnected, connectionStatus, refreshData, setSelectedBatchId }) => {
  const active       = batches.length;
  const atRisk       = batches.filter((b) => b.riskLevel === 'HIGH' || b.riskLevel === 'CRITICAL').length;
  const critical     = batches.filter((b) => b.riskLevel === 'CRITICAL').length;
  const uniqueProd   = new Set(batches.map((b) => b.produce)).size;
  const wasteKg      = dispatches.reduce((s, d) => s + (Number(d.wasteAvoidedKg) || 0), 0);
  const unresolved   = alerts.filter((a) => a.status === 'UNRESOLVED').length;

  const criticalBatches = batches.filter((b) => b.riskLevel === 'CRITICAL' || b.riskLevel === 'HIGH').slice(0, 6);
  const recentAlerts    = [...alerts].sort((a, b) => (a.status === 'UNRESOLVED' ? -1 : 1)).slice(0, 5);

  const kpis = [
    { label: 'Active Batches',    value: active,                             icon: Boxes,         tone: 'text-emerald-400', bg: 'border-emerald-800/40' },
    { label: 'Produce Types',     value: uniqueProd,                         icon: Leaf,          tone: 'text-emerald-400', bg: 'border-emerald-800/40' },
    { label: 'At-Risk Batches',   value: atRisk,                             icon: AlertTriangle, tone: 'text-amber-400',   bg: 'border-amber-800/30' },
    { label: 'Critical Batches',  value: critical,                           icon: Flame,         tone: 'text-rose-400',    bg: 'border-rose-800/30' },
    { label: 'Unresolved Alerts', value: unresolved,                         icon: Activity,      tone: unresolved > 0 ? 'text-rose-400' : 'text-emerald-400', bg: unresolved > 0 ? 'border-rose-800/30' : 'border-emerald-800/40' },
    { label: 'Waste Prevented',   value: wasteKg ? formatKg(wasteKg) : '—', icon: DollarSign,    tone: 'text-emerald-400', bg: 'border-emerald-800/40' },
  ];

  const sysStatus = [
    { label: 'Backend',     ok: backendOnline === true,              icon: Server },
    { label: 'AI Engine',   ok: health?.model_status === 'loaded',   icon: Cpu },
    { label: 'IoT Telemetry', ok: connectionStatus === 'LIVE',       icon: Radio },
    { label: 'WebSocket',   ok: wsConnected,                         icon: Wifi },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Warehouse Operations"
        title="Chamber & Inventory Status"
        subtitle="Live inventory, IoT chamber telemetry, and risk levels requiring immediate action."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/warehouse/batches/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400">
              <Plus className="h-3.5 w-3.5" /> Add Batch
            </Link>
            <button type="button" onClick={refreshData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Critical Batches */}
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">
                🔴 Critical & High-Risk Batches — Needs Action
              </h2>
              <Link to="/warehouse/batches" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                View All →
              </Link>
            </div>
            {criticalBatches.length === 0 ? (
              <p className="px-5 py-6 text-sm text-emerald-200/50">No critical or high-risk batches at this time. ✓</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/6 text-[10px] font-bold uppercase tracking-wider text-emerald-300/40">
                  <tr>
                    <th className="px-4 py-2.5">Batch</th>
                    <th className="px-4 py-2.5">Produce</th>
                    <th className="px-4 py-2.5">Zone</th>
                    <th className="px-4 py-2.5">RSL</th>
                    <th className="px-4 py-2.5">Risk</th>
                    <th className="px-4 py-2.5">Route</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {criticalBatches.map((b) => {
                    const feasible = b.currentRoute?.isFeasible;
                    return (
                      <tr key={b.id} className="hover:bg-white/4 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">{b.id}</td>
                        <td className="px-4 py-2.5 text-white">{b.icon} {display(b.produce)}</td>
                        <td className="px-4 py-2.5 text-emerald-200/60 text-[10px]">{display(b.zone, '—')}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          <span className={Number(b.remainingShelfLifeHours) < 48 ? 'text-rose-400 font-bold' : 'text-white'}>
                            {formatDaysFromHours(b.remainingShelfLifeHours) || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><RiskBadge level={b.riskLevel} size="sm" /></td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold ${feasible === false ? 'text-rose-400' : feasible ? 'text-emerald-400' : 'text-emerald-200/40'}`}>
                            {feasible === false ? '✕ Not Feasible' : feasible ? '✓ Feasible' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            to={`/warehouse/batches/${b.id}`}
                            onClick={() => setSelectedBatchId(b.id)}
                            className="rounded-lg bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Chamber Alerts */}
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">🔔 Chamber Alerts</h2>
              <Link to="/warehouse/alerts" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                Manage All →
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-emerald-200/50">No active chamber alerts.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentAlerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                        a.severity === 'CRITICAL' ? 'bg-rose-400 animate-pulse' :
                        a.severity === 'HIGH'     ? 'bg-orange-400' :
                        a.severity === 'MEDIUM'   ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{a.title}</p>
                        <p className="text-[11px] text-emerald-200/50 truncate">{a.batchId} · {a.timestamp}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 ${a.status === 'UNRESOLVED' ? 'text-rose-400' : 'text-emerald-200/40'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">System Status</h2>
            <div className="space-y-2.5">
              {sysStatus.map((s) => <SysStatusRow key={s.label} {...s} />)}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Warehouse Actions</h2>
            <div className="space-y-2">
              <QuickLink label="Register New Batch" to="/warehouse/batches/new" primary />
              <QuickLink label="Batch Inventory" to="/warehouse/batches" />
              <QuickLink label="IoT Chamber Telemetry" to="/warehouse/live" />
              <QuickLink label="Chamber Alerts" to="/warehouse/alerts" />
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Storage Zones</h2>
            {['Deep Chill Bay A', 'Controlled Atmosphere B', 'Dry Ambient Bay C'].map((zone) => {
              const count = batches.filter((b) => b.zone === zone).length;
              return (
                <div key={zone} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[11px] text-emerald-200/70">{zone}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 rounded-full">{count} batches</span>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};

// ─── SUPPLY CHAIN MANAGER Overview ────────────────────────────────────────────

const SupplyChainOverview = ({ batches, dispatches, alerts, backendOnline, wsConnected, connectionStatus, refreshData, setSelectedBatchId }) => {
  const actionable    = batches.filter(needsAction);
  const active        = dispatches.filter((d) => d.status !== 'DELIVERED').length;
  const delivered     = dispatches.filter((d) => d.status === 'DELIVERED').length;
  const wasteKg       = dispatches.reduce((s, d) => s + (Number(d.wasteAvoidedKg) || 0), 0);
  const recovered     = dispatches.reduce((s, d) => s + parseRecoveredValue(d.recoveredValue), 0);
  const inTransit     = dispatches.filter((d) => d.status === 'IN_TRANSIT').length;
  const infeasible    = batches.filter((b) => b.currentRoute?.isFeasible === false).length;

  const kpis = [
    { label: 'Pending Reroutes',  value: actionable.length, icon: AlertTriangle, tone: actionable.length > 0 ? 'text-amber-400' : 'text-emerald-400', bg: actionable.length > 0 ? 'border-amber-800/30' : 'border-emerald-800/40', subtext: 'Awaiting decision' },
    { label: 'Route Infeasible',  value: infeasible,        icon: MapPin,        tone: infeasible > 0 ? 'text-rose-400' : 'text-emerald-400', bg: infeasible > 0 ? 'border-rose-800/30' : 'border-emerald-800/40', subtext: 'Need immediate reroute' },
    { label: 'Active Dispatches', value: active,            icon: Truck,         tone: 'text-indigo-400', bg: 'border-indigo-800/30', subtext: 'En route' },
    { label: 'In Transit',        value: inTransit,         icon: Activity,      tone: 'text-blue-400',   bg: 'border-blue-800/30', subtext: 'Moving now' },
    { label: 'Delivered',         value: delivered,         icon: CheckCircle2,  tone: 'text-emerald-400', bg: 'border-emerald-800/40', subtext: 'Completed' },
    { label: 'Value Recovered',   value: recovered ? `₹${Math.round(recovered / 1000)}K` : '—', icon: TrendingUp, tone: 'text-emerald-400', bg: 'border-emerald-800/40', subtext: 'Economic impact' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Supply Chain Command"
        title="Route Decisions & Dispatch Control"
        subtitle="Real-time batch routing intelligence, reroute approvals, and active dispatch tracking for Indore Region."
        actions={
          <button type="button" onClick={refreshData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">

          {/* Pending Reroute Decisions */}
          <section className="rounded-2xl border border-amber-800/30 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300/80">
                ⚡ Pending Reroute Decisions
              </h2>
              <Link to="/supply-chain/decisions" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                Go to Decision Hub →
              </Link>
            </div>
            {actionable.length === 0 ? (
              <div className="px-5 py-6 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-emerald-200/60">All routes are feasible. No reroute decisions pending.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {actionable.slice(0, 6).map((b) => {
                  const rec = b.recommendedAction || {};
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm border ${
                          b.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/30' : 'bg-amber-500/20 border-amber-500/30'
                        }`}>{b.icon || '📦'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">{b.id}</span>
                            <RiskBadge level={b.riskLevel} size="sm" />
                          </div>
                          <p className="text-xs text-white">{display(b.produce)}</p>
                          <p className="text-[10px] text-emerald-200/50 mt-0.5 truncate max-w-[240px]">{display(rec.title, 'Action required')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-emerald-300/40">RSL</p>
                          <p className={`text-xs font-bold ${Number(b.remainingShelfLifeHours) < 24 ? 'text-rose-400' : 'text-white'}`}>
                            {formatDaysFromHours(b.remainingShelfLifeHours) || '—'}
                          </p>
                        </div>
                        <Link
                          to={`/supply-chain/decisions?batch=${b.id}`}
                          onClick={() => setSelectedBatchId(b.id)}
                          className="rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-black text-slate-950 hover:bg-amber-400"
                        >
                          Decide Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Dispatches */}
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">🚛 Active Dispatches</h2>
              <Link to="/supply-chain/dispatch" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                Full Tracking →
              </Link>
            </div>
            {dispatches.length === 0 ? (
              <p className="px-5 py-6 text-sm text-emerald-200/50">No dispatches created yet. Approve a reroute to generate one.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {dispatches.slice(0, 5).map((d) => {
                  const progress = Math.min(100, Math.max(0, Number(d.progressPct) || 0));
                  const isDelivered = d.status === 'DELIVERED';
                  return (
                    <div key={d.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <span className="font-mono text-[10px] text-emerald-400">{d.id}</span>
                          <p className="text-xs font-bold text-white">{display(d.produce)} → {display(d.destination)}</p>
                          <p className="text-[10px] text-emerald-200/50">{d.carrier} · {d.driverName}</p>
                        </div>
                        <span className={`text-[10px] font-black rounded-full px-2.5 py-0.5 border ${
                          isDelivered ? 'text-emerald-300 border-emerald-600/40 bg-emerald-600/10' :
                          d.status === 'IN_TRANSIT' ? 'text-amber-300 border-amber-600/40 bg-amber-600/10' :
                          'text-indigo-300 border-indigo-600/40 bg-indigo-600/10'
                        }`}>{d.status?.replace('_', ' ')}</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-black/30 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isDelivered ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-right text-[10px] text-emerald-200/40 mt-1">{progress}% complete</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Route Impact Summary</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300/40 mb-0.5">Waste Prevented</p>
                <p className="text-xl font-black text-emerald-400">{formatKg(wasteKg) || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300/40 mb-0.5">Value Recovered</p>
                <p className="text-xl font-black text-white">{recovered ? `₹${recovered.toLocaleString()}` : '—'}</p>
              </div>
              <div className="pt-2 border-t border-white/8">
                <p className="text-[10px] uppercase font-bold text-emerald-300/40 mb-0.5">Network Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${connectionStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className={`text-xs font-bold ${connectionStatus === 'LIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>{connectionStatus}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Quick Actions</h2>
            <div className="space-y-2">
              <QuickLink label="Reroute Decisions" to="/supply-chain/decisions" primary />
              <QuickLink label="Dispatch Tracking" to="/supply-chain/dispatch" />
              <QuickLink label="Transit Alerts" to="/supply-chain/alerts" />
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Dispatch Status Breakdown</h2>
            {['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].map((status) => {
              const count = dispatches.filter((d) => d.status === status).length;
              const colors = {
                PREPARING: 'text-slate-300', DISPATCHED: 'text-indigo-300',
                IN_TRANSIT: 'text-amber-300', DELIVERED: 'text-emerald-400',
              };
              return (
                <div key={status} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className={`text-[11px] font-semibold ${colors[status]}`}>{status.replace('_', ' ')}</span>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 rounded-full">{count}</span>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN Overview ────────────────────────────────────────────────────────────

const AdminOverview = ({ batches, dispatches, alerts, health, backendOnline, wsConnected, connectionStatus, refreshData, setSelectedBatchId }) => {
  const [inquiries, setInquiries] = React.useState([]);

  React.useEffect(() => {
    inquiryService.getInquiries()
      .then((data) => {
        if (Array.isArray(data)) setInquiries(data);
      })
      .catch((e) => console.warn('Could not load inquiries:', e));
  }, []);

  const totalBatches   = batches.length;
  const criticalBatches = batches.filter((b) => b.riskLevel === 'CRITICAL').length;
  const totalDispatches = dispatches.length;
  const activeDisp      = dispatches.filter((d) => d.status !== 'DELIVERED').length;
  const unresolved      = alerts.filter((a) => a.status === 'UNRESOLVED').length;
  const pendingInq      = inquiries.filter((i) => i.status === 'NEW').length;
  const wasteKg         = dispatches.reduce((s, d) => s + (Number(d.wasteAvoidedKg) || 0), 0);
  const recovered       = dispatches.reduce((s, d) => s + parseRecoveredValue(d.recoveredValue), 0);
  const actionable      = batches.filter(needsAction);

  const kpis = [
    { label: 'Total Batches',     value: totalBatches,      icon: Boxes,       tone: 'text-emerald-400', bg: 'border-emerald-800/40' },
    { label: 'Critical Batches',  value: criticalBatches,   icon: Flame,       tone: criticalBatches > 0 ? 'text-rose-400' : 'text-emerald-400', bg: criticalBatches > 0 ? 'border-rose-800/30' : 'border-emerald-800/40' },
    { label: 'Active Dispatches', value: activeDisp,        icon: Truck,       tone: 'text-indigo-400', bg: 'border-indigo-800/30' },
    { label: 'Unresolved Alerts', value: unresolved,        icon: AlertTriangle, tone: unresolved > 0 ? 'text-amber-400' : 'text-emerald-400', bg: unresolved > 0 ? 'border-amber-800/30' : 'border-emerald-800/40' },
    { label: 'New Inquiries',     value: pendingInq,        icon: Inbox,       tone: pendingInq > 0 ? 'text-blue-400' : 'text-emerald-400', bg: pendingInq > 0 ? 'border-blue-800/30' : 'border-emerald-800/40', subtext: 'Awaiting review' },
    { label: 'AI Model',          value: health?.model_status === 'loaded' ? 'Online' : 'Offline', icon: Cpu, tone: health?.model_status === 'loaded' ? 'text-emerald-400' : 'text-rose-400', bg: 'border-emerald-800/40' },
  ];

  const sysStatus = [
    { label: 'Backend API',     ok: backendOnline === true,             icon: Server },
    { label: 'XGBoost Model',   ok: health?.model_status === 'loaded',  icon: Cpu },
    { label: 'Live Telemetry',  ok: connectionStatus === 'LIVE',        icon: Activity },
    { label: 'WebSocket Hub',   ok: wsConnected,                        icon: Wifi },
    { label: 'RBAC Auth',       ok: true,                               icon: Shield },
    { label: 'Database',        ok: backendOnline === true,             icon: Server },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="System Administration"
        title="Global Command Center"
        subtitle="Full system oversight — AI engine, all roles, network status, integration inquiries, and platform-wide analytics."
        actions={
          <button type="button" onClick={refreshData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </button>
        }
      />

      {/* Admin Alert Banner */}
      {(criticalBatches > 0 || unresolved > 0 || pendingInq > 0) && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-900/20 px-5 py-3.5 flex flex-wrap items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex flex-wrap gap-3 text-xs">
            {criticalBatches > 0 && <span className="font-bold text-rose-300">{criticalBatches} critical batch{criticalBatches > 1 ? 'es' : ''} require intervention</span>}
            {unresolved > 0 && <span className="font-bold text-amber-300">{unresolved} unresolved alert{unresolved > 1 ? 's' : ''}</span>}
            {pendingInq > 0 && <span className="font-bold text-blue-300">{pendingInq} new integration inquir{pendingInq > 1 ? 'ies' : 'y'}</span>}
          </div>
          <Link to="/admin/alerts" className="ml-auto text-[11px] font-bold text-amber-400 hover:underline">
            View Alerts →
          </Link>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">

          {/* All Roles Summary */}
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">👥 Platform Role Metrics</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
              {[
                { icon: '🏢', role: 'Warehouse Mgr',   stat: `${totalBatches} batches`, sub: `${criticalBatches} critical` },
                { icon: '🚛', role: 'Supply Chain Mgr', stat: `${activeDisp} active`,   sub: `${actionable.length} pending decisions` },
                { icon: '🛡️', role: 'System Admin',     stat: `${pendingInq} inquiries`, sub: `${unresolved} alerts` },
                { icon: '🏬', role: 'Dest. Receiver',   stat: `${totalDispatches} shipments`, sub: `${dispatches.filter(d => d.status === 'DELIVERED').length} delivered` },
              ].map((r) => (
                <div key={r.role} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{r.icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/50">{r.role}</p>
                  </div>
                  <p className="text-base font-black text-white">{r.stat}</p>
                  <p className="text-[10px] text-emerald-200/40">{r.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Critical Batches requiring admin action */}
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">🔴 Batches Requiring Action</h2>
              <Link to="/admin/batches" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">All Batches →</Link>
            </div>
            {actionable.length === 0 ? (
              <div className="px-5 py-6 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-emerald-200/60">No critical action required. All routes feasible.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/6 text-[10px] font-bold uppercase tracking-wider text-emerald-300/40">
                  <tr>
                    <th className="px-4 py-2.5">Batch</th>
                    <th className="px-4 py-2.5">Produce</th>
                    <th className="px-4 py-2.5">RSL</th>
                    <th className="px-4 py-2.5">Risk</th>
                    <th className="px-4 py-2.5">Action Required</th>
                    <th className="px-4 py-2.5 text-right">→</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {actionable.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">{b.id}</td>
                      <td className="px-4 py-2.5 text-white">{b.icon} {display(b.produce)}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <span className={Number(b.remainingShelfLifeHours) < 48 ? 'text-rose-400 font-bold' : 'text-white'}>
                          {formatDaysFromHours(b.remainingShelfLifeHours) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><RiskBadge level={b.riskLevel} size="sm" /></td>
                      <td className="px-4 py-2.5 text-emerald-200/60 text-[10px] max-w-[160px] truncate">
                        {display(b.recommendedAction?.title, 'Review required')}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link to={`/admin/decisions?batch=${b.id}`} onClick={() => setSelectedBatchId(b.id)}
                          className="rounded-lg bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-emerald-400">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Integration Inquiries */}
          <section className="rounded-2xl border border-blue-800/30 bg-[#18261a]/70 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-300/70">📥 Integration Inquiries</h2>
              <Link to="/admin/inquiries" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                Manage All →
              </Link>
            </div>
            {inquiries.length === 0 ? (
              <p className="px-5 py-6 text-sm text-emerald-200/50">No integration inquiries received yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {inquiries.slice(0, 3).map((inq) => (
                  <div key={inq.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-xs font-bold text-white">{inq.warehouse_name}</p>
                      <p className="text-[10px] text-emerald-200/50">{inq.email} · {inq.created_at}</p>
                    </div>
                    <span className={`text-[10px] font-black rounded-full px-2.5 py-0.5 border ${
                      inq.status === 'NEW' ? 'text-blue-300 border-blue-600/40 bg-blue-600/10' :
                      inq.status === 'REVIEWED' ? 'text-amber-300 border-amber-600/40 bg-amber-600/10' :
                      'text-emerald-300 border-emerald-600/40 bg-emerald-600/10'
                    }`}>{inq.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">System Health</h2>
            <div className="space-y-2.5">
              {sysStatus.map((s) => <SysStatusRow key={s.label} {...s} />)}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Platform Metrics</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300/40">Total Waste Prevented</p>
                <p className="text-xl font-black text-emerald-400">{formatKg(wasteKg) || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300/40">Total Value Recovered</p>
                <p className="text-xl font-black text-white">{recovered ? `₹${recovered.toLocaleString()}` : '—'}</p>
              </div>
              {health?.input_features && (
                <div className="pt-2 border-t border-white/8">
                  <p className="text-[10px] uppercase font-bold text-emerald-300/40 mb-1">AI Model Features</p>
                  <p className="text-xs font-bold text-white">{health.input_features?.length || 0} input features loaded</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Admin Quick Actions</h2>
            <div className="space-y-2">
              <QuickLink label="All Batches" to="/admin/batches" primary />
              <QuickLink label="Rerouting Hub" to="/admin/decisions" />
              <QuickLink label="Global Dispatches" to="/admin/dispatch" />
              <QuickLink label="Integration Inquiries" to="/admin/inquiries" />
              <QuickLink label="System Audit Logs" to="/admin/audit-logs" />
              <QuickLink label="System Alerts" to="/admin/alerts" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// ─── Main OverviewPage (Role Dispatcher) ──────────────────────────────────────

export const OverviewPage = () => {
  const {
    batches, dispatches, alerts, dataLoading, backendOnline,
    refreshData, errorMessage, wsConnected, connectionStatus,
    health, setSelectedBatchId, currentUser,
  } = useApp();

  if (dataLoading) return <LoadingState label="Loading operational overview…" />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;

  const roleId = currentUser?.id || 'WAREHOUSE_MANAGER';
  const sharedProps = { batches, dispatches, alerts, health, backendOnline, wsConnected, connectionStatus, refreshData, setSelectedBatchId };

  if (roleId === 'SUPPLY_CHAIN_MANAGER') return <SupplyChainOverview {...sharedProps} />;
  if (roleId === 'ADMIN')                return <AdminOverview {...sharedProps} />;
  return <WarehouseOverview {...sharedProps} />;
};
