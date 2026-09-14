import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LogOut, Mail, Building2, Zap, Shield, BarChart2,
  Clock, Truck, Boxes, CheckCircle2, AlertTriangle, Users,
} from 'lucide-react';
import { formatKg, parseRecoveredValue, needsAction } from '../utils/format';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, logoutUser, batches = [], dispatches = [], alerts = [], theme = 'dark', USER_ROLES = {}, switchRole } = useApp();
  const isDark = theme === 'dark';

  const roleId = currentUser?.id || 'WAREHOUSE_MANAGER';

  // Role-specific computed stats
  const actionable  = batches.filter(needsAction).length;
  const critical    = batches.filter((b) => b.riskLevel === 'CRITICAL').length;
  const activeDisp  = dispatches.filter((d) => d.status !== 'DELIVERED').length;
  const delivered   = dispatches.filter((d) => d.status === 'DELIVERED').length;
  const wasteKg     = dispatches.reduce((s, d) => s + (Number(d.wasteAvoidedKg) || 0), 0);
  const recovered   = dispatches.reduce((s, d) => s + parseRecoveredValue(d.recoveredValue), 0);
  const unresolved  = alerts.filter((a) => a.status === 'UNRESOLVED').length;

  const roleStats = {
    WAREHOUSE_MANAGER: [
      { icon: Boxes,         label: 'Batches Managed',  value: batches.length },
      { icon: AlertTriangle, label: 'Critical Batches', value: critical, highlight: critical > 0 },
      { icon: AlertTriangle, label: 'Unresolved Alerts',value: unresolved, highlight: unresolved > 0 },
      { icon: Zap,           label: 'Needs Action',     value: actionable, highlight: actionable > 0 },
    ],
    SUPPLY_CHAIN_MANAGER: [
      { icon: Truck,         label: 'Active Dispatches', value: activeDisp },
      { icon: CheckCircle2,  label: 'Delivered',         value: delivered },
      { icon: Zap,           label: 'Pending Reroutes',  value: actionable, highlight: actionable > 0 },
      { icon: BarChart2,     label: 'Waste Prevented',   value: formatKg(wasteKg) || '—' },
    ],
    ADMIN: [
      { icon: Boxes,         label: 'Total Batches',    value: batches.length },
      { icon: Truck,         label: 'Total Dispatches', value: dispatches.length },
      { icon: AlertTriangle, label: 'Unresolved Alerts',value: unresolved, highlight: unresolved > 0 },
      { icon: BarChart2,     label: 'Value Recovered',  value: recovered ? `₹${Math.round(recovered / 1000)}K` : '—' },
    ],
    DESTINATION_RECEIVER: [
      { icon: Truck,         label: 'Total Shipments',  value: dispatches.length },
      { icon: CheckCircle2,  label: 'Accepted',         value: dispatches.filter(d => d.status === 'ACCEPTED').length },
      { icon: AlertTriangle, label: 'Pending Intake',   value: dispatches.filter(d => ['IN_TRANSIT','DISPATCHED','ARRIVED'].includes(d.status)).length, highlight: true },
      { icon: BarChart2,     label: 'Kg Received',      value: formatKg(wasteKg) || '—' },
    ],
  };

  const stats = roleStats[roleId] || roleStats.WAREHOUSE_MANAGER;

  const roleColors = {
    WAREHOUSE_MANAGER:    { ring: 'ring-emerald-500',  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    SUPPLY_CHAIN_MANAGER: { ring: 'ring-indigo-500',   badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    ADMIN:                { ring: 'ring-purple-500',   badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    DESTINATION_RECEIVER: { ring: 'ring-amber-500',    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  };
  const colors = roleColors[roleId] || roleColors.WAREHOUSE_MANAGER;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Header Card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-emerald-800/40 bg-[#18261a]/80' : 'border-emerald-200 bg-white/80'}`}>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl ring-2 ${colors.ring} ${isDark ? 'bg-[#0c1610]' : 'bg-white'}`}>
            {currentUser?.icon || '👤'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name || 'Operator'}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${colors.badge}`}>
                {currentUser?.title}
              </span>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-200/60">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{currentUser?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200/60">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{currentUser?.facility}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-200/50 mt-2">
                <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                <span>{currentUser?.focus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex items-center gap-3 pt-4 border-t border-white/8">
          <button
            type="button"
            onClick={() => { logoutUser(); navigate('/login'); }}
            className="flex items-center gap-2 rounded-xl border border-rose-700/50 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
          <span className={`text-[10px] ${isDark ? 'text-emerald-200/30' : 'text-slate-400'}`}>
            Session active · Indore Region
          </span>
        </div>
      </div>

      {/* Role Stats Grid */}
      <div className={`rounded-2xl border p-5 ${isDark ? 'border-emerald-800/40 bg-[#18261a]/80' : 'border-emerald-200 bg-white/80'}`}>
        <h2 className={`text-xs font-black uppercase tracking-wider mb-4 ${isDark ? 'text-emerald-300/60' : 'text-slate-400'}`}>
          Your Operational Statistics
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl border p-4 ${
                stat.highlight
                  ? isDark ? 'border-amber-800/40 bg-amber-900/20' : 'border-amber-200 bg-amber-50'
                  : isDark ? 'border-emerald-800/30 bg-black/20' : 'border-slate-100 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300/40' : 'text-slate-400'}`}>
                    {stat.label}
                  </p>
                  <Icon className={`h-3.5 w-3.5 ${stat.highlight ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <p className={`text-2xl font-black ${stat.highlight ? 'text-amber-300' : isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch Role Panel */}
      <div className={`rounded-2xl border p-5 ${isDark ? 'border-emerald-800/40 bg-[#18261a]/80' : 'border-emerald-200 bg-white/80'}`}>
        <h2 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-emerald-300/60' : 'text-slate-400'}`}>
          <Users className="inline h-3.5 w-3.5 mr-1.5" />Switch Role (Demo)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(USER_ROLES).map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                switchRole(role.id);
                navigate(role.defaultRoute);
              }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                currentUser?.id === role.id
                  ? isDark ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : isDark ? 'border-white/10 text-emerald-200/60 hover:border-emerald-700/50 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{role.icon}</span>
              <div>
                <p className="font-bold leading-tight">{role.title}</p>
                <p className="text-[10px] opacity-60 truncate">{role.facility}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
