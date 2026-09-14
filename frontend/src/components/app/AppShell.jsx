import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';
import { ToastNotification } from '../common/ToastNotification';
import { ParticleBackground } from '../common/ParticleBackground';
import { WaveBackground } from '../common/WaveBackground';
import { FloatingProduce } from '../common/FloatingProduce';

export const AppShell = ({ children }) => {
  const { theme = 'dark' } = useApp() || {};
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative flex min-h-screen flex-col font-sans antialiased ${
        isDark ? 'bg-[#060d07] text-slate-100' : 'bg-[#e8dcc8] text-slate-800'
      }`}
    >
      {isDark ? <ParticleBackground /> : <WaveBackground />}
      <FloatingProduce isStable theme={theme} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppNavbar />
        <ToastNotification />
        <div className="flex min-h-0 flex-1">
          <AppSidebar />
          <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
