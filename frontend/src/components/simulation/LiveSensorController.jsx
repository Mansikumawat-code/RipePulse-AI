import React, { useState } from 'react';
import { 
  Flame, 
  Snowflake, 
  Activity, 
  Play, 
  Pause, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LiveSensorController = () => {
  const { 
    activeBatch, 
    batches, 
    selectedBatchId, 
    setSelectedBatchId, 
    wsConnected, 
    activeScenario, 
    isAutoSensorActive,
    simulateStress, 
    simulateRecovery, 
    simulateLiveTick, 
    toggleAutoSensor 
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);

  const handleStress = async () => {
    setIsProcessing(true);
    triggerPipelineAnimation();
    try {
      await simulateStress(activeBatch?.id);
    } finally {
      setTimeout(() => setIsProcessing(false), 600);
    }
  };

  const handleRecovery = async () => {
    setIsProcessing(true);
    triggerPipelineAnimation();
    try {
      await simulateRecovery(activeBatch?.id);
    } finally {
      setTimeout(() => setIsProcessing(false), 600);
    }
  };

  const handleTick = async () => {
    setIsProcessing(true);
    triggerPipelineAnimation();
    try {
      await simulateLiveTick(activeBatch?.id);
    } finally {
      setTimeout(() => setIsProcessing(false), 400);
    }
  };

  const triggerPipelineAnimation = () => {
    // Sequentially highlight the 6 real-time pipeline stages
    setPipelineStep(1);
    setTimeout(() => setPipelineStep(2), 200);
    setTimeout(() => setPipelineStep(3), 400);
    setTimeout(() => setPipelineStep(4), 650);
    setTimeout(() => setPipelineStep(5), 900);
    setTimeout(() => setPipelineStep(6), 1150);
    setTimeout(() => setPipelineStep(null), 2200);
  };

  const isStress = activeScenario === 'STRESS' || activeBatch?.riskLevel === 'CRITICAL';
  const isFeasible = activeBatch?.currentRoute?.isFeasible ?? true;

  const pipelineStages = [
    { num: 1, name: "Mock Sensor", detail: "Temp / RH / VOC" },
    { num: 2, name: "FastAPI Ingestion", detail: "SQLite Log" },
    { num: 3, name: "XGBoost ML", detail: "RSL Prediction" },
    { num: 4, name: "Risk Engine", detail: "SLI & Severity" },
    { num: 5, name: "Route Checker", detail: "Transit vs RSL" },
    { num: 6, name: "Action Engine", detail: "Dynamic Reroute" }
  ];

  return (
    <div className="bg-[#09140c]/95 border-b border-emerald-800/40 backdrop-blur-md px-4 py-3 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* Top Control Bar: Live Telemetry + Direct Stress/Recovery Buttons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left: Batch Selector & Live Sensor Badges */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live WS Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-900/60 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-emerald-300 font-bold">{wsConnected ? 'IoT WS Live' : 'Polling'}</span>
            </div>

            {/* Batch Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400/60 hidden sm:inline">Active Batch:</span>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-black/60 border border-emerald-700/60 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.produce} ({b.id}) — {b.riskLevel}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Sensor Metrics Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              
              {/* Temperature */}
              <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${
                isStress
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}>
                <span className="text-[10px] text-slate-400 font-sans font-semibold">TEMP</span>
                <span>{activeBatch?.currentTemp != null ? `${activeBatch.currentTemp}°C` : '—'}</span>
                {isStress && <span className="text-[10px] text-rose-400 font-black">↑ HIGH</span>}
              </div>

              {/* Humidity */}
              <div className="px-2.5 py-1 rounded-lg border border-emerald-800/60 bg-black/40 font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-sans font-semibold">RH</span>
                <span>{activeBatch?.currentHumidity != null ? `${activeBatch.currentHumidity}%` : '—'}</span>
              </div>

              {/* VOC / Ethylene */}
              <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${
                activeBatch?.currentVoc != null && activeBatch.currentVoc > 2.0
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-black/40 border-emerald-800/60 text-emerald-300'
              }`}>
                <span className="text-[10px] text-slate-400 font-sans font-semibold">VOC</span>
                <span>{activeBatch?.currentVoc != null ? `${activeBatch.currentVoc} ppm` : '—'}</span>
              </div>

              {/* SLI */}
              <div className="px-2.5 py-1 rounded-lg border border-emerald-800/60 bg-black/40 font-mono font-bold flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-sans font-semibold">SLI</span>
                <span className={activeBatch?.sli != null && activeBatch.sli < 35 ? 'text-rose-400' : 'text-emerald-400'}>
                  {activeBatch?.sli != null ? `${Math.round(activeBatch.sli)}%` : '—'}
                </span>
              </div>

              {/* Route Feasibility */}
              <div className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${
                isFeasible
                  ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-700/60 text-rose-300 animate-pulse'
              }`}>
                {isFeasible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{isFeasible ? 'Route Feasible' : 'Route Infeasible'}</span>
              </div>

            </div>

          </div>

          {/* Right: SIMULATION / TEST MODE buttons — trigger backend simulation engine */}
          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
            
            {/* SIMULATION MODE label */}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-amber-300/70 border border-amber-700/40 bg-amber-950/30">
              TEST MODE
            </span>

            {/* Step Once Tick */}
            <button
              onClick={handleTick}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 bg-black/50 hover:bg-white/10 text-emerald-300 border border-emerald-800/50 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              title="Trigger one backend simulation step — not real sensor data"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tick Sensor</span>
            </button>

            {/* Auto Sensor Toggle (4s Interval) */}
            <button
              onClick={() => toggleAutoSensor(activeBatch?.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isAutoSensorActive
                  ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                  : 'bg-black/50 text-emerald-300/80 hover:text-white border-emerald-800/50 hover:bg-emerald-950/40'
              }`}
              title="Continuously stream sensor packets every 4 seconds"
            >
              {isAutoSensorActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoSensorActive ? 'Streaming (4s)' : 'Auto-Stream'}</span>
            </button>

            {/* SIMULATE STRESS BUTTON */}
            <button
              onClick={handleStress}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-lg shadow-lg shadow-rose-900/40 border border-rose-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              title="Simulate thermal abuse (temp spike to ~30°C and VOC surge). AI will collapse RSL and trigger reroute."
            >
              <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>SIMULATE STRESS</span>
            </button>

            {/* SIMULATE RECOVERY BUTTON */}
            <button
              onClick={handleRecovery}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-lg shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              title="Simulate cooling recovery. Restores optimal baseline and stabilizes shelf-life."
            >
              <Snowflake className="w-4 h-4 text-cyan-200" />
              <span>SIMULATE RECOVERY</span>
            </button>

          </div>

        </div>

        {/* Bottom: Real-Time Working Pipeline Flow Visualizer */}
        <div className="pt-2 border-t border-emerald-950/60 hidden sm:block">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 shrink-0 mr-2">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Pipeline:</span>
            </div>

            <div className="flex-1 grid grid-cols-6 gap-1.5">
              {pipelineStages.map((stage) => {
                const isActive = pipelineStep === stage.num;
                return (
                  <div
                    key={stage.num}
                    className={`px-2 py-1 rounded-md border text-center transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm shadow-emerald-400 font-bold scale-[1.02]'
                        : 'bg-black/30 border-emerald-900/40 text-slate-400'
                    }`}
                  >
                    <div className="font-bold truncate text-[10px] sm:text-[11px]">{stage.num}. {stage.name}</div>
                    <div className="text-[9px] opacity-70 truncate">{stage.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
