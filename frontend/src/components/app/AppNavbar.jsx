import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Leaf, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConnectionStatus } from '../common/ConnectionStatus';

export const AppNavbar = () => {
  const navigate = useNavigate();
  const {
    alerts = [],
    currentUser,
    logoutUser,
    switchRole,
    USER_ROLES = {},
    theme = 'dark',
    toggleTheme,
    connectionStatus,
  } = useApp() || {};

  const isDark = theme === 'dark';
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const unresolvedAlerts = alerts.filter((a) => a.status === 'UNRESOLVED');

  // Role-scoped route helpers
  const roleId = currentUser?.id || 'WAREHOUSE_MANAGER';
  const alertRoute = roleId === 'SUPPLY_CHAIN_MANAGER' ? '/supply-chain/alerts'
    : roleId === 'ADMIN' ? '/admin/alerts'
    : roleId === 'DESTINATION_RECEIVER' ? '/destination/shipments'
    : '/warehouse/alerts';
  const profileRoute = roleId === 'SUPPLY_CHAIN_MANAGER' ? '/supply-chain/profile'
    : roleId === 'ADMIN' ? '/admin/profile'
    : roleId === 'DESTINATION_RECEIVER' ? '/destination/profile'
    : '/warehouse/profile';
  const homeRoute = currentUser?.defaultRoute || '/warehouse/overview';

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        isDark ? 'border-emerald-900/60 bg-[#111c12]/95' : 'border-[#c9a87a] bg-[#eddfc5]/95'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to={homeRoute} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950">
            <Leaf className="h-5 w-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>RipePulse</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className={`hidden text-[10px] font-medium sm:block ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
              Predict. Prioritize. Prevent Produce Waste.
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ConnectionStatus status={connectionStatus} />

          <Link
            to={alertRoute}
            className={`relative rounded-xl p-2 ${isDark ? 'text-emerald-300/70 hover:bg-white/5' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Bell className="h-4 w-4" />
            {unresolvedAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                {unresolvedAlerts.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-xl border p-2 ${isDark ? 'border-emerald-800/60 text-amber-300' : 'border-slate-200 text-slate-600'}`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-2 rounded-xl border py-1.5 pr-2.5 pl-2 ${
                isDark ? 'border-emerald-800/60 bg-white/5' : 'border-slate-200 bg-white/40'
              }`}
            >
              <span>{currentUser?.icon || '👤'}</span>
              <div className="hidden text-left sm:block">
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</p>
                <p className="text-[10px] font-semibold text-emerald-500">{currentUser?.title}</p>
              </div>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isUserMenuOpen && (
              <div
                className={`absolute right-0 z-50 mt-2 w-56 rounded-2xl border p-2 shadow-2xl ${
                  isDark ? 'border-emerald-800/50 bg-[#18261a]' : 'border-[#c9a87a] bg-[#eddfc5]'
                }`}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <Link
                  to={profileRoute}
                  onClick={() => setIsUserMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-xs font-semibold ${isDark ? 'text-emerald-200 hover:bg-white/5' : 'text-slate-700 hover:bg-white/50'}`}
                >
                  My Profile
                </Link>
                {Object.values(USER_ROLES).map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      switchRole(role.id);
                      setIsUserMenuOpen(false);
                      if (role.defaultRoute) {
                        navigate(role.defaultRoute);
                      }
                    }}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-xs ${
                      currentUser?.id === role.id
                        ? 'font-bold text-emerald-400'
                        : isDark
                          ? 'text-emerald-200/70'
                          : 'text-slate-600'
                    }`}
                  >
                    {role.icon} {role.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
