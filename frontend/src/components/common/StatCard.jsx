import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'positive',
  icon: Icon,
  iconColor = 'text-emerald-400',
  iconBg = 'bg-emerald-900/50',
  badgeText,
  onClick,
}) => {
  const trendColors = {
    positive: 'text-emerald-200 bg-emerald-600/35 border-emerald-400 font-bold shadow-sm shadow-emerald-500/20',
    negative: 'text-rose-100 bg-rose-600/35 border-rose-400 font-bold shadow-sm shadow-rose-500/30',
    warning: 'text-amber-300 bg-amber-900/50 border-amber-700/50',
    neutral: 'text-slate-300 bg-white/10 border-white/20',
  }[trendType] || 'text-emerald-200 bg-emerald-600/35 border-emerald-400 font-bold';

  return (
    <div
      onClick={onClick}
      className={`relative bg-[#18261a]/80 rounded-xl border border-emerald-800/40 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-700/60 hover:bg-[#18261a] hover:-translate-y-0.5 hover:shadow-emerald-900/30 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/60">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-emerald-200/50">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 shadow-sm ${iconBg} ${iconColor}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(trend || badgeText) && (
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-white/10">
          {trend && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${trendColors}`}
            >
              {trend}
            </span>
          )}
          {badgeText && (
            <span className="text-xs text-emerald-300/50">{badgeText}</span>
          )}
        </div>
      )}
    </div>
  );
};
