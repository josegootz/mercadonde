export interface ValidatedMercadoLibreInput {
  isValid: boolean;
  errorReason?: string;
  errorCode?: 'EMPTY_INPUT' | 'MALFORMED_URL' | 'UNSUPPORTED_DOMAIN' | 'INVALID_FORMAT';
  normalizedUrl: string;
  countryCode: 'AR' | 'MX' | 'CL' | 'CO' | 'BR' | 'UY' | 'PE';
  extractedTrackingId: string;
  extractedOrderId?: string;
  extractedItemId?: string;
  extractedProductSlug?: string;
  isDirectCode: boolean;
}

const ML_DOMAIN_MAP: Record<string, 'AR' | 'MX' | 'CL' | 'CO' | 'BR' | 'UY' | 'PE'> = {
  'mercadolibre.com.ar': 'AR',
  'mercadolibre.com.mx': 'MX',
  'mercadolibre.cl': 'CL',
  'mercadolibre.com.co': 'CO',
  'mercadolivre.com.br': 'BR',
  'mercadolibre.com.uy': 'UY',
  'mercadolibre.com.pe': 'PE',
  'mercadolibre.com': 'AR',
  'meli.to': 'AR',
};

/**
 * Deterministic hash helper so the same URL always produces the same tracking ID if not explicitly in the URL.
 */
export function deterministicHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function validateMercadoLibreInput(rawInput: string): ValidatedMercadoLibreInput {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      isValid: false,
      errorCode: 'EMPTY_INPUT',
      errorReason: 'Por favor ingresa un enlace de seguimiento o código de envío de Mercado Libre.',
      normalizedUrl: '',
      countryCode: 'AR',
      extractedTrackingId: '',
      isDirectCode: false,
    };
  }

  // Case 1: Direct tracking ID such as MEL-43918273610, ML-12345678, or numeric shipment ID (8-14 digits)
  const directCodeRegex = /^(?:MEL-|ML-|ENV-|SHIP-)?(\d{8,15})$/i;
  const directMatch = trimmed.match(directCodeRegex);
  if (directMatch) {
    const digits = directMatch[1];
    const trackingId = `MEL-${digits}`;
    return {
      isValid: true,
      normalizedUrl: `https://www.mercadolibre.com.ar/gz/shipping/tracking/${digits}`,
      countryCode: 'AR',
      extractedTrackingId: trackingId,
      extractedOrderId: `200000${digits.slice(0, 8)}`,
      isDirectCode: true,
    };
  }

  // Case 2: URL input (with or without https:// prefix)
  let candidateUrl = trimmed;
  if (!/^https?:\/\//i.test(candidateUrl) && /^(www\.|envios\.|articulo\.|producto\.|myaccount\.|mercadoli)/i.test(candidateUrl)) {
    candidateUrl = `https://${candidateUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidateUrl);
  } catch {
    return {
      isValid: false,
      errorCode: 'MALFORMED_URL',
      errorReason:
        'El formato ingresado no es una URL válida ni un código de seguimiento (ej. MEL-43981273610).',
      normalizedUrl: trimmed,
      countryCode: 'AR',
      extractedTrackingId: '',
      isDirectCode: false,
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const matchedDomainEntry = Object.entries(ML_DOMAIN_MAP).find(
    ([domain]) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!matchedDomainEntry) {
    return {
      isValid: false,
      errorCode: 'UNSUPPORTED_DOMAIN',
      errorReason: `El dominio "${hostname}" no pertenece a Mercado Libre. Usa enlaces de mercadolibre.com.ar, .mx, .cl, .co, etc.`,
      normalizedUrl: parsedUrl.toString(),
      countryCode: 'AR',
      extractedTrackingId: '',
      isDirectCode: false,
    };
  }

  const countryCode = matchedDomainEntry[1];
  const fullPathAndQuery = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

  // Look for explicit shipment / tracking ID in query params or path segments
  const queryShipmentId =
    parsedUrl.searchParams.get('shipment_id') ||
    parsedUrl.searchParams.get('tracking_id') ||
    parsedUrl.searchParams.get('id') ||
    parsedUrl.searchParams.get('pack_id') ||
    parsedUrl.searchParams.get('order_id');

  const pathNumberMatch = parsedUrl.pathname.match(/(?:tracking|shipments|orders|purchases|envios|detail|pack)\/(\d{7,16})/i) ||
    parsedUrl.pathname.match(/(\d{9,16})/);

  // Look for Mercado Libre Item IDs like MLA-1425364758 or MLA1425364758
  const itemMatch = fullPathAndQuery.match(/\b(ML[A-Z])[-_]?(\d{7,12})\b/i);
  const extractedItemId = itemMatch ? `${itemMatch[1].toUpperCase()}${itemMatch[2]}` : undefined;

  // Extract human-readable product slug if present in URL path
  let extractedProductSlug: string | undefined;
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  for (const part of pathParts) {
    const cleaned = part
      .replace(/^ML[A-Z]-?\d+-?/i, '')
      .replace(/-_JM$/i, '')
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ-]/g, ' ')
      .trim();
    if (
      cleaned.length > 8 &&
      !/^(gz|shipping|tracking|myaccount|purchases|orders|detail|envios|p|up)$/i.test(cleaned) &&
      !/^\d+$/.test(cleaned)
    ) {
      extractedProductSlug = cleaned
        .split(/[- ]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      break;
    }
  }

  const numericId =
    (queryShipmentId && /^\d+$/.test(queryShipmentId) ? queryShipmentId : undefined) ||
    (pathNumberMatch ? pathNumberMatch[1] : undefined) ||
    String(40000000000 + (deterministicHash(parsedUrl.toString()) % 9999999999));

  const extractedTrackingId = `MEL-${numericId}`;
  const extractedOrderId =
    parsedUrl.searchParams.get('order_id') || `200000${numericId.slice(0, 8)}`;

  return {
    isValid: true,
    normalizedUrl: parsedUrl.toString(),
    countryCode,
    extractedTrackingId,
    extractedOrderId,
    extractedItemId,
    extractedProductSlug,
    isDirectCode: false,
  };
}
