'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { ParseUrlError } from '@/lib/ml-parser/scraper';
import { Shipment } from '@/types/shipment';

interface UrlIngestionBarProps {
  onAddUrls: (params: {
    urlInput: string;
    customTitle?: string;
  }) => Promise<{
    ok: boolean;
    created: Shipment[];
    errors: ParseUrlError[];
  }>;
}

const SAMPLE_PRESETS = [
  {
    label: 'Notebook Lenovo Legion (Llega hoy)',
    url: 'https://www.mercadolibre.com.ar/notebook-gamer-lenovo-legion-5-pro-rtx-4060/p/MLA29481023?shipment_id=44920184712',
    title: 'Notebook Gamer Lenovo Legion 5 Pro 16" RTX 4060 32GB',
  },
  {
    label: 'iPhone 16 Pro (Tracking directo)',
    url: 'https://www.mercadolibre.com.ar/gz/shipping/tracking/44810293845?item_id=MLA19482716',
    title: 'Apple iPhone 16 Pro 256GB Titanio Natural - Distribuidor Autorizado',
  },
  {
    label: 'Taladro DeWalt 20V (Código MEL)',
    url: 'MEL-44719203948',
    title: 'Taladro Percutor Inalámbrico DeWalt DCD7781 20V Brushless + 2 Baterías',
  },
];

export default function UrlIngestionBar({ onAddUrls }: UrlIngestionBarProps) {
  const [urlInput, setUrlInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [showCustomTitle, setShowCustomTitle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    detail: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await onAddUrls({
        urlInput,
        customTitle: customTitle.trim() || undefined,
      });

      if (result.created.length > 0) {
        const first = result.created[0];
        setUrlInput('');
        setCustomTitle('');
        setFeedback({
          type: 'success',
          title:
            result.created.length === 1
              ? `Envío ${first.trackingId} vinculado (${first.product.title})`
              : `${result.created.length} envíos vinculados correctamente`,
          detail: `${first.diagnostic.message} (${first.diagnostic.latencyMs}ms)`,
        });
      } else if (result.errors.length > 0) {
        setFeedback({
          type: 'error',
          title: 'No se pudo procesar el enlace ingresado',
          detail: result.errors.map((err) => err.errorMessage).join(' '),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePresetClick(preset: (typeof SAMPLE_PRESETS)[number]) {
    setUrlInput(preset.url);
    setCustomTitle(preset.title);
    setShowCustomTitle(true);
    setFeedback(null);
  }

  return (
    <section
      aria-label="Ingesta de enlaces de seguimiento de Mercado Libre"
      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Link2 className="h-4 w-4 text-blue-600 dark:text-meli-yellow" />
            <span>Vincular Nuevo Envío o Compra de Mercado Libre</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pega una o varias URLs de seguimiento/compra (separadas por coma) o un código{' '}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[11px]">
              MEL-...
            </code>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomTitle((v) => !v)}
          className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-300 hover:underline"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>
            {showCustomTitle ? 'Ocultar alias de producto' : '+ Personalizar nombre de producto'}
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Ej: https://www.mercadolibre.com.ar/gz/shipping/tracking/44920184712 o MEL-44920184712"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-meli-yellow focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Limpiar campo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !urlInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-meli-action hover:bg-blue-600 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition active:scale-[0.99] disabled:opacity-50 shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando URL...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Rastrear Envío</span>
              </>
            )}
          </button>
        </div>

        {showCustomTitle && (
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Nombre o referencia opcional del paquete (ej. Regalo Cumpleaños / Monitor Oficina)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
      </form>

      {/* Quick Test Presets */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Probar con un clic:</span>
        </span>
        {SAMPLE_PRESETS.map((preset) => (
          <button
            key={preset.url}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 hover:bg-amber-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition"
          >
            + {preset.label}
          </button>
        ))}
      </div>

      {/* Diagnostic / Error Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`mt-3 flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedback.title}</p>
              <p className="opacity-85 mt-0.5">{feedback.detail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-60 hover:opacity-100"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
