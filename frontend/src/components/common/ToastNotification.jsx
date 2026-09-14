import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastNotification = () => {
  const { notification } = useApp();
  if (!notification) return null;

  const type = notification.type;
  const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertTriangle : type === 'error' ? XCircle : Info;
  const tone =
    type === 'success'
      ? 'text-emerald-400 bg-emerald-900/50'
      : type === 'warning'
        ? 'text-amber-400 bg-amber-900/40'
        : type === 'error'
          ? 'text-rose-400 bg-rose-900/40'
          : 'text-sky-400 bg-sky-900/40';

  return (
    <div className="fixed top-20 right-6 z-50">
      <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-800/50 bg-[#18261a] p-4 shadow-2xl">
        <div className={`rounded-lg p-1.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{notification.title}</h4>
          <p className="mt-0.5 text-xs leading-snug text-emerald-200/60">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};
