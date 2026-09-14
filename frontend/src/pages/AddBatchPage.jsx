import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Leaf,
  Scale,
  CalendarDays,
  MapPin,
  Clock,
  Truck,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';

const PRODUCE_TYPES = [
  'Tomato', 'Strawberry', 'Apple', 'Banana', 'Bell Pepper', 'Broccoli',
  'Carrot', 'Cucumber', 'Grapes', 'Mango', 'Onion', 'Orange', 'Potato', 'Spinach',
];

const STORAGE_ZONES = [
  'Controlled Atmosphere A',
  'Controlled Atmosphere B',
  'Deep Chill Bay A',
  'Deep Chill Bay B',
  'Cold Room 1',
  'Cold Room 2',
  'Ambient Storage',
];

const DEFAULT_DESTINATIONS = [
  'Delhi NCR MegaGrocers DC',
  'Mumbai Central FreshMart Hub',
  'Bhopal Prime Wholesale Market',
  'Sanwer Road Food Processing & Juice Hub',
  'Vijay Nagar Retail Wholesale Hub',
  'Dewas Naka Food Relief & Charity Bank',
];

const today = new Date().toISOString().split('T')[0];

// Auto-generate a preview Batch ID (actual ID is confirmed by backend)
const previewId = () => `BAT-${String(Math.floor(1000 + Math.random() * 9000))}`;

export const AddBatchPage = () => {
  const navigate = useNavigate();
  const { addBatch, showNotification } = useApp();
  const [saving, setSaving] = useState(false);
  const [previewBatchId] = useState(previewId);

  const [form, setForm] = useState({
    id: '',
    produce: 'Tomato',
    variety: '',
    weightKg: '',
    harvestDate: today,
    arrivalDate: today,
    zone: 'Controlled Atmosphere B',
    initialShelfLifeDays: '',
    defaultDestination: 'Delhi NCR MegaGrocers DC',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        produce: form.produce,
        variety: form.variety || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        harvestDate: form.harvestDate || undefined,
        arrivalDate: form.arrivalDate || undefined,
        zone: form.zone || undefined,
        initialShelfLifeDays: form.initialShelfLifeDays ? Number(form.initialShelfLifeDays) : undefined,
        defaultDestination: form.defaultDestination || undefined,
      };
      if (form.id.trim()) payload.id = form.id.trim().toUpperCase();
      const created = await addBatch(payload);
      navigate(`/batches/${created.id}`);
    } catch (err) {
      showNotification(
        'Batch not created',
        err?.response?.data?.detail || err.message || 'Backend rejected the request.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-emerald-800/40 bg-black/25 px-3 py-2.5 text-sm text-white placeholder-emerald-200/25 outline-none focus:border-emerald-500/70 transition-colors';
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-emerald-300/55 mb-1.5';

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        kicker="Batch Management"
        title="Register New Batch"
        subtitle="Fill in the produce details. Live temperature, humidity, and VOC will arrive from backend telemetry — do not enter sensor readings here."
      />

      <form onSubmit={onSubmit} className="space-y-5">

        {/* ── Section 1: Identity ── */}
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-6 space-y-5">
          <SectionTitle icon={Package} label="Batch Identity" />

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Batch ID */}
            <div>
              <label className={labelClass}>
                Batch ID
                <span className="ml-1 text-emerald-400/40 normal-case font-normal tracking-normal">(optional — auto-generated)</span>
              </label>
              <div className="relative">
                <input
                  className={fieldClass}
                  value={form.id}
                  onChange={set('id')}
                  placeholder={`e.g. ${previewBatchId} (auto if empty)`}
                  maxLength={20}
                />
              </div>
              <p className="mt-1 text-[10px] text-emerald-200/30">
                Leave blank — the backend will assign a unique ID.
              </p>
            </div>

            {/* Produce Type */}
            <div>
              <label className={labelClass}>Produce Type <Req /></label>
              <select className={fieldClass} value={form.produce} onChange={set('produce')} required>
                {PRODUCE_TYPES.map((p) => (
                  <option key={p} value={p} className="bg-[#111c12]">{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Variety */}
          <div>
            <label className={labelClass}>Variety / Grade</label>
            <input
              className={fieldClass}
              value={form.variety}
              onChange={set('variety')}
              placeholder="e.g. Roma, Hybrid, Grade A"
            />
          </div>
        </section>

        {/* ── Section 2: Quantity ── */}
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-6 space-y-5">
          <SectionTitle icon={Scale} label="Quantity & Storage" />

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Weight */}
            <div>
              <label className={labelClass}>Quantity / Weight (kg) <Req /></label>
              <input
                className={fieldClass}
                type="number"
                min="1"
                step="1"
                value={form.weightKg}
                onChange={set('weightKg')}
                placeholder="e.g. 850"
                required
              />
            </div>

            {/* Storage Zone */}
            <div>
              <label className={labelClass}>Storage Zone</label>
              <select className={fieldClass} value={form.zone} onChange={set('zone')}>
                {STORAGE_ZONES.map((z) => (
                  <option key={z} value={z} className="bg-[#111c12]">{z}</option>
                ))}
                <option value="__custom__" className="bg-[#111c12]">Other…</option>
              </select>
              {form.zone === '__custom__' && (
                <input
                  className={`${fieldClass} mt-2`}
                  value=""
                  onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                  placeholder="Enter custom zone name"
                  autoFocus
                />
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3: Dates ── */}
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-6 space-y-5">
          <SectionTitle icon={CalendarDays} label="Dates" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Harvest Date</label>
              <input className={fieldClass} type="date" value={form.harvestDate} onChange={set('harvestDate')} />
            </div>
            <div>
              <label className={labelClass}>Arrival / Intake Date</label>
              <input className={fieldClass} type="date" value={form.arrivalDate} onChange={set('arrivalDate')} />
            </div>
          </div>
        </section>

        {/* ── Section 4: Shelf Life & Routing ── */}
        <section className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-6 space-y-5">
          <SectionTitle icon={Truck} label="Shelf Life & Initial Route" />

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Initial Shelf Life */}
            <div>
              <label className={labelClass}>Initial Shelf Life (days)</label>
              <input
                className={fieldClass}
                type="number"
                min="1"
                step="0.5"
                value={form.initialShelfLifeDays}
                onChange={set('initialShelfLifeDays')}
                placeholder="e.g. 21 (backend uses produce defaults if empty)"
              />
              <p className="mt-1 text-[10px] text-emerald-200/30">
                If left blank the backend uses produce-type defaults.
              </p>
            </div>

            {/* Current / Default Destination */}
            <div>
              <label className={labelClass}>Current Destination</label>
              <select className={fieldClass} value={form.defaultDestination} onChange={set('defaultDestination')}>
                {DEFAULT_DESTINATIONS.map((d) => (
                  <option key={d} value={d} className="bg-[#111c12]">{d}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-emerald-200/30">
                The AI will evaluate route feasibility after the first telemetry reading.
              </p>
            </div>
          </div>
        </section>

        {/* ── Info banner ── */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-800/30 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/60" />
          <span>
            Temperature, humidity, and VOC are <strong className="text-white">not entered here</strong> — they
            arrive from backend telemetry. The AI model will run its first prediction on the initial ingestion
            state and update continuously as sensor readings come in.
          </span>
        </div>

        {/* ── Buttons ── */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => navigate('/batches')}
            className="rounded-xl border border-emerald-800/50 px-5 py-2.5 text-xs font-bold text-emerald-200 hover:bg-white/5 transition-colors"
          >
            ← Back to Batches
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                Registering…
              </>
            ) : (
              <>Create Batch <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Small helper components ────────────────────────────────────────────────────

const Req = () => (
  <span className="ml-0.5 text-rose-400">*</span>
);

const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 pb-1 border-b border-white/8">
    <Icon className="h-4 w-4 text-emerald-400/70" />
    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300/60">{label}</h3>
  </div>
);
