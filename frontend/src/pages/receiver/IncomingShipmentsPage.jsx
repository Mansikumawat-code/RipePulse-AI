import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  PackageCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Building2, 
  RefreshCw,
  FileCheck2,
  MapPin,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { receiverService } from '../../services/receiverService';
import { ShipmentAcceptanceModal } from '../../components/receiver/ShipmentAcceptanceModal';

export const IncomingShipmentsPage = () => {
  const { dispatches = [], theme, currentUser } = useApp() || {};
  const isDark = theme === 'dark';

  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

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
    sentWeightKg: d.wasteAvoidedKg || 5000,
    temperatureMaintained: d.temperatureMaintained,
    recoveredValue: d.recoveredValue
  }));

  const filteredShipments = shipmentsList.filter((s) => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.produce.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'AWAITING') return ['IN_TRANSIT', 'DISPATCHED', 'ARRIVED', 'AWAITING_VERIFICATION'].includes(s.status);
    return s.status === statusFilter;
  });

  const handleOpenVerify = (shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className={`rounded-2xl border p-6 ${
        isDark ? 'border-emerald-800/40 bg-emerald-950/30' : 'border-emerald-200 bg-white/70'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Truck className="h-6 w-6 text-emerald-400" />
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Incoming Shipments Directory
              </h1>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
              Destination Inventory & Verification Hub for <span className="font-bold text-emerald-400">{currentUser?.facility || 'Vijay Nagar Wholesale Hub, Indore'}</span>
            </p>
          </div>

          <button
            onClick={fetchShipments}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${
              isDark ? 'border-emerald-800/60 bg-white/5 text-emerald-300 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={`rounded-2xl border p-4 ${
        isDark ? 'border-emerald-900/50 bg-[#0e1910]' : 'border-[#c9a87a] bg-[#f5ebd7]'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shipment ID, produce, carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-400 ${
                isDark ? 'border-emerald-800/60 bg-black/40 text-white placeholder-white/30' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-emerald-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full sm:w-48 rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-400 ${
                isDark ? 'border-emerald-800/60 bg-black/40 text-white' : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="AWAITING">Awaiting Intake</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShipments.map((disp) => {
          const isVerified = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'].includes(disp.status);
          return (
            <div
              key={disp.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-lg ${
                isDark ? 'border-emerald-800/40 bg-[#0e1910]' : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
                    {disp.id}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-bold border ${
                    disp.status === 'ACCEPTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : disp.status === 'PARTIALLY_ACCEPTED'
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      : disp.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {disp.status}
                  </span>
                </div>

                <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {disp.produce}
                </h3>
                <p className={`text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-500'} flex items-center gap-1 mt-1`}>
                  <Building2 className="h-3.5 w-3.5 text-emerald-400" /> {disp.destination}
                </p>

                <div className={`mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
                  isDark ? 'border-emerald-800/30 text-emerald-200/70' : 'border-slate-100 text-slate-600'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sent Weight</span>
                    <strong className="text-emerald-400 text-sm">{disp.sentWeightKg} kg</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier</span>
                    <strong className="truncate block">{disp.carrier}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver</span>
                    <strong className="truncate block">{disp.driverName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ETA</span>
                    <strong className="truncate block">{disp.eta}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-emerald-800/20">
                {!isVerified ? (
                  <button
                    onClick={() => handleOpenVerify(disp)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
                  >
                    <PackageCheck className="h-4 w-4" /> Inspect & Verify Receipt
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenVerify(disp)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold ${
                      isDark ? 'border-emerald-800/60 text-emerald-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileCheck2 className="h-4 w-4 text-emerald-400" /> View Verification Receipt
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ShipmentAcceptanceModal
        shipment={selectedShipment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerifySuccess={fetchShipments}
      />
    </div>
  );
};

export default IncomingShipmentsPage;
