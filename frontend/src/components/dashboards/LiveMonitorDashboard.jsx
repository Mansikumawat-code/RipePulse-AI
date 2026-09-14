import React, { useState } from 'react';
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
  Wifi,
  WifiOff,
  Flame,
  Snowflake,
  Activity,
  Play,
  Pause
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../common/RiskBadge';
 
// Live monitor — all data comes from the backend (WebSocket or polling).
// The "Simulation Controls" section triggers the backend's simulation engine,
// which produces realistic telemetry processed through the real XGBoost model.
// These controls are clearly labelled as SIMULATION / TEST MODE.
export const LiveMonitorDashboard = () => {
  const {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    activeBatch,
    wsConnected,
    isAutoSensorActive,
    liveTelemetrySeries,
    simulateStress,
    simulateRecovery,
    simulateLiveTick,
    toggleAutoSensor
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);

  const batch = activeBatch || batches.find(b => b.id === selectedBatchId) || batches[0];
  // Only use backend telemetry from context. No frontend random-number fallback.
  const telemetryData = (liveTelemetrySeries && liveTelemetrySeries.length > 0)
    ? liveTelemetrySeries
    : [];

  const runAction = async (fn) => {
    setIsProcessing(true);
    try {
      await fn(batch.id);
    } finally {
      setTimeout(() => setIsProcessing(false), 400);
    }
  };

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
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            wsConnected
              ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
              : 'bg-white/5 text-slate-300 border-white/10'
          }`}>
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            LIVE MONITORING
          </span>
          <h1 className="text-xl font-black text-white tracking-tight">
            {wsConnected ? 'Streaming live sensor data' : 'Polling sensor data'}
          </h1>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400/60">Select Batch:</span>
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

      {/* Live Sensor Values + Live AI Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/60 mb-4">Live Sensor Values</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Temperature</span>
              <span className="text-xl font-black text-white block mt-1">{batch.currentTemp}°C</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Humidity</span>
              <span className="text-xl font-black text-white block mt-1">{batch.currentHumidity}%</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">VOC</span>
              <span className="text-xl font-black text-white block mt-1">{batch.currentVoc} ppm</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/60 mb-4">Live AI Result</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">Remaining Shelf Life</span>
              <span className={`text-xl font-black block mt-1 ${batch.remainingShelfLifeHours < 24 ? 'text-rose-400' : 'text-white'}`}>
                {(batch.remainingShelfLifeHours / 24).toFixed(1)}d
              </span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block">SLI</span>
              <span className={`text-xl font-black block mt-1 ${batch.sli < 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {batch.sli}%
              </span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-wider block mb-1">Risk</span>
              <RiskBadge level={batch.riskLevel} />
            </div>
          </div>
        </div>

      </div>

      {/* Live Chart — data from backend only */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Live Telemetry & SLI</h3>
          <span className="text-[10px] text-emerald-400/50 font-semibold">Source: backend database</span>
        </div>
        {telemetryData.length === 0 ? (
          <div className="py-10 text-center text-sm text-emerald-200/50">
            Waiting for telemetry from backend…
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#34d39960" fontSize={10} tickLine={false} />
                <YAxis stroke="#34d39960" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={darkTooltip} />
                <Line type="monotone" dataKey="temperature" stroke="#F43F5E" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} dot={false} name="Humidity (%)" />
                <Line type="monotone" dataKey="voc" stroke="#F59E0B" strokeWidth={2} dot={false} name="VOC (ppm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="liveSliGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={batch.sli < 35 ? "#F43F5E" : "#10B981"} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={batch.sli < 35 ? "#F43F5E" : "#10B981"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#34d39960" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#34d39960" fontSize={10} tickLine={false} unit="%" />
                <Tooltip contentStyle={darkTooltip} />
                <Area type="monotone" dataKey="sli" stroke={batch.sli < 35 ? "#F43F5E" : "#10B981"} strokeWidth={2.5} fillOpacity={1} fill="url(#liveSliGrad)" name="SLI" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>

      {/* Simulation Controls — SIMULATION / TEST MODE */}
      <div className="bg-[#18261a]/80 rounded-2xl border border-amber-800/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
            ⚠ Simulation / Test Mode
          </h3>
          <span className="text-[10px] font-semibold text-amber-300/60 border border-amber-700/40 rounded px-2 py-0.5">
            Backend simulation engine — NOT real physical sensors
          </span>
        </div>
        <p className="text-[11px] text-emerald-200/50 mb-4">
          These controls trigger the backend telemetry simulation engine. Readings pass through
          the real XGBoost model and update RSL, SLI, Risk and routing — but the input values are
          algorithmically generated, not from physical sensors.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => runAction((id) => simulateLiveTick(id))}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black/50 hover:bg-white/10 text-emerald-300 border border-emerald-800/50 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            NORMAL / TICK
          </button>

          <button
            onClick={() => runAction((id) => simulateStress(id))}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-900/40 transition-all disabled:opacity-60"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            STRESS
          </button>

          <button
            onClick={() => runAction((id) => simulateRecovery(id))}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-60"
          >
            <Snowflake className="w-4 h-4" />
            RECOVERY
          </button>

          <button
            onClick={() => toggleAutoSensor(batch.id)}
            className={`ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              isAutoSensorActive
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-black/50 text-emerald-300/80 hover:text-white border-emerald-800/50'
            }`}
          >
            {isAutoSensorActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoSensorActive ? 'Streaming' : 'Auto-Stream'}
          </button>

          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300/50">
            {wsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {wsConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

    </div>
  );
};
