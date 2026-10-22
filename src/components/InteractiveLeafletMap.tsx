'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shipment, ShipmentStatus } from '@/types/shipment';

interface InteractiveLeafletMapProps {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  viewMode: 'single' | 'global';
  isDark: boolean;
  onSelectShipment: (shipmentId: string) => void;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'En preparación',
  in_transit: 'En distribución',
  arriving_today: 'Llega hoy · En camino',
  nearby: '¡Próximo a llegar!',
  delivered: 'Entregado',
  exception: 'Demorado',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  preparing: '#f59e0b',
  in_transit: '#3b82f6',
  arriving_today: '#6366f1',
  nearby: '#10b981',
  delivered: '#059669',
  exception: '#ef4444',
};

export default function InteractiveLeafletMap({
  shipments,
  selectedShipment,
  viewMode,
  isDark,
  onSelectShipment,
}: InteractiveLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlaysLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-34.6037, -58.4316],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const overlays = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    overlaysLayerRef.current = overlays;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      overlaysLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile theme dynamically when Dark/Light mode changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const nextUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(nextUrl);
  }, [isDark]);

  // Render routes, intermediate waypoints, origin/destination and live courier markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlays = overlaysLayerRef.current;
    if (!map || !overlays) return;

    overlays.clearLayers();

    const targetShipments =
      viewMode === 'single' && selectedShipment
        ? [selectedShipment]
        : shipments;

    if (targetShipments.length === 0) return;

    const allBoundsPoints: L.LatLngExpression[] = [];

    for (const shp of targetShipments) {
      const isFocused = selectedShipment?.id === shp.id;
      const routeColor = STATUS_COLORS[shp.status] || '#3b82f6';
      const poly = shp.routeGeometry;

      if (poly && poly.length >= 2) {
        const splitIdx = Math.max(
          1,
          Math.ceil(((poly.length - 1) * shp.currentLocation.progress) / 100)
        );
        const completedSegment = poly.slice(0, splitIdx + 1);
        const remainingSegment = poly.slice(Math.max(0, splitIdx - 1));

        // Completed route polyline
        L.polyline(completedSegment, {
          color: routeColor,
          weight: isFocused || viewMode === 'single' ? 5 : 3.5,
          opacity: isFocused || viewMode === 'single' ? 0.95 : 0.65,
          lineCap: 'round',
        }).addTo(overlays);

        // Remaining route polyline (dashed)
        if (shp.currentLocation.progress < 100 && remainingSegment.length >= 2) {
          L.polyline(remainingSegment, {
            color: isDark ? '#94a3b8' : '#64748b',
            weight: isFocused || viewMode === 'single' ? 3.5 : 2.5,
            opacity: 0.6,
            dashArray: '8, 8',
          }).addTo(overlays);
        }

        for (const pt of poly) {
          allBoundsPoints.push(pt);
        }
      }

      // Origin Distribution Center & Destination markers (shown in single view or focused shipment)
      if (viewMode === 'single' || isFocused) {
        const originIcon = L.divIcon({
          className: 'custom-leaflet-div-icon',
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#1e293b;color:#fde047;border:2px solid #fde047;box-shadow:0 4px 10px rgba(0,0,0,0.35);font-size:14px;" title="Origen">
              🏭
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.marker([shp.origin.lat, shp.origin.lng], { icon: originIcon })
          .bindTooltip(
            `<div style="font-family:system-ui;padding:2px 4px;">
              <div style="font-weight:700;font-size:12px;">Origen · Centro de Distribución</div>
              <div style="font-size:11px;opacity:0.85;">${shp.origin.name}</div>
              <div style="font-size:10px;opacity:0.7;">${shp.origin.address}, ${shp.origin.city}</div>
            </div>`,
            { direction: 'top', offset: [0, -12] }
          )
          .addTo(overlays);

        const destIcon = L.divIcon({
          className: 'custom-leaflet-div-icon',
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#059669;color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.35);font-size:15px;" title="Destino">
              🏠
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([shp.destination.lat, shp.destination.lng], { icon: destIcon })
          .bindTooltip(
            `<div style="font-family:system-ui;padding:2px 4px;">
              <div style="font-weight:700;font-size:12px;">Destino de Entrega</div>
              <div style="font-size:11px;opacity:0.9;">${shp.destination.address}</div>
              <div style="font-size:10px;opacity:0.75;">${shp.destination.city} · ${shp.etaWindow}</div>
            </div>`,
            { direction: 'top', offset: [0, -14] }
          )
          .addTo(overlays);

        // Intermediate stops (Waypoints)
        shp.waypoints.slice(1, -1).forEach((wp, idx) => {
          const wpIcon = L.divIcon({
            className: 'custom-leaflet-div-icon',
            html: `
              <div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:${
                wp.completed ? routeColor : isDark ? '#334155' : '#e2e8f0'
              };color:${
              wp.completed ? '#ffffff' : isDark ? '#cbd5e1' : '#475569'
            };border:2px solid #ffffff;font-size:10px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                ${wp.completed ? '✓' : idx + 1}
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker([wp.lat, wp.lng], { icon: wpIcon })
            .bindTooltip(
              `<div style="font-family:system-ui;padding:2px 4px;">
                <div style="font-weight:700;font-size:11px;">Parada #${idx + 1}: ${wp.name}</div>
                <div style="font-size:10px;opacity:0.85;">${wp.description}</div>
                <div style="font-size:10px;font-weight:600;color:${routeColor};">${wp.statusLabel}</div>
              </div>`,
              { direction: 'top', offset: [0, -8] }
            )
            .addTo(overlays);
        });
      }

      // Current Package / Courier Marker with Pulse and Interactive Tooltip
      const isMoving = shp.status !== 'delivered' && shp.status !== 'preparing';
      const courierIcon = L.divIcon({
        className: 'custom-leaflet-div-icon',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:42px;height:42px;">
            ${
              isMoving
                ? `<span style="position:absolute;width:42px;height:42px;border-radius:9999px;background:${routeColor};opacity:0.35;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>`
                : ''
            }
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#FFE600;color:#1e293b;border:2.5px solid #2D3277;box-shadow:0 6px 14px rgba(0,0,0,0.38);font-size:18px;cursor:pointer;">
              ${shp.status === 'delivered' ? '✅' : '🚚'}
            </div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const courierMarker = L.marker(
        [shp.currentLocation.lat, shp.currentLocation.lng],
        {
          icon: courierIcon,
          zIndexOffset: isFocused ? 1000 : 500,
        }
      );

      const tooltipHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;min-width:210px;padding:4px 6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;background:#FFE600;color:#2D3277;">
              ${shp.trackingId}
            </span>
            <span style="font-size:10px;font-weight:700;color:${routeColor};">
              ${STATUS_LABELS[shp.status]}
            </span>
          </div>
          <div style="font-weight:700;font-size:12px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px;">
            ${shp.product.title}
          </div>
          <div style="font-size:11px;opacity:0.85;">
            ${
              shp.status === 'delivered'
                ? `Entregado en ${shp.destination.address}`
                : `A <strong>${shp.currentLocation.stopsAway} parada(s)</strong> · Avance ${shp.currentLocation.progress}%`
            }
          </div>
          <div style="font-size:10px;opacity:0.7;margin-top:2px;">
            Repartidor: ${shp.driverName} · ${shp.etaWindow}
          </div>
        </div>
      `;

      courierMarker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -18],
        permanent: viewMode === 'single' && isFocused,
        opacity: 0.97,
      });

      courierMarker.on('click', () => {
        onSelectShipment(shp.id);
      });

      courierMarker.addTo(overlays);
      allBoundsPoints.push([shp.currentLocation.lat, shp.currentLocation.lng]);
    }

    if (allBoundsPoints.length > 0) {
      const bounds = L.latLngBounds(allBoundsPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [42, 42],
          maxZoom: 14,
          animate: true,
        });
      }
    }
  }, [shipments, selectedShipment, viewMode, isDark, onSelectShipment]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div
        ref={mapContainerRef}
        className="h-full w-full min-h-[340px] sm:min-h-[440px] lg:min-h-[540px] z-0"
        aria-label="Mapa interactivo de seguimiento de envíos de Mercado Libre"
      />
    </div>
  );
}
