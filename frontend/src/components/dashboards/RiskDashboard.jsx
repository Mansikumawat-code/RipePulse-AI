import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  Sparkles, 
  Activity, 
  Thermometer, 
  Wind, 
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../common/RiskBadge';

export const RiskDashboard = () => {
  const { batches, selectedBatchId, setSelectedBatchId, approveReroute, liveTelemetrySeries } = useApp();

  const activeBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  // Only use backend telemetry from context — no mock data fallback.
  const telemetryData = (liveTelemetrySeries && liveTelemetrySeries.length > 0)
    ? liveTelemetrySeries
    : [];

  const tempSpikeDiff = +(activeBatch.currentTemp - activeBatch.baselineTemp).toFixed(1);
  const vocSpikeDiff = +(activeBatch.currentVoc - activeBatch.baselineVoc).toFixed(1);


  const darkTooltip = {
    backgroundColor: '#18261a',
    borderRadius: '8px',
    border: '1px solid rgba(52,211,153,0.15)',
    fontSize: '11px',
    color: '#d1fae5'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-900/50 text-purple-300 border border-purple-700/50">
              Machine Learning Predictive Engine
            </span>
            <span className="text-xs text-emerald-300/50 font-medium">Kinetic Q10 Produce Decay</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Degradation Modeling & Risk Forecasting
          </h1>
          <p className="text-xs text-emerald-200/50 mt-0.5">
            Continuously projecting Remaining Shelf Life (RSL) and Shelf-Life Index (SLI) against thermal stress and ethylene spikes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400/50">Inspect Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-emerald-800/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.produce} ({b.id}) - {b.riskLevel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Prediction Overview Banner */}
      <div className="bg-gradient-to-br from-[#18261a] via-[#0f1911] to-[#0c1610] rounded-2xl border border-emerald-800/40 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Produce Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-emerald-800/40 shadow-sm flex items-center justify-center text-3xl">
              {activeBatch.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400/60">{activeBatch.id}</span>
                <RiskBadge level={activeBatch.riskLevel} />
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">{activeBatch.produce}</h2>
              <p className="text-xs text-emerald-300/50">
                Chamber: {activeBatch.zone} • {activeBatch.palletCount} Pallets ({activeBatch.weightKg.toLocaleString()} kg)
              </p>
            </div>
          </div>

          {/* Key Prediction Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Remaining Shelf Life</span>
              <span className={`text-xl font-black ${activeBatch.remainingShelfLifeHours < 24 ? 'text-rose-400' : 'text-white'}`}>
                {activeBatch.remainingShelfLifeHours}h
              </span>
              <span className="text-[10px] text-emerald-400/40 block">Baseline: {activeBatch.initialShelfLifeHours}h</span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Shelf-Life Index (SLI)</span>
              <span className={`text-xl font-black ${activeBatch.sli < 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeBatch.sli}%
              </span>
              <span className="text-[10px] text-emerald-400/40 block">Health Rating</span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Decay Acceleration</span>
              <span className="text-xl font-black text-amber-400">
                {activeBatch.decayRateFactor}x
              </span>
              <span className="text-[10px] text-emerald-400/40 block">Arrhenius Q10 Factor</span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">AI Model Confidence</span>
              <span className="text-xl font-black text-indigo-400">
                {activeBatch.confidenceScore}%
              </span>
              <span className="text-[10px] text-emerald-400/40 block">Ensemble Accuracy</span>
            </div>

          </div>

        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SLI Degradation Chart */}
        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Shelf-Life Index (SLI) Decay Trajectory</h3>
              </div>
              <p className="text-xs text-emerald-300/40">24-hour continuous biological degradation estimation</p>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-700/50">
              Backend Telemetry
            </span>
          </div>

          <div className="h-64 mt-4">
            {telemetryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-emerald-200/50">
                Waiting for telemetry from backend…
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="sliGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeBatch.sli < 35 ? "#F43F5E" : "#10B981"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={activeBatch.sli < 35 ? "#F43F5E" : "#10B981"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#34d39960" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#34d39960" fontSize={10} tickLine={false} unit="%" />
                <Tooltip contentStyle={darkTooltip} />
                <Area 
                  type="monotone" 
                  dataKey="sli" 
                  stroke={activeBatch.sli < 35 ? "#F43F5E" : "#10B981"} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#sliGrad)" 
                  name="Shelf-Life Index"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Temperature & VOC Surge Correlation Chart */}
        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Thermal & Ethylene Correlative Stress</h3>
              </div>
              <p className="text-xs text-emerald-300/40">Environmental triggers driving accelerated senescence</p>
            </div>
          </div>

          <div className="h-64 mt-4">
            {telemetryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-emerald-200/50">
                Waiting for telemetry from backend…
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#34d39960" fontSize={10} tickLine={false} />
                <YAxis stroke="#34d39960" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={darkTooltip} />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#F43F5E" 
                  strokeWidth={2}
                  dot={false}
                  name="Temp (°C)"
                />
                <Line 
                  type="monotone" 
                  dataKey="voc" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={false}
                  name="VOC / Ethylene (ppm)"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Explainable AI (XAI) Breakdown Panel */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-extrabold text-white">
            Explainable AI Degradation Rationale
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Factor 1: Temperature Abuse */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200/70 mb-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Thermal Kinetic Driver</span>
            </div>
            <div className="text-lg font-black text-white mb-1">
              +{tempSpikeDiff > 0 ? tempSpikeDiff : 0}°C Delta
            </div>
            <p className="text-xs text-emerald-200/50">
              {tempSpikeDiff > 2 
                ? `Thermal threshold exceeded by ${tempSpikeDiff}°C. Respiration rate escalated significantly under Arrhenius enzymatic reactions.`
                : 'Storage chamber maintained within optimal thermal bandwidth.'}
            </p>
          </div>

          {/* Factor 2: Ethylene / VOC Surge */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200/70 mb-2">
              <Wind className="w-4 h-4 text-amber-400" />
              <span>Ethylene Senescence Driver</span>
            </div>
            <div className="text-lg font-black text-white mb-1">
              {activeBatch.currentVoc} ppm Detected
            </div>
            <p className="text-xs text-emerald-200/50">
              {activeBatch.currentVoc > 2.0
                ? 'High volatile organic carbon presence triggers autocatalytic ripening cascade and skin softening.'
                : 'VOC and ethylene levels are safely suppressed by ventilation scrubbers.'}
            </p>
          </div>

          {/* Factor 3: Feasibility Deficit */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200/70 mb-2">
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
              <span>Transit Safety Buffer</span>
            </div>
            <div className="text-lg font-black text-white mb-1">
              {activeBatch.remainingShelfLifeHours - (activeBatch.currentRoute?.transitDurationHours || 12)}h Buffer
            </div>
            <p className="text-xs text-emerald-200/50">
              {activeBatch.currentRoute?.isFeasible
                ? 'Planned interstate route comfortably fits within biological freshness thresholds.'
                : 'Deficit buffer. Product will suffer irreversible mold growth or collapse before retail display.'}
            </p>
          </div>

        </div>

        {/* Recommended Action Box */}
        <div className="mt-5 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Decision Engine Directive</span>
            <h4 className="text-sm font-extrabold text-white mt-0.5">{activeBatch.recommendedAction?.title}</h4>
            <p className="text-xs text-emerald-200/50 mt-1 max-w-2xl">{activeBatch.recommendedAction?.reason}</p>
          </div>

          {activeBatch.recommendedAction?.status === 'PENDING_APPROVAL' ? (
            <button
              onClick={() => approveReroute(activeBatch.id, activeBatch.recommendedAction?.targetDestinationId)}
              className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Approve Dynamic Reroute
            </button>
          ) : (
            <span className="shrink-0 px-3 py-1.5 bg-emerald-900/60 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-700/50">
              ✓ Reroute Confirmed
            </span>
          )}
        </div>

      </div>

    </div>
  );
};
