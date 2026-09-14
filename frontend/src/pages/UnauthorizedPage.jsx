import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { currentUser, theme } = useApp() || {};
  const isDark = theme === 'dark';

  const handleReturnToDashboard = () => {
    if (currentUser?.defaultRoute) {
      navigate(currentUser.defaultRoute);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-6 text-center ${
      isDark ? 'bg-[#09110b] text-white' : 'bg-[#eddfc5] text-slate-900'
    }`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <h1 className="text-3xl font-black tracking-tight mb-2">Access Restricted</h1>
      <p className={`max-w-md text-sm mb-6 ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
        Your current active role <span className="font-bold text-amber-400">({currentUser?.title || 'User'})</span> does not have authorization to view this operational portal.
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleReturnToDashboard}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Return to My Assigned Portal
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
