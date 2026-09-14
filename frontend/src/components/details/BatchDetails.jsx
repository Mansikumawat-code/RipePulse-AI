import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeft,
  Thermometer,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../common/RiskBadge';

// Displays a single batch's full detail panel.
// All data — telemetry, prediction, route — comes from the backend via AppContext.
export const BatchDetails = () => {
  const { id } = useParams();
  const { batches, approveReroute, liveTelemetrySeries, lastPrediction } = useApp();

  const batch = batches.find(b => b.id === id) || batches[0];

  // Use backend telemetry series from context — never generate frontend mock data.
  const telemetryData = (liveTelemetrySeries && liveTelemetrySeries.length > 0)
    ? liveTelemetrySeries
    : [];

  // Use last AI prediction if available, else fall back to batch fields from backend.
  const rsl = lastPrediction?.remainingShelfLifeHours ?? batch?.remainingShelfLifeHours;
  const sli = lastPrediction?.sli ?? batch?.sli;
  const confidenceScore = lastPrediction?.confidenceScore ?? batch?.confidenceScore;
  const riskLevel = lastPrediction?.riskLevel ?? batch?.riskLevel;

  // Explainability from backend: try lastPrediction, then batch.explainability field
  const explain = lastPrediction?.explainability || batch?.explainability || {};
  const primaryDriver = explain.primary_driver || explain.primaryDriver;
  const tempImpact = explain.temp_impact || explain.tempImpact;
  const vocImpact = explain.voc_impact || explain.vocImpact;

  const isFeasible = batch?.currentRoute?.isFeasible ?? true;

  const darkTooltip = {
    backgroundColor: '#071209',
    borderRadius: '8px',
    border: '1px solid #10b981',
    color: '#fff',
    fontSize: '11px'
  };

  if (!batch) return null;

  return (
    <div className="space-y-6 text-slate-100">

      {/* Header */}
      <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <Link
          to="/batches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-emerald-800/40 flex items-center justify-center text-3xl shadow-sm">
              {batch.icon || '📦'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">{batch.id}</span>
                <RiskBadge level={riskLevel} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {batch.produce}{' '}
                {batch.weightKg != null && (
                  <span className="text-emerald-300/50 font-bold text-base">
                    — {Number(batch.weightKg).toLocaleString()} kg
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction — data from backend only */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/60 mb-4">
          AI Prediction
          <span className="ml-2 text-emerald-400/40 normal-case font-normal text-[10px]">
            (XGBoost — via backend)
          </span>
        </h3>
        {rsl == null && sli == null ? (
          <p className="text-sm text-emerald-200/60">
            AI prediction pending — waiting for telemetry from backend…
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Remaining Shelf Life</span>
              <div className={`text-2xl font-black mt-1 ${rsl < 24 ? 'text-rose-400' : 'text-white'}`}>
                {rsl != null ? `${(rsl / 24).toFixed(1)} Days` : '—'}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">SLI</span>
              <div className={`text-2xl font-black mt-1 ${sli < 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sli != null ? `${Math.round(sli)}%` : '—'}
              </div>
            </div>
            {confidenceScore != null && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Confidence</span>
                <div className="text-2xl font-black mt-1 text-indigo-400">
                  {typeof confidenceScore === 'number' ? `${confidenceScore.toFixed(1)}%` : confidenceScore}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Why is this batch at risk? — comes from backend explainability */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/60 mb-4">
          Why is this batch at risk?
        </h3>
        {!primaryDriver && !tempImpact && !vocImpact ? (
          <p className="text-sm text-emerald-200/60">
            Degradation driver data pending from the backend…
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {batch.currentTemp != null && (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  (batch.currentTemp - (batch.baselineTemp || 0)) > 1.5
                    ? 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                    : 'bg-white/5 text-emerald-200/60 border-white/10'
                }`}>
                  Temperature {batch.currentTemp}°C
                </span>
              )}
              {batch.currentVoc != null && (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  batch.currentVoc > 2.0
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                    : 'bg-white/5 text-emerald-200/60 border-white/10'
                }`}>
                  VOC {batch.currentVoc} ppm
                </span>
              )}
            </div>
            {tempImpact && (
              <p className="text-xs text-emerald-200/70 mb-2">• {tempImpact}</p>
            )}
            {vocImpact && (
              <p className="text-xs text-emerald-200/70 mb-2">• {vocImpact}</p>
            )}
            {primaryDriver && (
              <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-between mt-3">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Primary Driver (from AI model)
                  </span>
                  <span className="text-lg font-black text-white">{primaryDriver}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Telemetry Chart — uses backend telemetry series, shows empty state if no data */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Telemetry</h3>
          </div>
          <span className="text-[10px] text-emerald-400/50 font-semibold">
            Source: backend database
          </span>
        </div>

        {telemetryData.length === 0 ? (
          <div className="mt-4 py-8 text-center text-sm text-emerald-200/50">
            Waiting for telemetry readings from backend…
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b3820" />
                  <XAxis dataKey="time" stroke="#6ee7b7" fontSize={10} />
                  <YAxis stroke="#6ee7b7" fontSize={10} />
                  <Tooltip contentStyle={darkTooltip} />
                  <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2.5} dot={false} name="Temp (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} dot={false} name="Humidity (%)" />
                  <Line type="monotone" dataKey="voc" stroke="#F59E0B" strokeWidth={2} dot={false} name="VOC (ppm)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData}>
                  <defs>
                    <linearGradient id="sliDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sli < 35 ? "#EF4444" : "#10B981"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={sli < 35 ? "#EF4444" : "#10B981"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b3820" />
                  <XAxis dataKey="time" stroke="#6ee7b7" fontSize={10} />
                  <YAxis stroke="#6ee7b7" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={darkTooltip} />
                  <Area type="monotone" dataKey="sli" stroke={sli < 35 ? "#EF4444" : "#10B981"} strokeWidth={2.5} fill="url(#sliDetailGrad)" name="SLI" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Route Status — comes from backend batch data */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 className="text-sm font-bold text-white">Route Status</h3>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
            isFeasible ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
          }`}>
            {isFeasible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isFeasible ? 'FEASIBLE' : 'NOT FEASIBLE'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-emerald-300/50 uppercase font-bold tracking-wider block mb-1">Current Route</span>
            <span className="font-bold text-white">
              {batch.currentRoute?.transitDurationHours != null
                ? `${(batch.currentRoute.transitDurationHours / 24).toFixed(1)} days`
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-emerald-300/50 uppercase font-bold tracking-wider block mb-1">Remaining Shelf Life</span>
            <span className="font-bold text-white">
              {rsl != null ? `${(rsl / 24).toFixed(1)} days` : '—'}
            </span>
          </div>
          <div>
            <span className="text-emerald-300/50 uppercase font-bold tracking-wider block mb-1">Recommended Destination</span>
            <span className="font-bold text-white">
              {batch.recommendedAction?.title?.replace('Reroute to ', '') || '—'}
            </span>
          </div>
          <div>
            <span className="text-emerald-300/50 uppercase font-bold tracking-wider block mb-1">Avoided Waste</span>
            <span className="font-bold text-emerald-400">
              {batch.recommendedAction?.wasteAvoidedKg != null
                ? `${Number(batch.recommendedAction.wasteAvoidedKg).toLocaleString()} kg`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/batches"
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 transition-all"
        >
          BACK TO BATCHES
        </Link>

        {batch.recommendedAction?.status === 'PENDING_APPROVAL' && !isFeasible ? (
          <button
            onClick={() => approveReroute(batch.id, batch.recommendedAction?.targetDestinationId)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>VIEW RECOMMENDATION</span>
          </button>
        ) : (
          <Link
            to="/decisions"
            className="px-5 py-2.5 bg-emerald-700/60 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all border border-emerald-500/40"
          >
            VIEW RECOMMENDATION
          </Link>
        )}
      </div>

    </div>
  );
};
