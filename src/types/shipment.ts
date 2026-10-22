export type ShipmentStatus =
  | 'preparing'
  | 'in_transit'
  | 'arriving_today'
  | 'nearby'
  | 'delivered'
  | 'exception';

export type ExtractionMethod = 'ml_api' | 'html_scraper' | 'smart_hydration';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationNode extends Coordinates {
  name: string;
  address: string;
  city: string;
  countryCode: string;
}

export interface CurrentLocation extends Coordinates {
  progress: number; // 0 to 100
  stopsAway: number;
  speedKmh: number;
  headingLabel: string;
  updatedAt: string;
}

export interface Waypoint extends Coordinates {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  completed: boolean;
  isCurrent: boolean;
  statusLabel: string;
}

export interface ShipmentEvent {
  id: string;
  timestamp: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  location: string;
}

export interface ProductInfo {
  title: string;
  category: string;
  seller: string;
  orderId: string;
  itemId?: string;
  quantity: number;
  priceFormatted?: string;
}

export interface ParserDiagnostic {
  code:
    | 'OK_LIVE_API'
    | 'OK_HTML_METADATA'
    | 'AUTH_WALL_FALLBACK'
    | 'CAPTCHA_DETECTED_FALLBACK'
    | 'TIMEOUT_FALLBACK'
    | 'DIRECT_CODE_HYDRATED';
  message: string;
  httpStatus?: number;
  latencyMs: number;
}

export interface Shipment {
  id: string;
  trackingId: string;
  sourceUrl: string;
  extractionMethod: ExtractionMethod;
  diagnostic: ParserDiagnostic;
  product: ProductInfo;
  status: ShipmentStatus;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  origin: LocationNode;
  destination: LocationNode;
  currentLocation: CurrentLocation;
  waypoints: Waypoint[];
  routeGeometry: [number, number][];
  eta: string;
  etaWindow: string;
  history: ShipmentEvent[];
  alertsTriggered: {
    arrivingTodayNotified: boolean;
    nearbyNotified: boolean;
    deliveredNotified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  browserPushEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  proximityThresholdStops: number;
  updatedAt: string;
}

export interface AlertNotificationItem {
  id: string;
  shipmentId: string;
  trackingId: string;
  productTitle: string;
  type: 'arriving_today' | 'nearby' | 'delivered' | 'exception';
  title: string;
  message: string;
  timestamp: string;
  channelsDispatched: ('sound' | 'browser_push' | 'email' | 'webhook')[];
  read: boolean;
}
