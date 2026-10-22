'use client';

import React from 'react';
import {
  Clock,
  ExternalLink,
  FastForward,
  MapPin,
  Navigation,
  Trash2,
  Truck,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '@/types/shipment';

interface ShipmentCardProps {
  shipment: Shipment;
  isSelected: boolean;
  isAdvancing: boolean;
  onSelect: (id: string) => void;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE_MAP: Record<
  ShipmentStatus,
  { label: string; classes: string; dot: string; bar: string }
> = {
  preparing: {
    label: 'En preparación',
    classes:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  in_transit: {
    label: 'En distribución',
    classes:
      'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  arriving_today: {
    label: 'Llega hoy · En camino',
    classes:
      'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    dot: 'bg-indigo-500 animate-ping',
    bar: 'bg-indigo-500',
  },
  nearby: {
    label: '¡Próximo a llegar!',
    classes:
      'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
    dot: 'bg-emerald-500 animate-ping',
    bar: 'bg-emerald-500',
  },
  delivered: {
    label: 'Entregado',
    classes:
      'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-600',
  },
  exception: {
    label: 'Demorado',
    classes:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
};

export default function ShipmentCard({
  shipment,
  isSelected,
  isAdvancing,
  onSelect,
  onAdvance,
  onDelete,
}: ShipmentCardProps) {
  const badge = STATUS_BADGE_MAP[shipment.status] || STATUS_BADGE_MAP.in_transit;

  return (
    <article
      onClick={() => onSelect(shipment.id)}
      className={`group relative cursor-pointer rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
        isSelected
          ? 'border-blue-600 dark:border-meli-yellow bg-blue-50/20 dark:bg-slate-900 shadow-md ring-2 ring-blue-500/15 dark:ring-meli-yellow/20'
          : 'border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      {/* Top Row: Tracking Code + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center rounded-md bg-meli-yellow px-2 py-0.5 font-mono text-[11px] font-extrabold text-meli-blue">
            {shipment.trackingId}
          </span>
          <span className="truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {shipment.carrier}
          </span>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.classes}`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.dot}`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${badge.bar}`}
            />
          </span>
          {badge.label}
        </span>
      </div>

      {/* Product Title & Seller */}
      <div className="mt-2.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-meli-yellow transition-colors">
          {shipment.product.title}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>Vendedor: {shipment.product.seller}</span>
          {shipment.product.priceFormatted && (
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {shipment.product.priceFormatted}
            </span>
          )}
        </div>
      </div>

      {/* Route Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-slate-400" />
            {shipment.status === 'delivered'
              ? 'Recorrido finalizado'
              : `A ${shipment.currentLocation.stopsAway} parada(s) del destino`}
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {shipment.currentLocation.progress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${badge.bar}`}
            style={{ width: `${shipment.currentLocation.progress}%` }}
          />
        </div>
      </div>

      {/* Origin -> Destination + ETA */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">
            <strong>Destino:</strong> {shipment.destination.address}
          </span>
        </div>
        <div className="flex items-center sm:justify-end gap-1.5 text-slate-600 dark:text-slate-300 truncate">
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            {shipment.etaWindow}
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(shipment.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <Navigation className="h-3 w-3 text-blue-500" />
            <span>Ver en mapa</span>
          </button>

          {shipment.status !== 'delivered' && (
            <button
              type="button"
              disabled={isAdvancing}
              onClick={() => onAdvance(shipment.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:text-meli-yellow transition disabled:opacity-50"
            >
              <FastForward className="h-3 w-3" />
              <span>Avanzar</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <a
            href={shipment.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir enlace original de Mercado Libre"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={() => onDelete(shipment.id)}
            title="Eliminar envío del panel"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
