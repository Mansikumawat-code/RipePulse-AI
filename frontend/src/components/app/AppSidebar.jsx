import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Radio,
  Compass,
  Route,
  Truck,
  Bell,
  Sliders,
  UserCircle2,
  Inbox,
  PackageCheck,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { needsAction, formatKg, parseRecoveredValue } from '../../utils/format';

export const AppSidebar = () => {
  const { batches = [], alerts = [], dispatches = [], theme, currentUser } = useApp() || {};
  const isDark = theme === 'dark';
  const actionCount = batches.filter(needsAction).length;
  const unresolved = alerts.filter((a) => a.status === 'UNRESOLVED').length;
  const activeDispatch = dispatches.filter((d) => d.status !== 'DELIVERED').length;
  const wasteKg = dispatches.reduce((sum, d) => sum + (Number(d.wasteAvoidedKg) || 0), 0);
  const recovered = dispatches.reduce((sum, d) => sum + parseRecoveredValue(d.recoveredValue), 0);

  let pendingInquiries = 0;
  try {
    const rawInq = localStorage.getItem('ripepulse_assessment_inquiries');
    if (rawInq) {
      const parsed = JSON.parse(rawInq);
      pendingInquiries = parsed.filter((i) => i.status === 'NEW').length;
    }
  } catch (e) {}

  const roleId = currentUser?.id || 'WAREHOUSE_MANAGER';

  // Role-specific navigation definitions
  const roleMenus = {
    WAREHOUSE_MANAGER: {
      main: [
        { to: '/warehouse/overview', label: 'Warehouse Overview', icon: LayoutDashboard, badge: null },
        { to: '/warehouse/batches', label: 'Batch Inventory', icon: Boxes, badge: batches.length || null },
        { to: '/warehouse/live', label: 'IoT Chamber Telemetry', icon: Radio, badge: null },
      ],
      more: [
        { to: '/warehouse/alerts', label: 'Chamber Alerts', icon: Bell, badge: unresolved || null },
        { to: '/warehouse/settings', label: 'Settings', icon: Sliders, badge: null },
        { to: '/warehouse/profile', label: 'Profile', icon: UserCircle2, badge: null },
      ]
    },
    SUPPLY_CHAIN_MANAGER: {
      main: [
        { to: '/supply-chain/overview', label: 'Supply Chain Command', icon: LayoutDashboard, badge: null },
          { to: '/supply-chain/workflow', label: 'Dispatch Control Center', icon: Route, badge: actionCount || null },
        { to: '/supply-chain/decisions', label: 'Reroute Decisions', icon: Compass, badge: actionCount || null },
        { to: '/supply-chain/dispatch', label: 'Active Dispatches', icon: Truck, badge: activeDispatch || null },
      ],
      more: [
        { to: '/supply-chain/alerts', label: 'Transit Alerts', icon: Bell, badge: unresolved || null },
        { to: '/supply-chain/settings', label: 'Settings', icon: Sliders, badge: null },
        { to: '/supply-chain/profile', label: 'Profile', icon: UserCircle2, badge: null },
      ]
    },
    ADMIN: {
      main: [
        { to: '/admin/overview', label: 'Global System Overview', icon: LayoutDashboard, badge: null },
        { to: '/admin/batches', label: 'All Batches', icon: Boxes, badge: batches.length || null },
        { to: '/admin/decisions', label: 'Rerouting Hub', icon: Compass, badge: actionCount || null },
        { to: '/admin/dispatch', label: 'Global Dispatches', icon: Truck, badge: activeDispatch || null },
      ],
      more: [
        { to: '/admin/alerts', label: 'System Alerts', icon: Bell, badge: unresolved || null },
        { to: '/admin/inquiries', label: 'Integration Inquiries', icon: Inbox, badge: pendingInquiries || null, badgeColor: 'bg-emerald-500' },
        { to: '/admin/audit-logs', label: 'System Audit Logs', icon: History, badge: null },
        { to: '/admin/settings', label: 'Settings', icon: Sliders, badge: null },
        { to: '/admin/profile', label: 'Profile', icon: UserCircle2, badge: null },
      ]
    },
    DESTINATION_RECEIVER: {
      main: [
        { to: '/destination/overview', label: 'Receiving Dashboard', icon: PackageCheck, badge: activeDispatch || null },
        { to: '/destination/shipments', label: 'Incoming Shipments', icon: Truck, badge: null },
      ],
      more: [
        { to: '/destination/alerts', label: 'Transit Alerts', icon: Bell, badge: unresolved || null },
        { to: '/destination/settings', label: 'Settings', icon: Sliders, badge: null },
        { to: '/destination/profile', label: 'Receiver Profile', icon: UserCircle2, badge: null },
      ]
    }
  };

  const currentMenu = roleMenus[roleId] || roleMenus.WAREHOUSE_MANAGER;

  const linkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? isDark
          ? 'bg-emerald-900/60 text-white border border-emerald-700/50'
          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
        : isDark
          ? 'text-emerald-200/70 hover:bg-white/5 hover:text-white border border-transparent'
          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 border border-transparent'
    }`;

  return (
    <aside
      className={`flex w-60 shrink-0 flex-col border-r p-4 ${
        isDark ? 'border-emerald-900/50 bg-[#0c1610]' : 'border-[#c9a87a] bg-[#eddfc5]'
      }`}
    >
      <div className="mb-3 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Active View</span>
        <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser?.title}</p>
      </div>

      <p className={`mb-2 px-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400/50' : 'text-slate-400'}`}>
        Operational Menu
      </p>
      <nav className="space-y-1">
        {currentMenu.main.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge != null && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {currentMenu.more && currentMenu.more.length > 0 && (
        <>
          <p className={`mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400/50' : 'text-slate-400'}`}>
            System
          </p>
          <nav className="space-y-1">
            {currentMenu.more.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge != null && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </>
      )}

      <div className={`mt-auto rounded-xl border p-3.5 ${isDark ? 'border-emerald-800/40 bg-emerald-950/40' : 'border-emerald-200 bg-white/50'}`}>
        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Indore Regional Impact</p>
        <p className={`mt-1 text-[11px] ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          Waste prevented: <span className="font-bold text-emerald-500">{formatKg(wasteKg) || '—'}</span>
        </p>
        <p className={`text-[11px] ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
          Recovered Value: <span className="font-bold text-emerald-500">{recovered ? `₹${recovered.toLocaleString()}` : '—'}</span>
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
