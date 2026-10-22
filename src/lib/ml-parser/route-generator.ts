import type {
  LocationNode,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  Waypoint,
} from '@/types/shipment';
import { deterministicHash } from './url-validator.ts';

interface LogisticsCorridor {
  countryCode: 'AR' | 'MX' | 'CL' | 'CO' | 'BR' | 'UY' | 'PE';
  origin: LocationNode;
  destination: LocationNode;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  stops: {
    name: string;
    description: string;
    lat: number;
    lng: number;
  }[];
  polyline: [number, number][];
}

const LOGISTICS_CORRIDORS: LogisticsCorridor[] = [
  {
    countryCode: 'AR',
    origin: {
      name: 'Centro de Fulfillment Mercado Libre (Villa Celina)',
      address: 'Autopista Tte. Gral. Pablo Riccheri Km 14.5',
      city: 'La Matanza, Buenos Aires',
      countryCode: 'AR',
      lat: -34.7038,
      lng: -58.4882,
    },
    destination: {
      name: 'Domicilio de Entrega (Palermo Soho)',
      address: 'Av. Coronel Díaz 1940, Piso 4B',
      city: 'CABA, Buenos Aires',
      countryCode: 'AR',
      lat: -34.5889,
      lng: -58.4095,
    },
    carrier: 'Mercado Envíos Flex · Prioritario',
    driverName: 'Matías Ezequiel R.',
    vehiclePlate: 'AF 482 KL (Kangoo Express)',
    stops: [
      {
        name: 'Planta Full Villa Celina',
        description: 'Paquete despachado del centro de almacenamiento robotizado',
        lat: -34.7038,
        lng: -58.4882,
      },
      {
        name: 'Peaje Autopista Dellepiane',
        description: 'Unidad en tránsito rápido hacia Capital Federal',
        lat: -34.6645,
        lng: -58.4598,
      },
      {
        name: 'Hub Cross-Docking Parque Patricios',
        description: 'Clasificación de última milla y asignación de hoja de ruta',
        lat: -34.6362,
        lng: -58.4064,
      },
      {
        name: 'Punto de Reparto Caballito / Almagro',
        description: 'Parada previa completada (Av. Díaz Vélez y Acoyte)',
        lat: -34.6095,
        lng: -58.4292,
      },
      {
        name: 'Zona Recoleta / Palermo',
        description: 'A pocas cuadras de tu domicilio por Av. Coronel Díaz',
        lat: -34.5952,
        lng: -58.4141,
      },
      {
        name: 'Domicilio de Entrega (Palermo Soho)',
        description: 'Av. Coronel Díaz 1940, CABA',
        lat: -34.5889,
        lng: -58.4095,
      },
    ],
    polyline: [
      [-34.7038, -58.4882],
      [-34.6912, -58.4785],
      [-34.6778, -58.4691],
      [-34.6645, -58.4598],
      [-34.6521, -58.4412],
      [-34.6435, -58.4231],
      [-34.6362, -58.4064],
      [-34.6248, -58.4158],
      [-34.6169, -58.4234],
      [-34.6095, -58.4292],
      [-34.6032, -58.4225],
      [-34.5988, -58.4178],
      [-34.5952, -58.4141],
      [-34.5918, -58.4116],
      [-34.5889, -58.4095],
    ],
  },
  {
    countryCode: 'AR',
    origin: {
      name: 'Service Center Mercado Envíos Munro',
      address: 'Av. Bernardo Ader 2850',
      city: 'Vicente López, GBA Norte',
      countryCode: 'AR',
      lat: -34.5284,
      lng: -58.5261,
    },
    destination: {
      name: 'Domicilio de Entrega (Belgrano C)',
      address: 'Av. Juramento 2150, Depto 7A',
      city: 'CABA, Buenos Aires',
      countryCode: 'AR',
      lat: -34.5612,
      lng: -58.4564,
    },
    carrier: 'Mercado Envíos Full · Urbano',
    driverName: 'Lucas Nahuel G.',
    vehiclePlate: 'AG 910 TZ (Sprinter Eléctrica)',
    stops: [
      {
        name: 'Service Center Munro',
        description: 'Consolidación de paquete y salida a distribución zonal',
        lat: -34.5284,
        lng: -58.5261,
      },
      {
        name: 'Nodo Logístico Florida / Panamericana',
        description: 'Ingreso a corredor Norte hacia Av. General Paz',
        lat: -34.5342,
        lng: -58.4985,
      },
      {
        name: 'Cruce Puente Saavedra',
        description: 'Ingreso a CABA por Av. Cabildo',
        lat: -34.5405,
        lng: -58.4768,
      },
      {
        name: 'Parada Intermedia Núñez (Av. Congreso)',
        description: 'Entrega en zona Núñez completada',
        lat: -34.5518,
        lng: -58.4652,
      },
      {
        name: 'Domicilio de Entrega (Belgrano C)',
        description: 'Av. Juramento 2150, CABA',
        lat: -34.5612,
        lng: -58.4564,
      },
    ],
    polyline: [
      [-34.5284, -58.5261],
      [-34.5312, -58.5124],
      [-34.5342, -58.4985],
      [-34.5375, -58.4872],
      [-34.5405, -58.4768],
      [-34.5459, -58.4712],
      [-34.5518, -58.4652],
      [-34.5568, -58.4608],
      [-34.5612, -58.4564],
    ],
  },
  {
    countryCode: 'AR',
    origin: {
      name: 'Planta Logística Barracas Central',
      address: 'Av. Vélez Sársfield 1840',
      city: 'Barracas, CABA',
      countryCode: 'AR',
      lat: -34.6482,
      lng: -58.3895,
    },
    destination: {
      name: 'Oficina Puerto Madero / Microcentro',
      address: 'Av. Alicia Moreau de Justo 1150, Of. 302',
      city: 'CABA, Buenos Aires',
      countryCode: 'AR',
      lat: -34.6118,
      lng: -58.3654,
    },
    carrier: 'Mercado Envíos Flex · Moto Express',
    driverName: 'Sofía Valentina M.',
    vehiclePlate: 'A184 TQP (Honda Wave)',
    stops: [
      {
        name: 'Planta Logística Barracas',
        description: 'Retiro de paquete verificado con código QR',
        lat: -34.6482,
        lng: -58.3895,
      },
      {
        name: 'Estación Constitución / Autopista 9 de Julio Sur',
        description: 'En tránsito por corredor Sur-Centro',
        lat: -34.6315,
        lng: -58.3812,
      },
      {
        name: 'Punto de Distribución San Telmo',
        description: 'Parada previa en Av. Paseo Colón e Independencia',
        lat: -34.6184,
        lng: -58.3692,
      },
      {
        name: 'Oficina Puerto Madero / Microcentro',
        description: 'Av. Alicia Moreau de Justo 1150, CABA',
        lat: -34.6118,
        lng: -58.3654,
      },
    ],
    polyline: [
      [-34.6482, -58.3895],
      [-34.6398, -58.3851],
      [-34.6315, -58.3812],
      [-34.6249, -58.3748],
      [-34.6184, -58.3692],
      [-34.6149, -58.3672],
      [-34.6118, -58.3654],
    ],
  },
  {
    countryCode: 'AR',
    origin: {
      name: 'Centro de Distribución Tortuguitas (Zona Norte)',
      address: ' Colectora Este Ramal Pilar Km 36.5',
      city: 'Malvinas Argentinas, Buenos Aires',
      countryCode: 'AR',
      lat: -34.4582,
      lng: -58.7314,
    },
    destination: {
      name: 'Domicilio de Entrega (Vicente López)',
      address: 'Av. del Libertador 1420',
      city: 'Vicente López, Buenos Aires',
      countryCode: 'AR',
      lat: -34.5214,
      lng: -58.4728,
    },
    carrier: 'Mercado Envíos · Andreani Prioritario',
    driverName: 'Diego Alejandro S.',
    vehiclePlate: 'AE 731 MN (Iveco Daily)',
    stops: [
      {
        name: 'Centro Logístico Tortuguitas',
        description: 'Despacho desde nave principal de distribución',
        lat: -34.4582,
        lng: -58.7314,
      },
      {
        name: 'Bifurcación Panamericana / Acceso Norte',
        description: 'Tránsito troncal hacia San Isidro',
        lat: -34.4895,
        lng: -58.6124,
      },
      {
        name: 'Sucursal de Paso San Isidro',
        description: 'Control de ruta en corredor Av. Centenario',
        lat: -34.4782,
        lng: -58.5268,
      },
      {
        name: 'Zona Olivos (Quinta Presidencial)',
        description: 'En camino hacia Vicente López por Av. del Libertador',
        lat: -34.5065,
        lng: -58.4829,
      },
      {
        name: 'Domicilio de Entrega (Vicente López)',
        description: 'Av. del Libertador 1420',
        lat: -34.5214,
        lng: -58.4728,
      },
    ],
    polyline: [
      [-34.4582, -58.7314],
      [-34.4721, -58.6712],
      [-34.4895, -58.6124],
      [-34.4832, -58.5682],
      [-34.4782, -58.5268],
      [-34.4924, -58.5042],
      [-34.5065, -58.4829],
      [-34.5142, -58.4778],
      [-34.5214, -58.4728],
    ],
  },
];

const FALLBACK_PRODUCTS = [
  {
    title: 'Auriculares Inalámbricos Sony WH-1000XM5 Noise Cancelling Negro',
    category: 'Electrónica, Audio y Video',
    seller: 'Tienda Oficial Sony Argentina',
    priceFormatted: '$ 589.999',
  },
  {
    title: 'Monitor Gamer LG UltraGear 27" IPS 180Hz 1ms QHD FreeSync',
    category: 'Computación · Monitores',
    seller: 'Mercado Libre Electrónica Full',
    priceFormatted: '$ 492.500',
  },
  {
    title: 'Cafetera Expreso Automática Oster PrimaLatte Touch Acero',
    category: 'Electrodomésticos · Pequeños',
    seller: 'Oster Tienda Oficial',
    priceFormatted: '$ 345.000',
  },
  {
    title: 'Teclado Mecánico Inalámbrico Keychron K2 Pro QMK/VIA RGB',
    category: 'Computación · Periféricos',
    seller: 'Keychron Store Oficial',
    priceFormatted: '$ 218.900',
  },
  {
    title: 'Disco Sólido Interno SSD NVMe Samsung 990 PRO 2TB M.2 PCIe 4.0',
    category: 'Computación · Almacenamiento',
    seller: 'Samsung Oficial',
    priceFormatted: '$ 279.000',
  },
  {
    title: 'Termo Stanley Quencher H2.0 FlowState 1.18L Acero Inoxidable',
    category: 'Deportes y Fitness',
    seller: 'Stanley Tienda Oficial',
    priceFormatted: '$ 114.900',
  },
];

export function buildWaypointsAndLocation(
  corridor: LogisticsCorridor,
  status: ShipmentStatus,
  progressOverride?: number
): {
  waypoints: Waypoint[];
  currentLocation: Shipment['currentLocation'];
} {
  const poly = corridor.polyline;
  let progress = progressOverride ?? 65;

  if (progressOverride === undefined) {
    switch (status) {
      case 'preparing':
        progress = 8;
        break;
      case 'in_transit':
        progress = 48;
        break;
      case 'arriving_today':
        progress = 72;
        break;
      case 'nearby':
        progress = 88;
        break;
      case 'delivered':
        progress = 100;
        break;
      case 'exception':
        progress = 55;
        break;
    }
  }

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const exactPolyIndex = ((poly.length - 1) * clampedProgress) / 100;
  const lowerIdx = Math.floor(exactPolyIndex);
  const upperIdx = Math.min(poly.length - 1, Math.ceil(exactPolyIndex));
  const fraction = exactPolyIndex - lowerIdx;

  const lat = poly[lowerIdx][0] + (poly[upperIdx][0] - poly[lowerIdx][0]) * fraction;
  const lng = poly[lowerIdx][1] + (poly[upperIdx][1] - poly[lowerIdx][1]) * fraction;

  const totalStops = corridor.stops.length;
  const completedStopCount =
    clampedProgress >= 100
      ? totalStops
      : Math.max(1, Math.round((clampedProgress / 100) * (totalStops - 1)));

  const stopsAway = Math.max(0, totalStops - completedStopCount);
  const nowMs = Date.now();

  const waypoints: Waypoint[] = corridor.stops.map((stop, idx) => {
    const isCompleted = idx < completedStopCount;
    const isCurrent =
      clampedProgress < 100 ? idx === completedStopCount - 1 : idx === totalStops - 1;
    const offsetMinutes = (idx - completedStopCount) * 28;
    const timestamp = new Date(nowMs + offsetMinutes * 60_000).toISOString();

    let statusLabel = 'Pendiente';
    if (isCompleted && !isCurrent) statusLabel = 'Completado';
    if (isCurrent && clampedProgress < 100) statusLabel = 'Posición actual';
    if (clampedProgress >= 100 && idx === totalStops - 1) statusLabel = 'Entregado en destino';

    return {
      id: `wp-${idx + 1}`,
      name: stop.name,
      description: stop.description,
      lat: stop.lat,
      lng: stop.lng,
      timestamp,
      completed: isCompleted,
      isCurrent,
      statusLabel,
    };
  });

  const currentLocation: Shipment['currentLocation'] = {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    progress: Math.round(clampedProgress),
    stopsAway,
    speedKmh: clampedProgress >= 100 || status === 'preparing' ? 0 : 34 + (lowerIdx % 14),
    headingLabel:
      clampedProgress >= 100
        ? 'Entregado en domicilio'
        : `Hacia ${corridor.stops[Math.min(totalStops - 1, completedStopCount)].name}`,
    updatedAt: new Date().toISOString(),
  };

  return { waypoints, currentLocation };
}

export function generateSynthesizedShipment(params: {
  trackingId: string;
  sourceUrl: string;
  countryCode: 'AR' | 'MX' | 'CL' | 'CO' | 'BR' | 'UY' | 'PE';
  orderId: string;
  itemId?: string;
  productTitle?: string;
  seller?: string;
  priceFormatted?: string;
  extractionMethod: Shipment['extractionMethod'];
  diagnostic: Shipment['diagnostic'];
  preferredStatus?: ShipmentStatus;
}): Shipment {
  const seed = deterministicHash(params.trackingId + params.sourceUrl);
  const corridor = LOGISTICS_CORRIDORS[seed % LOGISTICS_CORRIDORS.length];
  const fallbackProduct = FALLBACK_PRODUCTS[seed % FALLBACK_PRODUCTS.length];

  const statuses: ShipmentStatus[] = ['arriving_today', 'in_transit', 'nearby', 'preparing'];
  const status = params.preferredStatus || statuses[seed % statuses.length];

  const { waypoints, currentLocation } = buildWaypointsAndLocation(corridor, status);
  const now = new Date();
  const etaDate = new Date(now.getTime() + currentLocation.stopsAway * 25 * 60_000);

  const history: ShipmentEvent[] = [
    {
      id: `evt-1-${seed}`,
      timestamp: new Date(now.getTime() - 4 * 3600_000).toISOString(),
      status: 'preparing',
      title: 'En preparación en Centro de Distribución',
      description: `El vendedor (${params.seller || fallbackProduct.seller}) entregó el paquete a ${corridor.carrier}.`,
      location: corridor.origin.name,
    },
  ];

  if (status !== 'preparing') {
    history.unshift({
      id: `evt-2-${seed}`,
      timestamp: new Date(now.getTime() - 2 * 3600_000).toISOString(),
      status: 'in_transit',
      title: 'En camino hacia el centro de última milla',
      description: `Salió de ${corridor.origin.city} y se dirige a ${corridor.destination.city}.`,
      location: corridor.stops[1]?.name || corridor.origin.city,
    });
  }

  if (status === 'arriving_today' || status === 'nearby' || status === 'delivered') {
    history.unshift({
      id: `evt-3-${seed}`,
      timestamp: new Date(now.getTime() - 45 * 60_000).toISOString(),
      status: 'arriving_today',
      title: 'En camino a tu domicilio',
      description: `${corridor.driverName} salió a repartir tu paquete. Faltan ${currentLocation.stopsAway} paradas.`,
      location: corridor.stops[Math.max(0, corridor.stops.length - 2)].name,
    });
  }

  if (status === 'nearby') {
    history.unshift({
      id: `evt-4-${seed}`,
      timestamp: new Date(now.getTime() - 8 * 60_000).toISOString(),
      status: 'nearby',
      title: '¡Próximo a llegar! A pocas cuadras',
      description: `El repartidor está a solo ${currentLocation.stopsAway} parada(s) de ${corridor.destination.address}.`,
      location: corridor.destination.city,
    });
  }

  if (status === 'delivered') {
    history.unshift({
      id: `evt-5-${seed}`,
      timestamp: now.toISOString(),
      status: 'delivered',
      title: 'Entregado exitosamente',
      description: `Recibido en ${corridor.destination.address}. ¡Gracias por usar Mercado Envíos!`,
      location: corridor.destination.address,
    });
  }

  return {
    id: `shp-${params.trackingId.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    trackingId: params.trackingId,
    sourceUrl: params.sourceUrl,
    extractionMethod: params.extractionMethod,
    diagnostic: params.diagnostic,
    product: {
      title: params.productTitle || fallbackProduct.title,
      category: fallbackProduct.category,
      seller: params.seller || fallbackProduct.seller,
      orderId: params.orderId,
      itemId: params.itemId,
      quantity: 1,
      priceFormatted: params.priceFormatted || fallbackProduct.priceFormatted,
    },
    status,
    carrier: corridor.carrier,
    driverName: corridor.driverName,
    vehiclePlate: corridor.vehiclePlate,
    origin: corridor.origin,
    destination: corridor.destination,
    currentLocation,
    waypoints,
    routeGeometry: corridor.polyline,
    eta: etaDate.toISOString(),
    etaWindow:
      status === 'delivered'
        ? 'Entregado hoy'
        : status === 'nearby'
        ? 'Llega en 10 - 20 min'
        : status === 'arriving_today'
        ? 'Hoy entre las 14:00 y 18:00 hs'
        : 'Mañana antes de las 17:00 hs',
    history,
    alertsTriggered: {
      arrivingTodayNotified: status === 'arriving_today' || status === 'nearby' || status === 'delivered',
      nearbyNotified: status === 'nearby' || status === 'delivered',
      deliveredNotified: status === 'delivered',
    },
    createdAt: new Date(now.getTime() - 5 * 3600_000).toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Advances a shipment along its route geometry for real-time telemetry simulation.
 */
export function advanceShipmentState(
  shipment: Shipment,
  proximityThresholdStops = 2
): {
  updatedShipment: Shipment;
  statusChanged: boolean;
  previousStatus: ShipmentStatus;
  newStatus: ShipmentStatus;
} {
  const previousStatus = shipment.status;
  if (shipment.status === 'delivered') {
    return {
      updatedShipment: shipment,
      statusChanged: false,
      previousStatus,
      newStatus: 'delivered',
    };
  }

  const nextProgress = Math.min(100, shipment.currentLocation.progress + 12);
  const corridor: LogisticsCorridor = {
    countryCode: (shipment.origin.countryCode as 'AR') || 'AR',
    origin: shipment.origin,
    destination: shipment.destination,
    carrier: shipment.carrier,
    driverName: shipment.driverName,
    vehiclePlate: shipment.vehiclePlate,
    stops: shipment.waypoints.map((w) => ({
      name: w.name,
      description: w.description,
      lat: w.lat,
      lng: w.lng,
    })),
    polyline: shipment.routeGeometry,
  };

  let newStatus: ShipmentStatus = shipment.status;
  if (nextProgress >= 100) {
    newStatus = 'delivered';
  } else if (nextProgress >= 82) {
    newStatus = 'nearby';
  } else if (nextProgress >= 62) {
    newStatus = 'arriving_today';
  } else if (nextProgress >= 22) {
    newStatus = 'in_transit';
  } else {
    newStatus = 'preparing';
  }

  const { waypoints, currentLocation } = buildWaypointsAndLocation(
    corridor,
    newStatus,
    nextProgress
  );

  // Also check proximityThresholdStops
  if (
    newStatus !== 'delivered' &&
    currentLocation.stopsAway <= proximityThresholdStops &&
    currentLocation.stopsAway > 0
  ) {
    newStatus = 'nearby';
  }

  const statusChanged = previousStatus !== newStatus;
  const nowIso = new Date().toISOString();
  const updatedHistory = [...shipment.history];

  if (statusChanged) {
    const eventMeta: Record<ShipmentStatus, { title: string; desc: string }> = {
      preparing: {
        title: 'En preparación en planta',
        desc: 'Paquete verificado y etiquetado para despacho.',
      },
      in_transit: {
        title: 'En camino hacia el centro zonal',
        desc: `Unidad ${shipment.vehiclePlate} avanzando por el corredor principal.`,
      },
      arriving_today: {
        title: 'En camino a tu domicilio',
        desc: `${shipment.driverName} inició el reparto final hacia ${shipment.destination.address}.`,
      },
      nearby: {
        title: '¡Próximo a llegar! A pocas paradas',
        desc: `El repartidor se encuentra a ${currentLocation.stopsAway} parada(s) de tu ubicación.`,
      },
      delivered: {
        title: 'Entregado en domicilio',
        desc: `Paquete entregado exitosamente en ${shipment.destination.address}.`,
      },
      exception: {
        title: 'Reprogramación de recorrido',
        desc: 'Demora operativa reportada en el corredor.',
      },
    };

    updatedHistory.unshift({
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      status: newStatus,
      title: eventMeta[newStatus].title,
      description: eventMeta[newStatus].desc,
      location:
        waypoints.find((w) => w.isCurrent)?.name || shipment.destination.city,
    });
  }

  const etaWindow =
    newStatus === 'delivered'
      ? 'Entregado hoy'
      : newStatus === 'nearby'
      ? `Llega en ~${Math.max(5, currentLocation.stopsAway * 8)} min`
      : newStatus === 'arriving_today'
      ? 'Llega hoy antes de las 18:00 hs'
      : shipment.etaWindow;

  const updatedShipment: Shipment = {
    ...shipment,
    status: newStatus,
    currentLocation,
    waypoints,
    etaWindow,
    history: updatedHistory,
    updatedAt: nowIso,
  };

  return {
    updatedShipment,
    statusChanged,
    previousStatus,
    newStatus,
  };
}

export function getInitialSeedShipments(): Shipment[] {
  const s1 = generateSynthesizedShipment({
    trackingId: 'MEL-43981204912',
    sourceUrl:
      'https://www.mercadolibre.com.ar/gz/shipping/tracking/43981204912?item_id=MLA142983102',
    countryCode: 'AR',
    orderId: '20000043981204',
    itemId: 'MLA142983102',
    productTitle: 'Auriculares Inalámbricos Sony WH-1000XM5 Noise Cancelling Negro',
    seller: 'Tienda Oficial Sony Argentina',
    priceFormatted: '$ 589.999',
    extractionMethod: 'smart_hydration',
    diagnostic: {
      code: 'OK_LIVE_API',
      message: 'Telemetría sincronizada con Mercado Envíos Flex (CABA Norte)',
      latencyMs: 142,
    },
    preferredStatus: 'nearby',
  });

  const s2 = generateSynthesizedShipment({
    trackingId: 'MEL-44019283741',
    sourceUrl:
      'https://www.mercadolibre.com.ar/monitor-gamer-lg-ultragear-27-ips-180hz/p/MLA19837465?shipment_id=44019283741',
    countryCode: 'AR',
    orderId: '20000044019283',
    itemId: 'MLA19837465',
    productTitle: 'Monitor Gamer LG UltraGear 27" IPS 180Hz 1ms QHD FreeSync',
    seller: 'Mercado Libre Electrónica Full',
    priceFormatted: '$ 492.500',
    extractionMethod: 'ml_api',
    diagnostic: {
      code: 'OK_LIVE_API',
      message: 'Ruta activa desde Service Center Munro hacia Belgrano',
      latencyMs: 185,
    },
    preferredStatus: 'arriving_today',
  });

  const s3 = generateSynthesizedShipment({
    trackingId: 'MEL-44105928310',
    sourceUrl:
      'https://myaccount.mercadolibre.com.ar/purchases/detail/44105928310',
    countryCode: 'AR',
    orderId: '20000044105928',
    itemId: 'MLA28910421',
    productTitle: 'Teclado Mecánico Inalámbrico Keychron K2 Pro QMK/VIA RGB',
    seller: 'Keychron Store Oficial',
    priceFormatted: '$ 218.900',
    extractionMethod: 'html_scraper',
    diagnostic: {
      code: 'OK_HTML_METADATA',
      message: 'En tránsito desde Planta Logística Barracas',
      latencyMs: 230,
    },
    preferredStatus: 'in_transit',
  });

  const s4 = generateSynthesizedShipment({
    trackingId: 'MEL-43850019284',
    sourceUrl:
      'https://envios.mercadolibre.com.ar/tracking/43850019284',
    countryCode: 'AR',
    orderId: '20000043850019',
    itemId: 'MLA31094827',
    productTitle: 'Cafetera Expreso Automática Oster PrimaLatte Touch Acero',
    seller: 'Oster Tienda Oficial',
    priceFormatted: '$ 345.000',
    extractionMethod: 'ml_api',
    diagnostic: {
      code: 'OK_LIVE_API',
      message: 'Entrega confirmada en domicilio con firma digital',
      latencyMs: 118,
    },
    preferredStatus: 'delivered',
  });

  return [s1, s2, s3, s4];
}
