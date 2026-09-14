import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Truck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteMap } from '../map/RouteMap';
import { RiskBadge } from '../common/RiskBadge';

export const RoutingDashboard = () => {
  const { 
    batches, 
    destinations, 
    selectedBatchId, 
    setSelectedBatchId, 
    approveReroute 
  } = useApp();

  const activeBatch = batches.find(b => b.id === selectedBatchId) || batches[0] || null;
  const [selectedDestination, setSelectedDestination] = useState(destinations[0] || null);

  if (!activeBatch) {
    return (
      <div className="rounded-2xl border border-emerald-900/40 bg-[#18261a]/60 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-emerald-200/60">
          Loading batches from backend…
        </p>
      </div>
    );
  }

  const isFeasible = activeBatch.currentRoute?.isFeasible ?? true;
  const transitHours = activeBatch.currentRoute?.transitDurationHours || 20;
  const rsl = activeBatch.remainingShelfLifeHours || 16;
  const bufferDelta = rsl - transitHours;

  const isApproved = activeBatch.recommendedAction?.status === 'APPROVED' || activeBatch.recommendedAction?.status === 'DELIVERED';

  return (
    <div className="space-y-6">
      
      {/* Header & Batch Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
              Decisions
            </span>
            <span className="text-xs text-emerald-300/50 font-medium">Reroute Recommendations</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Route Feasibility & Alternative Destinations
          </h1>
          <p className="text-xs text-emerald-200/50 mt-0.5">
            Comparing transit time against remaining shelf life to decide whether to reroute a batch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400/50">Inspecting:</span>
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

      {/* Feasibility Comparison Bar */}
      <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
        isFeasible 
          ? 'bg-emerald-900/30 border-emerald-700/40' 
          : 'bg-rose-900/30 border-rose-700/40'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isFeasible ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
              {isFeasible ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {isFeasible ? 'Current Route Confirmed Feasible' : 'Current Route INFEASIBLE (Critical Spoilage Risk)'}
                </h3>
                <RiskBadge level={activeBatch.riskLevel} />
              </div>
              <p className="text-xs text-emerald-200/50 mt-0.5 max-w-2xl">
                {isFeasible
                  ? `Batch has ${rsl}h remaining shelf-life, which exceeds transit duration (${transitHours}h) with safe buffer.`
                  : `Transit to ${activeBatch.currentRoute?.destinationName} requires ${transitHours}h, but produce only has ${rsl}h remaining shelf life. Negative buffer of ${Math.abs(bufferDelta)} hours will result in complete loss.`}
              </p>
            </div>
          </div>

          {/* Metrics comparison pills */}
          <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 block">Remaining RSL</span>
              <strong className="text-sm font-black text-rose-400">{rsl}h</strong>
            </div>

            <div className="text-emerald-400/50 font-bold">vs</div>

            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 block">Planned Transit</span>
              <strong className="text-sm font-black text-white">{transitHours}h</strong>
            </div>

            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 block">Safety Margin</span>
              <strong className={`text-sm font-black ${bufferDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bufferDelta}h
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Leaflet Map & Alternative Destinations Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Interactive Map View */}
        <div className="lg:col-span-2">
          <RouteMap
            selectedBatch={activeBatch}
            onSelectDestination={(dest) => setSelectedDestination(dest)}
          />
        </div>

        {/* Alternative Destinations Ranking Card */}
        <div className="space-y-4">
          <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Alternative Destinations</h3>
                <p className="text-[11px] text-emerald-300/40">AI-ranked by travel time, capacity & value</p>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-700/50">
                Top Matches
              </span>
            </div>

            <div className="space-y-3">
              {destinations.map((dest, idx) => {
                const isTopRanked = idx === 0;
                const isSelected = selectedDestination?.id === dest.id;

                return (
                  <div
                    key={dest.id}
                    onClick={() => setSelectedDestination(dest)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-600/70 bg-emerald-900/40 ring-1 ring-emerald-500/30' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dest.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">{dest.name}</h4>
                            {isTopRanked && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-1 rounded">
                                AI #1
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-300/40">{dest.type}</span>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold text-emerald-400">
                        {dest.travelTimeMinutes} min
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-300/40">
                      <span>Dist: {dest.distanceKm} km</span>
                      <span>Cap: {dest.capacityAvailableKg.toLocaleString()} kg</span>
                      <span className="font-semibold text-emerald-300/60">
                        {dest.pricingFactor > 0 ? `${(dest.pricingFactor * 100).toFixed(0)}% Salvage` : 'Food Relief'}
                      </span>
                    </div>

                    {isTopRanked && (
                      <div className="mt-3">
                        {isApproved ? (
                          <div className="w-full py-2 bg-emerald-900/50 text-emerald-300 font-bold text-xs rounded-lg text-center border border-emerald-700/50 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reroute Dispatched to {dest.name}</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveReroute(activeBatch.id, dest.id);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Approve Reroute & Dispatch</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* Selected Destination Deep-Dive Details */}
      {selectedDestination && (
        <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedDestination.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedDestination.name}</h3>
                <p className="text-xs text-emerald-300/40">{selectedDestination.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-200/60">
              <div>
                <span className="text-emerald-400/40 block text-[10px]">Contact</span>
                <span className="text-white">{selectedDestination.contactPerson}</span>
              </div>
              <div>
                <span className="text-emerald-400/40 block text-[10px]">Phone</span>
                <span className="text-white">{selectedDestination.phone}</span>
              </div>
              <div>
                <span className="text-emerald-400/40 block text-[10px]">Facility Rating</span>
                <span className="text-amber-400 font-bold">★ {selectedDestination.rating}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-emerald-400/40 text-[10px] uppercase font-bold block">Compatible Produce</span>
              <span className="text-white font-semibold mt-1 block">
                {selectedDestination.preferredProduce?.join(', ')}
              </span>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-emerald-400/40 text-[10px] uppercase font-bold block">Receiving Capacity</span>
              <span className="text-white font-semibold mt-1 block">
                {selectedDestination.capacityAvailableKg.toLocaleString()} kg available today
              </span>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-emerald-400/40 text-[10px] uppercase font-bold block">Economic Recovery</span>
              <span className="text-emerald-400 font-bold mt-1 block">
                {selectedDestination.pricingFactor > 0 
                  ? `${(selectedDestination.pricingFactor * 100).toFixed(0)}% Original Value Preserved` 
                  : 'Section 170(e)(3) Enhanced Tax Deduction'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
