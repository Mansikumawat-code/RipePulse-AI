import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { batchService } from '../services/batchService';
import { telemetryService } from '../services/telemetryService';
import { routingService } from '../services/routingService';
import { destinationService } from '../services/destinationService';
import { alertService } from '../services/alertService';
import { receiverService } from '../services/receiverService';
import { checkApiHealth, resolveWsUrl, apiClient } from '../services/api';

const AppContext = createContext();

export const USER_ROLES = {
  WAREHOUSE_MANAGER: {
    id: 'WAREHOUSE_MANAGER',
    title: 'Warehouse Manager',
    icon: '🏢',
    name: 'Elena Vance',
    email: 'elena.vance@ripepulse.ai',
    facility: 'Indore Central Cold-Storage Hub',
    focus: 'Inventory, Batches, Chambers & IoT Telemetry',
    defaultRoute: '/warehouse/overview',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  SUPPLY_CHAIN_MANAGER: {
    id: 'SUPPLY_CHAIN_MANAGER',
    title: 'Supply Chain Manager',
    icon: '🚛',
    name: 'Marcus Chen',
    email: 'marcus.chen@ripepulse.ai',
    facility: 'Indore Regional Logistics Operations',
    focus: 'Route Feasibility, Alternative Destinations & Rerouting',
    defaultRoute: '/supply-chain/overview',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  ADMIN: {
    id: 'ADMIN',
    title: 'System Admin',
    icon: '🛡️',
    name: 'Dr. Maya Lin',
    email: 'admin@ripepulse.ai',
    facility: 'RipePulse Command Center',
    focus: 'Full System Oversight, AI Kinetics & Configuration',
    defaultRoute: '/admin/overview',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  DESTINATION_RECEIVER: {
    id: 'DESTINATION_RECEIVER',
    title: 'Destination Receiver',
    icon: '🏬',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@ripepulse.ai',
    facility: 'Vijay Nagar Wholesale Hub, Indore',
    focus: 'Shipment Inspection, Quality Verification & Intake Acceptance',
    defaultRoute: '/destination/overview',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  }
};

const LIVE_WINDOW_MS = 15000;

export const AppProvider = ({ children }) => {
  const [batches, setBatches] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [riskSummary, setRiskSummary] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [liveTelemetrySeries, setLiveTelemetrySeries] = useState([]);
  const [lastPrediction, setLastPrediction] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(null);
  const [health, setHealth] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [lastLiveAt, setLastLiveAt] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isAutoSensorActive, setIsAutoSensorActive] = useState(false);
  const [simStatus, setSimStatus] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('harvestiq_user_role') || localStorage.getItem('ripepulse_user_role');
    return USER_ROLES[saved] || USER_ROLES.WAREHOUSE_MANAGER;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [notification, setNotification] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('ripepulse_theme') || localStorage.getItem('harvestiq_theme') || 'dark');

  const selectedBatchIdRef = useRef(selectedBatchId);
  selectedBatchIdRef.current = selectedBatchId;

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ripepulse_theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ripepulse_user_role', currentUser.id);
      localStorage.setItem('harvestiq_user_role', currentUser.id);
      localStorage.setItem('ripepulse_user_name', currentUser.name || '');
      localStorage.setItem('harvestiq_user_name', currentUser.name || '');
    }
  }, [currentUser]);

  const showNotification = useCallback((title, message, type = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#10B981', '#059669', '#34D399', '#F59E0B']
      });
    } catch {
      /* ignore */
    }
  }, []);

  const markLive = useCallback(() => {
    setLastLiveAt(Date.now());
  }, []);

  const applyTelemetryPayload = useCallback((data) => {
    if (!data) return;
    if (data.scenario) setActiveScenario(data.scenario);
    markLive();

    setBatches((prev) => prev.map((b) => {
      if (b.id !== data.batchId) return b;
      return {
        ...b,
        currentTemp: data.temperature,
        currentHumidity: data.humidity,
        currentVoc: data.voc,
        sli: data.sli,
        remainingShelfLifeHours: data.remainingShelfLifeHours,
        riskLevel: data.riskLevel,
        confidenceScore: data.confidenceScore ?? b.confidenceScore,
        decayRateFactor: data.explainability?.decay_rate_factor ?? b.decayRateFactor,
        currentRoute: {
          ...(b.currentRoute || {}),
          isFeasible: data.isRouteFeasible
        },
        recommendedAction: data.recommendedAction || b.recommendedAction,
        lastTelemetryAt: data.timestamp,
        explainability: data.explainability || b.explainability
      };
    }));

    if (data.batchId === selectedBatchIdRef.current) {
      setLastPrediction({
        remainingShelfLifeHours: data.remainingShelfLifeHours,
        remainingShelfLifeDays: data.remainingShelfLifeDays,
        sli: data.sli,
        riskLevel: data.riskLevel,
        confidenceScore: data.confidenceScore,
        timestamp: data.timestamp,
        explainability: data.explainability
      });

      setLiveTelemetrySeries((prev) => {
        const newPoint = {
          time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          voc: data.voc,
          sli: data.sli,
          decayAcceleration: data.explainability?.decay_rate_factor
        };
        const next = [...prev, newPoint];
        return next.slice(-48);
      });
    }
  }, [markLive]);

  const refreshData = useCallback(async () => {
    try {
      const [backendBatches, backendDestinations, backendDispatches, backendAlerts, summary] = await Promise.all([
        batchService.getAllBatches(),
        destinationService.getAlternativeDestinations(),
        routingService.getDispatches(),
        alertService.getAllAlerts(),
        alertService.getRiskSummary().catch(() => null)
      ]);

      setBatches(Array.isArray(backendBatches) ? backendBatches : []);
      setDestinations(Array.isArray(backendDestinations) ? backendDestinations : []);
      setDispatches(Array.isArray(backendDispatches) ? backendDispatches : []);
      setAlerts(Array.isArray(backendAlerts) ? backendAlerts : []);
      setRiskSummary(summary);
      setBackendOnline(true);
      setErrorMessage(null);
      return true;
    } catch (err) {
      setBackendOnline(false);
      setErrorMessage(err?.message || 'Backend is offline.');
      return false;
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await checkApiHealth();
      setHealth(h);
      setBackendOnline(true);
    } catch {
      setHealth(null);
      setBackendOnline(false);
    }
  }, []);

  const loadTelemetryForBatch = useCallback(async (batchId) => {
    if (!batchId) {
      setLiveTelemetrySeries([]);
      setLastPrediction(null);
      return;
    }
    try {
      const series = await telemetryService.getBatchTelemetry(batchId);
      const points = Array.isArray(series) ? series : [];
      setLiveTelemetrySeries(points);
      if (points.length > 0) {
        const last = points[points.length - 1];
        if (last.timestamp) {
          const ts = new Date(last.timestamp).getTime();
          if (!Number.isNaN(ts) && Date.now() - ts < LIVE_WINDOW_MS) {
            setLastLiveAt(ts);
          }
        }
      }
    } catch {
      setLiveTelemetrySeries([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setDataLoading(true);
      await refreshHealth();
      await refreshData();
      if (mounted) setDataLoading(false);
    })();
    return () => { mounted = false; };
  }, [refreshData, refreshHealth]);

  useEffect(() => {
    loadTelemetryForBatch(selectedBatchId);
  }, [selectedBatchId, loadTelemetryForBatch]);

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
      if (selectedBatchIdRef.current) {
        loadTelemetryForBatch(selectedBatchIdRef.current);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshData, loadTelemetryForBatch]);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let closed = false;

    const connectWs = () => {
      if (closed) return;
      try {
        const wsUrl = resolveWsUrl();
        ws = new WebSocket(wsUrl);

        ws.onopen = () => setWsConnected(true);

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'TELEMETRY_UPDATE') {
              applyTelemetryPayload(payload);
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (!closed) reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          try { ws.close(); } catch { /* ignore */ }
        };
      } catch {
        if (!closed) reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    return () => {
      closed = true;
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [applyTelemetryPayload]);

  const loginUser = (roleId = 'WAREHOUSE_MANAGER', customDetails = null) => {
    const roleObj = USER_ROLES[roleId] || USER_ROLES.WAREHOUSE_MANAGER;
    const user = customDetails ? { ...roleObj, ...customDetails } : roleObj;
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('ripepulse_user_role', roleId);
    showNotification('Welcome back!', `Signed in as ${user.name} (${user.title}).`, 'success');
    return user;
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ripepulse_user_role');
    showNotification('Logged Out', 'You have been securely signed out.', 'info');
  };

  const switchRole = (roleId) => {
    if (USER_ROLES[roleId]) {
      setCurrentUser(USER_ROLES[roleId]);
      localStorage.setItem('ripepulse_user_role', roleId);
      showNotification('Role Switched', `Active view tailored for ${USER_ROLES[roleId].title}.`, 'info');
    }
  };

  const activeBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || null,
    [batches, selectedBatchId]
  );

  const connectionStatus = useMemo(() => {
    const recentlyLive = lastLiveAt && Date.now() - lastLiveAt < LIVE_WINDOW_MS;
    if (recentlyLive) return 'LIVE';
    if (backendOnline === false && !wsConnected) return 'DISCONNECTED';
    return 'WAITING';
  }, [lastLiveAt, backendOnline, wsConnected]);

  const simulateStress = async (batchId = selectedBatchId) => {
    if (!batchId) {
      showNotification('No batch selected', 'Select a batch before running telemetry.', 'warning');
      return null;
    }
    const res = await telemetryService.simulateStress(batchId);
    applyTelemetryPayload(res);
    return res;
  };

  const simulateRecovery = async (batchId = selectedBatchId) => {
    if (!batchId) {
      showNotification('No batch selected', 'Select a batch before running telemetry.', 'warning');
      return null;
    }
    const res = await telemetryService.simulateRecovery(batchId);
    applyTelemetryPayload(res);
    return res;
  };

  const toggleAutoSensor = async (batchId = selectedBatchId) => {
    if (!batchId) {
      showNotification('No batch selected', 'Select a batch first.', 'warning');
      return;
    }
    const res = await telemetryService.toggleTicker(batchId);
    const isRunning = res.status === 'started' || res.status === 'already_running';
    setIsAutoSensorActive(isRunning);
    setSimStatus(res);
    showNotification(
      isRunning ? 'Telemetry ticker started' : 'Telemetry ticker paused',
      isRunning ? 'Backend is streaming sensor packets.' : 'Automatic telemetry stopped.',
      'info'
    );
  };

  const simulateLiveTick = async (batchId = selectedBatchId) => {
    if (!batchId) return null;
    const res = await telemetryService.simulateStep(batchId, activeScenario || 'NORMAL');
    applyTelemetryPayload(res);
    return res;
  };

  const approveReroute = async (batchId, destinationId) => {
    if (!batchId || !destinationId) {
      throw new Error('Batch and destination are required.');
    }
    const res = await routingService.executeReroute(batchId, destinationId);
    const updatedBatch = {
      isRerouted: true,
      rerouteRequired: false,
      routeIssue: false,
      rerouteStatus: 'completed',
      recommendedAction: { status: 'APPROVED' },
    };
    setBatches((prev) => prev.map((batch) => batch.id === batchId ? { ...batch, ...updatedBatch } : batch));
    if (res.dispatch) {
      setDispatches((prev) => [res.dispatch, ...prev.filter((dispatch) => dispatch.id !== res.dispatch.id)]);
    }
    await refreshData();
    triggerConfetti();
    showNotification('Reroute confirmed', res.message || 'Dispatch created by backend.', 'success');
    return res;
  };

  const addBatch = async (newBatchData) => {
    const created = await batchService.createBatch(newBatchData);
    await refreshData();
    setSelectedBatchId(created.id);
    showNotification('Batch registered', `${created.id} is waiting for live telemetry.`, 'success');
    return created;
  };

  const acknowledgeAlert = async (alertId) => {
    await alertService.acknowledgeAlert(alertId);
    await refreshData();
    showNotification('Alert acknowledged', 'Status updated by backend.', 'info');
  };

  const resolveAlert = async (alertId) => {
    await alertService.resolveAlert(alertId);
    await refreshData();
    showNotification('Alert resolved', 'Status updated by backend.', 'success');
  };

  const verifyShipmentReceipt = async (shipmentId, payload) => {
    // Strictly invoke backend endpoint; never convert failure into fake local success
    const result = await receiverService.verifyReceipt(shipmentId, payload);
    await refreshData();
    if (result?.status === 'ACCEPTED') triggerConfetti();
    return result;
  };

  const updateDispatchStatus = async (dispatchId, newStatus, progressPct, notes) => {
    const res = await apiClient.patch(`/dispatches/${dispatchId}/status`, {
      status: newStatus,
      progressPct,
      notes
    });
    await refreshData();
    showNotification('Dispatch Status', `Shipment ${dispatchId} is now ${newStatus}.`, 'info');
    return res.data;
  };

  const simulateRouteIssue = async (dispatchId) => {
    const updated = await routingService.simulateRouteIssue(dispatchId);
    setDispatches((prev) => prev.map((dispatch) => dispatch.id === dispatchId ? updated : dispatch));
    await refreshData();
    showNotification('Demo route issue created', 'The shipment is now pending in Reroute Decisions.', 'warning');
    return updated;
  };

  const value = {
    batches,
    destinations,
    alerts,
    dispatches,
    riskSummary,
    selectedBatchId,
    setSelectedBatchId,
    activeBatch,
    lastPrediction,
    liveTelemetrySeries,
    dataLoading,
    backendOnline,
    health,
    errorMessage,
    refreshData,
    refreshHealth,
    loadTelemetryForBatch,
    approveReroute,
    addBatch,
    acknowledgeAlert,
    resolveAlert,
    verifyShipmentReceipt,
    updateDispatchStatus,
    simulateRouteIssue,
    currentUser,
    isAuthenticated,
    loginUser,
    logoutUser,
    switchRole,
    USER_ROLES,
    notification,
    showNotification,
    triggerConfetti,
    theme,
    toggleTheme,
    wsConnected,
    connectionStatus,
    lastLiveAt,
    activeScenario,
    isAutoSensorActive,
    simStatus,
    simulateStress,
    simulateRecovery,
    toggleAutoSensor,
    simulateLiveTick
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
