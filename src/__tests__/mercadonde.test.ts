import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateMercadoLibreInput } from '../lib/ml-parser/url-validator.ts';
import {
  advanceShipmentState,
  generateSynthesizedShipment,
  getInitialSeedShipments,
} from '../lib/ml-parser/route-generator.ts';
import { processMercadoLibreUrl } from '../lib/ml-parser/scraper.ts';

describe('MercaDónde · URL Validator & Parser', () => {
  it('validates official Mercado Libre tracking URLs and extracts shipment ID', () => {
    const res = validateMercadoLibreInput(
      'https://www.mercadolibre.com.ar/gz/shipping/tracking/44920184712?item_id=MLA19482716'
    );
    assert.equal(res.isValid, true);
    assert.equal(res.countryCode, 'AR');
    assert.equal(res.extractedTrackingId, 'MEL-44920184712');
    assert.equal(res.extractedItemId, 'MLA19482716');
  });

  it('validates direct MEL tracking codes', () => {
    const res = validateMercadoLibreInput('MEL-43981204912');
    assert.equal(res.isValid, true);
    assert.equal(res.isDirectCode, true);
    assert.equal(res.extractedTrackingId, 'MEL-43981204912');
  });

  it('extracts product slug and country from regional Mercado Libre product URLs', () => {
    const res = validateMercadoLibreInput(
      'https://www.mercadolibre.com.mx/monitor-gamer-samsung-odyssey-g5/p/MLM19283746?shipment_id=98765432101'
    );
    assert.equal(res.isValid, true);
    assert.equal(res.countryCode, 'MX');
    assert.equal(res.extractedTrackingId, 'MEL-98765432101');
    assert.ok(res.extractedProductSlug?.includes('Monitor Gamer Samsung'));
  });

  it('rejects non-Mercado Libre domains and malformed inputs with clear error codes', () => {
    const invalidDomain = validateMercadoLibreInput('https://www.amazon.com/dp/B08N5WRWNW');
    assert.equal(invalidDomain.isValid, false);
    assert.equal(invalidDomain.errorCode, 'UNSUPPORTED_DOMAIN');

    const malformed = validateMercadoLibreInput('no-es-una-url-valida');
    assert.equal(malformed.isValid, false);
    assert.equal(malformed.errorCode, 'MALFORMED_URL');

    const empty = validateMercadoLibreInput('   ');
    assert.equal(empty.isValid, false);
    assert.equal(empty.errorCode, 'EMPTY_INPUT');
  });
});

describe('MercaDónde · Hybrid Scraper & Error Handling', () => {
  it('processes direct tracking code and returns a complete Shipment object', async () => {
    const outcome = await processMercadoLibreUrl('MEL-44719203948', {
      customTitle: 'Taladro Percutor Inalámbrico DeWalt 20V',
    });
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.shipment.trackingId, 'MEL-44719203948');
      assert.equal(
        outcome.shipment.product.title,
        'Taladro Percutor Inalámbrico DeWalt 20V'
      );
      assert.ok(outcome.shipment.waypoints.length >= 4);
      assert.ok(outcome.shipment.routeGeometry.length >= 5);
    }
  });

  it('returns structured ParseUrlError on invalid domain', async () => {
    const outcome = await processMercadoLibreUrl('https://ebay.com/itm/123456');
    assert.equal(outcome.ok, false);
    if (!outcome.ok) {
      assert.equal(outcome.errorCode, 'UNSUPPORTED_DOMAIN');
    }
  });
});

describe('MercaDónde · Route Generator & Live Telemetry Simulation', () => {
  it('generates initial seed shipments with valid route geometry and waypoints', () => {
    const seeds = getInitialSeedShipments();
    assert.equal(seeds.length, 4);
    for (const shp of seeds) {
      assert.ok(shp.routeGeometry.length >= 5);
      assert.ok(shp.waypoints.length >= 4);
      assert.ok(shp.trackingId.startsWith('MEL-'));
    }
  });

  it('advances shipment along route and transitions status to delivered at 100%', () => {
    let shp = generateSynthesizedShipment({
      trackingId: 'MEL-99988877766',
      sourceUrl: 'https://www.mercadolibre.com.ar/gz/shipping/tracking/99988877766',
      countryCode: 'AR',
      orderId: '20000099988877',
      extractionMethod: 'smart_hydration',
      diagnostic: {
        code: 'OK_LIVE_API',
        message: 'Test shipment',
        latencyMs: 15,
      },
      preferredStatus: 'preparing',
    });

    assert.equal(shp.status, 'preparing');
    const seenStatuses = new Set<string>([shp.status]);

    for (let i = 0; i < 12; i++) {
      const step = advanceShipmentState(shp, 2);
      shp = step.updatedShipment;
      seenStatuses.add(shp.status);
    }

    assert.equal(shp.status, 'delivered');
    assert.equal(shp.currentLocation.progress, 100);
    assert.equal(shp.currentLocation.stopsAway, 0);
    assert.ok(seenStatuses.has('in_transit'));
    assert.ok(seenStatuses.has('arriving_today') || seenStatuses.has('nearby'));
  });
});

describe('MercaDónde · Mobile-First & Dark/Light Mode UI Verification', () => {
  it('ensures responsive mobile-first breakpoints and dark mode classes exist across core views', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'src/app/page.tsx'),
      'utf-8'
    );
    // Mobile tab switcher for < lg screens + 12-column desktop split view
    assert.ok(pageContent.includes('lg:hidden'), 'Mobile tab switcher must be present');
    assert.ok(pageContent.includes('lg:grid-cols-12'), 'Desktop 12-col split layout must be present');
    assert.ok(pageContent.includes('dark:bg-slate-950'), 'Dark mode classes must be present');

    const mapViewContent = fs.readFileSync(
      path.join(process.cwd(), 'src/components/MapView.tsx'),
      'utf-8'
    );
    assert.ok(mapViewContent.includes('grid-cols-2 sm:grid-cols-4'), 'Mobile-first 2-col to 4-col telemetry grid');
  });
});
