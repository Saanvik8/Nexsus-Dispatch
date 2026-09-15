import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Radio, Gauge, Rows3, LayoutList, Inbox, RefreshCw, Megaphone,
  Truck, MapPin, Thermometer, Clock, Package, Navigation, History,
  X, ShieldAlert, TriangleAlert, ArrowRight, Check, Undo2,
} from 'lucide-react';

const STATUS_META = {
  'in-transit': { label: 'In transit', pill: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50', dot: 'bg-emerald-500' },
  delayed: { label: 'Delayed', pill: 'bg-amber-950/40 text-amber-400 border-amber-800/50', dot: 'bg-amber-500' },
  'hos-alert': { label: 'HOS alert', pill: 'bg-rose-950/40 text-rose-400 border-rose-800/50', dot: 'bg-rose-500' },
  idle: { label: 'Idle', pill: 'bg-slate-800/40 text-slate-400 border-slate-700/50', dot: 'bg-slate-500' },
};

const FILTERS = [
  { key: 'all', label: 'All units' },
  { key: 'in-transit', label: 'In-transit' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'hos-alert', label: 'HOS alert' },
  { key: 'idle', label: 'Idle' },
];

function hosColor(hoursLeft, threshold = 1.0) {
  if (hoursLeft <= threshold) return { bar: 'bg-rose-500', text: 'text-rose-400' };
  if (hoursLeft <= threshold * 4) return { bar: 'bg-amber-500', text: 'text-amber-400' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
}

function capacityColor(weightKg, maxCapacityKg) {
  const pct = maxCapacityKg > 0 ? (weightKg / maxCapacityKg) * 100 : 0;
  if (pct > 100) return { bar: 'bg-rose-500', text: 'text-rose-400', pct };
  if (pct >= 80) return { bar: 'bg-amber-500', text: 'text-amber-400', pct };
  return { bar: 'bg-emerald-500', text: 'text-emerald-400', pct };
}

function formatCoord(value, axis) {
  const abs = Math.abs(value).toFixed(4);
  const suffix = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${abs}\u00b0 ${suffix}`;
}

const SEED = [
  { id: 'v1', vehicleId: 'TRK-2214', licensePlate: 'NJ-88GX41', driver: { name: 'R. Okafor', hoursLeft: 6.2, hosThreshold: 1.0 }, cargo: { manifest: 'Electronics pallet batch A-19', weightKg: 8200, maxCapacityKg: 12000, coldChain: false }, destination: 'Newark, NJ \u2014 Terminal 4', status: 'in-transit', telemetry: { lat: 40.7357, long: -74.1724, routeProgressPct: 62 }, routeHistory: [] },
  { id: 'v2', vehicleId: 'TRK-3391', licensePlate: 'MD-14PT02', driver: { name: 'M. Delgado', hoursLeft: 4.8, hosThreshold: 1.0 }, cargo: { manifest: 'Frozen seafood consignment', weightKg: 11400, maxCapacityKg: 12000, coldChain: true, refrigTempC: -18.2 }, destination: 'Baltimore, MD \u2014 Cold storage hub', status: 'delayed', telemetry: { lat: 39.2904, long: -76.6122, routeProgressPct: 34 }, routeHistory: [] },
  { id: 'v3', vehicleId: 'TRK-5567', licensePlate: 'OH-77RM19', driver: { name: 'J. Whitfield', hoursLeft: 0.6, hosThreshold: 1.0 }, cargo: { manifest: 'Automotive parts kit', weightKg: 9100, maxCapacityKg: 10000, coldChain: false }, destination: 'Columbus, OH \u2014 Distribution center 2', status: 'hos-alert', telemetry: { lat: 39.9612, long: -82.9988, routeProgressPct: 78 }, routeHistory: [] },
  { id: 'v4', vehicleId: 'TRK-6620', licensePlate: 'TN-33LK88', driver: { name: 'A. Kowalski', hoursLeft: 7.5, hosThreshold: 1.0 }, cargo: { manifest: 'Pharma cold-chain batch 7', weightKg: 6300, maxCapacityKg: 9000, coldChain: true, refrigTempC: 2.4 }, destination: 'Memphis, TN \u2014 Regional hub', status: 'in-transit', telemetry: { lat: 35.1495, long: -90.049, routeProgressPct: 45 }, routeHistory: [] },
  { id: 'v5', vehicleId: 'TRK-7742', licensePlate: 'IL-09WQ55', driver: { name: 'S. Nakamura', hoursLeft: 9.1, hosThreshold: 1.0 }, cargo: { manifest: '\u2014', weightKg: 0, maxCapacityKg: 11000, coldChain: false }, destination: 'Terminal yard \u2014 Bay 12', status: 'idle', telemetry: { lat: 41.8508, long: -87.6499, routeProgressPct: 0 }, routeHistory: [] },
  { id: 'v6', vehicleId: 'TRK-8830', licensePlate: 'GA-21HD73', driver: { name: 'D. Fontaine', hoursLeft: 3.4, hosThreshold: 1.0 }, cargo: { manifest: 'Retail overstock freight', weightKg: 12800, maxCapacityKg: 11500, coldChain: false }, destination: 'Atlanta, GA \u2014 Terminal 9', status: 'delayed', telemetry: { lat: 33.749, long: -84.388, routeProgressPct: 55 }, routeHistory: [] },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10.5px] font-medium leading-none ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function HosGauge({ hoursLeft, threshold = 1.0, compact }) {
  const { bar, text } = hosColor(hoursLeft, threshold);
  const pct = Math.min(100, (hoursLeft / 11) * 100);
  return (
    <div className={compact ? 'w-20' : 'w-28'}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">HOS</span>
        <span className={`font-mono text-[10.5px] tabular-nums ${text}`}>{hoursLeft.toFixed(1)}h</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1E2638]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WeightBar({ weightKg, maxCapacityKg, compact }) {
  const { bar, text, pct } = capacityColor(weightKg, maxCapacityKg);
  return (
    <div className={compact ? 'w-24' : 'w-32'}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Payload</span>
        <span className={`font-mono text-[10.5px] tabular-nums ${text}`}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1E2638]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function RerouteModal({ vehicle, onClose, onConfirm }) {
  const [destination, setDestination] = useState('');
  const [replacementDriver, setReplacementDriver] = useState('');
  const inputRef = useRef(null);
  const hosBlocked = vehicle.driver.hoursLeft <= vehicle.driver.hosThreshold;
  const overCapacity = vehicle.cargo.weightKg > vehicle.cargo.maxCapacityKg;
  const needsReplacement = hosBlocked && !replacementDriver.trim();

  useEffect(() => {
    inputRef.current?.focus();
    function onKeyDown(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!destination.trim() || needsReplacement) return;
    onConfirm({ destination: destination.trim(), replacementDriver: replacementDriver.trim() || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-lg border border-[#1E2638] bg-[#111622] shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-[#1E2638] px-4 py-3">
          <div>
            <h2 className="text-xs font-medium text-slate-200">Dispatch reroute</h2>
            <p className="font-mono text-[10.5px] text-slate-500">{vehicle.vehicleId}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-[#161C2B] hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4">
          {hosBlocked && (
            <div className="mb-3 rounded-md border border-rose-800/50 bg-rose-950/40 px-3 py-2.5">
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <p className="text-[11px] leading-snug text-rose-300">
                  Regulatory violation: driver has exceeded legal shift threshold. Re-dispatch requires replacement driver assignment.
                </p>
              </div>
            </div>
          )}
          {overCapacity && (
            <div className="mb-3 rounded-md border border-amber-800/50 bg-amber-950/40 px-3 py-2.5">
              <div className="flex gap-2">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-snug text-amber-300">
                  Payload {vehicle.cargo.weightKg.toLocaleString()}kg exceeds rated capacity of {vehicle.cargo.maxCapacityKg.toLocaleString()}kg. Reroute may proceed, but flag for load review.
                </p>
              </div>
            </div>
          )}
          <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-slate-500">New destination</label>
          <input ref={inputRef} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Charlotte, NC \u2014 Terminal 6" className="mb-3 w-full rounded-md border border-[#1E2638] bg-[#161C2B] px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-700" />
          {hosBlocked && (
            <>
              <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-slate-500">Replacement driver</label>
              <input value={replacementDriver} onChange={(e) => setReplacementDriver(e.target.value)} placeholder="Driver name" className="mb-3 w-full rounded-md border border-[#1E2638] bg-[#161C2B] px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-700" />
            </>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10.5px] text-slate-600">
              <kbd className="rounded border border-[#1E2638] bg-[#0B0F17] px-1 py-0.5 font-mono">Esc</kbd> to cancel
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-md border border-[#1E2638] px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-200">Cancel</button>
              <button type="submit" disabled={!destination.trim() || needsReplacement} className="flex items-center gap-1.5 rounded-md border border-blue-800/60 bg-blue-950/50 px-3 py-1.5 text-[11px] font-medium text-blue-300 hover:bg-blue-950/80 disabled:cursor-not-allowed disabled:opacity-40">
                Confirm reroute <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function UndoToast({ message, onUndo, onExpire }) {
  const DURATION_MS = 5000;
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, DURATION_MS - (Date.now() - startedAt.current));
      setRemainingMs(left);
      if (left <= 0) { clearInterval(interval); onExpire(); }
    }, 50);
    return () => clearInterval(interval);
  }, [onExpire]);

  const pct = (remainingMs / DURATION_MS) * 100;
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-lg border border-[#1E2638] bg-[#161C2B] shadow-2xl shadow-black/60">
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-950/60">
          <Check className="h-2.5 w-2.5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-slate-200">{message}</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-600">Committing in {(remainingMs / 1000).toFixed(1)}s</p>
        </div>
        <button onClick={onUndo} className="flex shrink-0 items-center gap-1 rounded border border-[#1E2638] px-2 py-1 text-[10.5px] text-slate-300 hover:border-slate-600 hover:text-slate-100">
          <Undo2 className="h-3 w-3" /> Undo
        </button>
      </div>
      <div className="h-0.5 w-full bg-[#0B0F17]">
        <div className="h-full bg-blue-500" style={{ width: `${pct}%`, transition: 'width 50ms linear' }} />
      </div>
    </div>
  );
}

function VehicleDrawer({ vehicle, onReroute }) {
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-slate-100">{vehicle.vehicleId}</span>
          <StatusBadge status={vehicle.status} />
        </div>
        <p className="mt-1 font-mono text-[10.5px] text-slate-500">Plate {vehicle.licensePlate} &middot; {vehicle.driver.name}</p>
      </div>

      <div className="flex-1 overflow-auto px-4">
        <section className="border-b border-[#1E2638] py-3.5">
          <h3 className="mb-2 text-[10.5px] uppercase tracking-wide text-slate-500">Telemetry</h3>
          <div className="rounded-md border border-[#1E2638] bg-[#161C2B] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] tabular-nums text-slate-300">
                {formatCoord(vehicle.telemetry.lat, 'lat')} &nbsp; {formatCoord(vehicle.telemetry.long, 'long')}
              </span>
            </div>
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500"><Navigation className="h-3 w-3" /> Route progress</span>
              <span className="font-mono text-[10.5px] tabular-nums text-slate-300">{vehicle.telemetry.routeProgressPct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#0B0F17]">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${vehicle.telemetry.routeProgressPct}%` }} />
            </div>
          </div>
        </section>

        <section className="border-b border-[#1E2638] py-3.5">
          <h3 className="mb-1 text-[10.5px] uppercase tracking-wide text-slate-500">Regulatory metrics</h3>
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-[11px] text-slate-500"><Clock className="h-3.5 w-3.5" /> Legal driving time left</span>
            <span className={`font-mono text-[11px] tabular-nums ${hos.text}`}>{vehicle.driver.hoursLeft.toFixed(1)}h</span>
          </div>
          {vehicle.cargo.coldChain && (
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[11px] text-slate-500"><Thermometer className="h-3.5 w-3.5" /> Refrigeration temp</span>
              <span className="font-mono text-[11px] tabular-nums text-sky-400">{vehicle.cargo.refrigTempC.toFixed(1)}\u00b0C</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-[11px] text-slate-500"><Package className="h-3.5 w-3.5" /> Payload capacity</span>
            <span className={`font-mono text-[11px] tabular-nums ${cap.text}`}>{Math.round(cap.pct)}%</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-[11px] text-slate-500"><History className="h-3.5 w-3.5" /> Reroute history</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">{vehicle.routeHistory?.length ?? 0} events</span>
          </div>
        </section>

        <section className="py-3.5">
          <h3 className="mb-2 text-[10.5px] uppercase tracking-wide text-slate-500">Cargo manifest</h3>
          <p className="text-[11px] leading-relaxed text-slate-300">{vehicle.cargo.manifest}</p>
          <p className="mt-1 font-mono text-[10.5px] text-slate-600">Destination &middot; {vehicle.destination}</p>
        </section>
      </div>

      <div className="border-t border-[#1E2638] p-3.5">
        <button onClick={() => onReroute(vehicle)} className="w-full rounded-md border border-blue-800/60 bg-blue-950/50 py-2 text-[11px] font-medium text-blue-300 hover:bg-blue-950/80">
          Dispatch reroute
        </button>
      </div>
    </div>
  );
}

export default function NexusDispatchPreview() {
  const [vehicles, setVehicles] = useState(SEED);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState('standard');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedVehicleId, setSelectedVehicleId] = useState('v3');
  const [rerouteTarget, setRerouteTarget] = useState(null);
  const [pendingReroute, setPendingReroute] = useState(null);
  const [bulkToastMessage, setBulkToastMessage] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;
    if (filter !== 'all') list = list.filter((v) => v.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((v) =>
        v.vehicleId.toLowerCase().includes(q) ||
        v.driver.name.toLowerCase().includes(q) ||
        v.destination.toLowerCase().includes(q) ||
        v.cargo.manifest.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, filter, query]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const compact = density === 'compact';
  const rowPad = compact ? 'px-3 py-2' : 'px-3 py-3.5';
  const allSelected = filteredVehicles.length > 0 && selectedIds.size === filteredVehicles.length;

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkAction(action) {
    const count = selectedIds.size;
    setBulkToastMessage(
      action === 'force-route-sync'
        ? `Route sync forced for ${count} unit${count === 1 ? '' : 's'}.`
        : `Broadcast notice sent to ${count} unit${count === 1 ? '' : 's'}.`
    );
    setSelectedIds(new Set());
  }

  function confirmReroute({ destination, replacementDriver }) {
    const target = rerouteTarget;
    const hosBlocked = target.driver.hoursLeft <= target.driver.hosThreshold;

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === target.id
          ? {
              ...v,
              destination,
              status: hosBlocked ? 'in-transit' : v.status,
              driver: hosBlocked ? { ...v.driver, name: replacementDriver, hoursLeft: 11 } : v.driver,
            }
          : v
      )
    );
    setPendingReroute({ vehicleId: target.id, previousVehicle: target, destination });
    setRerouteTarget(null);
  }

  function commitPendingReroute() {
    setPendingReroute(null);
  }

  function undoPendingReroute() {
    if (!pendingReroute) return;
    setVehicles((prev) => prev.map((v) => (v.id === pendingReroute.vehicleId ? pendingReroute.previousVehicle : v)));
    setPendingReroute(null);
  }

  const activeCount = vehicles.filter((v) => v.status !== 'idle').length;

  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-lg bg-[#0B0F17] font-sans text-slate-200" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[#1E2638] bg-[#111622] px-4">
        <div className="flex items-center gap-2 pr-4">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-[#1E2638] bg-[#161C2B]">
            <Radio className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span className="font-mono text-xs font-medium tracking-wide text-slate-200">
            NEXUS <span className="text-slate-600">//</span> DISPATCH DISCIPLINE
          </span>
        </div>

        <div className="hidden items-center gap-3 border-l border-[#1E2638] pl-4 text-[11px] text-slate-500 lg:flex">
          <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /><span className="font-mono tabular-nums text-slate-300">28ms</span></span>
          <span className="text-slate-700">|</span>
          <span><span className="font-mono tabular-nums text-slate-300">{activeCount}</span> active units</span>
          <span className="text-slate-700">|</span>
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10.5px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live mode
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-[#1E2638] bg-[#161C2B] p-0.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded px-2.5 py-1 text-[11px] transition-colors ${filter === f.key ? 'bg-[#1E2638] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative ml-2 max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vehicle, driver, terminal" className="w-full rounded-md border border-[#1E2638] bg-[#161C2B] py-1.5 pl-8 pr-8 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-700" />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#1E2638] bg-[#0B0F17] px-1 py-0.5 font-mono text-[10px] text-slate-600">/</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-[#1E2638] bg-[#161C2B] p-0.5">
          <button onClick={() => setDensity('compact')} className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${density === 'compact' ? 'bg-[#1E2638] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
            <Rows3 className="h-3.5 w-3.5" /> Compact
          </button>
          <button onClick={() => setDensity('standard')} className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${density === 'standard' ? 'bg-[#1E2638] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutList className="h-3.5 w-3.5" /> Standard
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative w-[60%] overflow-hidden border-r border-[#1E2638] bg-[#111622]">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#111622]">
                  <tr className="border-b border-[#1E2638] text-[10.5px] uppercase tracking-wide text-slate-500">
                    <th className="w-9 px-3 py-2">
                      <input type="checkbox" checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredVehicles.map((v) => v.id)) : new Set())} className="h-3.5 w-3.5 accent-blue-500" />
                    </th>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Driver / HOS</th>
                    <th className="px-3 py-2 font-medium">Cargo / Weight</th>
                    <th className="px-3 py-2 font-medium">Destination</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Inbox className="mx-auto mb-2 h-5 w-5 text-slate-700" />
                        <p className="text-xs text-slate-500">No units match the current filter.</p>
                      </td>
                    </tr>
                  )}
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} onClick={() => setSelectedVehicleId(v.id)} className={`cursor-pointer border-b border-[#1E2638] transition-colors ${selectedVehicleId === v.id ? 'bg-[#161C2B]' : 'hover:bg-[#0F141F]'}`}>
                      <td className={rowPad} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => toggleSelect(v.id)} className="h-3.5 w-3.5 accent-blue-500" />
                      </td>
                      <td className={rowPad}>
                        <div className="font-mono text-xs text-slate-200">{v.vehicleId}</div>
                        <div className="font-mono text-[10px] text-slate-600">{v.licensePlate}</div>
                      </td>
                      <td className={rowPad}>
                        <div className="mb-1 text-[11px] text-slate-300">{v.driver.name}</div>
                        <HosGauge hoursLeft={v.driver.hoursLeft} threshold={v.driver.hosThreshold} compact />
                      </td>
                      <td className={rowPad}>
                        <div className="mb-1 max-w-[160px] truncate text-[11px] text-slate-300">{v.cargo.manifest}</div>
                        <WeightBar weightKg={v.cargo.weightKg} maxCapacityKg={v.cargo.maxCapacityKg} compact />
                      </td>
                      <td className={rowPad}><span className="text-[11px] text-slate-400">{v.destination}</span></td>
                      <td className={rowPad}><StatusBadge status={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedIds.size > 0 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[#1E2638] bg-[#161C2B] px-4 py-2.5 shadow-lg shadow-black/40">
                <span className="text-[11px] text-slate-300"><span className="font-mono tabular-nums">{selectedIds.size}</span> selected</span>
                <div className="h-4 w-px bg-[#1E2638]" />
                <button onClick={() => handleBulkAction('force-route-sync')} className="flex items-center gap-1.5 rounded border border-[#1E2638] bg-[#111622] px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:text-slate-100">
                  <RefreshCw className="h-3.5 w-3.5" /> Force route sync
                </button>
                <button onClick={() => handleBulkAction('broadcast-notice')} className="flex items-center gap-1.5 rounded border border-[#1E2638] bg-[#111622] px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:text-slate-100">
                  <Megaphone className="h-3.5 w-3.5" /> Broadcast notice
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-[40%] overflow-hidden bg-[#111622]">
          <VehicleDrawer vehicle={selectedVehicle} onReroute={setRerouteTarget} />
        </div>
      </div>

      {rerouteTarget && <RerouteModal vehicle={rerouteTarget} onClose={() => setRerouteTarget(null)} onConfirm={confirmReroute} />}
      {pendingReroute && (
        <UndoToast message={`Reroute to ${pendingReroute.destination} confirmed.`} onUndo={undoPendingReroute} onExpire={commitPendingReroute} />
      )}
      {bulkToastMessage && !pendingReroute && (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-[#1E2638] bg-[#161C2B] px-3.5 py-3 shadow-2xl shadow-black/60">
          <p className="text-[11px] text-slate-200">{bulkToastMessage}</p>
          <button onClick={() => setBulkToastMessage(null)} className="mt-2 text-[10.5px] text-slate-500 hover:text-slate-300">Dismiss</button>
        </div>
      )}
    </div>
  );
}
