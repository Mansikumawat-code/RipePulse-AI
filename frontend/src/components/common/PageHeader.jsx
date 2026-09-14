import React from 'react';

export const PageHeader = ({ kicker, title, subtitle, actions }) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      {kicker && (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400/70">
          {kicker}
        </p>
      )}
      <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-emerald-200/55">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
