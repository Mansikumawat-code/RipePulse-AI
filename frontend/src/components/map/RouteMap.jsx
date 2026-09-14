import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  Store, 
  Factory, 
  HeartHandshake, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INDORE_CENTER_COORDINATES } from '../../data/indoreLocations';

// Center updater helper
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Custom HTML DivIcon creators for crisp high-contrast styling
const createWarehouseIcon = () => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-xl text-white font-bold animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createOriginalDestIcon = (isFeasible) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="flex items-center justify-center w-9 h-9 rounded-full ${
        isFeasible ? 'bg-blue-600' : 'bg-rose-600 ring-4 ring-rose-300 animate-bounce'
      } border-2 border-white shadow-xl text-white">
        ${
          isFeasible
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        }
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createAlternativeIcon = (category, isRecommended) => {
  const bg = isRecommended 
    ? 'bg-emerald-600 ring-4 ring-emerald-300/80 scale-110' 
    : 'bg-indigo-600';
    
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full ${bg} border-2 border-white shadow-xl text-white transition-transform hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const RouteMap = ({ selectedBatch, onSelectDestination }) => {
  const { warehouses = [], destinations = [], approveReroute } = useApp() || {};
  const warehouse = (warehouses && warehouses[0]) || {
    name: 'Indore Central Cold-Storage Hub',
    location: 'Pithampur Sector 1, Indore, MP',
    coordinates: [22.6280, 75.6820]
  };
  
  const batch = selectedBatch;
  const isFeasible = batch?.currentRoute?.isFeasible ?? true;
  
  // Indore Coordinates
  const warehouseCoords = warehouse.coordinates || [22.6280, 75.6820];
  const recommendedDestId = batch?.recommendedAction?.targetDestinationId;
  const recommendedDest = (destinations && destinations.find(d => d.id === recommendedDestId)) || (destinations && destinations[0]) || {
    name: 'Sanwer Road Food Processing Hub',
    location: 'Sanwer Road Industrial Area, Indore, MP',
    coordinates: [22.7750, 75.8360],
    travelTimeMinutes: 28
  };

  // Route lines
  // 1. Original route (e.g. Indore -> Delhi or Mumbai)
  const originalRouteCoords = batch?.currentRoute?.routeCoordinates || [
    warehouseCoords,
    [22.7533, 75.8937]
  ];

  // 2. Dynamic Reroute path to recommended local processor/mart
  const rerouteCoords = [
    warehouseCoords,
    recommendedDest.coordinates || [22.7750, 75.8360]
  ];

  const mapCenter = [22.7196, 75.8577]; // Indore City Center

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-50">
      
      {/* Interactive Map Header Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-lg max-w-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Indore Route Feasibility Engine
          </h4>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="text-sm font-extrabold text-slate-900">
            {batch?.produce || 'Organic Strawberries'} ({batch?.id || 'BAT-9042'})
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isFeasible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {isFeasible ? 'Route Feasible' : 'Route Infeasible'}
          </span>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-lg text-xs space-y-1.5 font-medium">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Legend</div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-3 h-3 rounded-full bg-slate-900"></span>
          <span>Indore Origin Warehouse</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-3 h-1 bg-rose-500 border-b border-dashed border-rose-700"></span>
          <span>Infeasible Planned Route ({batch?.currentRoute?.transitDurationHours || 18}h transit)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-3 h-1 bg-emerald-500"></span>
          <span>Recommended Reroute ({recommendedDest.travelTimeMinutes || 28} mins)</span>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeMapView center={mapCenter} zoom={11} />
        
        {/* CartoDB Positron - Ultra-clean Light theme tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Origin Warehouse Marker */}
        <Marker position={warehouseCoords} icon={createWarehouseIcon()}>
          <Popup>
            <div className="p-1">
              <h4 className="font-bold text-sm text-slate-900">{warehouse.name}</h4>
              <p className="text-xs text-slate-500">{warehouse.location}</p>
              <div className="mt-2 text-xs font-semibold text-emerald-700">
                Origin Cold Storage (Pallet Staging)
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Alternative Destinations Markers */}
        {destinations.map((dest) => {
          const isRec = dest.id === recommendedDestId;
          return (
            <Marker
              key={dest.id}
              position={dest.coordinates || [22.7500, 75.8500]}
              icon={createAlternativeIcon(dest.category, isRec)}
              eventHandlers={{
                click: () => onSelectDestination && onSelectDestination(dest)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">{dest.type}</span>
                    {isRec && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        AI Recommended
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{dest.name}</h4>
                  <p className="text-xs text-slate-500">{dest.location}</p>
                  
                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Distance</span>
                      <strong className="text-slate-800">{dest.distanceKm} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Transit</span>
                      <strong className="text-emerald-700">{dest.travelTimeMinutes} mins</strong>
                    </div>
                  </div>

                  {isRec && batch?.recommendedAction?.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => approveReroute && approveReroute(batch.id, dest.id)}
                      className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                    >
                      Approve Reroute
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Recommended Reroute Polyline */}
        <Polyline
          positions={rerouteCoords}
          pathOptions={{
            color: '#059669',
            weight: 5,
            opacity: 0.9,
          }}
        />

        {/* Planned Highway Route Polyline */}
        <Polyline
          positions={[warehouseCoords, [22.7533, 75.8937]]}
          pathOptions={{
            color: isFeasible ? '#3B82F6' : '#EF4444',
            weight: 3.5,
            opacity: 0.8,
            dashArray: isFeasible ? null : '6, 8',
          }}
        />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
