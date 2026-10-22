'use client';

import React from 'react';
import {
  Bell,
  Database,
  Moon,
  PackageSearch,
  Radio,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface HeaderProps {
  storageEngine: 'mongodb' | 'local_nosql_json';
  isLiveSimulation: boolean;
  soundEnabled: boolean;
  unreadAlertsCount: number;
  isDark: boolean;
  onToggleLiveSimulation: () => void;
  onToggleSound: () => void;
  onOpenAlertsModal: () => void;
  onToggleTheme: () => void;
  onResetDemo: () => void;
}

export default function Header({
  storageEngine,
  isLiveSimulation,
  soundEnabled,
  unreadAlertsCount,
  isDark,
  onToggleLiveSimulation,
  onToggleSound,
  onOpenAlertsModal,
  onToggleTheme,
  onResetDemo,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-meli-yellow text-meli-blue shadow-xs border border-amber-300/80">
            <PackageSearch className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Merca<span className="text-blue-600 dark:text-meli-yellow">Dónde</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                <Database className="h-2.5 w-2.5 text-emerald-500" />
                {storageEngine === 'mongodb' ? 'MongoDB Atlas' : 'NoSQL Local Store'}
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Centralización y telemetría de envíos de Mercado Libre en tiempo real
            </p>
          </div>
        </div>

        {/* Action Controls (Mobile-first compact layout) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Telemetry Simulation Toggle */}
          <button
            type="button"
            onClick={onToggleLiveSimulation}
            title="Activar/Pausar avance automático de envíos en el mapa"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition border ${
              isLiveSimulation
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio
              className={`h-3.5 w-3.5 ${
                isLiveSimulation ? 'text-emerald-500 animate-pulse' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {isLiveSimulation ? 'Rastreo Vivo: ON' : 'Simular Ruta'}
            </span>
            <span className="sm:hidden">{isLiveSimulation ? 'Vivo' : 'Sim'}</span>
          </button>

          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={
              soundEnabled
                ? 'Alertas sonoras activadas (clic para silenciar)'
                : 'Alertas sonoras silenciadas (clic para activar)'
            }
            className={`inline-flex h-8 w-8 sm:h-9 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-xl border transition ${
              soundEnabled
                ? 'border-amber-300/80 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="hidden lg:inline text-xs font-medium">
              {soundEnabled ? 'Audio ON' : 'Mute'}
            </span>
          </button>

          {/* Alerts & Notifications Drawer/Modal Button */}
          <button
            type="button"
            onClick={onOpenAlertsModal}
            className="relative inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
            title="Configurar alertas sonoras, notificaciones push, email y webhooks"
          >
            <Bell className="h-4 w-4 text-blue-600 dark:text-meli-yellow" />
            <span className="hidden md:inline">Alertas</span>
            {unreadAlertsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={onResetDemo}
            title="Restaurar envíos de demostración"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Cambiar tema claro u oscuro"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-meli-yellow" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
