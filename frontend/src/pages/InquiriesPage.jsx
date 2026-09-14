import React, { useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { inquiryService } from '../services/inquiryService';
import { useApp } from '../context/AppContext';

const STATUS_CONFIG = {
  NEW: {
    label: 'New Inquiry',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-400 animate-pulse',
  },
  REVIEWED: {
    label: 'Under Review',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-400',
  },
  CONTACTED: {
    label: 'Contacted',
    pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
    dot: 'bg-indigo-400',
  },
};

export const InquiriesPage = () => {
  const { theme, showNotification } = useApp();
  const isDark = theme === 'dark';

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inquiryService.getInquiries();
      setInquiries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await inquiryService.updateStatus(id, newStatus);
      await loadData();
      if (showNotification) {
        showNotification('Status Updated', `Inquiry marked as ${newStatus}`, 'success');
      }
    } catch (e) {
      if (showNotification) {
        showNotification('Update Failed', e.message || 'Could not update inquiry status', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this assessment inquiry?')) {
      try {
        await inquiryService.deleteInquiry(id);
        await loadData();
        if (showNotification) {
          showNotification('Removed', 'Assessment inquiry deleted', 'info');
        }
      } catch (e) {
        if (showNotification) {
          showNotification('Delete Failed', e.message || 'Could not delete inquiry', 'error');
        }
      }
    }
  };

  const filtered = useMemo(() => {
    return inquiries.filter((item) => {
      const matchesFilter =
        filter === 'ALL' ? true : item.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        (item.warehouse_name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.volume_details || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [inquiries, filter, search]);

  const newCount = inquiries.filter((i) => i.status === 'NEW').length;
  const reviewCount = inquiries.filter((i) => i.status === 'REVIEWED').length;
  const contactedCount = inquiries.filter((i) => i.status === 'CONTACTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Admin Panel"
        title="Warehouse Integration Requests"
        subtitle="Commercial leads and assessment inquiries submitted directly from the Landing Page."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Feed
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl p-4 border ${
            isDark ? 'border-emerald-800/40 bg-[#0f1911]' : 'border-emerald-200 bg-white'
          } shadow-lg flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-200/60 uppercase tracking-wider">
              Pending Inquiries
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{newCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 border ${
            isDark ? 'border-amber-800/40 bg-[#0f1911]' : 'border-amber-200 bg-white'
          } shadow-lg flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-200/60 uppercase tracking-wider">
              Under Review
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{reviewCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 border ${
            isDark ? 'border-indigo-800/40 bg-[#0f1911]' : 'border-indigo-200 bg-white'
          } shadow-lg flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-semibold text-indigo-200/60 uppercase tracking-wider">
              Contacted / Active
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{contactedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto">
          {['ALL', 'NEW', 'REVIEWED', 'CONTACTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-emerald-200/60 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-emerald-400/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search warehouse or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-emerald-200/50">
          Loading assessment inquiries…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-emerald-800/30 bg-[#0f1911] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Inquiries Found</h4>
          <p className="text-xs text-emerald-200/60 max-w-sm mx-auto">
            {search
              ? 'No integration requests match your current search query.'
              : 'Submit a new request from the Landing Page footer to test this flow.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.NEW;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-all ${
                  isDark
                    ? 'border-emerald-800/40 bg-gradient-to-r from-[#132216] to-[#0f1911] hover:border-emerald-600/50'
                    : 'border-emerald-200 bg-white hover:border-emerald-400'
                } shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5`}
              >
                {/* Left details */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {item.id}
                    </span>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      {item.warehouse_name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-100/80 leading-relaxed pl-1">
                    <strong className="text-emerald-300">Volume &amp; Scope:</strong>{' '}
                    {item.volume_details || 'No volume specifications provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-emerald-200/60 pt-1">
                    <a
                      href={`mailto:${item.email}?subject=RipePulse%20Warehouse%20Integration%20Assessment`}
                      className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {item.email}
                    </a>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400/60" />
                      {item.created_at}
                    </span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-700/50 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Under Review</option>
                    <option value="CONTACTED">Contacted</option>
                  </select>

                  <a
                    href={`mailto:${item.email}?subject=RipePulse%20Integration%20Assessment%20for%20${encodeURIComponent(
                      item.warehouse_name
                    )}`}
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
