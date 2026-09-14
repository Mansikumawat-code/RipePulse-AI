import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Boxes, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Truck, 
  DollarSign, 
  Compass,
  Radio,
  Cpu,
  ShieldQuestion,
  Route,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { RiskBadge } from '../common/RiskBadge';

// Simple visual explaining the end-to-end product story in one glance:
// SENSE -> PREDICT -> RISK -> DECISION -> ACTION
const SystemFlow = () => {
  const stages = [
    { label: 'Live Telemetry', icon: Radio, desc: 'Sense' },
    { label: 'AI Prediction', icon: Cpu, desc: 'Predict' },
    { label: 'Risk', icon: ShieldQuestion, desc: 'Assess' },
    { label: 'Decision', icon: Route, desc: 'Decide' },
    { label: 'Action', icon: Zap, desc: 'Act' },
  ];
  return (
    <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/60 mb-4">How RipePulse Works</h3>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.label}>
              <div className="flex flex-col items-center text-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/60 block">{stage.desc}</span>
                  <span className="text-xs font-bold text-white">{stage.label}</span>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-emerald-600/50 hidden sm:block shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const CommandDashboard = () => {
  const { batches, warehouses, alerts, dispatches, approveReroute, riskSummary } = useApp();
  const warehouse = warehouses && warehouses.length > 0 ? warehouses[0] : null;

  const totalBatches = batches.length;
  const criticalBatches = batches.filter(b => b.riskLevel === 'CRITICAL');
  const highBatches = batches.filter(b => b.riskLevel === 'HIGH');
  const totalValueAtRisk = criticalBatches.concat(highBatches).reduce((sum, b) => sum + (b.estimatedValue || 0), 0);
  const totalWeightKg = batches.reduce((sum, b) => sum + (b.weightKg || 0), 0);
  const urgentBatch = criticalBatches[0] || batches[0];

  // Waste-prevented figures from backend risk summary
  const wastePreventedValue = riskSummary?.wastePreventedThisMonthValue;
  const wastePreventedKg = riskSummary?.wastePreventedThisMonthKg;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Enterprise Operational Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              RipePulse AI
            </span>
            {warehouse && <span className="text-xs text-emerald-300/50 font-medium">Node: {warehouse.name}</span>}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Predict. Prioritize. Prevent Produce Waste.
          </h1>
          <p className="text-xs text-emerald-200/50 mt-1 max-w-2xl">
            A live look at what needs attention right now — batch health, risks, and the actions that will prevent waste.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/decisions"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-400/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Open Dynamic Rerouting</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Inventory"
          value={`${totalBatches} Batches`}
          subtitle={totalWeightKg > 0 ? `${totalWeightKg.toLocaleString()} kg under monitoring` : 'Loading…'}
          trend=""
          trendType="neutral"
          icon={Boxes}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-900/50"
        />

        <StatCard
          title="Critical Spoilage Risk"
          value={`${criticalBatches.length} Batches`}
          subtitle="Requires immediate reroute"
          trend={criticalBatches.length > 0 ? "URGENT" : "Clear"}
          trendType={criticalBatches.length > 0 ? "negative" : "positive"}
          icon={Flame}
          iconColor="text-rose-400"
          iconBg="bg-rose-900/50"
        />

        <StatCard
          title="Value at Waste Risk"
          value={`$${totalValueAtRisk.toLocaleString()}`}
          subtitle="Eligible for rapid salvage"
          trend=""
          trendType="warning"
          icon={DollarSign}
          iconColor="text-amber-400"
          iconBg="bg-amber-900/50"
        />

        <StatCard
          title="Waste Prevented MTD"
          value={wastePreventedValue != null ? `$${Number(wastePreventedValue).toLocaleString()}` : '—'}
          subtitle={wastePreventedKg != null ? `${(wastePreventedKg / 1000).toFixed(1)} Tons produce saved` : 'Loading from backend…'}
          trend=""
          trendType="positive"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-900/50"
        />
      </div>

      {/* System Flow: explains the whole product in one glance */}
      <SystemFlow />

      {/* Priority Actions */}
      <div className="grid grid-cols-1">
        
        {/* Urgent Action Card — only renders if we have at least one batch */}
        {!urgentBatch ? (
          <div className="rounded-2xl border border-emerald-900/40 bg-[#18261a]/60 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-emerald-200/60">
              No batches loaded — backend may be starting up.
            </p>
          </div>
        ) : (
        <div className="bg-[#18261a]/80 rounded-2xl border border-rose-800/40 p-6 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-900/50 text-rose-400 rounded-lg border border-rose-700/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Priority Redistribution Alert</h3>
                <p className="text-xs text-emerald-200/50">Autonomous degradation model triggered immediate rerouting</p>
              </div>
            </div>
            <RiskBadge level={urgentBatch.riskLevel} />
          </div>

          <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{urgentBatch.icon || '📦'}</span>
              <div>
                <h4 className="text-lg font-extrabold text-white">{urgentBatch.produce}</h4>
                <div className="flex items-center gap-2 text-xs text-emerald-300/50 mt-0.5">
                  <span className="font-mono font-bold text-emerald-300/70">{urgentBatch.id}</span>
                  {urgentBatch.zone && <><span>•</span><span>{urgentBatch.zone}</span></>}
                  {urgentBatch.weightKg != null && (
                    <><span>•</span><span>{urgentBatch.palletCount} Pallets ({Number(urgentBatch.weightKg).toLocaleString()} kg)</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
              <span className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider block">Remaining Shelf Life</span>
              <span className="text-2xl font-black text-rose-400">{urgentBatch.remainingShelfLifeHours} Hours</span>
              <span className="text-[11px] text-emerald-300/40 block font-medium">Original Route: {urgentBatch.currentRoute?.transitDurationHours}h transit (Infeasible)</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Recommended AI Intervention</span>
                <h5 className="text-sm font-bold text-white mt-0.5">{urgentBatch.recommendedAction?.title}</h5>
                <p className="text-xs text-emerald-200/50 mt-1 max-w-xl">
                  {urgentBatch.recommendedAction?.reason}
                </p>
              </div>

              {urgentBatch.recommendedAction?.status === 'PENDING_APPROVAL' ? (
                <button
                  onClick={() => approveReroute(urgentBatch.id, urgentBatch.recommendedAction?.targetDestinationId)}
                  className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Approve Reroute
                </button>
              ) : (
                <span className="shrink-0 px-3 py-1.5 bg-emerald-900/60 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-700/50">
                  ✓ Reroute Approved
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Link
              to={`/batches/${urgentBatch.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 transition-all"
            >
              <span>VIEW BATCH</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
        )}

      </div>

      {/* Active Dispatches & Priority Queue Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Dispatches */}
        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Active Reroute Dispatches</h3>
            </div>
            <Link to="/dispatch" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/5 mt-2">
            {dispatches.slice(0, 2).map((disp) => (
              <div key={disp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{disp.produce}</span>
                    <span className="text-[10px] font-mono text-emerald-300/50">({disp.id})</span>
                  </div>
                  <p className="text-xs text-emerald-200/40 mt-0.5">Dest: {disp.destination}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                    {disp.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-emerald-300/40 block mt-0.5 font-medium">{disp.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Priority Alerts Ticker</h3>
            </div>
            <Link to="/alerts" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
              <span>Alert Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/5 mt-2">
            {alerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                  </div>
                  <p className="text-xs text-emerald-200/40 mt-0.5 line-clamp-1">{alert.message}</p>
                </div>
                <span className="text-[11px] text-emerald-400/40 shrink-0">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
