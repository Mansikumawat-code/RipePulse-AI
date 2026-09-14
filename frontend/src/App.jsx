import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/app/AppShell';
import { RequireRole } from './components/auth/RequireRole';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { OverviewPage } from './pages/OverviewPage';
import { BatchesPage } from './pages/BatchesPage';
import { AddBatchPage } from './pages/AddBatchPage';
import { BatchDetailsPage } from './pages/BatchDetailsPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { DispatchPage } from './pages/DispatchPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { InquiriesPage } from './pages/InquiriesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReceiverDashboardPage } from './pages/receiver/ReceiverDashboardPage';
import { IncomingShipmentsPage } from './pages/receiver/IncomingShipmentsPage';
import { SupplyChainWorkflowPage } from './pages/SupplyChainWorkflowPage';

const Shell = ({ children }) => <AppShell>{children}</AppShell>;

const DefaultRoleRedirect = () => {
  const { currentUser } = useApp() || {};
  const target = currentUser?.defaultRoute || '/warehouse/overview';
  return <Navigate to={target} replace />;
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Role Landing Dispatcher */}
          <Route path="/dashboard" element={<DefaultRoleRedirect />} />
          <Route path="/overview" element={<DefaultRoleRedirect />} />

          {/* 1. WAREHOUSE MANAGER PORTAL (/warehouse/*) */}
          <Route
            path="/warehouse/overview"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><OverviewPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/batches/new"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><AddBatchPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/batches/:id"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><BatchDetailsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/batches"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><BatchesPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/live"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><LiveMonitoringPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/alerts"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><AlertsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/settings"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><SettingsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/warehouse/profile"
            element={
              <RequireRole allowedRoles={['WAREHOUSE_MANAGER', 'ADMIN']}>
                <Shell><ProfilePage /></Shell>
              </RequireRole>
            }
          />

          {/* 2. SUPPLY CHAIN MANAGER PORTAL (/supply-chain/*) */}
          <Route
            path="/supply-chain/overview"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><OverviewPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/decisions"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><DecisionsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/dispatch"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><DispatchPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/workflow"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><SupplyChainWorkflowPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/alerts"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><AlertsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/settings"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><SettingsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/supply-chain/profile"
            element={
              <RequireRole allowedRoles={['SUPPLY_CHAIN_MANAGER', 'ADMIN']}>
                <Shell><ProfilePage /></Shell>
              </RequireRole>
            }
          />

          {/* 3. ADMIN PORTAL (/admin/*) */}
          <Route
            path="/admin/overview"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><OverviewPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><BatchesPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/batches/:id"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><BatchDetailsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/decisions"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><DecisionsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/dispatch"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><DispatchPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><AlertsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/inquiries"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><InquiriesPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><AuditLogsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><SettingsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <Shell><ProfilePage /></Shell>
              </RequireRole>
            }
          />

          {/* 4. DESTINATION RECEIVER PORTAL (/destination/*) */}
          <Route
            path="/destination/overview"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><ReceiverDashboardPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/destination/shipments"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><IncomingShipmentsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/destination/dispatch"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><IncomingShipmentsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/destination/alerts"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><AlertsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/destination/settings"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><SettingsPage /></Shell>
              </RequireRole>
            }
          />
          <Route
            path="/destination/profile"
            element={
              <RequireRole allowedRoles={['DESTINATION_RECEIVER', 'ADMIN']}>
                <Shell><ProfilePage /></Shell>
              </RequireRole>
            }
          />

          {/* Backwards Compatible Route Fallbacks */}
          <Route path="/batches/new" element={<Navigate to="/warehouse/batches/new" replace />} />
          <Route path="/batches/:id" element={<Navigate to="/warehouse/batches" replace />} />
          <Route path="/batches" element={<Navigate to="/warehouse/batches" replace />} />
          <Route path="/live" element={<Navigate to="/warehouse/live" replace />} />
          <Route path="/decisions" element={<Navigate to="/supply-chain/decisions" replace />} />
          <Route path="/dispatch" element={<Navigate to="/supply-chain/dispatch" replace />} />
          <Route path="/alerts" element={<Navigate to="/warehouse/alerts" replace />} />
          <Route path="/inquiries" element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
          <Route path="/settings" element={<Navigate to="/warehouse/settings" replace />} />
          <Route path="/profile" element={<Navigate to="/warehouse/profile" replace />} />

          {/* Catch-all Wildcard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
