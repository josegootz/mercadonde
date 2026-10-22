'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing,
  ListFilter,
  Map as MapIcon,
  PackageOpen,
  Volume2,
  X,
} from 'lucide-react';
import AlertsConfigModal from '@/components/AlertsConfigModal';
import DashboardStats from '@/components/DashboardStats';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import ShipmentCard from '@/components/ShipmentCard';
import ShipmentFilters, { SortOrder } from '@/components/ShipmentFilters';
import UrlIngestionBar from '@/components/UrlIngestionBar';
import { ParseUrlError } from '@/lib/ml-parser/scraper';
import { dispatchMultiChannelAlert } from '@/lib/notifications/notifier';
import {
  AlertNotificationItem,
  Shipment,
  ShipmentStatus,
  UserPreferences,
} from '@/types/shipment';

const DEFAULT_PREFS: UserPreferences = {
  id: 'default-user',
  soundEnabled: true,
  soundVolume: 0.8,
  browserPushEnabled: true,
  emailEnabled: false,
  emailAddress: '',
  webhookEnabled: false,
  webhookUrl: '',
  proximityThresholdStops: 2,
  updatedAt: new Date().toISOString(),
};

const STATUS_PRIORITY: Record<ShipmentStatus, number> = {
  nearby: 1,
  arriving_today: 2,
  in_transit: 3,
  preparing: 4,
  exception: 5,
  delivered: 6,
};

export default function MercaDondePage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [storageEngine, setStorageEngine] = useState<
    'mongodb' | 'local_nosql_json'
  >('local_nosql_json');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'single' | 'global'>('single');
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const [activeFilter, setActiveFilter] = useState<ShipmentStatus | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority_eta');
  const [isLoading, setIsLoading] = useState(true);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Alerts & Preferences State
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFS);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotificationItem[]>(
    []
  );
  const [activeToast, setActiveToast] = useState<AlertNotificationItem | null>(
    null
  );

  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  // Initialize theme (Dark/Light mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('mercadonde_theme');
    const prefersDark =
      savedTheme === 'dark' ||
      (!savedTheme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  function handleToggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('mercadonde_theme', next ? 'dark' : 'light');
      return next;
    });
  }

  // Initial fetch of Shipments and Preferences
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [shpRes, prefRes] = await Promise.all([
          fetch('/api/shipments'),
          fetch('/api/alerts/preferences'),
        ]);
        if (shpRes.ok) {
          const shpData = (await shpRes.json()) as {
            shipments: Shipment[];
            storage?: { engine: 'mongodb' | 'local_nosql_json' };
          };
          setShipments(shpData.shipments || []);
          if (shpData.storage?.engine) {
            setStorageEngine(shpData.storage.engine);
          }
          if (shpData.shipments?.length > 0) {
            setSelectedId(shpData.shipments[0].id);
          }
        }
        if (prefRes.ok) {
          const prefData = (await prefRes.json()) as {
            preferences: UserPreferences;
          };
          if (prefData.preferences) {
            setPreferences(prefData.preferences);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Trigger alert when a shipment enters arriving_today, nearby, or delivered
  const triggerAlertIfEligible = useCallback(
    async (updatedShipment: Shipment, newStatus: ShipmentStatus) => {
      if (
        newStatus !== 'arriving_today' &&
        newStatus !== 'nearby' &&
        newStatus !== 'delivered'
      ) {
        return;
      }

      const alertItem = await dispatchMultiChannelAlert({
        shipment: updatedShipment,
        alertType: newStatus,
        preferences,
      });

      setNotifications((prev) => [alertItem, ...prev]);
      setActiveToast(alertItem);
    },
    [preferences]
  );

  // Advance shipment along its route (manual or live simulation)
  const handleAdvanceShipment = useCallback(
    async (shipmentId: string) => {
      setAdvancingId(shipmentId);
      try {
        const res = await fetch(`/api/shipments/${shipmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'advance' }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            shipment: Shipment;
            statusChanged: boolean;
            newStatus: ShipmentStatus;
          };
          setShipments((prev) =>
            prev.map((s) => (s.id === data.shipment.id ? data.shipment : s))
          );

          if (data.statusChanged) {
            await triggerAlertIfEligible(data.shipment, data.newStatus);
          }
        }
      } finally {
        setAdvancingId(null);
      }
    },
    [triggerAlertIfEligible]
  );

  // Live Tracking Simulation Interval (every 5 seconds advances active shipment)
  useEffect(() => {
    if (!isLiveSimulation) return;

    const timer = setInterval(() => {
      const activeCandidates = shipments.filter(
        (s) => s.status !== 'delivered'
      );
      if (activeCandidates.length === 0) {
        setIsLiveSimulation(false);
        return;
      }
      const target =
        activeCandidates.find((s) => s.id === selectedId) ||
        activeCandidates[0];
      handleAdvanceShipment(target.id);
    }, 4500);

    return () => clearInterval(timer);
  }, [isLiveSimulation, shipments, selectedId, handleAdvanceShipment]);

  // Add new shipment(s) from URL bar
  async function handleAddUrls(params: {
    urlInput: string;
    customTitle?: string;
  }): Promise<{
    ok: boolean;
    created: Shipment[];
    errors: ParseUrlError[];
  }> {
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: params.urlInput,
        customTitle: params.customTitle,
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      created?: Shipment[];
      errors?: ParseUrlError[];
      shipments?: Shipment[];
      error?: string;
    };

    if (data.shipments) {
      setShipments(data.shipments);
    }

    if (data.created && data.created.length > 0) {
      const newest = data.created[0];
      setSelectedId(newest.id);
      setMapViewMode('single');
      if (
        newest.status === 'arriving_today' ||
        newest.status === 'nearby'
      ) {
        await triggerAlertIfEligible(newest, newest.status);
      }
    }

    return {
      ok: Boolean(data.ok),
      created: data.created || [],
      errors:
        data.errors ||
        (data.error
          ? [
              {
                ok: false,
                input: params.urlInput,
                errorCode: 'REQUEST_ERROR',
                errorMessage: data.error,
              },
            ]
          : []),
    };
  }

  async function handleDeleteShipment(id: string) {
    const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setShipments((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        if (selectedId === id) {
          setSelectedId(remaining[0]?.id || null);
        }
        return remaining;
      });
    }
  }

  async function handleResetDemo() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo' }),
      });
      if (res.ok) {
        const data = (await res.json()) as { shipments: Shipment[] };
        setShipments(data.shipments || []);
        if (data.shipments?.length > 0) {
          setSelectedId(data.shipments[0].id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSavePreferences(partial: Partial<UserPreferences>) {
    const res = await fetch('/api/alerts/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const data = (await res.json()) as { preferences: UserPreferences };
      setPreferences(data.preferences);
    }
  }

  function handleSelectShipment(id: string) {
    setSelectedId(id);
    setMapViewMode('single');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('map');
      setTimeout(() => {
        mapSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
    }
  }

  // Filtered and Sorted Shipments
  const filteredShipments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = shipments.filter((shp) => {
      if (activeFilter !== 'all' && shp.status !== activeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        shp.trackingId.toLowerCase().includes(q) ||
        shp.product.title.toLowerCase().includes(q) ||
        shp.product.seller.toLowerCase().includes(q) ||
        shp.destination.address.toLowerCase().includes(q) ||
        shp.destination.city.toLowerCase().includes(q) ||
        shp.origin.city.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      if (sortOrder === 'priority_eta') {
        const pDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (pDiff !== 0) return pDiff;
        return a.currentLocation.stopsAway - b.currentLocation.stopsAway;
      }
      if (sortOrder === 'recent_updated') {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [shipments, activeFilter, searchQuery, sortOrder]);

  const selectedShipment = useMemo(
    () =>
      shipments.find((s) => s.id === selectedId) ||
      filteredShipments[0] ||
      null,
    [shipments, selectedId, filteredShipments]
  );

  const unreadAlertsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header
        storageEngine={storageEngine}
        isLiveSimulation={isLiveSimulation}
        soundEnabled={preferences.soundEnabled}
        unreadAlertsCount={unreadAlertsCount}
        isDark={isDark}
        onToggleLiveSimulation={() => setIsLiveSimulation((v) => !v)}
        onToggleSound={() =>
          handleSavePreferences({ soundEnabled: !preferences.soundEnabled })
        }
        onOpenAlertsModal={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          setIsAlertsModalOpen(true);
        }}
        onToggleTheme={handleToggleTheme}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* 1. URL Ingestion Bar */}
        <UrlIngestionBar onAddUrls={handleAddUrls} />

        {/* 2. KPI Summary Strip */}
        <DashboardStats
          shipments={shipments}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Mobile View Switcher (Visible on Mobile/Tablet < lg) */}
        <div className="flex lg:hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              mobileTab === 'list'
                ? 'bg-slate-900 text-white dark:bg-meli-yellow dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            <span>Envíos ({filteredShipments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              mobileTab === 'map'
                ? 'bg-slate-900 text-white dark:bg-meli-yellow dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <span>Mapa en Vivo y Ruta</span>
          </button>
        </div>

        {/* 3. Main Split Dashboard Grid (Mobile-First -> 12-Col Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Filters + Shipment Cards List */}
          <div
            className={`lg:col-span-5 space-y-3.5 ${
              mobileTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            <ShipmentFilters
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              sortOrder={sortOrder}
              onSearchChange={setSearchQuery}
              onFilterChange={setActiveFilter}
              onSortChange={setSortOrder}
            />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <PackageOpen className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No se encontraron envíos con ese criterio
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Prueba limpiando los filtros o agrega un nuevo enlace de Mercado Libre arriba.
                </p>
                {activeFilter !== 'all' || searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-3 rounded-xl bg-slate-900 dark:bg-meli-yellow px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-950"
                  >
                    Mostrar todos los envíos
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShipments.map((shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    isSelected={selectedShipment?.id === shipment.id}
                    isAdvancing={advancingId === shipment.id}
                    onSelect={handleSelectShipment}
                    onAdvance={handleAdvanceShipment}
                    onDelete={handleDeleteShipment}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Map + Waypoints & Telemetry */}
          <div
            ref={mapSectionRef}
            className={`lg:col-span-7 lg:sticky lg:top-16 ${
              mobileTab === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <MapView
              shipments={filteredShipments.length > 0 ? filteredShipments : shipments}
              selectedShipment={selectedShipment}
              viewMode={mapViewMode}
              isDark={isDark}
              advancingId={advancingId}
              onViewModeChange={setMapViewMode}
              onSelectShipment={(id) => {
                setSelectedId(id);
                setMapViewMode('single');
              }}
              onAdvanceShipment={handleAdvanceShipment}
            />
          </div>
        </div>
      </main>

      {/* Live Toast Alert Notification */}
      {activeToast && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-40 rounded-2xl border border-amber-300 dark:border-amber-500/50 bg-white dark:bg-slate-900 p-4 shadow-2xl ring-4 ring-meli-yellow/25 transition-all"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-meli-yellow text-meli-blue">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {activeToast.title}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {activeToast.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {activeToast.channelsDispatched.includes('sound') && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-meli-yellow">
                      <Volume2 className="h-3 w-3" /> Alerta Sonora reproducida
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeToast.trackingId}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alerts & Preferences Modal */}
      <AlertsConfigModal
        isOpen={isAlertsModalOpen}
        preferences={preferences}
        notifications={notifications}
        onClose={() => setIsAlertsModalOpen(false)}
        onSavePreferences={handleSavePreferences}
        onClearNotifications={() => setNotifications([])}
      />
    </div>
  );
}
