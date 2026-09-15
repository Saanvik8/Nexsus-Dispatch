require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus_dispatch';

const seedData = [
  {
    vehicleId: 'TRK-2214',
    licensePlate: 'MH-04-EB-2214',
    driver: { name: 'R. Pawar', hoursLeft: 6.2 },
    cargo: {
      manifest: 'Electronics pallet batch A-19',
      weightKg: 8200,
      maxCapacityKg: 12000,
      coldChain: false,
    },
    destination: 'Bhiwandi, MH — Logistics Park Bay 4',
    status: 'in-transit',
    telemetry: { lat: 19.2967, long: 73.0631, routeProgressPct: 62 },
  },
  {
    vehicleId: 'TRK-3391',
    licensePlate: 'GJ-01-AX-3391',
    driver: { name: 'M. Patel', hoursLeft: 4.8 },
    cargo: {
      manifest: 'Frozen seafood consignment',
      weightKg: 11400,
      maxCapacityKg: 12000,
      coldChain: true,
      refrigTempC: -18.2,
    },
    destination: 'Surat, GJ — Cold storage hub',
    status: 'delayed',
    telemetry: { lat: 21.1702, long: 72.8311, routeProgressPct: 34 },
  },
  {
    // Edge case: HOS violation - driver.hoursLeft below hosThreshold (1.0)
    vehicleId: 'TRK-5567',
    licensePlate: 'MH-12-RN-5567',
    driver: { name: 'J. Deshmukh', hoursLeft: 0.6 },
    cargo: {
      manifest: 'Automotive engine assemblies',
      weightKg: 9100,
      maxCapacityKg: 10000,
      coldChain: false,
    },
    destination: 'Pune, MH — Chakan MIDC Phase 2',
    status: 'hos-alert',
    telemetry: { lat: 18.6298, long: 73.7997, routeProgressPct: 78 },
  },
  {
    // Edge case: cold-chain with tight but legal tolerance
    vehicleId: 'TRK-6620',
    licensePlate: 'HR-26-DF-6620',
    driver: { name: 'A. Gurjar', hoursLeft: 7.5 },
    cargo: {
      manifest: 'Pharma vaccine cold-chain batch 7',
      weightKg: 6300,
      maxCapacityKg: 9000,
      coldChain: true,
      refrigTempC: 2.4,
    },
    destination: 'New Delhi, DL — IGI Cargo Terminal',
    status: 'in-transit',
    telemetry: { lat: 28.5562, long: 77.1000, routeProgressPct: 45 },
  },
  {
    // Edge case: idle unit, no active cargo
    vehicleId: 'TRK-7742',
    licensePlate: 'KA-05-MQ-7742',
    driver: { name: 'S. Gowda', hoursLeft: 9.1 },
    cargo: {
      manifest: '—',
      weightKg: 0,
      maxCapacityKg: 11000,
      coldChain: false,
    },
    destination: 'Bengaluru, KA — Nelamangala Yard B',
    status: 'idle',
    telemetry: { lat: 13.0358, long: 77.4988, routeProgressPct: 0 },
  },
  {
    // Edge case: payload exceeds maxCapacityKg (non-blocking warning trigger)
    vehicleId: 'TRK-8830',
    licensePlate: 'TN-01-PK-8830',
    driver: { name: 'K. Sundaram', hoursLeft: 3.4 },
    cargo: {
      manifest: 'Automotive stamping dies',
      weightKg: 12800,
      maxCapacityKg: 11500,
      coldChain: false,
    },
    destination: 'Chennai, TN — Sriperumbudur Cluster',
    status: 'delayed',
    telemetry: { lat: 12.9815, long: 79.9722, routeProgressPct: 55 },
  },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('[seed] connected to MongoDB');

  await Vehicle.deleteMany({});
  await Vehicle.insertMany(seedData);

  console.log(`[seed] inserted ${seedData.length} vehicles`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});