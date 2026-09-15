import FleetMap from './FleetMap';
import { Truck, MapPin, Thermometer, Clock, Package, Navigation, History } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCoord, hosColor, capacityColor } from '../utils';

function MetricRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-[11px] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </div>
  );
}

export default function VehicleDrawer({ vehicle, onReroute }) {
  if (!vehicle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
        <Truck className="h-6 w-6" />
        <p className="text-[11px]">Select a unit to inspect telemetry and compliance detail.</p>
      </div>
    );
  }

  const hos = hosColor(vehicle.driver.hoursLeft, vehicle.driver.hosThreshold);
  const cap = capacityColor(vehicle.cargo.weightKg, vehicle.cargo.maxCapacityKg);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#1E2638] px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-100">{vehicle.vehicleId}</span>
              <StatusBadge status={vehicle.status} />
            </div>
            <p className="mt-1 font-mono text-[10.5px] text-slate-500">
              Plate {vehicle.licensePlate} &middot; {vehicle.driver.name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4">
       <section className="border-b border-[#1E2638] py-3.5">
  <h3 className="mb-2 text-[10.5px] uppercase tracking-wide text-slate-500">
    Telemetry
  </h3>

  <FleetMap vehicle={vehicle} />
</section>

        <section className="border-b border-[#1E2638] py-3.5">
          <h3 className="mb-1 text-[10.5px] uppercase tracking-wide text-slate-500">Regulatory metrics</h3>

          <MetricRow icon={Clock} label="Legal driving time left">
            <span className={`font-mono text-[11px] tabular-nums ${hos.text}`}>
              {vehicle.driver.hoursLeft.toFixed(1)}h
            </span>
          </MetricRow>

          {vehicle.cargo.coldChain && (
            <MetricRow icon={Thermometer} label="Refrigeration temp">
              <span className="font-mono text-[11px] tabular-nums text-sky-400">
                {vehicle.cargo.refrigTempC.toFixed(1)}\u00b0C
              </span>
            </MetricRow>
          )}

          <MetricRow icon={Package} label="Payload capacity">
            <span className={`font-mono text-[11px] tabular-nums ${cap.text}`}>
              {Math.round(cap.pct)}%
            </span>
          </MetricRow>

          <MetricRow icon={History} label="Reroute history">
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              {vehicle.routeHistory?.length ?? 0} events
            </span>
          </MetricRow>
        </section>

        <section className="py-3.5">
          <h3 className="mb-2 text-[10.5px] uppercase tracking-wide text-slate-500">Cargo manifest</h3>
          <p className="text-[11px] leading-relaxed text-slate-300">{vehicle.cargo.manifest}</p>
          <p className="mt-1 font-mono text-[10.5px] text-slate-600">
            Destination &middot; {vehicle.destination}
          </p>
        </section>
      </div>

      <div className="border-t border-[#1E2638] p-3.5">
        <button
          onClick={() => onReroute(vehicle)}
          className="focus-ring w-full rounded-md border border-blue-800/60 bg-blue-950/50 py-2 text-[11px] font-medium text-blue-300 hover:bg-blue-950/80"
        >
          Dispatch reroute
        </button>
      </div>
    </div>
  );
}
