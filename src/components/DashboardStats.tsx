'use client';

import React from 'react';
import {
  BellRing,
  CheckCircle2,
  Package,
  Truck,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '@/types/shipment';

interface DashboardStatsProps {
  shipments: Shipment[];
  activeFilter: ShipmentStatus | 'all';
  onFilterChange: (filter: ShipmentStatus | 'all') => void;
}

export default function DashboardStats({
  shipments,
  activeFilter,
  onFilterChange,
}: DashboardStatsProps) {
  const totalCount = shipments.length;
  const inTransitCount = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'preparing'
  ).length;
  const arrivingTodayCount = shipments.filter(
    (s) => s.status === 'arriving_today' || s.status === 'nearby'
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'delivered').length;

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Monitoreados',
      value: totalCount,
      sub: 'Envíos vinculados',
      icon: Package,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
    },
    {
      id: 'in_transit' as const,
      label: 'En Distribución',
      value: inTransitCount,
      sub: 'En planta o tránsito troncal',
      icon: Truck,
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      id: 'nearby' as const,
      label: 'Llegan Hoy / Próximos',
      value: arrivingTodayCount,
      sub: 'En camino a domicilio',
      icon: BellRing,
      accent: 'text-amber-700 dark:text-meli-yellow bg-amber-50 dark:bg-amber-500/15',
    },
    {
      id: 'delivered' as const,
      label: 'Entregados',
      value: deliveredCount,
      sub: 'Completados con éxito',
      icon: CheckCircle2,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    },
  ];

  return (
    <section
      aria-label="Resumen de estado de envíos"
      className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() =>
              onFilterChange(
                activeFilter === card.id && card.id !== 'all' ? 'all' : card.id
              )
            }
            className={`group flex items-center justify-between rounded-2xl border p-3 sm:p-4 text-left transition ${
              isSelected
                ? 'border-blue-500 dark:border-meli-yellow bg-white dark:bg-slate-900 ring-2 ring-blue-500/15 dark:ring-meli-yellow/20'
                : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {card.value}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
                {card.sub}
              </p>
            </div>
            <div
              className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${card.accent} transition group-hover:scale-105`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </button>
        );
      })}
    </section>
  );
}
