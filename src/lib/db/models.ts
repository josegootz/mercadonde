import mongoose, { Schema } from 'mongoose';
import { Shipment, UserPreferences } from '@/types/shipment';

const ShipmentSchema = new Schema<Shipment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    trackingId: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
    extractionMethod: { type: String, required: true },
    diagnostic: { type: Schema.Types.Mixed, required: true },
    product: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true, index: true },
    carrier: { type: String, required: true },
    driverName: { type: String, required: true },
    vehiclePlate: { type: String, required: true },
    origin: { type: Schema.Types.Mixed, required: true },
    destination: { type: Schema.Types.Mixed, required: true },
    currentLocation: { type: Schema.Types.Mixed, required: true },
    waypoints: { type: Schema.Types.Mixed, default: [] },
    routeGeometry: { type: Schema.Types.Mixed, default: [] },
    eta: { type: String, required: true },
    etaWindow: { type: String, required: true },
    history: { type: Schema.Types.Mixed, default: [] },
    alertsTriggered: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    versionKey: false,
  }
);

const UserPreferencesSchema = new Schema<UserPreferences>(
  {
    id: { type: String, required: true, unique: true },
    soundEnabled: { type: Boolean, default: true },
    soundVolume: { type: Number, default: 0.75 },
    browserPushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    emailAddress: { type: String, default: '' },
    webhookEnabled: { type: Boolean, default: false },
    webhookUrl: { type: String, default: '' },
    proximityThresholdStops: { type: Number, default: 2 },
    updatedAt: { type: String, required: true },
  },
  {
    versionKey: false,
  }
);

export const ShipmentModel =
  mongoose.models.Shipment || mongoose.model<Shipment>('Shipment', ShipmentSchema);

export const UserPreferencesModel =
  mongoose.models.UserPreferences ||
  mongoose.model<UserPreferences>('UserPreferences', UserPreferencesSchema);
