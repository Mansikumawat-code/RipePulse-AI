import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { RiskBadge } from '../components/common/RiskBadge';
import { TelemetryChart } from '../components/common/TelemetryChart';
import { ConnectionStatus } from '../components/common/ConnectionStatus';
import { display, formatDaysFromHours, formatPercent } from '../utils/format';

export const LiveMonitoringPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    activeBatch,
    liveTelemetrySeries,
    lastPrediction,
    connectionStatus,
    lastLiveAt,
    dataLoading,
    backendOnline,
    refreshData,
    errorMessage,
    loadTelemetryForBatch,
    showNotification,
  } = useApp();

  useEffect(() => {
    const fromQuery = params.get('batch');
    if (fromQuery) setSelectedBatchId(fromQuery);
  }, [params, setSelectedBatchId]);

  if (dataLoading) return <LoadingState label="Connecting to live monitoring…" />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;

  const batch = activeBatch;
  const lastPoint = liveTelemetrySeries[liveTelemetrySeries.length - 1];
  const predictionPending = !lastPrediction && (batch?.remainingShelfLifeHours == null);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Live Monitoring"
        title="Real telemetry"
        subtitle="Charts update only when the backend or WebSocket delivers a reading."
        actions={<ConnectionStatus status={connectionStatus} />}
      />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-4">
        <label className="block min-w-[220px] flex-1 text-xs font-bold text-emerald-200/70">
          Select Batch
          <select
            className="mt-1 w-full rounded-xl border border-emerald-800/40 bg-black/30 px-3 py-2 text-sm text-white"
            value={selectedBatchId || ''}
            onChange={(e) => setSelectedBatchId(e.target.value || null)}
          >
            <option value="">Select a batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.id} — {b.produce}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={async () => {
            try {
              await refreshData();
              if (selectedBatchId) await loadTelemetryForBatch(selectedBatchId);
            } catch (err) {
              showNotification('Telemetry request failed', err.message || 'Backend did not return a reading.', 'error');
            }
          }}
          className="rounded-xl border border-emerald-700/50 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-white/5"
        >
          Refresh telemetry
        </button>
      </div>

      {!batch ? (
        <EmptyState title="WAITING FOR LIVE DATA" message="Select a batch to view telemetry." />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            <Tile label="Temperature" value={batch.currentTemp != null ? `${batch.currentTemp}°C` : '—'} />
            <Tile label="Humidity" value={batch.currentHumidity != null ? `${batch.currentHumidity}%` : '—'} />
            <Tile label="VOC" value={batch.currentVoc != null ? `${batch.currentVoc} ppm` : '—'} />
            <Tile
              label="Timestamp"
              value={lastPoint?.timestamp || batch.lastTelemetryAt || 'Waiting for telemetry…'}
            />
          </section>
          <p className="text-xs text-emerald-200/50">
            Data source: {connectionStatus === 'LIVE' ? 'Live backend / WebSocket' : 'Backend API'}
            {lastLiveAt ? ` · last packet ${new Date(lastLiveAt).toLocaleTimeString()}` : ''}
          </p>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300/60">Real-time chart</h2>
            <TelemetryChart data={liveTelemetrySeries} />
          </section>

          <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
            <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-emerald-300/60">AI Result</h2>
            {predictionPending ? (
              <p className="text-sm text-emerald-200/60">AI prediction pending…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-4">
                <Tile label="Remaining Shelf Life" value={formatDaysFromHours(lastPrediction?.remainingShelfLifeHours ?? batch.remainingShelfLifeHours) || '—'} />
                <Tile label="SLI" value={formatPercent(lastPrediction?.sli ?? batch.sli) || '—'} />
                <div>
                  <p className="text-[11px] font-bold uppercase text-emerald-300/50">Risk</p>
                  <div className="mt-2"><RiskBadge level={lastPrediction?.riskLevel || batch.riskLevel} /></div>
                </div>
                <Tile
                  label="Confidence"
                  value={(lastPrediction?.confidenceScore ?? batch.confidenceScore) != null
                    ? formatPercent(lastPrediction?.confidenceScore ?? batch.confidenceScore)
                    : 'Not provided'}
                />
              </div>
            )}
            <p className="mt-3 text-xs text-emerald-200/45">
              Latest prediction: {display(lastPrediction?.timestamp, 'Using last stored backend prediction')}
            </p>
            {(batch.currentRoute?.isFeasible === false) && (
              <button
                type="button"
                onClick={() => navigate(`/decisions?batch=${batch.id}`)}
                className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400"
              >
                Route infeasible — open Decisions
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const Tile = ({ label, value }) => (
  <div className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-4">
    <p className="text-[11px] font-bold uppercase text-emerald-300/50">{label}</p>
    <p className="mt-2 text-lg font-black text-white break-all">{value}</p>
  </div>
);
