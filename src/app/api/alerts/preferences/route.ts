import { NextRequest, NextResponse } from 'next/server';
import {
  getUserPreferences,
  updateUserPreferences,
} from '@/lib/db/repository';
import { UserPreferences } from '@/types/shipment';

export async function GET() {
  const preferences = await getUserPreferences();
  return NextResponse.json({ ok: true, preferences });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<UserPreferences>;
    const preferences = await updateUserPreferences(body);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron guardar las preferencias.',
      },
      { status: 500 }
    );
  }
}
