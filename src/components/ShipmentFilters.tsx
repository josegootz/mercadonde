'use client';

import React from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { ShipmentStatus } from '@/types/shipment';

export type SortOrder = 'priority_eta' | 'recent_updated' | 'oldest_first';

interface ShipmentFiltersProps {
  searchQuery: string;
  activeFilter: ShipmentStatus | 'all';
  sortOrder: SortOrder;
  onSearchChange: (q: string) => void;
  onFilterChange: (filter: ShipmentStatus | 'all') => void;
  onSortChange: (sort: SortOrder) => void;
}

const FILTER_TABS: { id: ShipmentStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'nearby', label: 'Próximo a llegar' },
  { id: 'arriving_today', label: 'Llega hoy' },
  { id: 'in_transit', label: 'En camino' },
  { id: 'preparing', label: 'En preparación' },
  { id: 'delivered', label: 'Entregados' },
];

export default function ShipmentFilters({
  searchQuery,
  activeFilter,
  sortOrder,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: ShipmentFiltersProps) {
  return (
    <div className="space-y-2.5">
      {/* Search + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código MEL, producto, vendedor o ciudad..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-meli-yellow focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <label htmlFor="sort-shipments" className="sr-only">
            Ordenar envíos
          </label>
          <select
            id="sort-shipments"
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="priority_eta" className="dark:bg-slate-900">
              Orden: Más próximos a llegar
            </option>
            <option value="recent_updated" className="dark:bg-slate-900">
              Orden: Actualizados recientemente
            </option>
            <option value="oldest_first" className="dark:bg-slate-900">
              Orden: Orden cronológico de compra
            </option>
          </select>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-slate-900 text-white dark:bg-meli-yellow dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
