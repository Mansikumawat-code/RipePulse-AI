import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Route, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { routingService } from '../services/routingService';
import { PageHeader } from '../components/common/PageHeader';
import { RiskBadge } from '../components/common/RiskBadge';
import { formatKg, display } from '../utils/format';

const terminalStatuses = ['DELIVERED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'CANCELLED'];

export const SupplyChainWorkflowPage = () => {
  const { destinations = [], dispatches = [], refreshData, showNotification } = useApp();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [destinationId, setDestinationId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadAtRisk = async () => {
    setLoading(true);
    try {
      const data = await routingService.getAtRiskBatches();
      setBatches(data);
      if (!selectedBatch && data.length) {
        setSelectedBatch(data[0]);
        setQuantityKg(data[0].weightKg);
      }
    } catch (error) {
      showNotification('At-risk batches unavailable', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAtRisk(); }, []);

  const chooseBatch = (batch) => {
    setSelectedBatch(batch);
    setQuantityKg(batch.weightKg);
    setRoute(null);
  };

  const checkRoute = async () => {
    if (!selectedBatch || !destinationId) return;
    setWorking(true);
    try {
      setRoute(await routingService.checkRoute(selectedBatch.id, destinationId));
    } catch (error) {
      showNotification('Route check failed', error.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const createDispatch = async () => {
    if (!route?.isFeasible) return;
    setWorking(true);
    try {
      const destination = destinations.find((item) => item.id === destinationId);
      await routingService.createDispatch({
        batchId: selectedBatch.id,
        destinationId,
        destination: destination?.name || route.destination.name,
        quantityKg: Number(quantityKg),
        vehicleId: 'VEHICLE-01',
        route: {
          distanceKm: route.destination.distanceKm,
          estimatedTimeMinutes: route.destination.travelTimeMinutes,
          feasible: route.isFeasible,
          bufferHours: route.bufferHours,
        },
      });
      await refreshData();
      await loadAtRisk();
      setSelectedBatch(null);
      setRoute(null);
      showNotification('Dispatch planned', 'The route is assigned and ready for dispatch.', 'success');
    } catch (error) {
      showNotification('Dispatch creation failed', error.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const updateStatus = async (dispatch, status) => {
    setWorking(true);
    try {
      await routingService.updateDispatchStatus(dispatch.id, status);
      await refreshData();
    } catch (error) {
      showNotification('Status update failed', error.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const active = dispatches.filter((dispatch) => !terminalStatuses.includes(dispatch.status));

  return (
    <div className="space-y-6">
      <PageHeader kicker="Supply Chain Control Center" title="At-risk batch to shipment" subtitle="Prioritize fragile inventory, validate the route, and keep every dispatch moving from one operational view." actions={<button type="button" onClick={loadAtRisk} className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/40 px-3 py-2 text-xs font-bold text-emerald-300"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-emerald-200/70">At-risk batches</h2><span className="text-xs text-emerald-200/50">{batches.length} awaiting dispatch</span></div>
          {loading ? <p className="text-sm text-emerald-200/60">Loading operational queue...</p> : batches.length === 0 ? <p className="text-sm text-emerald-300">All risky batches have an active or completed dispatch.</p> : <div className="space-y-2">{batches.map((batch) => <button key={batch.id} type="button" onClick={() => chooseBatch(batch)} className={`w-full rounded-xl border p-3 text-left ${selectedBatch?.id === batch.id ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-black/10'}`}><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-white">{batch.id}</p><p className="text-sm font-bold text-emerald-100">{display(batch.produce)}</p></div><RiskBadge level={batch.riskLevel} /></div><div className="mt-2 flex gap-4 text-xs text-emerald-200/60"><span>{formatKg(batch.weightKg)}</span><span>{batch.remainingShelfLifeHours}h shelf life</span></div></button>)}</div>}
        </div>

        <div className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-200/70">Plan dispatch</h2>
          {!selectedBatch ? <p className="mt-4 text-sm text-emerald-200/60">Select a batch to begin.</p> : <div className="mt-4 space-y-4"><div className="rounded-xl border border-amber-700/30 bg-amber-500/10 p-3"><p className="text-xs font-bold text-amber-300">{selectedBatch.id} · {display(selectedBatch.produce)}</p><p className="mt-1 text-xs text-amber-100/70">Risk {selectedBatch.riskLevel} · {selectedBatch.remainingShelfLifeHours} hours remaining</p></div><label className="block text-xs font-bold text-emerald-200/70">Destination<select value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setRoute(null); }} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-sm text-white"><option value="">Select destination</option>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></label><label className="block text-xs font-bold text-emerald-200/70">Quantity (kg)<input type="number" min="1" max={selectedBatch.weightKg} value={quantityKg} onChange={(event) => setQuantityKg(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-sm text-white" /></label><button type="button" disabled={working || !destinationId} onClick={checkRoute} className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/50 px-4 py-2 text-xs font-black text-emerald-300 disabled:opacity-40"><Route className="h-3.5 w-3.5" /> Check route</button>{route && <div className={`rounded-xl border p-3 ${route.isFeasible ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-rose-600/40 bg-rose-500/10'}`}><div className="flex items-center gap-2">{route.isFeasible ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}<p className={`text-sm font-black ${route.isFeasible ? 'text-emerald-300' : 'text-rose-300'}`}>{route.isFeasible ? 'Route feasible' : 'Route not feasible'}</p></div><p className="mt-2 text-xs text-emerald-100/70">{route.transitHours}h travel · {route.bufferHours}h shelf-life buffer · {route.destination.distanceKm} km</p>{route.isFeasible && <button type="button" disabled={working} onClick={createDispatch} className="mt-3 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40">Create & assign dispatch</button>}</div>}</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-emerald-200/70">Active shipments</h2><Truck className="h-4 w-4 text-emerald-400" /></div>{active.length === 0 ? <p className="text-sm text-emerald-200/60">No active shipments.</p> : <div className="grid gap-3 md:grid-cols-2">{active.map((dispatch) => <div key={dispatch.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex justify-between"><div><p className="font-mono text-xs font-bold text-emerald-400">{dispatch.id}</p><p className="text-sm font-bold text-white">{display(dispatch.produce)}</p></div><span className="text-[10px] font-black uppercase text-amber-300">{dispatch.status}</span></div><p className="mt-2 text-xs text-emerald-200/60">{dispatch.source} → {dispatch.destination} · {formatKg(dispatch.quantityKg)}</p><div className="mt-3 flex flex-wrap gap-2">{dispatch.status === 'PLANNED' && <button type="button" onClick={() => updateStatus(dispatch, 'DISPATCHED')} className="rounded-lg border border-emerald-700/40 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300">Mark dispatched</button>}{dispatch.status === 'DISPATCHED' && <button type="button" onClick={() => updateStatus(dispatch, 'IN_TRANSIT')} className="rounded-lg border border-amber-700/40 px-2.5 py-1.5 text-[11px] font-bold text-amber-300">Mark in transit</button>}{dispatch.status === 'IN_TRANSIT' && <button type="button" onClick={() => updateStatus(dispatch, 'ARRIVED')} className="rounded-lg border border-indigo-700/40 px-2.5 py-1.5 text-[11px] font-bold text-indigo-300">Mark arrived</button>}</div></div>)}</div>}</section>
    </div>
  );
};
