import React, { useState } from 'react';
import { Layers, Thermometer, Wind, AlertTriangle, ShieldCheck, Box, Activity } from 'lucide-react';

export const Warehouse3DIsometric = ({ warehouse, onSelectZone }) => {
  const [hoveredZone, setHoveredZone] = useState('ZONE-A');

  const zones = warehouse?.zones || [
    { id: "ZONE-A", name: "Deep Chill Bay A", targetTemp: 2.0, currentTemp: 7.2, humidity: 94, voc: 6.8, status: "critical", produce: "Organic Strawberries & Berries" },
    { id: "ZONE-B", name: "Controlled Atmosphere B", targetTemp: 12.0, currentTemp: 13.8, humidity: 88, voc: 4.9, status: "warning", produce: "Roma Tomatoes & Avocados" },
    { id: "ZONE-C", name: "Dry Ambient Bay C", targetTemp: 5.0, currentTemp: 4.9, humidity: 84, voc: 0.9, status: "normal", produce: "Honeycrisp Apples & Citrus" },
  ];

  return (
    <div className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-lg backdrop-blur-sm overflow-hidden relative text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
              <Layers className="w-3.5 h-3.5" /> 3D Digital Twin Visualizer
            </span>
            <span className="text-xs text-emerald-300/50 font-mono">Indore Central Cold-Storage Hub</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Multi-Chamber Warehouse Telemetry Grid</h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-200/70">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Optimal
          </span>
          <span className="flex items-center gap-1.5 text-emerald-200/70">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> Warning
          </span>
          <span className="flex items-center gap-1.5 text-emerald-200/70">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span> Critical Alert
          </span>
        </div>
      </div>

      {/* 3D Isometric Viewport */}
      <div className="py-6 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Isometric 3D Racks Stage */}
        <div className="relative w-full lg:w-3/5 h-[340px] flex items-center justify-center bg-black/40 rounded-xl border border-emerald-800/40 p-4 shadow-inner overflow-hidden">
          {/* Subtle 3D Grid floor */}
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Isometric Transform Container */}
          <div className="isometric-container relative flex gap-6 items-center cursor-pointer">
            {zones.map((zone, idx) => {
              const isCritical = zone.status === 'critical' || zone.currentTemp > (zone.targetTemp + 2.5);
              const isWarning = zone.status === 'warning' || (zone.currentTemp > zone.targetTemp + 1 && !isCritical);
              const isSelected = hoveredZone === zone.id;

              return (
                <div
                  key={zone.id}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onClick={() => onSelectZone && onSelectZone(zone)}
                  className={`iso-rack relative w-28 h-56 rounded-xl border-2 transition-all duration-300 flex flex-col justify-between p-3 select-none ${
                    isCritical 
                      ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/50 shadow-2xl'
                      : isWarning
                      ? 'bg-amber-950/80 border-amber-500 shadow-amber-900/50 shadow-xl'
                      : 'bg-[#0f1f14]/90 border-emerald-500 shadow-emerald-950 shadow-lg'
                  } ${isSelected ? 'scale-105 ring-4 ring-emerald-400/50 ring-offset-2 ring-offset-black' : 'opacity-90'}`}
                  style={{
                    transform: `translateZ(${isSelected ? 30 : idx * 10}px)`,
                  }}
                >
                  {/* Top 3D Roof Cap */}
                  <div className={`text-[10px] font-bold uppercase tracking-wider py-1 px-1.5 rounded flex items-center justify-between ${
                    isCritical ? 'bg-rose-600 text-white animate-pulse' : isWarning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    <span>{zone.id}</span>
                    {isCritical && <AlertTriangle className="w-3 h-3 text-white" />}
                  </div>

                  {/* Chamber 3D Shelves simulation */}
                  <div className="flex flex-col gap-1.5 my-auto">
                    {[1, 2, 3].map(shelf => (
                      <div key={shelf} className="h-6 bg-black/40 rounded border border-white/10 flex items-center justify-center px-1 shadow-xs">
                        <Box className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <span className="text-[9px] font-mono text-emerald-200/70 ml-1">L{shelf}</span>
                      </div>
                    ))}
                  </div>

                  {/* Temperature Readout footer */}
                  <div className="bg-black/50 rounded-md p-1.5 border border-white/10 text-center">
                    <span className="text-[10px] text-emerald-300/60 block font-medium">Temp</span>
                    <span className={`text-xs font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {zone.currentTemp}°C
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-2 right-3 text-[11px] font-medium text-emerald-300/80 bg-black/70 px-2.5 py-1 rounded-md border border-emerald-800/40 shadow-xs flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hover or click chamber to inspect IoT telemetry</span>
          </div>
        </div>

        {/* Selected Zone Deep Dive Panel */}
        <div className="w-full lg:w-2/5 flex flex-col justify-center">
          {(() => {
            const current = zones.find(z => z.id === hoveredZone) || zones[0];
            const isCrit = current.status === 'critical' || current.currentTemp > current.targetTemp + 2.5;

            return (
              <div className="bg-black/40 rounded-xl border border-emerald-800/40 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-white">{current.name}</h4>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isCrit ? 'bg-rose-950/80 text-rose-300 border-rose-700/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                  }`}>
                    {isCrit ? 'Thermal Anomaly' : 'Normal Operation'}
                  </span>
                </div>

                <p className="text-xs text-emerald-200/70 mb-4 font-medium">
                  Stored Stock: <span className="text-white font-semibold">{current.produce || 'Mixed Produce'}</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-1 text-emerald-300/70 text-xs mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Current Temp
                    </div>
                    <div className="text-lg font-bold text-white">{current.currentTemp}°C</div>
                    <div className="text-[10px] text-emerald-300/50">Target: {current.targetTemp}°C</div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-1 text-emerald-300/70 text-xs mb-1">
                      <Wind className="w-3.5 h-3.5 text-amber-400" /> VOC / Ethylene
                    </div>
                    <div className="text-lg font-bold text-white">{current.voc} ppm</div>
                    <div className="text-[10px] text-emerald-300/50">Safe: &lt; 2.0 ppm</div>
                  </div>
                </div>

                {isCrit && (
                  <div className="bg-rose-950/60 border border-rose-700/50 rounded-lg p-3 text-xs text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-rose-300">Critical Action Needed:</strong>
                      Zone A compressor thermal breach detected. AI recommends immediate batch rerouting.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
