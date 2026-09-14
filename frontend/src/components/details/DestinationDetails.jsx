import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Navigation,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DestinationDetails = () => {
  const { destinations } = useApp();

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="bg-[#18261a]/80 p-6 rounded-2xl border border-emerald-800/40 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Redistribution Network
          </span>
          <span className="text-xs text-emerald-300/60 font-medium">Regional Partner Facilities</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Alternative Receiving Facilities Directory
        </h1>
        <p className="text-xs text-emerald-200/60 mt-0.5">
          Pre-vetted commercial processors, discount wholesale grocers, commercial kitchens, and food banks configured for rapid emergency produce absorption.
        </p>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="bg-[#18261a]/80 rounded-2xl border border-emerald-800/40 p-6 shadow-lg backdrop-blur-sm hover:border-emerald-700/60 transition-all card-3d"
          >
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-black/40 rounded-xl border border-emerald-800/30">
                  {dest.icon}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                    {dest.type}
                  </span>
                  <h3 className="text-lg font-extrabold text-white">{dest.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/60 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{dest.location}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/50 block">
                  {dest.travelTimeMinutes} mins
                </span>
                <span className="text-[10px] text-emerald-300/50 mt-1 block">{dest.distanceKm} km away</span>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-emerald-100/80">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300/70">Available Receiving Capacity:</span>
                <strong className="text-white font-bold">{dest.capacityAvailableKg.toLocaleString()} kg</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-emerald-300/70">Economic Recovery Model:</span>
                <strong className="text-emerald-400 font-bold">
                  {dest.pricingFactor > 0 ? `${(dest.pricingFactor * 100).toFixed(0)}% Original Value` : 'Tax Deduction Donation'}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-emerald-300/70">Facility Quality Rating:</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{dest.rating} / 5.0</span>
                </span>
              </div>

              <div className="p-3 bg-black/30 rounded-xl border border-emerald-800/30 mt-2">
                <span className="text-[10px] uppercase font-bold text-emerald-300/50 block mb-1">Accepted Produce Varieties</span>
                <div className="flex flex-wrap gap-1.5">
                  {dest.preferredProduce.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-white/10 text-emerald-200 text-[11px] font-semibold border border-white/10">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-300/50 block text-[10px]">Direct Receiving Contact</span>
                <span className="font-bold text-white">{dest.contactPerson} ({dest.phone})</span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Intake
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
