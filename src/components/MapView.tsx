'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  CheckCircle2,
  Clock,
  Compass,
  FastForward,
  Globe,
  MapPin,
  Navigation,
  Package,
  Truck,
} from 'lucide-react';
import { Shipment } from '@/types/shipment';

const InteractiveLeafletMap = dynamic(
  () => import('./InteractiveLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] sm:h-[440px] lg:h-[520px] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800/70 animate-pulse">
        <Compass className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Cargando cartografía en tiempo real...
        </p>
      </div>
    ),
  }
);

interface MapViewProps {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  viewMode: 'single' | 'global';
  isDark: boolean;
  advancingId: string | null;
  onViewModeChange: (mode: 'single' | 'global') => void;
  onSelectShipment: (shipmentId: string) => void;
  onAdvanceShipment: (shipmentId: string) => void;
}

export default function MapView({
  shipments,
  selectedShipment,
  viewMode,
  isDark,
  advancingId,
  onViewModeChange,
  onSelectShipment,
  onAdvanceShipment,
}: MapViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Map Card Container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Top Floating Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 px-3.5 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="truncate text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
              {viewMode === 'global'
                ? `Mapa Global (${shipments.length} envíos monitoreados)`
                : selectedShipment
                ? `Trayecto: ${selectedShipment.trackingId}`
                : 'Selecciona un envío'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange('single')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'single'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Individual</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('global')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'global'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Global ({shipments.length})</span>
              </button>
            </div>

            {selectedShipment && selectedShipment.status !== 'delivered' && (
              <button
                type="button"
                disabled={advancingId === selectedShipment.id}
                onClick={() => onAdvanceShipment(selectedShipment.id)}
                title="Simular avance del repartidor en la ruta para probar alertas"
                className="inline-flex items-center gap-1.5 rounded-lg bg-meli-yellow hover:bg-meli-darkYellow text-slate-900 px-2.5 py-1 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                <FastForward className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Avanzar ruta</span>
                <span className="sm:hidden">+1 Parada</span>
              </button>
            )}
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="h-[350px] sm:h-[430px] lg:h-[470px] w-full">
          <InteractiveLeafletMap
            shipments={shipments}
            selectedShipment={selectedShipment}
            viewMode={viewMode}
            isDark={isDark}
            onSelectShipment={onSelectShipment}
          />
        </div>

        {/* Selected Shipment Bottom Telemetry Bar */}
        {selectedShipment && (
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 px-3.5 py-3 sm:px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded-xl bg-white dark:bg-slate-800/70 p-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Origen Logístico
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedShipment.origin.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedShipment.origin.city}
                </p>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-800/70 p-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Destino Final
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedShipment.destination.address}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedShipment.destination.city}
                </p>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-800/70 p-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Progreso y Paradas
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedShipment.status === 'delivered'
                    ? '100% Completado'
                    : `${selectedShipment.currentLocation.progress}% · A ${selectedShipment.currentLocation.stopsAway} parada(s)`}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedShipment.currentLocation.headingLabel}
                </p>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-800/70 p-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Entrega Estimada
                </span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  {selectedShipment.etaWindow}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedShipment.driverName} · {selectedShipment.vehiclePlate}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Intermediate Stops & Event History Card for Selected Shipment */}
      {selectedShipment && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <span>
                  Hoja de Ruta y Paradas Intermedias ({selectedShipment.waypoints.length})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedShipment.product.title} · Orden #{selectedShipment.product.orderId}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <Package className="h-3 w-3" />
              {selectedShipment.carrier}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Waypoints along the route */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Trazado de Paradas
              </h4>
              <ol className="relative border-s border-slate-200 dark:border-slate-700 ms-3 space-y-3">
                {selectedShipment.waypoints.map((wp, index) => (
                  <li key={wp.id} className="ms-4">
                    <span
                      className={`absolute -start-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 text-[10px] font-bold ${
                        wp.isCurrent
                          ? 'bg-meli-yellow text-slate-900 animate-pulse'
                          : wp.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {wp.completed ? '✓' : index + 1}
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            wp.isCurrent
                              ? 'text-blue-600 dark:text-amber-300'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {wp.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {wp.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          wp.isCurrent
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : wp.completed
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {wp.statusLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Column 2: Chronological Events */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Historial de Eventos
              </h4>
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {selectedShipment.history.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {evt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(evt.timestamp).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      {evt.description}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {evt.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
