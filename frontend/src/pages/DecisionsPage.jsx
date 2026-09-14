import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { routingService } from '../services/routingService';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  display,
  destinationFeasibility,
  formatDaysFromHours,
  formatHours,
  formatKg,
  isProduceCompatible,
  needsAction,
} from '../utils/format';

export const DecisionsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    batches,
    dispatches,
    destinations,
    setSelectedBatchId,
    approveReroute,
    dataLoading,
    backendOnline,
    refreshData,
    errorMessage,
    showNotification,
  } = useApp();

  const actionable = batches.filter(needsAction);
  const rerouteHistory = dispatches.filter((dispatch) => (
    dispatch.isRerouted === true ||
    ['completed', 'approved'].includes(String(dispatch.rerouteStatus || '').toLowerCase()) ||
    String(dispatch.status || '').toUpperCase() === 'REROUTED'
  ));
  const pendingReroutes = dispatches.filter((dispatch) => (
    dispatch.rerouteRequired === true &&
    dispatch.routeIssue === true &&
    !dispatch.isRerouted &&
    String(dispatch.rerouteStatus || '').toLowerCase() === 'pending'
  ));
  const [activeId, setActiveId] = useState(params.get('batch') || actionable[0]?.id || '');
  const [selectedDestId, setSelectedDestId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reroutingId, setReroutingId] = useState(null);

  useEffect(() => {
    const q = params.get('batch');
    if (q) setActiveId(q);
  }, [params]);

  const batch = batches.find((b) => b.id === activeId) || actionable[0] || null;
  const rec = batch?.recommendedAction || {};
  const route = batch?.currentRoute || {};

  const recommendedDest = useMemo(() => {
    if (!rec.targetDestinationId) return null;
    return destinations.find((d) => d.id === rec.targetDestinationId) || null;
  }, [destinations, rec.targetDestinationId]);

  useEffect(() => {
    if (recommendedDest) setSelectedDestId(recommendedDest.id);
  }, [recommendedDest]);

  const selectedDest = destinations.find((d) => d.id === selectedDestId) || recommendedDest;

  const openConfirm = () => {
    if (!selectedDest) {
      showNotification('No destination selected', 'Choose a feasible destination first.', 'warning');
      return;
    }
    setConfirmOpen(true);
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await approveReroute(batch.id, selectedDest.id);
      setConfirmOpen(false);
      navigate(`/dispatch?id=${res.dispatchId || ''}`);
    } catch (err) {
      showNotification(
        'Reroute failed',
        err?.response?.data?.detail || err.message || 'Backend did not confirm the reroute.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const approvePendingReroute = async (dispatch) => {
    const alternate = destinations.find((destination) => destination.id !== dispatch.destinationId);
    if (!alternate) {
      showNotification('No alternate route', 'Add an alternate destination before approving this reroute.', 'warning');
      return;
    }
    setReroutingId(dispatch.id);
    try {
      await routingService.rerouteDispatch(dispatch.id, alternate.id, dispatch.issueReason || 'Route issue requires alternate destination');
      await refreshData();
      showNotification('Reroute approved', `${dispatch.id} moved to ${alternate.name}.`, 'success');
    } catch (err) {
      showNotification('Reroute failed', err.message || 'Backend did not confirm the reroute.', 'error');
    } finally {
      setReroutingId(null);
    }
  };

  if (dataLoading) return <LoadingState />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Decisions"
        title="What should I do with this batch?"
        subtitle="Only batches that require action are listed. Alternative destinations stay in this same screen."
      />

      {pendingReroutes.length > 0 && (
        <section className="rounded-2xl border border-rose-800/40 bg-[#241719]/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-300/80">Pending Shipment Reroutes</h2>
              <p className="mt-1 text-xs text-rose-100/50">Route issues requiring an alternate destination.</p>
            </div>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-black text-rose-300">{pendingReroutes.length} pending</span>
          </div>
          <div className="space-y-3">
            {pendingReroutes.map((dispatch) => {
              const alternate = destinations.find((destination) => destination.id !== dispatch.destinationId);
              return (
                <article key={dispatch.id} className="rounded-xl border border-rose-700/30 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-black text-rose-300">Shipment {dispatch.id}</p>
                      <p className="mt-1 text-sm font-bold text-white">Batch {display(dispatch.batchId)} · {display(dispatch.produce)}</p>
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-300">Priority: Route Issue</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <Fact label="Source" value={display(dispatch.source)} />
                    <Fact label="Current Destination" value={display(dispatch.destination)} />
                    <Fact label="Current Route" value={`${display(dispatch.source)} → ${display(dispatch.destination)}`} />
                    <Fact label="Current ETA" value={display(dispatch.eta)} />
                    <Fact label="Issue Reason" value={display(dispatch.issueReason, 'Route blockage or delay')} />
                    <Fact label="Risk / Priority" value="High · Immediate review" />
                    <Fact label="Suggested Alternate" value={display(alternate?.name, 'No alternate available')} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <span className="text-[11px] font-bold text-rose-300/70">Status remains IN TRANSIT until reroute approval.</span>
                    <button type="button" disabled={reroutingId === dispatch.id || !alternate} onClick={() => approvePendingReroute(dispatch)} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                      {reroutingId === dispatch.id ? 'Approving…' : 'Approve Reroute'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {actionable.length === 0 && pendingReroutes.length === 0 ? (
        <EmptyState title="NO ACTIONS REQUIRED" message="No route recommendation available." />
      ) : actionable.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {actionable.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActiveId(b.id);
                  setSelectedBatchId(b.id);
                }}
                className={`w-full rounded-xl border px-3 py-3 text-left ${
                  batch?.id === b.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-emerald-800/40 bg-[#18261a]/60 hover:bg-white/5'
                }`}
              >
                <p className="font-mono text-xs font-bold text-white">{b.id}</p>
                <p className="text-sm text-emerald-200/70">{display(b.produce)}</p>
                <div className="mt-1"><RiskBadge level={b.riskLevel} size="sm" /></div>
              </button>
            ))}
          </aside>

          {batch && (
            <div className="space-y-4">
              <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-lg font-black text-white">{batch.id}</h2>
                    <p className="text-sm text-emerald-200/70">
                      {display(batch.produce)} · {formatKg(batch.weightKg) || '—'}
                    </p>
                  </div>
                  <RiskBadge level={batch.riskLevel} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Fact label="Remaining Shelf Life" value={formatDaysFromHours(batch.remainingShelfLifeHours) || 'AI prediction pending…'} />
                  <Fact label="Current Route" value={`${display(route.destinationName)} · ${formatHours(route.transitDurationHours) || '—'}`} />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-emerald-300/50">Route</p>
                    <p className={`mt-1 text-sm font-black ${route.isFeasible === false ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {route.isFeasible === false ? 'NOT FEASIBLE' : route.isFeasible ? 'FEASIBLE' : '—'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-emerald-100/80">
                  {display(rec.reason, 'Transit duration exceeds available shelf life.')}
                </p>
              </section>

              <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/60">Recommended destination</h3>
                {!recommendedDest && !rec.targetDestinationId ? (
                  <p className="text-sm text-emerald-200/60">No route recommendation available.</p>
                ) : (
                  <div className="rounded-xl border border-emerald-700/40 bg-black/20 p-4">
                    <p className="text-base font-black text-white">{display(recommendedDest?.name || rec.title)}</p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                      <Fact label="Travel Time" value={recommendedDest ? `${recommendedDest.travelTimeMinutes} min` : '—'} />
                      <Fact label="Capacity" value={formatKg(recommendedDest?.capacityAvailableKg) || '—'} />
                      <Fact label="Compatibility" value={recommendedDest ? (isProduceCompatible(batch, recommendedDest) ? 'Compatible' : 'Check produce type') : '—'} />
                      <Fact label="Expected Waste Avoided" value={formatKg(rec.wasteAvoidedKg) || '—'} />
                      <Fact label="Expected Recovery" value={display(rec.economicRecoveryEst)} />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/60">Alternative destinations</h3>
                {destinations.length === 0 ? (
                  <EmptyState title="NO DATA AVAILABLE" message="No destinations returned by the backend." />
                ) : (
                  <div className="space-y-2">
                    {destinations.map((d) => {
                      const feas = destinationFeasibility(batch, d);
                      const selected = selectedDestId === d.id;
                      return (
                        <div
                          key={d.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                            selected ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/20'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-white">{d.name}</p>
                            <p className="text-xs text-emerald-200/60">
                              {display(d.type)} · {d.distanceKm != null ? `${d.distanceKm} km` : '—'} ·{' '}
                              {d.travelTimeMinutes != null ? `${d.travelTimeMinutes} min` : '—'} · capacity {formatKg(d.capacityAvailableKg) || '—'}
                            </p>
                            <p className={`mt-1 text-xs font-bold ${feas.feasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {feas.feasible ? '✓ FEASIBLE' : '✕ NOT FEASIBLE'} — {feas.reason}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDestId(d.id)}
                            className="rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-white/5"
                          >
                            Select
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <button
                type="button"
                onClick={openConfirm}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
              >
                Approve Reroute
              </button>
            </div>
          )}
        </div>
      ) : null}

      {rerouteHistory.length > 0 && (
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">Reroute History</h2>
            <span className="text-[11px] font-bold text-emerald-400">{rerouteHistory.length} completed</span>
          </div>
          <div className="space-y-2">
            {rerouteHistory.map((dispatch) => (
              <div key={dispatch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div>
                  <p className="font-mono text-xs font-bold text-emerald-400">{dispatch.id}</p>
                  <p className="text-xs text-white">{display(dispatch.produce)} · {display(dispatch.destination)}</p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-300">Rerouted</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {confirmOpen && batch && selectedDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-800/50 bg-[#0c1610] p-6">
            <h3 className="text-lg font-black text-white">Confirm reroute</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Batch" v={batch.id} />
              <Row k="Current Destination" v={display(route.destinationName)} />
              <Row k="New Destination" v={selectedDest.name} />
              <Row k="Remaining Shelf Life" v={formatDaysFromHours(batch.remainingShelfLifeHours) || '—'} />
              <Row k="Transit Time" v={`${selectedDest.travelTimeMinutes} min`} />
              <Row k="Waste Avoided" v={formatKg(rec.wasteAvoidedKg || batch.weightKg) || '—'} />
              <Row k="Recovered Value" v={display(rec.economicRecoveryEst)} />
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-emerald-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={confirm}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
              >
                {submitting ? 'Confirming…' : 'Confirm Reroute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Fact = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold uppercase text-emerald-300/50">{label}</p>
    <p className="mt-1 text-sm font-bold text-white">{value}</p>
  </div>
);

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-emerald-200/50">{k}</dt>
    <dd className="font-semibold text-white">{v}</dd>
  </div>
);
