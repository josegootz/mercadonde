'use client';

import {
  AlertNotificationItem,
  Shipment,
  UserPreferences,
} from '@/types/shipment';
import { AlertSoundType, playShipmentAlertSound } from './sound-engine';

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export async function dispatchMultiChannelAlert(params: {
  shipment: Shipment;
  alertType: AlertSoundType;
  preferences: UserPreferences;
}): Promise<AlertNotificationItem> {
  const { shipment, alertType, preferences } = params;
  const channelsDispatched: AlertNotificationItem['channelsDispatched'] = [];

  const titles: Record<AlertSoundType, string> = {
    arriving_today: '🚚 ¡Tu envío está en camino a tu domicilio!',
    nearby: `🔔 ¡Próximo a llegar! A ${shipment.currentLocation.stopsAway} parada(s)`,
    delivered: '✅ ¡Paquete entregado en domicilio!',
  };

  const messages: Record<AlertSoundType, string> = {
    arriving_today: `${shipment.product.title} (${shipment.trackingId}) salió a reparto con ${shipment.driverName}.`,
    nearby: `El repartidor de ${shipment.carrier} está a pocos minutos de ${shipment.destination.address}.`,
    delivered: `Tu compra ${shipment.product.title} fue entregada exitosamente en ${shipment.destination.address}.`,
  };

  // 1. Web Audio API Sound Alert
  if (preferences.soundEnabled) {
    const played = playShipmentAlertSound(alertType, preferences.soundVolume);
    if (played) {
      channelsDispatched.push('sound');
    }
  }

  // 2. Native Browser Push Notification
  if (
    preferences.browserPushEnabled &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(titles[alertType], {
        body: messages[alertType],
        tag: `${shipment.id}-${alertType}`,
      });
      channelsDispatched.push('browser_push');
    } catch {
      // Ignore browser notification failure
    }
  }

  // 3. Backend Email (Resend) & Webhook Dispatch
  if (
    (preferences.emailEnabled && preferences.emailAddress) ||
    (preferences.webhookEnabled && preferences.webhookUrl)
  ) {
    try {
      const res = await fetch('/api/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.id,
          trackingId: shipment.trackingId,
          productTitle: shipment.product.title,
          alertType,
          title: titles[alertType],
          message: messages[alertType],
          stopsAway: shipment.currentLocation.stopsAway,
          destination: shipment.destination.address,
          emailEnabled: preferences.emailEnabled,
          emailAddress: preferences.emailAddress,
          webhookEnabled: preferences.webhookEnabled,
          webhookUrl: preferences.webhookUrl,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          emailSent?: boolean;
          webhookSent?: boolean;
        };
        if (data.emailSent) channelsDispatched.push('email');
        if (data.webhookSent) channelsDispatched.push('webhook');
      }
    } catch {
      // Non-blocking external dispatch
    }
  }

  return {
    id: `alrt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    shipmentId: shipment.id,
    trackingId: shipment.trackingId,
    productTitle: shipment.product.title,
    type: alertType,
    title: titles[alertType],
    message: messages[alertType],
    timestamp: new Date().toISOString(),
    channelsDispatched,
    read: false,
  };
}
