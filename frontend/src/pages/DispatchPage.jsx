import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Truck, CheckCircle2, AlertTriangle, MapPin, Thermometer, RefreshCw, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { display, formatKg } from '../utils/format';

const STATUS_ORDER = ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];

const STATUS_STYLE = {
  PREPARING:  'border-slate-600/40 bg-slate-600/10 text-slate-300',
  DISPATCHED: 'border-indigo-600/40 bg-indigo-600/10 text-indigo-300',
  IN_TRANSIT: 'border-amber-600/40 bg-amber-600/10 text-amber-300',
  DELIVERED:  'border-emerald-600/40 bg-emerald-600/10 text-emerald-300',
};

function tempCompliance(maintained) {
  if (!maintained) return null;
  const lower = String(maintained).toLowerCase();
  const ok = !lower.includes('deviation') && !lower.includes('breach') && !lower.includes('warning');
  return ok;
}

export const DispatchPage = () => {
  const [params] = useSearchParams();
  const highlight = params.get('id');
  const {
    dispatches, dataLoading, backendOnline, refreshData, errorMessage,
    setSelectedBatchId, updateDispatchStatus, simulateRouteIssue, showNotification
  } = useApp();
  const [updatingId, setUpdatingId] = useState(null);
  const [demoIssueId, setDemoIssueId] = useState(null);

  const handleStatusUpdate = async (dispatchId, newStatus) => {
    setUpdatingId(dispatchId);
    try {
      await updateDispatchStatus(dispatchId, newStatus, null, null);
    } catch (err) {
      showNotification('Status Update Failed', err.message || 'Backend error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDemoRouteIssue = async (dispatchId) => {
    setDemoIssueId(dispatchId);
    try {
      await simulateRouteIssue(dispatchId);
    } catch (err) {
      showNotification('Demo route issue failed', err.message || 'Backend error', 'error');
    } finally {
      setDemoIssueId(null);
    }
  };

  if (dataLoading) return <LoadingState label="Loading dispatches…" />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;

  const active    = dispatches.filter((d) => d.status !== 'DELIVERED').length;
  const delivered = dispatches.filter((d) => d.status === 'DELIVERED').length;

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Dispatch"
        title="Active Dispatch Tracking"
        subtitle="All dispatches created by the backend after reroute approval. Live status from backend records."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-200/50">
              {active} active · {delivered} delivered
            </span>
            <button type="button" onClick={refreshData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        }
      />

      {dispatches.length === 0 ? (
        <EmptyState
          title="NO DISPATCHES"
          message="No dispatches have been created yet. Approve a reroute to create the first dispatch."
          icon={Truck}
        />
      ) : (
        <div className="space-y-4">
          {dispatches.map((d) => {
            const isHighlighted = highlight === d.id;
            const isDelivered   = d.status === 'DELIVERED';
            const statusStyle   = STATUS_STYLE[d.status] || STATUS_STYLE.DISPATCHED;
            const tempOk        = tempCompliance(d.temperatureMaintained);
            const progress      = Math.min(100, Math.max(0, Number(d.progressPct) || 0));

            return (
              <article
                key={d.id}
                className={`rounded-2xl border bg-[#18261a]/70 p-5 transition-all ${
                  isHighlighted ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.1)]' : 'border-emerald-800/40'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/8">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isDelivered ? 'bg-emerald-600/30' : 'bg-indigo-600/30'}`}>
                      <Truck className={`h-5 w-5 ${isDelivered ? 'text-emerald-400' : 'text-indigo-400'}`} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-emerald-400">{d.id}</p>
                      <h2 className="text-base font-black text-white">{display(d.produce)}</h2>
                      <p className="text-[11px] text-emerald-200/50">Batch: {display(d.batchId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHighlighted && (
                      <span className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                        NEW
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}>
                      {d.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DispFact label="Destination"  value={display(d.destination)} />
                  <DispFact label="Carrier"       value={display(d.carrier)} />
                  <DispFact label="Driver"        value={display(d.driverName)} />
                  <DispFact label="ETA"           value={display(d.eta)} />
                  <DispFact label="Departed"      value={display(d.departureTime)} />
                  <DispFact label="Waste Avoided" value={formatKg(d.wasteAvoidedKg) || '—'} />
                  <DispFact label="Recovered"     value={display(d.recoveredValue)} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-1">
                      <Thermometer className="inline h-3 w-3 mr-0.5" />Temperature
                    </p>
                    <div className="flex items-center gap-1.5">
                      {tempOk === true  && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      {tempOk === false && <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                      <span className={`text-xs font-semibold ${tempOk === false ? 'text-rose-400' : 'text-white'}`}>
                        {display(d.temperatureMaintained)}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[10px] font-bold ${tempOk === false ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tempOk === false ? '⚠ Temperature Deviation' : tempOk ? '✓ Within Safe Range' : ''}
                    </p>
                  </div>
                </div>

                {/* Progress stepper */}
                <div className="mt-5">
                  {/* Step labels */}
                  <div className="flex justify-between mb-2">
                    {STATUS_ORDER.map((s) => {
                      const stepIdx    = STATUS_ORDER.indexOf(s);
                      const currentIdx = STATUS_ORDER.indexOf(d.status);
                      const done = stepIdx <= currentIdx;
                      return (
                        <span key={s} className={`text-[9px] font-bold uppercase tracking-wide ${done ? 'text-emerald-400' : 'text-emerald-200/25'}`}>
                          {s.replace('_', ' ')}
                        </span>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isDelivered ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] font-bold tabular-nums text-emerald-300/50">{progress}%</span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/8 flex-wrap">
                  {Array.isArray(d.currentCoordinates) && d.currentCoordinates.length === 2 && (
                    <a
                      href={`https://www.google.com/maps?q=${d.currentCoordinates.join(',')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-700/40 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-white/5 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Track on Map
                    </a>
                  )}
                  <Link
                    to={`/batches/${d.batchId}`}
                    onClick={() => setSelectedBatchId(d.batchId)}
                    className="rounded-xl bg-emerald-500/80 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                  >
                    View Batch
                  </Link>
                  {/* Status progression controls */}
                  {d.status === 'DISPATCHED' && (
                    <button
                      type="button"
                      disabled={updatingId === d.id}
                      onClick={() => handleStatusUpdate(d.id, 'IN_TRANSIT')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-600/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-600/20 transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {updatingId === d.id ? 'Updating…' : 'Mark In-Transit'}
                    </button>
                  )}
                  {d.status === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      disabled={updatingId === d.id}
                      onClick={() => handleStatusUpdate(d.id, 'ARRIVED')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-600/40 bg-indigo-600/10 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600/20 transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {updatingId === d.id ? 'Updating…' : 'Mark Arrived'}
                    </button>
                  )}
                  {d.status === 'IN_TRANSIT' && !d.rerouteRequired && !d.isRerouted && (
                    <button
                      type="button"
                      disabled={demoIssueId === d.id}
                      onClick={() => handleDemoRouteIssue(d.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-600/40 bg-rose-600/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-600/20 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {demoIssueId === d.id ? 'Simulating…' : 'Simulate Route Issue (Demo)'}
                    </button>
                  )}
                  {d.status === 'ARRIVED' && (
                    <button
                      type="button"
                      disabled={updatingId === d.id}
                      onClick={() => handleStatusUpdate(d.id, 'DELIVERED')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {updatingId === d.id ? 'Updating…' : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DispFact = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-0.5">{label}</p>
    <p className="text-xs font-semibold text-white">{value}</p>
  </div>
);
