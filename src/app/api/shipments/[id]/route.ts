import { NextRequest, NextResponse } from 'next/server';
import {
  getShipmentById,
  getUserPreferences,
  removeShipment,
  upsertShipment,
} from '@/lib/db/repository';
import {
  advanceShipmentState,
  buildWaypointsAndLocation,
} from '@/lib/ml-parser/route-generator';
import { ShipmentStatus } from '@/types/shipment';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const shipment = await getShipmentById(id);
  if (!shipment) {
    return NextResponse.json(
      { ok: false, error: 'Envío no encontrado.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, shipment });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const existing = await getShipmentById(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Envío no encontrado.' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      action?: 'advance' | 'set_status';
      status?: ShipmentStatus;
      productTitle?: string;
    };

    const prefs = await getUserPreferences();

    if (body.action === 'advance') {
      const result = advanceShipmentState(
        existing,
        prefs.proximityThresholdStops
      );
      const saved = await upsertShipment(result.updatedShipment);
      return NextResponse.json({
        ok: true,
        shipment: saved,
        statusChanged: result.statusChanged,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
      });
    }

    if (body.action === 'set_status' && body.status) {
      const previousStatus = existing.status;
      const newStatus = body.status;
      const { waypoints, currentLocation } = buildWaypointsAndLocation(
        {
          countryCode: (existing.origin.countryCode as 'AR') || 'AR',
          origin: existing.origin,
          destination: existing.destination,
          carrier: existing.carrier,
          driverName: existing.driverName,
          vehiclePlate: existing.vehiclePlate,
          stops: existing.waypoints.map((w) => ({
            name: w.name,
            description: w.description,
            lat: w.lat,
            lng: w.lng,
          })),
          polyline: existing.routeGeometry,
        },
        newStatus
      );

      const nowIso = new Date().toISOString();
      const statusTitles: Record<ShipmentStatus, string> = {
        preparing: 'En preparación en planta logística',
        in_transit: 'En camino hacia el centro de distribución zonal',
        arriving_today: 'En camino a tu domicilio',
        nearby: `¡Próximo a llegar! A ${currentLocation.stopsAway} parada(s)`,
        delivered: 'Entregado en domicilio',
        exception: 'Demora operativa en ruta',
      };

      const updatedHistory = [
        {
          id: `evt-${Date.now()}`,
          timestamp: nowIso,
          status: newStatus,
          title: statusTitles[newStatus],
          description: `Actualización de estado: ${statusTitles[newStatus]} (${existing.carrier}).`,
          location:
            waypoints.find((w) => w.isCurrent)?.name ||
            existing.destination.city,
        },
        ...existing.history,
      ];

      const updated = await upsertShipment({
        ...existing,
        status: newStatus,
        currentLocation,
        waypoints,
        history: updatedHistory,
        updatedAt: nowIso,
      });

      return NextResponse.json({
        ok: true,
        shipment: updated,
        statusChanged: previousStatus !== newStatus,
        previousStatus,
        newStatus,
      });
    }

    if (body.productTitle) {
      const updated = await upsertShipment({
        ...existing,
        product: {
          ...existing.product,
          title: body.productTitle.trim(),
        },
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        ok: true,
        shipment: updated,
        statusChanged: false,
      });
    }

    return NextResponse.json({ ok: true, shipment: existing });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el envío.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const deleted = await removeShipment(id);
  return NextResponse.json({ ok: deleted });
}
