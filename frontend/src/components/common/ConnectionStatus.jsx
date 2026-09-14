import React from 'react';

export const ConnectionStatus = ({ status }) => {
  const map = {
    LIVE: { label: 'LIVE', dot: 'bg-emerald-400', text: 'text-emerald-400', ring: true },
    WAITING: { label: 'WAITING FOR TELEMETRY', dot: 'bg-amber-400', text: 'text-amber-400', ring: false },
    DISCONNECTED: { label: 'DISCONNECTED', dot: 'bg-slate-400', text: 'text-slate-400', ring: false },
  };
  const cfg = map[status] || map.DISCONNECTED;

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-bold ${cfg.text}`}>
      <span className="relative flex h-2.5 w-2.5">
        {cfg.ring && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
};
