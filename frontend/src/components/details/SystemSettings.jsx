import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../services/api';

export const SystemSettings = () => {
  const { showNotification } = useApp();

  const [settings, setSettings] = useState({
    apiUrl: API_BASE_URL,
    tempWarningThreshold: 2.0,
    vocThreshold: 2.0,
    minTransitBufferHours: 8,
    modelType: 'Q10_ARRHENIUS_ENSEMBLE',
    autoRerouteApproval: false,
    soundAlerts: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    showNotification("Settings Saved", "System telemetry thresholds and ML configuration updated.", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl text-slate-100">
      
      {/* Header */}
      <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
            System Configuration
          </span>
          <span className="text-xs text-emerald-300/60 font-medium">RipePulse Parameters</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Telemetry Thresholds & AI Parameters
        </h1>
        <p className="text-xs text-emerald-200/60 mt-0.5">
          Fine-tune sensor alerts, Arrhenius biological sensitivity coefficients, and backend integration endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Backend API Integration */}
        <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Backend API Connection</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-200 mb-1">FastAPI Service Endpoint (VITE_API_BASE_URL)</label>
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-black/40 text-white border border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-[11px] text-emerald-300/50 mt-1 block">
              Set via <code>VITE_API_BASE_URL</code> environment variable. All data must come from the FastAPI backend.
            </span>
          </div>
        </div>

        {/* Biological Degradation Model Settings */}
        <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">AI Biological Degradation Kinetics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Thermal Tolerance Delta (+°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.tempWarningThreshold}
                onChange={(e) => setSettings({ ...settings, tempWarningThreshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 text-white border border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="text-[11px] text-emerald-300/50 mt-0.5 block">Trigger alarm when temp spikes above baseline</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                VOC / Ethylene Critical Level (ppm)
              </label>
              <input
                type="number"
                step="0.2"
                value={settings.vocThreshold}
                onChange={(e) => setSettings({ ...settings, vocThreshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 text-white border border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="text-[11px] text-emerald-300/50 mt-0.5 block">Autocatalytic ripening threshold</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Minimum Retail Transit Safety Buffer (Hours)
              </label>
              <input
                type="number"
                value={settings.minTransitBufferHours}
                onChange={(e) => setSettings({ ...settings, minTransitBufferHours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 text-white border border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="text-[11px] text-emerald-300/50 mt-0.5 block">Required shelf life remaining upon store arrival</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Degradation Calculation Algorithm
              </label>
              <select
                value={settings.modelType}
                onChange={(e) => setSettings({ ...settings, modelType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 text-white border border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Q10_ARRHENIUS_ENSEMBLE" className="bg-[#111c12] text-white">Q10 Arrhenius Biological Enzyme Model (Recommended)</option>
                <option value="RANDOM_FOREST" className="bg-[#111c12] text-white">Random Forest Sensor Regressor</option>
                <option value="LSTM_TIME_SERIES" className="bg-[#111c12] text-white">LSTM Recurrent Degradation Network</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
};
