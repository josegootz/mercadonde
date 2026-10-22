import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      shipmentId: string;
      trackingId: string;
      productTitle: string;
      alertType: string;
      title: string;
      message: string;
      stopsAway: number;
      destination: string;
      emailEnabled?: boolean;
      emailAddress?: string;
      webhookEnabled?: boolean;
      webhookUrl?: string;
    };

    let emailSent = false;
    let emailMode: 'resend_live' | 'simulated' | 'disabled' = 'disabled';
    let webhookSent = false;

    // 1. Resend Email Dispatch
    if (body.emailEnabled && body.emailAddress) {
      const resendApiKey = process.env.RESEND_API_KEY?.trim();
      if (resendApiKey) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from:
                process.env.RESEND_FROM_EMAIL ||
                'MercaDónde Alertas <onboarding@resend.dev>',
              to: [body.emailAddress],
              subject: `${body.title} — ${body.trackingId}`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
                  <div style="background: #FFE600; color: #2D3277; padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                    MercaDónde · Alerta de Seguimiento en Tiempo Real
                  </div>
                  <h2 style="color: #111827; margin-top: 20px;">${body.title}</h2>
                  <p style="color: #374151; font-size: 15px; line-height: 1.5;">${body.message}</p>
                  <div style="background: #f9fafb; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 14px; color: #4b5563;">
                    <div><strong>Producto:</strong> ${body.productTitle}</div>
                    <div><strong>Código:</strong> ${body.trackingId}</div>
                    <div><strong>Paradas restantes:</strong> ${body.stopsAway}</div>
                    <div><strong>Destino:</strong> ${body.destination}</div>
                  </div>
                </div>
              `,
            }),
            signal: AbortSignal.timeout(4000),
          });
          emailSent = emailRes.ok;
          emailMode = 'resend_live';
        } catch {
          emailSent = false;
        }
      } else {
        // Simulated email delivery when RESEND_API_KEY is not set in environment
        emailSent = true;
        emailMode = 'simulated';
      }
    }

    // 2. Outbound Webhook Dispatch (Discord / Slack / Custom HTTP endpoint)
    if (body.webhookEnabled && body.webhookUrl) {
      try {
        const parsedWebhook = new URL(body.webhookUrl);
        if (
          parsedWebhook.protocol === 'https:' ||
          parsedWebhook.protocol === 'http:'
        ) {
          const webhookRes = await fetch(parsedWebhook.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: `shipment.${body.alertType}`,
              content: `${body.title} — **${body.productTitle}** (${body.trackingId}): ${body.message}`,
              shipment: {
                id: body.shipmentId,
                trackingId: body.trackingId,
                productTitle: body.productTitle,
                stopsAway: body.stopsAway,
                destination: body.destination,
              },
              timestamp: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(4000),
          });
          webhookSent = webhookRes.ok;
        }
      } catch {
        webhookSent = false;
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      emailMode,
      webhookSent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al despachar la notificación externa.',
      },
      { status: 500 }
    );
  }
}
