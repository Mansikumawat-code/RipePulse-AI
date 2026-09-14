import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Thermometer, Droplets, Wind, Clock, Brain, ShieldAlert,
  AlertTriangle, Flame, CheckCircle2, TrendingDown, MapPin,
  ArrowRight, Truck, RefreshCw, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { RiskBadge } from '../components/common/RiskBadge';
import { ConnectionStatus } from '../components/common/ConnectionStatus';
import {
  display, formatDaysFromHours, formatHours, formatKg, formatPercent, isProduceCompatible, destinationFeasibility,
} from '../utils/format';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function secAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} h ago`;
}

const DRIVER_INFO = {
  THERMAL_STRESS:      { label: 'Thermal Stress',               color: 'text-amber-400',  desc: 'Temperature exposure is increasing the predicted degradation rate.' },
  VOC_STRESS:          { label: 'VOC / Ethylene-related Stress', color: 'text-rose-400',   desc: 'Elevated ethylene is triggering autocatalytic ripening and mold risk.' },
  NATURAL_AGING:       { label: 'Natural Aging / Respiration',   color: 'text-orange-400', desc: 'Normal respiration and senescence are consuming the remaining shelf buffer.' },
};
function driverInfo(key) {
  const k = (key || '').toUpperCase().replace(/ /g, '_');
  return DRIVER_INFO[k] || { label: key || 'Unknown', color: 'text-emerald-300', desc: 'No additional explanation provided by the backend.' };
}

/* ── sub-chart ───────────────────────────────────────────────────────────── */
const MiniChart = ({ data, dataKey, color, label, unit }) => {
  if (!data.length) return (
    <div className="flex h-[140px] items-center justify-center rounded-xl border border-emerald-900/30 bg-black/20 text-xs text-emerald-200/30">
      Waiting for telemetry…
    </div>
  );
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/45">{label} ({unit})</p>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
            <XAxis dataKey="time" tick={{ fill: '#86efac', fontSize: 9 }} stroke="rgba(16,185,129,0.15)" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#86efac', fontSize: 9 }} stroke="rgba(16,185,129,0.15)" />
            <Tooltip contentStyle={{ background: '#0c1610', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, fontSize: 11 }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={1.8} name={label} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ── main page ───────────────────────────────────────────────────────────── */
export const BatchDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    batches, destinations, setSelectedBatchId,
    liveTelemetrySeries, lastPrediction, connectionStatus, lastLiveAt,
    approveReroute, dataLoading, backendOnline, refreshData, errorMessage,
    showNotification,
  } = useApp();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rerouted, setRerouted] = useState(false);

  useEffect(() => { if (id) setSelectedBatchId(id); }, [id, setSelectedBatchId]);

  const batch       = batches.find((b) => b.id === id);
  const series      = liveTelemetrySeries;
  const hasTelemetry = series.length > 0;
  const lastPoint   = series[series.length - 1];
  const route       = batch?.currentRoute || {};
  const rec         = batch?.recommendedAction || {};

  // prediction: prefer live lastPrediction, fall back to batch stored values
  const rsl        = lastPrediction?.remainingShelfLifeHours ?? batch?.remainingShelfLifeHours;
  const sli        = lastPrediction?.sli ?? batch?.sli;
  const risk       = lastPrediction?.riskLevel ?? batch?.riskLevel;
  const confidence = lastPrediction?.confidenceScore ?? batch?.confidenceScore;
  const predTs     = lastPrediction?.timestamp;

  // explainability
  const explain = useMemo(() => {
    const ex = batch?.explainability || lastPrediction?.explainability || {};
    const driver = ex.primary_driver || ex.primaryDriver || '';
    const tempImpact = Number(ex.temp_impact ?? ex.tempImpact ?? 0);
    const vocImpact  = Number(ex.voc_impact  ?? ex.vocImpact  ?? 0);
    const ageImpact  = Number(ex.age_impact  ?? ex.ageImpact  ?? 0);
    return { driver, tempImpact, vocImpact, ageImpact };
  }, [batch, lastPrediction]);

  // recommended destination
  const recommendedDest = useMemo(
    () => destinations.find((d) => d.id === rec.targetDestinationId) || null,
    [destinations, rec.targetDestinationId],
  );
  const selectedDest = destinations.find((d) => d.id === selectedDestId) || recommendedDest;

  // route buffer
  const transitH = Number(route.transitDurationHours || 0);
  const rslH     = Number(rsl || 0);
  const bufferH  = rslH - transitH;

  if (dataLoading) return <LoadingState />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;
  if (!batch) return <EmptyState title="BATCH NOT FOUND" message={`Batch ${id} was not returned by the backend.`} />;

  const handleApprove = async () => {
    if (!selectedDest) { showNotification('No destination', 'Select a destination first.', 'warning'); return; }
    setSubmitting(true);
    try {
      const res = await approveReroute(batch.id, selectedDest.id);
      setConfirmOpen(false);
      setRerouted(true);
      setTimeout(() => navigate(`/dispatch?id=${res.dispatchId || ''}`), 1800);
    } catch (err) {
      showNotification('Reroute failed', err?.response?.data?.detail || err.message || 'Backend did not confirm.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const di = driverInfo(explain.driver);
  const maxImpact = Math.max(explain.tempImpact, explain.vocImpact, explain.ageImpact, 1);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400/60">Batch Details</p>
          <h1 className="text-2xl font-black tracking-tight text-white">{batch.id}</h1>
          <p className="mt-0.5 text-sm text-emerald-200/60">
            {batch.icon && <span className="mr-1">{batch.icon}</span>}
            {display(batch.produce)} · {display(batch.variety)} · {formatKg(batch.weightKg) || '—'} · {display(batch.zone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionStatus status={connectionStatus} />
          <RiskBadge level={risk} size="lg" />
          <button
            type="button"
            onClick={refreshData}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-800/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Telemetry waiting banner ── */}
      {!hasTelemetry && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/25 px-4 py-3 text-sm font-semibold text-amber-200">
          ⏳ Batch created successfully. Waiting for first telemetry reading from the backend…
        </div>
      )}

      {/* ════ SECTION 1 — LIVE TELEMETRY ════ */}
      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {connectionStatus === 'LIVE' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${connectionStatus === 'LIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">
              {connectionStatus === 'LIVE' ? '● Live Telemetry' : 'Telemetry'}
            </h2>
            {connectionStatus === 'LIVE' && (
              <span className="rounded-full border border-emerald-600/40 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Backend Active
              </span>
            )}
          </div>
          {lastLiveAt && (
            <span className="text-[11px] text-emerald-200/40">Last packet: {secAgo(new Date(lastLiveAt).toISOString())}</span>
          )}
        </div>

        {/* Sensor cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SensorCard icon={Thermometer} label="Temperature" value={batch.currentTemp != null ? `${Number(batch.currentTemp).toFixed(1)} °C` : '—'} live={connectionStatus === 'LIVE'} warn={batch.currentTemp != null && batch.currentTemp > (batch.baselineTemp || 4) + 2} />
          <SensorCard icon={Droplets}    label="Humidity"    value={batch.currentHumidity != null ? `${Number(batch.currentHumidity).toFixed(0)} %` : '—'} live={connectionStatus === 'LIVE'} />
          <SensorCard icon={Wind}        label="VOC"         value={batch.currentVoc != null ? `${Number(batch.currentVoc).toFixed(2)} ppm` : '—'} live={connectionStatus === 'LIVE'} warn={batch.currentVoc != null && batch.currentVoc > 2.0} />
          <SensorCard icon={Clock}       label="Last Updated" value={lastPoint?.timestamp ? secAgo(lastPoint.timestamp) : (batch.lastTelemetryAt ? secAgo(batch.lastTelemetryAt) : 'Waiting…')} live={connectionStatus === 'LIVE'} />
        </div>

        {/* 4 individual charts */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniChart data={series} dataKey="temperature" color="#10b981" label="Temperature" unit="°C" />
          <MiniChart data={series} dataKey="humidity"    color="#f59e0b" label="Humidity"    unit="%" />
          <MiniChart data={series} dataKey="voc"         color="#f43f5e" label="VOC"         unit="ppm" />
          <MiniChart data={series} dataKey="sli"         color="#a78bfa" label="SLI"         unit="%" />
        </div>
      </section>

      {/* ════ SECTION 2 — AI PREDICTION ════ */}
      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">AI Shelf-Life Prediction</h2>
          <span className="rounded-full border border-violet-600/30 bg-violet-600/10 px-2 py-0.5 text-[10px] font-bold text-violet-400">XGBoost Regression</span>
        </div>

        {rsl == null ? (
          <p className="text-sm text-emerald-200/50">AI prediction pending — waiting for telemetry…</p>
        ) : (
          <>
            {/* Big RSL */}
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/45">Remaining Shelf Life</p>
                <p className={`mt-1 text-4xl font-black ${rslH < 24 ? 'text-rose-400' : rslH < 72 ? 'text-amber-400' : 'text-white'}`}>
                  {formatDaysFromHours(rsl)}
                </p>
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/45 mb-1.5">Shelf-Life Index</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${Number(sli) < 30 ? 'bg-rose-500' : Number(sli) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(sli) || 0))}%` }}
                    />
                  </div>
                  <span className={`text-lg font-black tabular-nums ${Number(sli) < 30 ? 'text-rose-400' : Number(sli) < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {sli != null ? `${Math.round(Number(sli))}` : '—'}<span className="text-sm font-normal text-emerald-200/40"> / 100</span>
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-emerald-200/35">
                  Initial: {formatDaysFromHours(batch.initialShelfLifeHours) || '—'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <AIStat label="Risk Level">
                <RiskBadge level={risk} />
              </AIStat>
              <AIStat label="Prediction Confidence" value={confidence != null ? formatPercent(confidence) : 'Not provided'} />
              <AIStat label="Last Prediction" value={predTs ? secAgo(predTs) : 'Using stored backend value'} />
            </div>
          </>
        )}
      </section>

      {/* ════ SECTION 3 — SLI STATUS ════ */}
      {sli != null && (
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5">
          <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/70">Shelf-Life Index</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className={`text-5xl font-black tabular-nums ${Number(sli) < 30 ? 'text-rose-400' : Number(sli) < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.round(Number(sli))}
              </p>
              <p className="text-xs text-emerald-200/40">/ 100</p>
            </div>
            <div className="flex-1 space-y-2 min-w-[200px]">
              <div className="h-4 w-full rounded-full bg-black/30 overflow-hidden border border-emerald-900/40">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${Number(sli) < 30 ? 'bg-rose-500' : Number(sli) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, Number(sli))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-200/30">
                <span>0 — Critical</span><span>30 — At Risk</span><span>60 — Monitor</span><span>100 — Healthy</span>
              </div>
            </div>
            <SLIStatus sli={Number(sli)} />
          </div>
        </section>
      )}

      {/* ════ SECTION 4 — WHY IS THIS BATCH AT RISK? ════ */}
      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">Why is this batch at risk?</h2>
        </div>
        {!explain.driver && !explain.tempImpact && !explain.vocImpact ? (
          <p className="text-sm text-emerald-200/50">No explanation data available from the backend yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-2">Primary Driver</p>
              <div className="rounded-xl border border-emerald-800/30 bg-black/20 p-4">
                <p className={`text-base font-black ${di.color}`}>{di.label}</p>
                <p className="mt-1.5 text-sm text-emerald-200/65">{di.desc}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-2">Impact Factors</p>
              <div className="space-y-2">
                {[
                  { k: 'Temperature', v: explain.tempImpact, c: '#f59e0b' },
                  { k: 'VOC / Ethylene', v: explain.vocImpact, c: '#f43f5e' },
                  { k: 'Storage Age', v: explain.ageImpact, c: '#a78bfa' },
                ].map(({ k, v, c }) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-28 text-emerald-200/55 shrink-0">{k}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/30 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / maxImpact) * 100)}%`, backgroundColor: c }} />
                    </div>
                    <span className="w-8 text-right tabular-nums text-emerald-200/50">{v ? v.toFixed(1) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ════ SECTION 5 — ROUTE STATUS ════ */}
      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300/70">Route Status</h2>
        </div>
        {!route.destinationName ? (
          <p className="text-sm text-emerald-200/50">No route information available from the backend.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RouteStat label="Current Destination" value={display(route.destinationName)} />
            <RouteStat label="Transit Time" value={formatHours(route.transitDurationHours) || '—'} />
            <RouteStat label="Remaining Shelf Life" value={formatDaysFromHours(rsl) || '—'} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-1">Route Buffer</p>
              <p className={`text-lg font-black ${bufferH >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rsl != null && transitH ? `${bufferH >= 0 ? '+' : ''}${(bufferH / 24).toFixed(1)} days` : '—'}
              </p>
            </div>
          </div>
        )}
        <div className="pt-1">
          {route.isFeasible === false ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-rose-600/40 bg-rose-600/10 px-4 py-2 text-sm font-black text-rose-400">
              <Flame className="h-4 w-4" /> ✕ ROUTE NOT FEASIBLE
            </div>
          ) : route.isFeasible === true ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm font-black text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> ✓ ROUTE FEASIBLE
            </div>
          ) : null}
        </div>
      </section>

      {/* ════ SECTION 6 — RECOMMENDATION ════ */}
      {rec.actionType && (
        <section className="rounded-2xl border border-indigo-800/40 bg-indigo-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-300/70">AI Recommendation</h2>
          </div>

          {(recommendedDest || rec.title) && (
            <div className="rounded-xl border border-indigo-700/30 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400/70">Recommended</span>
                  <p className="text-base font-black text-white mt-0.5">{display(recommendedDest?.name || rec.title)}</p>
                  {recommendedDest?.location && (
                    <p className="text-xs text-emerald-200/50 mt-0.5">{recommendedDest.location}</p>
                  )}
                </div>
                {recommendedDest && (
                  <select
                    className="rounded-lg border border-indigo-800/40 bg-black/30 px-2 py-1.5 text-xs text-white outline-none"
                    value={selectedDestId || recommendedDest.id}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                  >
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#111c12]">{d.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {recommendedDest && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <DestFact label="Distance" value={recommendedDest.distanceKm != null ? `${recommendedDest.distanceKm} km` : '—'} />
                  <DestFact label="Travel Time" value={recommendedDest.travelTimeMinutes != null ? `${recommendedDest.travelTimeMinutes} min` : '—'} />
                  <DestFact label="Capacity Available" value={formatKg(recommendedDest.capacityAvailableKg) || '—'} />
                  <DestFact label="Batch Weight" value={formatKg(batch.weightKg) || '—'} />
                </div>
              )}

              {recommendedDest && (
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <CompatTag ok={Number(recommendedDest.capacityAvailableKg) >= Number(batch.weightKg)} label="Capacity Available" />
                  <CompatTag ok={isProduceCompatible(batch, recommendedDest)} label="Produce Compatible" />
                  <CompatTag ok={destinationFeasibility(batch, recommendedDest).feasible} label="Within Shelf Life" />
                </div>
              )}

              <p className="text-xs text-emerald-200/60">{display(rec.reason)}</p>

              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <DestFact label="Expected Recovery" value={display(rec.economicRecoveryEst)} />
                <DestFact label="Waste Avoided" value={formatKg(rec.wasteAvoidedKg) || '—'} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <Truck className="h-4 w-4" /> Approve Reroute <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* ════ REROUTE CONFIRM MODAL ════ */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-800/50 bg-[#0c1610] p-6 shadow-2xl">
            {rerouted ? (
              <div className="py-4 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="text-lg font-black text-white">✓ Reroute Approved</p>
                <p className="text-sm text-emerald-200/60">Dispatch created successfully. Redirecting…</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-white">Approve Reroute?</h3>
                <dl className="mt-4 space-y-2 text-sm divide-y divide-white/5">
                  <ModalRow k="Batch" v={batch.id} />
                  <ModalRow k="Current Destination" v={display(route.destinationName)} />
                  <ModalRow k="New Destination" v={selectedDest?.name || '—'} highlight />
                  <ModalRow k="Remaining Shelf Life" v={formatDaysFromHours(rsl) || '—'} />
                  <ModalRow k="Transit Time" v={selectedDest?.travelTimeMinutes ? `${selectedDest.travelTimeMinutes} min` : '—'} />
                  <ModalRow k="Waste Avoided" v={formatKg(rec.wasteAvoidedKg || batch.weightKg) || '—'} />
                  <ModalRow k="Recovered Value" v={display(rec.economicRecoveryEst)} />
                </dl>
                <p className="mt-4 rounded-lg border border-rose-800/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
                  {display(rec.reason, 'Current route is not feasible.')}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setConfirmOpen(false)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="button" disabled={submitting} onClick={handleApprove}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                    {submitting ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />Confirming…</> : 'Confirm Reroute'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── reusable sub-components ─────────────────────────────────────────────── */
const SensorCard = ({ icon: Icon, label, value, live, warn }) => (
  <div className={`rounded-xl border p-3.5 ${warn ? 'border-amber-700/40 bg-amber-950/20' : 'border-emerald-800/30 bg-black/20'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${warn ? 'text-amber-400' : 'text-emerald-400/70'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40">{label}</span>
      </div>
      {live && (
        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
          Live
        </span>
      )}
    </div>
    <p className={`text-xl font-black tabular-nums ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</p>
  </div>
);

const AIStat = ({ label, value, children }) => (
  <div className="rounded-xl border border-emerald-800/25 bg-black/20 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-1">{label}</p>
    {children || <p className="text-sm font-bold text-white">{value}</p>}
  </div>
);

const SLIStatus = ({ sli }) => {
  if (sli >= 70) return <div className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-black text-emerald-400">● Healthy</div>;
  if (sli >= 45) return <div className="rounded-xl border border-amber-600/40 bg-amber-600/10 px-3 py-1.5 text-xs font-black text-amber-400">● Monitor</div>;
  if (sli >= 25) return <div className="rounded-xl border border-orange-600/40 bg-orange-600/10 px-3 py-1.5 text-xs font-black text-orange-400">⚠ At Risk</div>;
  return          <div className="rounded-xl border border-rose-600/40 bg-rose-600/10 px-3 py-1.5 text-xs font-black text-rose-400">🔥 Critical</div>;
};

const RouteStat = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mb-1">{label}</p>
    <p className="text-sm font-bold text-white">{value}</p>
  </div>
);

const DestFact = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/40 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-white">{value}</p>
  </div>
);

const CompatTag = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
    ok === true  ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-400' :
    ok === false ? 'border-rose-600/40 bg-rose-600/10 text-rose-400' :
                   'border-white/10 bg-white/5 text-emerald-200/40'
  }`}>
    {ok === true ? '✓' : ok === false ? '✕' : '?'} {label}
  </span>
);

const ModalRow = ({ k, v, highlight }) => (
  <div className="flex justify-between gap-4 py-1.5">
    <dt className="text-emerald-200/45 text-xs">{k}</dt>
    <dd className={`text-xs font-semibold ${highlight ? 'text-emerald-300' : 'text-white'}`}>{v}</dd>
  </div>
);
