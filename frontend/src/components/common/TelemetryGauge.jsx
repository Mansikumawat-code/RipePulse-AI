import React from 'react';
import { Thermometer, Droplets, Wind } from 'lucide-react';

export const TelemetryGauge = ({
  type = 'temp',
  value,
  target,
  unit,
  min = 0,
  max = 20,
}) => {
  const configs = {
    temp: {
      label: 'Zone Temperature',
      icon: Thermometer,
      unit: '°C',
      defaultMax: 20,
      color: value > (target + 2) ? 'text-rose-400' : 'text-emerald-400',
      barColor: value > (target + 2) ? 'bg-rose-500' : 'bg-emerald-500',
      bgLight: value > (target + 2) ? 'bg-rose-900/40' : 'bg-emerald-900/40',
      borderColor: value > (target + 2) ? 'border-rose-700/40' : 'border-emerald-700/40',
    },
    humidity: {
      label: 'Relative Humidity',
      icon: Droplets,
      unit: '% RH',
      defaultMax: 100,
      color: 'text-blue-400',
      barColor: 'bg-blue-500',
      bgLight: 'bg-blue-900/40',
      borderColor: 'border-blue-700/40',
    },
    voc: {
      label: 'VOC / Ethylene',
      icon: Wind,
      unit: 'ppm',
      defaultMax: 10,
      color: value > 2.0 ? 'text-amber-400' : 'text-teal-400',
      barColor: value > 2.0 ? 'bg-amber-500' : 'bg-teal-500',
      bgLight: value > 2.0 ? 'bg-amber-900/40' : 'bg-teal-900/40',
      borderColor: value > 2.0 ? 'border-amber-700/40' : 'border-teal-700/40',
    },
  };

  const config = configs[type] || configs.temp;
  const Icon = config.icon;
  const displayUnit = unit || config.unit;
  const effectiveMax = max || config.defaultMax;
  const percentage = Math.min(100, Math.max(0, ((value - min) / (effectiveMax - min)) * 100));

  return (
    <div className="bg-[#18261a]/70 rounded-xl border border-emerald-800/40 p-4 shadow-sm transition-all hover:border-emerald-700/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${config.bgLight} ${config.color} border ${config.borderColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-300/50 block">{config.label}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-white tracking-tight">{value}</span>
              <span className="text-xs font-medium text-emerald-300/50">{displayUnit}</span>
            </div>
          </div>
        </div>

        {target !== undefined && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/40 block">Baseline</span>
            <span className="text-xs font-semibold text-emerald-200/70">{target}{displayUnit}</span>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="mt-3">
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${config.barColor} shadow-sm`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-emerald-400/40 mt-1 font-medium">
          <span>{min}{displayUnit}</span>
          <span>Max safe: {effectiveMax}{displayUnit}</span>
        </div>
      </div>
    </div>
  );
};
