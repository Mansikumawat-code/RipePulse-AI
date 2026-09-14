import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { ConnectionStatus } from '../components/common/ConnectionStatus';
import { API_BASE_URL } from '../services/api';
import { telemetryService } from '../services/telemetryService';

export const SettingsPage = () => {
  const {
    connectionStatus,
    backendOnline,
    health,
    refreshHealth,
    selectedBatchId,
    simulateStress,
    simulateRecovery,
    toggleAutoSensor,
    isAutoSensorActive,
    showNotification,
  } = useApp();

  const [sim, setSim] = useState(null);

  useEffect(() => {
    telemetryService.getSimulatorStatus()
      .then(setSim)
      .catch(() => setSim(null));
    refreshHealth();
  }, [refreshHealth]);

  const run = async (fn, label) => {
    try {
      await fn();
      showNotification(label, 'Backend accepted the request.', 'success');
    } catch (err) {
      showNotification(label, err.message || 'Backend request failed.', 'error');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        kicker="Settings"
        title="Application status"
        subtitle="Operational controls only. Risk thresholds are owned by the backend."
      />

      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
        <h2 className="mb-3 text-sm font-black text-white">API connection</h2>
        <p className="font-mono text-xs text-emerald-200/70">{API_BASE_URL}</p>
        <p className="mt-2 text-sm">
          System status:{' '}
          <span className={backendOnline ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>
            {backendOnline ? 'Online' : 'Offline'}
          </span>
        </p>
        <p className="mt-1 text-xs text-emerald-200/50">
          Model: {health?.model_status || 'unknown'}
        </p>
        <div className="mt-3">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
        <h2 className="mb-3 text-sm font-black text-white">Simulation / telemetry</h2>
        <p className="text-sm text-emerald-200/60">
          Ticker: {sim?.isTickerRunning || isAutoSensorActive ? 'Running' : 'Stopped'}
          {sim?.activeBatchId ? ` · ${sim.activeBatchId}` : ''}
          {sim?.currentScenario ? ` · ${sim.currentScenario}` : ''}
        </p>
        <p className="mt-1 text-xs text-emerald-200/45">Selected batch: {selectedBatchId || 'None'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="rounded-xl border border-emerald-700/50 px-3 py-2 text-xs font-bold" onClick={() => run(() => toggleAutoSensor(selectedBatchId), 'Ticker')}>
            Toggle live ticker
          </button>
          <button type="button" className="rounded-xl border border-rose-700/50 px-3 py-2 text-xs font-bold text-rose-300" onClick={() => run(() => simulateStress(selectedBatchId), 'Stress simulation')}>
            Simulate stress
          </button>
          <button type="button" className="rounded-xl border border-emerald-700/50 px-3 py-2 text-xs font-bold" onClick={() => run(() => simulateRecovery(selectedBatchId), 'Recovery simulation')}>
            Simulate recovery
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/80 p-5">
        <h2 className="mb-2 text-sm font-black text-white">Risk thresholds</h2>
        <p className="text-sm text-emerald-200/60">
          Risk levels are computed by the backend (SLI and remaining shelf life). They are not edited in this operator view.
        </p>
      </section>
    </div>
  );
};
