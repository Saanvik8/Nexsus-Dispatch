const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// GET /api/fleet
// Returns the full fleet roster. Supports optional ?status= and ?q= query
// params so the client can push filtering server-side later without an
// API shape change.
router.get('/', async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q) {
      const rx = new RegExp(q.trim(), 'i');
      filter.$or = [
        { vehicleId: rx },
        { 'driver.name': rx },
        { destination: rx },
        { 'cargo.manifest': rx },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort({ vehicleId: 1 }).lean();
    res.json({ data: vehicles, count: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load fleet roster.', detail: err.message });
  }
});

// GET /api/fleet/:id
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ data: vehicle });
  } catch (err) {
    res.status(400).json({ error: 'Invalid vehicle id.', detail: err.message });
  }
});

// PATCH /api/fleet/:id/reroute
// Body: { destination: string, replacementDriver?: string }
//
// Business rules enforced server-side (mirrored client-side for instant
// feedback, but the server is the source of truth):
//   1. HOS compliance: if driver.hoursLeft <= driver.hosThreshold, the
//      reroute is rejected unless a replacementDriver is supplied.
//   2. Payload constraint: over-capacity cargo does not block the reroute,
//      it is surfaced back as a warning in the response payload.
router.patch('/:id/reroute', async (req, res) => {
  try {
    const { destination, replacementDriver } = req.body;

    if (!destination || !destination.trim()) {
      return res.status(422).json({ error: 'A destination is required to reroute.' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const hosBlocked = vehicle.isHosBlocked();
    if (hosBlocked && !replacementDriver) {
      return res.status(409).json({
        error: 'hos-violation',
        message:
          'Regulatory violation: driver has exceeded legal shift threshold. Re-dispatch requires replacement driver assignment.',
        driverHoursLeft: vehicle.driver.hoursLeft,
      });
    }

    const overCapacity = vehicle.isOverCapacity();

    vehicle.routeHistory.push({
      destination: vehicle.destination,
      reason: hosBlocked ? 'hos-override-reroute' : 'manual-reroute',
      replacementDriver: replacementDriver || null,
    });

    vehicle.destination = destination.trim();
    if (hosBlocked && replacementDriver) {
      vehicle.driver.name = replacementDriver.trim();
      vehicle.driver.hoursLeft = 11; // fresh legal shift
      vehicle.status = 'in-transit';
    }

    await vehicle.save();

    res.json({
      data: vehicle,
      warnings: overCapacity
        ? [`Payload ${vehicle.cargo.weightKg}kg exceeds rated capacity of ${vehicle.cargo.maxCapacityKg}kg.`]
        : [],
    });
  } catch (err) {
    res.status(400).json({ error: 'Reroute failed.', detail: err.message });
  }
});

// POST /api/fleet/bulk-status
// Body: { ids: string[], action: 'force-route-sync' | 'broadcast-notice', message?: string }
router.post('/bulk-status', async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(422).json({ error: 'At least one vehicle id is required.' });
    }
    if (!['force-route-sync', 'broadcast-notice'].includes(action)) {
      return res.status(422).json({ error: 'Unsupported bulk action.' });
    }

    if (action === 'force-route-sync') {
      await Vehicle.updateMany(
        { _id: { $in: ids } },
        { $set: { 'telemetry.lastPingAt': new Date() } }
      );
    }
    // broadcast-notice is a fire-and-forget dispatcher-to-driver message in
    // this demo; a production build would enqueue to a notification service.

    res.json({ ok: true, affected: ids.length, action });
  } catch (err) {
    res.status(400).json({ error: 'Bulk action failed.', detail: err.message });
  }
});

module.exports = router;
