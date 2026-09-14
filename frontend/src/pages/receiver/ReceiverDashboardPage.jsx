import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Building2, 
  PackageCheck, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  FileCheck2,
  Warehouse
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { receiverService } from '../../services/receiverService';
import { ShipmentAcceptanceModal } from '../../components/receiver/ShipmentAcceptanceModal';
import { formatKg } from '../../utils/format';

export const ReceiverDashboardPage = () => {
  const { dispatches = [], theme, currentUser } = useApp() || {};
  const isDark = theme === 'dark';

  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, AWAITING, ACCEPTED, PARTIALLY_ACCEPTED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const data = await receiverService.getShipments(currentUser?.facility);
    if (data) {
      setBackendData(data);
    }
    setLoading(false);
  }, [currentUser]);

  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const items = await receiverService.getInventory(currentUser?.facility);
      setInventory(Array.isArray(items) ? items : []);
    } catch {
      setInventory([]);
    }
    setInventoryLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchShipments();
    fetchInventory();
  }, [fetchShipments, fetchInventory]);

  // Combine dispatches from AppContext if backend endpoint is unavailable or fallback needed
  const shipmentsList = backendData?.shipments || dispatches.map((d) => ({
    id: d.id,
    batchId: d.batchId,
    produce: d.produce,
    destination: d.destination,
    status: d.status === 'DELIVERED' ? 'ACCEPTED' : (d.status || 'IN_TRANSIT'),
    carrier: d.carrier || 'Logistics Fleet',
    driverName: d.driverName || 'Driver Staff',
    driverPhone: d.driverPhone || '+91 98930 11223',
    eta: d.eta,
    progressPct: d.progressPct,
    sentWeightKg: d.wasteAvoidedKg || 5000,
    temperatureMaintained: d.temperatureMaintained,
    recoveredValue: d.recoveredValue
  }));

  // Scoped filtering
  const filteredShipments = shipmentsList.filter((s) => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.produce.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'AWAITING') return ['IN_TRANSIT', 'DISPATCHED', 'ARRIVED', 'AWAITING_VERIFICATION'].includes(s.status);
    if (activeTab === 'ACCEPTED') return s.status === 'ACCEPTED';
    if (activeTab === 'PARTIALLY_ACCEPTED') return s.status === 'PARTIALLY_ACCEPTED';
    if (activeTab === 'REJECTED') return s.status === 'REJECTED';
    return true;
  });

  // Calculate local metrics if backend metrics not available
  const totalCount = shipmentsList.length;
  const awaitingCount = shipmentsList.filter((s) => ['IN_TRANSIT', 'DISPATCHED', 'ARRIVED', 'AWAITING_VERIFICATION'].includes(s.status)).length;
  const acceptedCount = shipmentsList.filter((s) => s.status === 'ACCEPTED').length;
  const partialCount = shipmentsList.filter((s) => s.status === 'PARTIALLY_ACCEPTED').length;
  const rejectedCount = shipmentsList.filter((s) => s.status === 'REJECTED').length;
  const totalReceivedKg = shipmentsList
    .filter((s) => s.receipt)
    .reduce((sum, s) => sum + (s.receipt.receivedWeightKg || 0), 0);

  const metrics = backendData?.metrics || {
    totalShipments: totalCount,
    awaitingVerification: awaitingCount,
    accepted: acceptedCount,
    partiallyAccepted: partialCount,
    rejected: rejectedCount,
    totalReceivedKg: totalReceivedKg
  };

  const handleOpenVerify = (shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  const handleVerifySuccess = () => {
    fetchShipments();
    fetchInventory();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className={`rounded-2xl border p-6 ${
        isDark ? 'border-emerald-800/40 bg-emerald-950/30' : 'border-emerald-200 bg-white/70'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏬</span>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Destination Receiver Portal
              </h1>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
              Assigned Operational Intake Hub: <span className="font-bold text-emerald-400">{currentUser?.facility || 'Vijay Nagar Wholesale Hub, Indore'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchShipments}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                isDark ? 'border-emerald-800/60 bg-white/5 text-emerald-300 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-emerald-900/50 bg-[#0e1910]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>
              Total Incoming
            </span>
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.totalShipments}</p>
        </div>

        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-amber-900/50 bg-amber-950/20' : 'border-amber-200 bg-amber-50/50 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              Awaiting Intake
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{metrics.awaitingVerification}</p>
        </div>

        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-emerald-900/50 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50/50 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              Full Accepted
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300">{metrics.accepted}</p>
        </div>

        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-indigo-900/50 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/50 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
              Partially Accepted
            </span>
            <AlertTriangle className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300">{metrics.partiallyAccepted}</p>
        </div>

        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-rose-900/50 bg-rose-950/20' : 'border-rose-200 bg-rose-50/50 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
              Rejected
            </span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{metrics.rejected}</p>
        </div>

        <div className={`rounded-2xl border p-4 transition-all ${
          isDark ? 'border-emerald-900/50 bg-[#0e1910]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>
              Total Verified Intake
            </span>
            <Scale className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatKg(metrics.totalReceivedKg) || '0 kg'}</p>
        </div>
      </div>

      {/* Main Receiving Table & Search Filters */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'border-emerald-900/50 bg-[#0e1910]' : 'border-[#c9a87a] bg-[#f5ebd7]'
      }`}>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          
          {/* Tab Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Shipments', count: metrics.totalShipments },
              { id: 'AWAITING', label: 'Awaiting Intake', count: metrics.awaitingVerification, badgeColor: 'bg-amber-500/20 text-amber-400' },
              { id: 'ACCEPTED', label: 'Accepted', count: metrics.accepted, badgeColor: 'bg-emerald-500/20 text-emerald-400' },
              { id: 'PARTIALLY_ACCEPTED', label: 'Partial Intake', count: metrics.partiallyAccepted, badgeColor: 'bg-indigo-500/20 text-indigo-400' },
              { id: 'REJECTED', label: 'Rejected', count: metrics.rejected, badgeColor: 'bg-rose-500/20 text-rose-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDark ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-emerald-600 text-white shadow-md'
                    : isDark ? 'bg-white/5 text-emerald-200/70 hover:bg-white/10' : 'bg-white/60 text-slate-700 hover:bg-white'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-slate-950/20 text-slate-950' : tab.badgeColor || 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, produce, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-400 ${
                isDark ? 'border-emerald-800/60 bg-black/40 text-white placeholder-white/30' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Table / Cards List */}
        {filteredShipments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <PackageCheck className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p className="font-bold text-sm">No incoming produce shipments match criteria.</p>
            <p className="text-[11px] opacity-70">Try adjusting your active tab filter or search query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShipments.map((disp) => {
              const isVerified = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'].includes(disp.status);
              return (
                <div
                  key={disp.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                    isDark ? 'border-emerald-800/40 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white/90 hover:bg-white shadow-sm'
                  }`}
                >
                  {/* Left Metadata */}
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg border ${
                      disp.status === 'ACCEPTED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : disp.status === 'PARTIALLY_ACCEPTED'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : disp.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      📦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {disp.produce}
                        </span>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          {disp.id}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-500'} flex items-center gap-1 mt-0.5`}>
                        <Building2 className="h-3 w-3" /> Destination: <span className="font-semibold text-emerald-400">{disp.destination}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Action */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Sent Weight</p>
                      <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{disp.sentWeightKg} kg</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Status</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                        disp.status === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : disp.status === 'PARTIALLY_ACCEPTED'
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : disp.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {disp.status === 'ACCEPTED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {disp.status === 'PARTIALLY_ACCEPTED' && <AlertTriangle className="h-3.5 w-3.5" />}
                        {disp.status === 'REJECTED' && <XCircle className="h-3.5 w-3.5" />}
                        {['IN_TRANSIT', 'DISPATCHED', 'ARRIVED', 'AWAITING_VERIFICATION'].includes(disp.status) && <Clock className="h-3.5 w-3.5" />}
                        {disp.status}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div>
                      {!isVerified ? (
                        <button
                          onClick={() => handleOpenVerify(disp)}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
                        >
                          <PackageCheck className="h-4 w-4" /> Inspect & Verify
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenVerify(disp)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold ${
                            isDark ? 'border-emerald-800/60 text-emerald-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" /> View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acceptance Modal */}
      <ShipmentAcceptanceModal
        shipment={selectedShipment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerifySuccess={handleVerifySuccess}
      />

      {/* ─── On-Hand Facility Inventory ──────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'border-emerald-900/50 bg-[#0e1910]' : 'border-slate-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                On-Hand Facility Inventory
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
                Verified produce accepted into facility stock
              </p>
            </div>
          </div>
          <button
            onClick={fetchInventory}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              isDark ? 'border-emerald-800/60 bg-white/5 text-emerald-300 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${inventoryLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {inventoryLoading ? (
          <div className="py-8 text-center text-xs text-emerald-400/50">Loading inventory…</div>
        ) : inventory.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <PackageCheck className="h-8 w-8 mx-auto opacity-30 text-slate-400" />
            <p className={`text-sm font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              No inventory yet
            </p>
            <p className={`text-[11px] ${isDark ? 'text-emerald-200/30' : 'text-slate-400'}`}>
              Accepted shipments will appear here once verified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-emerald-800/40' : 'border-slate-200'}`}>
                  {['Produce', 'Batch ID', 'Dispatch ID', 'Usable Weight', 'Condition', 'Received At'].map((h) => (
                    <th key={h} className={`pb-2 pr-4 text-left font-extrabold uppercase tracking-wider text-[10px] ${isDark ? 'text-emerald-400/50' : 'text-slate-400'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventory.map((item) => (
                  <tr key={item.id} className="group">
                    <td className={`py-2.5 pr-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.produce}</td>
                    <td className="py-2.5 pr-4 font-mono text-emerald-400">{item.batchId}</td>
                    <td className="py-2.5 pr-4 font-mono text-blue-400/80">{item.dispatchId}</td>
                    <td className={`py-2.5 pr-4 font-black ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {item.receivedWeightKg?.toLocaleString() ?? '—'} kg
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        item.productCondition === 'Good'
                          ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                          : item.productCondition === 'Partially Damaged'
                          ? 'border-amber-500/30 bg-amber-500/20 text-amber-400'
                          : 'border-rose-500/30 bg-rose-500/20 text-rose-400'
                      }`}>
                        {item.productCondition}
                      </span>
                    </td>
                    <td className={`py-2.5 text-[11px] ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
                      {item.receivedAt ? new Date(item.receivedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`mt-3 text-right text-[10px] font-bold ${isDark ? 'text-emerald-400/40' : 'text-slate-400'}`}>
              {inventory.length} inventory record{inventory.length !== 1 ? 's' : ''} · Source: Backend SQLite
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiverDashboardPage;
