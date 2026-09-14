import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Flame, 
  Check, 
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../common/RiskBadge';

export const AlertDetails = () => {
  const { alerts, acknowledgeAlert, resolveAlert, setSelectedBatchId } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredAlerts = alerts.filter(a => 
    filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  const filterColors = {
    ALL: 'bg-white/10 text-white border-white/20',
    CRITICAL: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    HIGH: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    MEDIUM: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    LOW: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-900/50 text-rose-300 border border-rose-700/50">
              Operations Center
            </span>
            <span className="text-xs text-emerald-300/50 font-medium">Incident & Anomaly Queue</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Priority Risk Alerts & Incident Logs
          </h1>
          <p className="text-xs text-emerald-200/50 mt-0.5">
            Automated notifications triggered when thermal abuse or ethylene surges violate biological thresholds.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-emerald-400/50">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                filterSeverity === sev
                  ? filterColors[sev]
                  : 'bg-white/5 text-emerald-300/50 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isCrit = alert.severity === 'CRITICAL';
          const isResolved = alert.status === 'RESOLVED';

          return (
            <div
              key={alert.id}
              className={`bg-[#18261a]/80 rounded-2xl border p-5 shadow-sm transition-all backdrop-blur-sm ${
                isCrit && !isResolved
                  ? 'border-rose-700/50 ring-1 ring-rose-800/30'
                  : 'border-emerald-800/40 hover:border-emerald-700/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    isCrit ? 'bg-rose-900/50 text-rose-400' : 'bg-amber-900/40 text-amber-400'
                  }`}>
                    {isCrit ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400/50">{alert.id}</span>
                      <RiskBadge level={alert.severity} size="sm" />
                      <span className="text-xs text-emerald-300/30">• {alert.timestamp}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-0.5">{alert.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isResolved 
                      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' 
                      : alert.status === 'ACKNOWLEDGED'
                      ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
                      : 'bg-rose-900/50 text-rose-300 border-rose-700/50'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>

              <div className="py-3 text-xs text-emerald-200/60">
                <p className="leading-relaxed">{alert.message}</p>
                <div className="mt-2.5 bg-white/5 p-2.5 rounded-lg border border-white/10 font-medium flex items-center justify-between text-emerald-200/60">
                  <span><strong className="text-white">Prescribed Action:</strong> {alert.actionRequired}</span>
                  <span className="font-mono text-[11px] text-emerald-400/40">Produce: {alert.produce} ({alert.batchId})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <Link
                  to={`/batches/${alert.batchId}`}
                  onClick={() => setSelectedBatchId(alert.batchId)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <span>Inspect Batch Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  {!isResolved && alert.status !== 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!isResolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
