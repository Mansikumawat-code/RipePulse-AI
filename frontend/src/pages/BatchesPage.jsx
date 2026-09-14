import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/common/EmptyState';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  display,
  formatDaysFromHours,
  formatKg,
  formatPercent,
  storageAgeLabel,
} from '../utils/format';

const RISK_LEVELS  = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ROUTE_STATUS = ['ALL', 'FEASIBLE', 'NOT FEASIBLE', 'PENDING'];
const PRODUCE_OPTS = [
  'ALL', 'Tomato', 'Strawberry', 'Apple', 'Banana', 'Bell Pepper',
  'Broccoli', 'Carrot', 'Cucumber', 'Grapes', 'Mango', 'Onion',
  'Orange', 'Potato', 'Spinach',
];

const RISK_PILL = {
  LOW:      'border-emerald-500/40  bg-emerald-500/10  text-emerald-300',
  MEDIUM:   'border-amber-500/40    bg-amber-500/10    text-amber-300',
  HIGH:     'border-orange-500/40   bg-orange-500/10   text-orange-300',
  CRITICAL: 'border-rose-500/50     bg-rose-500/15     text-rose-300',
  ALL:      'border-white/15        bg-white/5         text-emerald-200/60',
};

function routeStatusOf(batch) {
  const isFeasible = batch?.currentRoute?.isFeasible;
  if (isFeasible === true)  return 'FEASIBLE';
  if (isFeasible === false) return 'NOT FEASIBLE';
  return 'PENDING';
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sort.dir === 'asc'
    ? <ChevronUp   className="ml-1 inline h-3 w-3 text-emerald-400" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-emerald-400" />;
}

export const BatchesPage = () => {
  const navigate = useNavigate();
  const {
    batches,
    currentUser,
    setSelectedBatchId,
    dataLoading,
    backendOnline,
    refreshData,
    errorMessage,
  } = useApp();

  const [query,       setQuery]       = useState('');
  const [riskFilter,  setRiskFilter]  = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [produceFilter, setProduceFilter] = useState('ALL');
  const [sort, setSort] = useState({ col: 'id', dir: 'asc' });
  const batchDetailsBase = currentUser?.id === 'ADMIN' ? '/admin/batches' : '/warehouse/batches';

  const handleSort = (col) => {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    );
  };

  const filtered = useMemo(() => {
    let list = batches.filter((b) => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q ||
        String(b.id || '').toLowerCase().includes(q) ||
        String(b.produce || '').toLowerCase().includes(q) ||
        String(b.variety || '').toLowerCase().includes(q) ||
        String(b.zone || '').toLowerCase().includes(q);
      const matchesRisk    = riskFilter  === 'ALL' || b.riskLevel === riskFilter;
      const matchesRoute   = routeFilter === 'ALL' || routeStatusOf(b) === routeFilter;
      const matchesProduce = produceFilter === 'ALL' ||
        String(b.produce || '').toLowerCase() === produceFilter.toLowerCase();
      return matchesQ && matchesRisk && matchesRoute && matchesProduce;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      let av, bv;
      switch (sort.col) {
        case 'id':       av = a.id; bv = b.id; break;
        case 'produce':  av = a.produce; bv = b.produce; break;
        case 'weight':   av = Number(a.weightKg || 0); bv = Number(b.weightKg || 0); break;
        case 'temp':     av = Number(a.currentTemp ?? Infinity); bv = Number(b.currentTemp ?? Infinity); break;
        case 'rsl':      av = Number(a.remainingShelfLifeHours ?? Infinity); bv = Number(b.remainingShelfLifeHours ?? Infinity); break;
        case 'sli':      av = Number(a.sli ?? -1); bv = Number(b.sli ?? -1); break;
        default:         av = a.id; bv = b.id;
      }
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === 'asc' ? av - bv : bv - av;
    });

    return list;
  }, [batches, query, riskFilter, routeFilter, produceFilter, sort]);

  if (dataLoading) return <LoadingState label="Loading batches…" />;
  if (backendOnline === false) return <ErrorState message={errorMessage} onRetry={refreshData} />;

  const Th = ({ col, children, className = '' }) => (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 ${className}`}
      onClick={() => handleSort(col)}
    >
      {children}<SortIcon col={col} sort={sort} />
    </th>
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <PageHeader
        kicker="Inventory"
        title="Batch Management"
        subtitle="All produce batches from the backend. Filter, sort and drill into live telemetry or decisions."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              title="Refresh"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/batches/new')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add New Batch
            </button>
          </div>
        }
      />

      {/* ── Filters bar ── */}
      <div className="rounded-2xl border border-emerald-800/40 bg-[#18261a]/70 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-emerald-400/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search batch ID, produce, variety or zone…"
            className="w-full rounded-xl border border-emerald-800/40 bg-black/25 py-2 pl-9 pr-3 text-sm text-white placeholder-emerald-200/30 outline-none focus:border-emerald-500/70 transition-colors"
          />
        </div>

        {/* Filter chips row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">

          {/* Produce filter */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mr-1">Produce</span>
            {PRODUCE_OPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProduceFilter(p)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  produceFilter === p
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 text-emerald-200/40 hover:text-white hover:border-emerald-700/50'
                }`}
              >
                {p === 'ALL' ? 'All' : p}
              </button>
            ))}
          </div>

          {/* Risk filter */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mr-1">Risk</span>
            {RISK_LEVELS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRiskFilter(r)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  riskFilter === r
                    ? RISK_PILL[r]
                    : 'border-white/10 text-emerald-200/40 hover:text-white hover:border-emerald-700/50'
                }`}
              >
                {r === 'ALL' ? 'All Risk' : r}
              </button>
            ))}
          </div>

          {/* Route status filter */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/40 mr-1">Route</span>
            {ROUTE_STATUS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRouteFilter(s)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  routeFilter === s
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 text-emerald-200/40 hover:text-white hover:border-emerald-700/50'
                }`}
              >
                {s === 'ALL' ? 'All Routes' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter summary */}
        {(riskFilter !== 'ALL' || routeFilter !== 'ALL' || produceFilter !== 'ALL' || query) && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-emerald-300/50">
              Showing <strong className="text-white">{filtered.length}</strong> of{' '}
              <strong className="text-white">{batches.length}</strong> batches
            </span>
            <button
              type="button"
              onClick={() => { setQuery(''); setRiskFilter('ALL'); setRouteFilter('ALL'); setProduceFilter('ALL'); }}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title={batches.length === 0 ? 'NO BATCHES YET' : 'NO MATCHING BATCHES'}
          message={
            batches.length === 0
              ? 'Click "Add New Batch" to register the first batch.'
              : 'Adjust filters or clear search to see results.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-emerald-800/40 bg-[#18261a]/70">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-white/8 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-emerald-300/45">
              <tr>
                <Th col="id">Batch ID</Th>
                <Th col="produce">Produce</Th>
                <th className="px-4 py-3">Variety</th>
                <Th col="weight">Quantity</Th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Storage Age</th>
                <Th col="temp"><span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />Temp</span></Th>
                <th className="px-4 py-3"><span className="flex items-center gap-1"><Droplets className="h-3 w-3" />Humidity</span></th>
                <Th col="rsl">RSL</Th>
                <Th col="sli">SLI</Th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Route Status</th>
                <th className="px-4 py-3">Batch Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((b) => {
                const routeStatus = routeStatusOf(b);
                const actionStatus = display(b.recommendedAction?.status, 'REGISTERED');
                return (
                  <tr
                    key={b.id}
                    className="group hover:bg-emerald-500/5 transition-colors"
                  >
                    {/* Batch ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-emerald-400">{b.id}</span>
                    </td>

                    {/* Produce */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {b.icon && <span className="text-base leading-none">{b.icon}</span>}
                        <span className="font-semibold text-white">{display(b.produce)}</span>
                      </div>
                    </td>

                    {/* Variety */}
                    <td className="px-4 py-3 text-emerald-200/55">{display(b.variety)}</td>

                    {/* Quantity */}
                    <td className="px-4 py-3 tabular-nums text-white">{formatKg(b.weightKg) || '—'}</td>

                    {/* Zone */}
                    <td className="px-4 py-3 text-emerald-200/55 max-w-[120px] truncate" title={b.zone}>{display(b.zone)}</td>

                    {/* Storage Age */}
                    <td className="px-4 py-3 tabular-nums text-emerald-200/70">
                      {storageAgeLabel(b.harvestDate, b.arrivalDate) || '—'}
                    </td>

                    {/* Temperature */}
                    <td className="px-4 py-3 tabular-nums">
                      <span className={b.currentTemp != null ? (b.currentTemp > 8 ? 'text-amber-400' : 'text-emerald-300') : 'text-emerald-200/40'}>
                        {b.currentTemp != null ? `${Number(b.currentTemp).toFixed(1)}°C` : '—'}
                      </span>
                    </td>

                    {/* Humidity */}
                    <td className="px-4 py-3 tabular-nums text-emerald-200/70">
                      {b.currentHumidity != null ? `${Number(b.currentHumidity).toFixed(0)}%` : '—'}
                    </td>

                    {/* RSL */}
                    <td className="px-4 py-3 tabular-nums">
                      {b.remainingShelfLifeHours != null ? (
                        <span className={Number(b.remainingShelfLifeHours) < 48 ? 'font-bold text-rose-400' : 'text-white'}>
                          {formatDaysFromHours(b.remainingShelfLifeHours)}
                        </span>
                      ) : (
                        <span className="text-xs italic text-emerald-200/35">Pending</span>
                      )}
                    </td>

                    {/* SLI */}
                    <td className="px-4 py-3 tabular-nums">
                      {b.sli != null ? (
                        <span className={Number(b.sli) < 30 ? 'font-bold text-rose-400' : Number(b.sli) < 60 ? 'text-amber-400' : 'text-emerald-300'}>
                          {formatPercent(b.sli)}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-3">
                      <RiskBadge level={b.riskLevel} size="sm" />
                    </td>

                    {/* Route Status */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        routeStatus === 'FEASIBLE'     ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-400' :
                        routeStatus === 'NOT FEASIBLE' ? 'border-rose-600/40    bg-rose-600/10    text-rose-400'    :
                                                         'border-white/15       bg-white/5        text-emerald-200/40'
                      }`}>
                        {routeStatus === 'FEASIBLE' ? '✓ Feasible' : routeStatus === 'NOT FEASIBLE' ? '✕ Not Feasible' : 'Pending'}
                      </span>
                    </td>

                    {/* Batch Status */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-emerald-200/55">{actionStatus}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/live?batch=${b.id}`}
                          onClick={() => setSelectedBatchId(b.id)}
                          className="rounded-lg border border-emerald-700/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:border-emerald-500 hover:text-white transition-colors"
                        >
                          Live
                        </Link>
                        <Link
                          to={`${batchDetailsBase}/${b.id}`}
                          onClick={() => setSelectedBatchId(b.id)}
                          className="rounded-lg bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5 text-[11px] text-emerald-200/40">
            <span>{filtered.length} batch{filtered.length !== 1 ? 'es' : ''} displayed</span>
            <span>Click a column header to sort · All values from backend</span>
          </div>
        </div>
      )}
    </div>
  );
};
