import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  title = 'NO DATA AVAILABLE',
  message = 'Waiting for live data from the backend.',
  icon: Icon = Inbox,
  action = null,
}) => (
  <div className="rounded-2xl border border-emerald-900/40 bg-[#18261a]/60 px-6 py-12 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-emerald-400/70">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-sm font-black tracking-wide text-white">{title}</h3>
    <p className="mt-1 text-sm text-emerald-200/60">{message}</p>
    {action}
  </div>
);

export const LoadingState = ({ label = 'Loading…' }) => (
  <div className="rounded-2xl border border-emerald-900/40 bg-[#18261a]/60 px-6 py-12 text-center text-sm font-semibold text-emerald-200/70">
    {label}
  </div>
);

export const ErrorState = ({ title = 'Backend Offline', message, onRetry }) => (
  <div className="rounded-2xl border border-rose-800/50 bg-rose-950/30 px-6 py-10 text-center">
    <h3 className="text-sm font-black text-rose-300">{title}</h3>
    <p className="mt-1 text-sm text-rose-200/70">{message || 'Could not reach the RipePulse API.'}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400"
      >
        Retry
      </button>
    )}
  </div>
);
