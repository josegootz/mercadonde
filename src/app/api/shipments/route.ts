import { NextRequest, NextResponse } from 'next/server';
import {
  getStorageInfo,
  listShipments,
  resetSeedShipments,
  upsertShipment,
} from '@/lib/db/repository';
import {
  ParseUrlError,
  processMercadoLibreUrl,
} from '@/lib/ml-parser/scraper';
import { Shipment, ShipmentStatus } from '@/types/shipment';

export async function GET() {
  try {
    const [shipments, storage] = await Promise.all([
      listShipments(),
      getStorageInfo(),
    ]);
    return NextResponse.json({
      ok: true,
      storage,
      shipments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al consultar los envíos en la base de datos.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: 'reset_demo';
      url?: string;
      urls?: string[];
      customTitle?: string;
      preferredStatus?: ShipmentStatus;
    };

    if (body.action === 'reset_demo') {
      const shipments = await resetSeedShipments();
      return NextResponse.json({
        ok: true,
        shipments,
      });
    }

    const rawList: string[] = [];
    if (Array.isArray(body.urls)) {
      rawList.push(...body.urls);
    } else if (typeof body.url === 'string') {
      // Split by newline or comma if the user pasted multiple links at once
      const parts = body.url
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      rawList.push(...parts);
    }

    if (rawList.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Debes ingresar al menos un enlace o código de seguimiento de Mercado Libre.',
        },
        { status: 400 }
      );
    }

    const created: Shipment[] = [];
    const errors: ParseUrlError[] = [];

    for (const item of rawList.slice(0, 10)) {
      const outcome = await processMercadoLibreUrl(item, {
        customTitle: rawList.length === 1 ? body.customTitle : undefined,
        preferredStatus: body.preferredStatus,
      });

      if (outcome.ok) {
        const saved = await upsertShipment(outcome.shipment);
        created.push(saved);
      } else {
        errors.push(outcome);
      }
    }

    const allShipments = await listShipments();

    return NextResponse.json(
      {
        ok: created.length > 0,
        created,
        errors,
        shipments: allShipments,
      },
      { status: created.length > 0 ? 201 : 422 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error inesperado al procesar el enlace de Mercado Libre.',
      },
      { status: 500 }
    );
  }
}
