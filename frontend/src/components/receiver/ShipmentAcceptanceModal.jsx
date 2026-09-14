import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  PackageCheck, 
  Building2, 
  Truck, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ShipmentAcceptanceModal = ({ shipment, isOpen, onClose, onVerifySuccess }) => {
  const { currentUser, showNotification, theme, verifyShipmentReceipt } = useApp() || {};
  const isDark = theme === 'dark';

  const sentWeight = Number(shipment?.sentWeightKg || shipment?.wasteAvoidedKg || 5000);

  const [receivedWeight, setReceivedWeight] = useState(sentWeight);
  const [damagedWeight, setDamagedWeight] = useState(0);
  const [productCondition, setProductCondition] = useState('Good');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState(currentUser?.name || 'Rajesh Sharma');
  const [explicitReject, setExplicitReject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync defaults when shipment changes
  useEffect(() => {
    if (shipment) {
      const sw = Number(shipment.sentWeightKg || shipment.wasteAvoidedKg || 5000);
      setReceivedWeight(sw);
      setDamagedWeight(0);
      setProductCondition('Good');
      setVerificationNotes('');
      setExplicitReject(false);
      setErrorMsg(null);
      setShowConfirm(false);
    }
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  // Auto-calculated fields
  const missingWeight = Math.max(0, Number((sentWeight - Number(receivedWeight)).toFixed(1)));
  const recvNum = Number(receivedWeight) || 0;
  const damNum = Number(damagedWeight) || 0;

  // Dynamically calculated outcome status
  let computedStatus = 'ACCEPTED';
  if (recvNum === 0 || productCondition === 'Severely Damaged' || explicitReject) {
    computedStatus = 'REJECTED';
  } else if (recvNum === sentWeight && damNum === 0 && productCondition === 'Good') {
    computedStatus = 'ACCEPTED';
  } else {
    computedStatus = 'PARTIALLY_ACCEPTED';
  }

  // Real-time client-side validation
  const validateForm = () => {
    if (recvNum < 0 || damNum < 0) {
      return 'Quantities cannot be negative.';
    }
    if (recvNum > sentWeight) {
      return `Received quantity (${recvNum} kg) cannot exceed dispatched sent weight (${sentWeight} kg).`;
    }
    if (damNum > recvNum) {
      return `Damaged weight (${damNum} kg) cannot exceed actual received quantity (${recvNum} kg).`;
    }
    if (computedStatus === 'REJECTED' && !verificationNotes.trim()) {
      return 'A detailed verification note / rejection reason is mandatory when rejecting a shipment.';
    }
    if ((damNum > 0 || missingWeight > 0) && !verificationNotes.trim()) {
      return 'Please provide verification notes detailing the reason for missing or damaged produce.';
    }
    return null;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setShowConfirm(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      sentWeightKg: sentWeight,
      receivedWeightKg: recvNum,
      damagedWeightKg: damNum,
      productCondition,
      verificationNotes: verificationNotes.trim(),
      verifiedBy: verifiedBy.trim() || 'Rajesh Sharma',
      facilityName: currentUser?.facility || shipment.destination,
      explicitReject
    };

    try {
      const result = await verifyShipmentReceipt(shipment.id, payload);
      showNotification(
        `Shipment ${computedStatus}`,
        result?.message || `Receipt recorded as ${computedStatus}.`,
        computedStatus === 'ACCEPTED' ? 'success' : computedStatus === 'PARTIALLY_ACCEPTED' ? 'info' : 'warning'
      );
      if (onVerifySuccess) onVerifySuccess(result);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit verification.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl transition-all ${
        isDark ? 'border-emerald-800/50 bg-[#111c13] text-white' : 'border-[#c9a87a] bg-[#f7efe0] text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-5 ${
          isDark ? 'border-emerald-800/40 bg-emerald-950/40' : 'border-emerald-200 bg-white/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Receipt Verification & Quality Intake</h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  {shipment.id}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
                Produce: <span className="font-bold text-emerald-400">{shipment.produce}</span> | Destination: <span className="font-bold">{shipment.destination}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-full p-2 hover:bg-white/10 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        {!showConfirm ? (
          <form onSubmit={handlePreSubmit} className="space-y-5 p-6 max-h-[80vh] overflow-y-auto">
            
            {/* Error Alert */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            {/* Carrier & Shipment Quick Meta */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border p-3 text-xs ${
              isDark ? 'border-emerald-800/30 bg-white/5' : 'border-slate-200 bg-white/50'
            }`}>
              <div>
                <span className={`block text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Carrier</span>
                <span className="font-bold truncate block">{shipment.carrier || 'Logistics Partner'}</span>
              </div>
              <div>
                <span className={`block text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Driver</span>
                <span className="font-bold truncate block">{shipment.driverName || 'Courier Staff'}</span>
              </div>
              <div>
                <span className={`block text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Dispatched Sent Weight</span>
                <span className="font-black text-emerald-400">{sentWeight} kg</span>
              </div>
              <div>
                <span className={`block text-[10px] uppercase font-bold ${isDark ? 'text-emerald-400/60' : 'text-slate-400'}`}>Outcome Status</span>
                <span className={`inline-flex items-center gap-1 font-extrabold text-[11px] ${
                  computedStatus === 'ACCEPTED' ? 'text-emerald-400' : computedStatus === 'PARTIALLY_ACCEPTED' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {computedStatus === 'ACCEPTED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {computedStatus === 'PARTIALLY_ACCEPTED' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {computedStatus === 'REJECTED' && <XCircle className="h-3.5 w-3.5" />}
                  {computedStatus}
                </span>
              </div>
            </div>

            {/* Quantities Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Sent Weight (Disabled) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Sent Weight (kg)
                </label>
                <input
                  type="number"
                  disabled
                  value={sentWeight}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-black cursor-not-allowed ${
                    isDark ? 'border-emerald-900 bg-white/5 text-emerald-400' : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
                />
              </div>

              {/* Received Weight (Editable) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Actual Received Weight (kg) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={sentWeight}
                  step="0.1"
                  value={receivedWeight}
                  onChange={(e) => setReceivedWeight(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:border-emerald-400 ${
                    isDark ? 'border-emerald-800/60 bg-black/40 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              {/* Damaged Weight (Editable) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                  Damaged / Spoiled Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  max={recvNum}
                  step="0.1"
                  value={damagedWeight}
                  onChange={(e) => setDamagedWeight(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:border-emerald-400 ${
                    isDark ? 'border-emerald-800/60 bg-black/40 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Calculated Missing Quantity Banner */}
            <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
              missingWeight > 0 
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' 
                : isDark ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Auto-Calculated Missing Transit Deficit:</span>
              </div>
              <span className="font-black text-sm">{missingWeight} kg</span>
            </div>

            {/* Product Condition Selection */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                Physical Inspection Condition <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Good', label: 'Good Quality', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
                  { value: 'Partially Damaged', label: 'Minor Damage', icon: AlertTriangle, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
                  { value: 'Severely Damaged', label: 'Severely Damaged', icon: XCircle, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = productCondition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProductCondition(opt.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        isSelected 
                          ? `${opt.color} ring-2 ring-emerald-400/50 shadow-md` 
                          : isDark ? 'border-emerald-900/60 bg-white/5 text-slate-400 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explicit Reject Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="explicitReject"
                checked={explicitReject}
                onChange={(e) => setExplicitReject(e.target.checked)}
                className="h-4 w-4 rounded border-emerald-800 text-rose-500 focus:ring-rose-500"
              />
              <label htmlFor="explicitReject" className="text-xs font-bold text-rose-400 cursor-pointer">
                Manually mark entire shipment as REJECTED (e.g. non-compliant cold-chain logs)
              </label>
            </div>

            {/* Verification Notes */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-700'}`}>
                Inspection Notes & Rejection Reason {computedStatus === 'REJECTED' && <span className="text-rose-400">* Required</span>}
              </label>
              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder={
                  computedStatus === 'REJECTED'
                    ? 'State detailed reason for total shipment rejection...'
                    : 'Add intake notes regarding pallet temperature, packaging condition, or weight discrepancies...'
                }
                className={`w-full rounded-xl border p-3 text-xs font-medium transition-colors focus:outline-none focus:border-emerald-400 ${
                  isDark ? 'border-emerald-800/60 bg-black/40 text-white placeholder-white/30' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-800/30">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg ${
                  computedStatus === 'ACCEPTED'
                    ? 'bg-emerald-400 hover:bg-emerald-300'
                    : computedStatus === 'PARTIALLY_ACCEPTED'
                    ? 'bg-amber-400 hover:bg-amber-300'
                    : 'bg-rose-500 text-white hover:bg-rose-400'
                }`}
              >
                <PackageCheck className="h-4 w-4" />
                Review & Confirm Verification
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Step */
          <div className="p-6 space-y-5 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              computedStatus === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' : computedStatus === 'PARTIALLY_ACCEPTED' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-xl font-black mb-1">Confirm Receipt Sign-Off</h4>
              <p className={`text-xs ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
                Are you sure you want to submit this verification? This action will permanently update the dispatch status and destination inventory.
              </p>
            </div>

            <div className={`rounded-xl border p-4 text-xs text-left space-y-2 ${
              isDark ? 'border-emerald-800/40 bg-white/5' : 'border-slate-200 bg-white/80'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400">Shipment ID:</span>
                <span className="font-bold">{shipment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Determined Status:</span>
                <span className={`font-black ${
                  computedStatus === 'ACCEPTED' ? 'text-emerald-400' : computedStatus === 'PARTIALLY_ACCEPTED' ? 'text-amber-400' : 'text-rose-400'
                }`}>{computedStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Received Weight:</span>
                <span className="font-bold">{recvNum} kg / {sentWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Damaged Weight:</span>
                <span className="font-bold text-rose-400">{damNum} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missing Deficit:</span>
                <span className="font-bold text-amber-400">{missingWeight} kg</span>
              </div>
              {verificationNotes && (
                <div className="pt-2 border-t border-slate-700/40">
                  <span className="text-slate-400 block text-[10px]">Verification Note:</span>
                  <p className="italic text-slate-300 mt-0.5">{verificationNotes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className={`rounded-xl border px-5 py-2.5 text-xs font-bold ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying & Persisting...' : 'Confirm & Finalize Sign-Off'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentAcceptanceModal;
