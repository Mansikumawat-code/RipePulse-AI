import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Radio, 
  Compass, 
  Truck,
  Bell, 
  Sliders, 
  UserCircle2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const { batches, alerts, dispatches, theme } = useApp();
  const isDark = theme === 'dark';

  const criticalCount = batches.filter(b => b.riskLevel === 'CRITICAL').length;
  const unresolvedAlertsCount = alerts.filter(a => a.status === 'UNRESOLVED').length;
  const activeDispatchesCount = dispatches.filter(d => d.status === 'IN_TRANSIT').length;

  // Only 5 primary sections — kept intentionally short so the full
  // product story (Sense -> Predict -> Assess -> Decide -> Act) fits
  // in a single glance.
  const mainNavItems = [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Status at a glance'
    },
    {
      to: '/inventory',
      label: 'Batches',
      icon: Boxes,
      badge: `${batches.length}`,
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
      desc: 'All produce batches'
    },
    {
      to: '/live',
      label: 'Live Monitor',
      icon: Radio,
      badge: criticalCount > 0 ? `${criticalCount} Critical` : null,
      badgeColor: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
      desc: 'Real-time sensors & AI'
    },
    {
      to: '/routing',
      label: 'Decisions',
      icon: Compass,
      badge: 'Action Needed',
      badgeColor: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
      desc: 'Reroute recommendations'
    },
    {
      to: '/dispatches',
      label: 'Dispatch',
      icon: Truck,
      badge: activeDispatchesCount > 0 ? `${activeDispatchesCount} Transit` : null,
      badgeColor: 'bg-teal-900/50 text-teal-300 border-teal-700/50',
      desc: 'Tracking active shipments'
    },
  ];

  const supportingNavItems = [
    {
      to: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : null,
      badgeColor: 'bg-rose-500 text-white border-rose-600',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Sliders,
      badge: null,
    },
    {
      to: '/settings',
      label: 'Profile',
      icon: UserCircle2,
      badge: null,
    },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none transition-colors duration-300 ${ isDark ? 'bg-[#0c1610] border-emerald-900/50' : 'bg-[#eddfc5] border-[#c9a87a]' }`}>
      
      {/* Primary Dashboards */}
      <div className="mb-6">
        <h3 className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-2 ${ isDark ? 'text-emerald-400/50' : 'text-slate-400' }`}>
          Main
        </h3>
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-900/60 text-white shadow border border-emerald-700/50'
                        : 'bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-200'
                      : isDark
                        ? 'text-emerald-200/60 hover:text-white hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${ isDark ? 'bg-white/5 group-hover:bg-emerald-900/40 text-emerald-300/60 group-hover:text-emerald-400' : 'bg-slate-100 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-600' }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-snug">{item.label}</span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.badgeColor || (isDark ? 'bg-white/10 text-emerald-300 border-emerald-700/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Supporting Operations */}
      <div className="mb-6">
        <h3 className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-2 ${ isDark ? 'text-emerald-400/50' : 'text-slate-400' }`}>
          More
        </h3>
        <nav className="space-y-1">
          {supportingNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-white font-bold'
                        : 'bg-slate-100 text-slate-900 font-bold'
                      : isDark
                        ? 'text-emerald-200/50 hover:text-white hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${ isDark ? 'text-emerald-400/40 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600' }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      item.badgeColor || (isDark ? 'bg-white/10 text-emerald-300 border-emerald-700/50' : 'bg-slate-100 text-slate-600 border-slate-200')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* RipePulse Waste Prevention Impact Metric */}
      <div className={`mt-auto rounded-xl p-3.5 border transition-colors duration-300 ${ isDark ? 'bg-gradient-to-br from-emerald-900/50 via-emerald-950/30 to-transparent border-emerald-800/40' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200' }`}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className={`text-xs font-bold ${ isDark ? 'text-white' : 'text-slate-800' }`}>Prevention Impact</span>
        </div>
        <p className={`text-[11px] mb-2 ${ isDark ? 'text-emerald-200/60' : 'text-slate-500' }`}>
          AI Rerouting preserved <span className="font-bold text-emerald-600">$84,300</span> in produce this month.
        </p>
        <div className={`w-full rounded-full h-1.5 overflow-hidden ${ isDark ? 'bg-white/10' : 'bg-emerald-100' }`}>
          <div className="bg-emerald-500 h-full rounded-full shadow-sm shadow-emerald-400/40" style={{ width: '84%' }}></div>
        </div>
        <span className={`text-[10px] mt-1 block ${ isDark ? 'text-emerald-400/50' : 'text-slate-400' }`}>84.3% Waste Reduction Target Met</span>
      </div>

    </aside>
  );
};
