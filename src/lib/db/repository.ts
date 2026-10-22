import fs from 'fs';
import os from 'os';
import path from 'path';
import { getInitialSeedShipments } from '@/lib/ml-parser/route-generator';
import { Shipment, UserPreferences } from '@/types/shipment';
import { ShipmentModel, UserPreferencesModel } from './models';
import { connectToMongo } from './mongodb';

interface LocalNoSqlStore {
  shipments: Shipment[];
  preferences: UserPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'default-user',
  soundEnabled: true,
  soundVolume: 0.8,
  browserPushEnabled: true,
  emailEnabled: false,
  emailAddress: '',
  webhookEnabled: false,
  webhookUrl: '',
  proximityThresholdStops: 2,
  updatedAt: new Date().toISOString(),
};

declare global {
  // eslint-disable-next-line no-var
  var __mercadondeMemoryStore: LocalNoSqlStore | undefined;
}

function resolveStoreFilePath(): string {
  const localDir = path.join(process.cwd(), '.data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return path.join(localDir, 'mercadonde-db.json');
  } catch {
    // Fallback to OS temp dir for serverless read-only environments (e.g. Netlify Functions)
    return path.join(os.tmpdir(), 'mercadonde-db.json');
  }
}

function readLocalStore(): LocalNoSqlStore {
  if (globalThis.__mercadondeMemoryStore) {
    return globalThis.__mercadondeMemoryStore;
  }

  const filePath = resolveStoreFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as LocalNoSqlStore;
      if (Array.isArray(parsed.shipments) && parsed.preferences) {
        globalThis.__mercadondeMemoryStore = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore read error and initialize fresh seed store
  }

  const initialStore: LocalNoSqlStore = {
    shipments: getInitialSeedShipments(),
    preferences: DEFAULT_PREFERENCES,
  };

  writeLocalStore(initialStore);
  return initialStore;
}

function writeLocalStore(store: LocalNoSqlStore): void {
  globalThis.__mercadondeMemoryStore = store;
  const filePath = resolveStoreFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // In memory cache still holds state if disk write is restricted
  }
}

export async function getStorageInfo(): Promise<{
  engine: 'mongodb' | 'local_nosql_json';
  connected: boolean;
}> {
  const mongo = await connectToMongo();
  return {
    engine: mongo ? 'mongodb' : 'local_nosql_json',
    connected: true,
  };
}

export async function listShipments(): Promise<Shipment[]> {
  const mongo = await connectToMongo();
  if (mongo) {
    const count = await ShipmentModel.countDocuments();
    if (count === 0) {
      const seeds = getInitialSeedShipments();
      await ShipmentModel.insertMany(seeds);
      return seeds;
    }
    const docs = await ShipmentModel.find().sort({ updatedAt: -1 }).lean<Shipment[]>();
    return docs;
  }

  const store = readLocalStore();
  return [...store.shipments];
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  const mongo = await connectToMongo();
  if (mongo) {
    const doc = await ShipmentModel.findOne({ id }).lean<Shipment | null>();
    return doc;
  }

  const store = readLocalStore();
  return store.shipments.find((s) => s.id === id || s.trackingId === id) || null;
}

export async function upsertShipment(shipment: Shipment): Promise<Shipment> {
  const mongo = await connectToMongo();
  if (mongo) {
    await ShipmentModel.findOneAndUpdate(
      { id: shipment.id },
      { $set: shipment },
      { upsert: true, new: true }
    );
    return shipment;
  }

  const store = readLocalStore();
  const existingIdx = store.shipments.findIndex(
    (s) => s.id === shipment.id || s.trackingId === shipment.trackingId
  );

  if (existingIdx >= 0) {
    store.shipments[existingIdx] = shipment;
  } else {
    store.shipments.unshift(shipment);
  }

  writeLocalStore(store);
  return shipment;
}

export async function removeShipment(id: string): Promise<boolean> {
  const mongo = await connectToMongo();
  if (mongo) {
    const res = await ShipmentModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  const store = readLocalStore();
  const initialLen = store.shipments.length;
  store.shipments = store.shipments.filter((s) => s.id !== id);
  writeLocalStore(store);
  return store.shipments.length < initialLen;
}

export async function resetSeedShipments(): Promise<Shipment[]> {
  const seeds = getInitialSeedShipments();
  const mongo = await connectToMongo();
  if (mongo) {
    await ShipmentModel.deleteMany({});
    await ShipmentModel.insertMany(seeds);
    return seeds;
  }

  const store = readLocalStore();
  store.shipments = seeds;
  writeLocalStore(store);
  return seeds;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const mongo = await connectToMongo();
  if (mongo) {
    const doc = await UserPreferencesModel.findOne({ id: 'default-user' }).lean<UserPreferences | null>();
    if (!doc) {
      await UserPreferencesModel.create(DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    }
    return doc;
  }

  const store = readLocalStore();
  return store.preferences;
}

export async function updateUserPreferences(
  partial: Partial<Omit<UserPreferences, 'id'>>
): Promise<UserPreferences> {
  const current = await getUserPreferences();
  const updated: UserPreferences = {
    ...current,
    ...partial,
    id: 'default-user',
    updatedAt: new Date().toISOString(),
  };

  const mongo = await connectToMongo();
  if (mongo) {
    await UserPreferencesModel.findOneAndUpdate(
      { id: 'default-user' },
      { $set: updated },
      { upsert: true, new: true }
    );
    return updated;
  }

  const store = readLocalStore();
  store.preferences = updated;
  writeLocalStore(store);
  return updated;
}
