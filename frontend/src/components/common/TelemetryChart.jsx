import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const TelemetryChart = ({ data = [], height = 280 }) => {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-emerald-900/40 bg-black/20 text-sm text-emerald-200/50">
        Waiting for live telemetry…
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.12)" />
          <XAxis dataKey="time" tick={{ fill: '#86efac', fontSize: 11 }} stroke="rgba(16,185,129,0.2)" />
          <YAxis tick={{ fill: '#86efac', fontSize: 11 }} stroke="rgba(16,185,129,0.2)" />
          <Tooltip
            contentStyle={{
              background: '#0c1610',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#10b981" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#f59e0b" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="voc" name="VOC" stroke="#f43f5e" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="sli" name="SLI" stroke="#e2e8f0" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
