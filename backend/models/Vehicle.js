const mongoose = require('mongoose');

const RouteHistorySchema = new mongoose.Schema(
  {
    destination: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'manual-reroute' },
    replacementDriver: { type: String, default: null },
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true, unique: true, index: true },
    licensePlate: { type: String, required: true },

    driver: {
      name: { type: String, required: true },
      hoursLeft: { type: Number, required: true, min: 0, max: 11 },
      // Federal Hours-of-Service ceiling used for the compliance check.
      hosThreshold: { type: Number, default: 1.0 },
    },

    cargo: {
      manifest: { type: String, default: '\u2014' },
      weightKg: { type: Number, required: true, min: 0 },
      maxCapacityKg: { type: Number, required: true, min: 0 },
      coldChain: { type: Boolean, default: false },
      refrigTempC: { type: Number, default: null },
    },

    destination: { type: String, required: true },

    status: {
      type: String,
      enum: ['in-transit', 'delayed', 'hos-alert', 'idle'],
      default: 'in-transit',
      index: true,
    },

    telemetry: {
      lat: { type: Number, required: true },
      long: { type: Number, required: true },
      routeProgressPct: { type: Number, default: 0, min: 0, max: 100 },
      lastPingAt: { type: Date, default: Date.now },
    },

    routeHistory: { type: [RouteHistorySchema], default: [] },
  },
  { timestamps: true }
);

// Derived, read-oriented helper - not persisted, computed on the fly for API responses.
VehicleSchema.methods.isHosBlocked = function isHosBlocked() {
  return this.driver.hoursLeft <= this.driver.hosThreshold;
};

VehicleSchema.methods.isOverCapacity = function isOverCapacity() {
  return this.cargo.weightKg > this.cargo.maxCapacityKg;
};

module.exports = mongoose.model('Vehicle', VehicleSchema);
