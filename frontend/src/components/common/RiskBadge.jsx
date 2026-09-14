import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Flame } from 'lucide-react';

const CONFIG = {
  LOW: {
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    icon: CheckCircle2,
    label: 'LOW',
  },
  MEDIUM: {
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    icon: AlertCircle,
    label: 'MEDIUM',
  },
  HIGH: {
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    icon: AlertTriangle,
    label: 'HIGH',
  },
  CRITICAL: {
    className: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
    icon: Flame,
    label: 'CRITICAL',
  },
};

export const RiskBadge = ({ level = 'LOW', size = 'md', showIcon = true }) => {
  const config = CONFIG[level] || CONFIG.LOW;
  const Icon = config.icon;
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-bold tracking-wide ${config.className} ${sizes[size] || sizes.md}`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
};
