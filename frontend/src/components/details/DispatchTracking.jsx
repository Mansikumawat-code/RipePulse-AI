import React from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ThermometerSnowflake, 
  DollarSign, 
  ShieldCheck, 
  Phone, 
  ArrowRight 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DispatchTracking = () => {
  const { dispatches } = useApp();

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
            Logistics Pipeline
          </span>
          <span className="text-xs text-emerald-300/60 font-medium">Active Fleet & Receiving Docks</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Dynamic Redistribution Dispatch Tracking
        </h1>
        <p className="text-xs text-emerald-200/60 mt-0.5">
          Real-time cold-chain fleet telemetry and intake confirmation for rerouted produce batches.
        </p>
      </div>

      {/* Dispatches List */}
      <div className="space-y-4">
        {dispatches.map((disp) => {
          const isDelivered = disp.status === 'DELIVERED';
          const isInTransit = disp.status === 'IN_TRANSIT';

          return (
            <div
              key={disp.id}
              className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-lg backdrop-blur-sm hover:border-emerald-700/60 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                    isDelivered ? 'bg-emerald-600' : 'bg-indigo-600 animate-pulse'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{disp.id}</span>
                      <span className="text-xs text-emerald-200/50">• Batch: {disp.batchId}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">{disp.produce}</h3>
                    <p className="text-xs text-emerald-200/70">
                      Destination: <strong className="text-emerald-300">{disp.destination}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isDelivered 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
                      : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                  }`}>
                    {disp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-6">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-400 font-extrabold">1. Reroute Approved</span>
                  <span className="text-emerald-400 font-extrabold">2. Staged & Dispatched</span>
                  <span className={isInTransit || isDelivered ? 'text-emerald-400 font-extrabold' : 'text-emerald-300/30'}>
                    3. Cold-Chain In Transit
                  </span>
                  <span className={isDelivered ? 'text-emerald-400 font-extrabold' : 'text-emerald-300/30'}>
                    4. Received & Processed
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-emerald-900/50">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${disp.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Driver & Cold-Chain Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="p-3 bg-black/30 rounded-xl border border-emerald-800/30">
                  <span className="text-emerald-300/50 text-[10px] uppercase font-bold block">Assigned Carrier</span>
                  <strong className="text-white block mt-0.5">{disp.carrier}</strong>
                  <span className="text-emerald-200/70 text-[11px]">Driver: {disp.driverName}</span>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-emerald-800/30">
                  <span className="text-emerald-300/50 text-[10px] uppercase font-bold block">In-Transit Cold-Chain</span>
                  <strong className="text-emerald-400 block mt-0.5">{disp.temperatureMaintained}</strong>
                  <span className="text-emerald-200/70 text-[11px]">Reefer Sensor Active</span>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-emerald-800/30">
                  <span className="text-emerald-300/50 text-[10px] uppercase font-bold block">Environmental Impact</span>
                  <strong className="text-emerald-400 block mt-0.5">{disp.recoveredValue} Saved</strong>
                  <span className="text-emerald-200/70 text-[11px]">{disp.wasteAvoidedKg != null ? Number(disp.wasteAvoidedKg).toLocaleString() : '—'} kg Produce Salvaged</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
