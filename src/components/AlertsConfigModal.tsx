'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Mail,
  Play,
  Save,
  Volume2,
  Webhook,
  X,
} from 'lucide-react';
import { requestBrowserNotificationPermission } from '@/lib/notifications/notifier';
import { playShipmentAlertSound } from '@/lib/notifications/sound-engine';
import { AlertNotificationItem, UserPreferences } from '@/types/shipment';

interface AlertsConfigModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  notifications: AlertNotificationItem[];
  onClose: () => void;
  onSavePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  onClearNotifications: () => void;
}

export default function AlertsConfigModal({
  isOpen,
  preferences,
  notifications,
  onClose,
  onSavePreferences,
  onClearNotifications,
}: AlertsConfigModalProps) {
  const [formState, setFormState] = useState<UserPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string>('');

  if (!isOpen) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSavePreferences(formState);
      setSaveMessage('Preferencias de alertas guardadas correctamente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnableBrowserPush() {
    const perm = await requestBrowserNotificationPermission();
    if (perm === 'granted') {
      setFormState((prev) => ({ ...prev, browserPushEnabled: true }));
      setPushStatus('Permiso de notificaciones concedido en el navegador.');
    } else if (perm === 'denied') {
      setPushStatus('Permiso bloqueado en la configuración del navegador.');
    } else {
      setPushStatus('Notificaciones nativas listas.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-meli-yellow text-meli-blue">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="alerts-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Centro de Alertas Sonoras, Push y Webhooks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura avisos cuando tu envío pase a &ldquo;En camino&rdquo; o &ldquo;Próximo a llegar&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <form id="alerts-config-form" onSubmit={handleSave} className="space-y-5">
            {/* 1. Web Audio Sound Alerts */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Alertas Sonoras en Interfaz Web (Web Audio API)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formState.soundEnabled}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, soundEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-slate-500">Volumen:</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={formState.soundVolume}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        soundVolume: parseFloat(e.target.value),
                      }))
                    }
                    className="w-32 accent-blue-600"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {Math.round(formState.soundVolume * 100)}%
                  </span>
                </div>

                {/* Test Sound Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      playShipmentAlertSound('arriving_today', formState.soundVolume)
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <Play className="h-3 w-3 text-blue-500" />
                    <span>Probar &ldquo;En camino&rdquo;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      playShipmentAlertSound('nearby', formState.soundVolume)
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-meli-yellow"
                  >
                    <Play className="h-3 w-3" />
                    <span>Probar &ldquo;Próximo a llegar&rdquo;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Proximity Threshold & Browser Push */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Umbral de alerta &ldquo;Próximo a llegar&rdquo;
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Notificar cuando falten esta cantidad de paradas:
                </p>
                <select
                  value={formState.proximityThresholdStops}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      proximityThresholdStops: Number(e.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white"
                >
                  <option value={1}>A 1 parada del destino</option>
                  <option value={2}>A 2 paradas del destino (Recomendado)</option>
                  <option value={3}>A 3 paradas del destino</option>
                </select>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Notificaciones Push del Navegador
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.browserPushEnabled}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        browserPushEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-blue-600 rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEnableBrowserPush}
                  className="mt-2 inline-flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 transition"
                >
                  Solicitar permiso Push en navegador
                </button>
                {pushStatus && (
                  <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    {pushStatus}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Email (Resend) & Outbound Webhook */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  Alertas Automáticas por Email (Resend API)
                </span>
                <input
                  type="checkbox"
                  checked={formState.emailEnabled}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, emailEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-blue-600 rounded"
                />
              </div>
              <input
                type="email"
                value={formState.emailAddress}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, emailAddress: e.target.value }))
                }
                placeholder="tu-correo@ejemplo.com"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Webhook className="h-3.5 w-3.5 text-purple-500" />
                  Webhook Saliente (Discord / Slack / Endpoint JSON)
                </span>
                <input
                  type="checkbox"
                  checked={formState.webhookEnabled}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, webhookEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-blue-600 rounded"
                />
              </div>
              <input
                type="url"
                value={formState.webhookUrl}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, webhookUrl: e.target.value }))
                }
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
              />
            </div>

            {saveMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>{saveMessage}</span>
              </div>
            )}
          </form>

          {/* Recent Triggered Alerts Feed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registro Reciente de Alertas Disparadas ({notifications.length})
              </h3>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Limpiar historial
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-xs text-slate-500">
                Aún no se han disparado alertas en esta sesión. Usa el botón{' '}
                <strong>&ldquo;Avanzar ruta&rdquo;</strong> o activa{' '}
                <strong>&ldquo;Rastreo Vivo&rdquo;</strong> para probar las alertas en tiempo real.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-100">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString('es-AR')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
          <button
            type="submit"
            form="alerts-config-form"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-meli-action hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Preferencias'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
