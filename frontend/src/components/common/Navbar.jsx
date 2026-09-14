import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Bell, 
  MapPin, 
  RotateCcw, 
  ChevronRight,
  Leaf,
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const { 
    alerts = [], 
    currentDemoStep, 
    advanceDemoStep,
    setDemoStepDirectly,
    warehouses = [],
    currentUser,
    logoutUser,
    switchRole,
    USER_ROLES = {},
    theme = 'dark',
    toggleTheme
  } = useApp() || {};

  const isDark = theme === 'dark';

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const unresolvedAlerts = alerts.filter(a => a.status === 'UNRESOLVED');
  const activeWarehouse = warehouses[0];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-lg transition-colors duration-300 ${
      isDark
        ? 'bg-[#111c12]/95 border-emerald-900/60 shadow-black/20'
        : 'bg-[#eddfc5]/95 border-[#c9a87a] shadow-[#b8956a]/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105 group-hover:rotate-6">
                <Leaf className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-black tracking-tight ${ isDark ? 'text-white' : 'text-slate-900' }`}>RipePulse</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30">AI</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Interactive Workflow Stepper */}
          <div className={`flex items-center gap-2 border rounded-full px-3 py-1 shadow-inner transition-colors duration-300 ${ isDark ? 'bg-emerald-950/60 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200' }`}>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span className={`text-[11px] font-medium hidden md:inline ${ isDark ? 'text-emerald-200/80' : 'text-emerald-700/80' }`}>Demo Workflow:</span>
            </div>
            <button
              onClick={advanceDemoStep}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow transition-all active:scale-95"
              title="Advance Demo Simulation"
            >
              <span className="truncate max-w-[150px]">{currentDemoStep.badge}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDemoStepDirectly(0)}
              className="text-emerald-400/60 hover:text-emerald-300 p-0.5 rounded-full transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Zone 3: Facility Info, Alerts & User Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Public Landing Link */}
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${ isDark ? 'border-emerald-800/60 text-emerald-300/70 hover:text-white hover:bg-white/5' : 'border-emerald-200 text-emerald-700/80 hover:text-emerald-900 hover:bg-emerald-50' }`}
              title="Public Landing Page"
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Landing</span>
            </Link>

            {/* Facility Selector */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors duration-300 ${ isDark ? 'bg-white/5 border-emerald-800/40 text-emerald-200/70' : 'bg-slate-100 border-slate-200 text-slate-600' }`}>
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate max-w-[130px] font-semibold">{activeWarehouse.name}</span>
            </div>

            {/* Alerts Pill */}
            <Link
              to="/alerts"
              className={`relative p-2 rounded-xl transition-colors border border-transparent ${ isDark ? 'text-emerald-300/70 hover:text-white hover:bg-white/5 hover:border-emerald-800/40' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200' }`}
              title="Active Alerts"
            >
              <Bell className="w-4 h-4" />
              {unresolvedAlerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow animate-pulse">
                  {unresolvedAlerts.length}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`relative p-2 rounded-xl border transition-all duration-300 group ${ isDark ? 'border-emerald-800/60 bg-white/5 text-amber-300 hover:bg-amber-400/10 hover:border-amber-500/40' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700' }`}
            >
              <span className="relative flex items-center justify-center w-4 h-4 overflow-hidden">
                <Sun
                  className={`absolute w-4 h-4 transition-all duration-300 ${ isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50' }`}
                />
                <Moon
                  className={`absolute w-4 h-4 transition-all duration-300 ${ isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100' }`}
                />
              </span>
            </button>

            {/* User Profile & Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border text-left transition-all ${ isDark ? 'border-emerald-800/60 hover:border-emerald-600/60 bg-white/5 hover:bg-white/10' : 'border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50' }`}
              >
                <span className="text-base">{currentUser?.icon || '👤'}</span>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold leading-tight ${ isDark ? 'text-white' : 'text-slate-900' }`}>
                      {currentUser?.name || 'User'}
                    </span>
                    <ChevronDown className={`w-3 h-3 ${ isDark ? 'text-emerald-400/60' : 'text-slate-400' }`} />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 block -mt-0.5">
                    {currentUser?.title || 'Manager'}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 transition-colors duration-300 ${ isDark ? 'bg-[#18261a] border-emerald-800/50 shadow-black/50' : 'bg-[#eddfc5] border-[#c9a87a] shadow-[#b8956a]/30' }`}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className={`px-3 py-2 border-b ${ isDark ? 'border-emerald-900/60' : 'border-slate-100' }`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${ isDark ? 'text-emerald-400/60' : 'text-slate-400' }`}>Signed in as</p>
                    <p className={`text-xs font-extrabold mt-0.5 ${ isDark ? 'text-white' : 'text-slate-900' }`}>{currentUser?.name}</p>
                    <span className={`text-[10px] font-mono ${ isDark ? 'text-emerald-300/50' : 'text-slate-400' }`}>{currentUser?.email}</span>
                  </div>

                  <div className="py-2">
                    <p className={`px-3 text-[10px] font-bold uppercase tracking-wider mb-1 ${ isDark ? 'text-emerald-400/50' : 'text-slate-400' }`}>
                      Switch Role View
                    </p>
                    {Object.values(USER_ROLES).map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          switchRole(role.id);
                          setIsUserMenuOpen(false);
                          if (role.defaultRoute) navigate(role.defaultRoute);
                        }}
                        className={`w-full px-3 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          currentUser?.id === role.id 
                            ? isDark
                              ? 'bg-emerald-900/60 text-emerald-200 font-bold border border-emerald-700/50'
                              : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                            : isDark
                              ? 'text-emerald-200/60 hover:bg-white/5 hover:text-white'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          <span>{role.title}</span>
                        </span>
                        {currentUser?.id === role.id && (
                          <span className="text-[10px] text-emerald-500 font-black">✓ Active</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className={`pt-2 border-t ${ isDark ? 'border-emerald-900/60' : 'border-slate-100' }`}>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
