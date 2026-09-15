# NEXUS // Dispatch Discipline

A B2B fleet logistics and dispatch command center built on the MERN stack.
Single-pane split-screen operator console: a high-density fleet grid on the
left, a vehicle inspection drawer on the right.

## Stack

- MongoDB + Mongoose
- Express (REST API)
- React 18 + Vite
- Tailwind CSS
- lucide-react icons

## Project layout

```
nexus-dispatch/
  backend/
    models/Vehicle.js       Mongoose schema (telemetry, HOS, cargo, route history)
    routes/fleet.js          REST endpoints + business rules
    server.js                Express app entrypoint
    seed.js                  Seeds 6 realistic fleet records
    package.json
    .env.example
  frontend/
    src/
      components/            Header, FleetTable, VehicleDrawer, RerouteModal, UndoToast, StatusBadge, HosGauge, WeightBar
      App.jsx                 Top-level state and orchestration
      api.js                   Fetch wrapper for the fleet API
      utils.js                 Status metadata, HOS/capacity color logic, formatters
      main.jsx, index.css
    tailwind.config.js
    vite.config.js
    index.html
    package.json
```

## Running it locally

### 1. Backend

```bash
cd backend
cp .env.example .env       # adjust MONGO_URI if not running Mongo locally
npm install
npm run seed                # loads the 6-vehicle demo fleet
npm run dev                 # http://localhost:4000
```

Requires a reachable MongoDB instance (local `mongod`, Docker, or Atlas) at
the `MONGO_URI` in `.env`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no CORS
configuration is needed in development beyond what's already in
`backend/server.js`.

## API surface

| Method | Route                          | Purpose                                  |
| ------ | ------------------------------- | ----------------------------------------- |
| GET    | `/api/fleet`                    | List vehicles (`?status=`, `?q=`)         |
| GET    | `/api/fleet/:id`                | Single vehicle detail                     |
| PATCH  | `/api/fleet/:id/reroute`        | Reroute; enforces HOS + surfaces payload warnings |
| POST   | `/api/fleet/bulk-status`        | `force-route-sync` / `broadcast-notice` for selected units |

## Business rules

- **HOS compliance** \u2014 if `driver.hoursLeft <= driver.hosThreshold` (default
  `1.0`), a reroute is rejected with a 409 and a compliance message unless a
  `replacementDriver` is supplied, which resets the shift clock and clears
  the alert.
- **Payload constraint** \u2014 cargo weight above `maxCapacityKg` never blocks a
  reroute; the API returns it as a non-blocking `warnings[]` entry, and the
  UI shows the same warning inline before the driver confirms.
- **Reroute undo window** \u2014 the UI applies the reroute optimistically and
  shows a 5-second ticking toast with an undo action. The API call that
  actually persists the change only fires once the window expires without
  an undo.
