import { Inbox, RefreshCw, Megaphone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import HosGauge from './HosGauge';
import WeightBar from './WeightBar';

function SkeletonRow({ compact }) {
  return (
    <tr className="border-b border-[#1E2638]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className={compact ? 'px-3 py-2' : 'px-3 py-3.5'}>
          <div className="h-3 w-full max-w-[110px] animate-pulse rounded bg-[#1E2638]" />
        </td>
      ))}
    </tr>
  );
}

export default function FleetTable({
  vehicles,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectVehicle,
  selectedVehicleId,
  density,
  onBulkAction,
}) {
  const compact = density === 'compact';
  const rowPad = compact ? 'px-3 py-2' : 'px-3 py-3.5';
  const allSelected = vehicles.length > 0 && selectedIds.size === vehicles.length;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#111622]">
            <tr className="border-b border-[#1E2638] text-[10.5px] uppercase tracking-wide text-slate-500">
              <th className="w-9 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all vehicles"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm border-[#1E2638] bg-[#161C2B] accent-blue-500"
                />
              </th>
              <th className="px-3 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Driver / HOS</th>
              <th className="px-3 py-2 font-medium">Cargo / Weight</th>
              <th className="px-3 py-2 font-medium">Destination</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} compact={compact} />)}

            {!loading && vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Inbox className="mx-auto mb-2 h-5 w-5 text-slate-700" />
                  <p className="text-xs text-slate-500">No units match the current filter.</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Adjust the filter segment or clear the search query.
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              vehicles.map((v) => (
                <tr
                  key={v._id}
                  onClick={() => onSelectVehicle(v._id)}
                  className={`cursor-pointer border-b border-[#1E2638] transition-colors ${
                    selectedVehicleId === v._id ? 'bg-[#161C2B]' : 'hover:bg-[#0F141F]'
                  }`}
                >
                  <td className={rowPad} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${v.vehicleId}`}
                      checked={selectedIds.has(v._id)}
                      onChange={() => onToggleSelect(v._id)}
                      className="h-3.5 w-3.5 rounded-sm border-[#1E2638] bg-[#161C2B] accent-blue-500"
                    />
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
                    <div className="mb-1 max-w-[160px] truncate text-[11px] text-slate-300">
                      {v.cargo.manifest}
                    </div>
                    <WeightBar weightKg={v.cargo.weightKg} maxCapacityKg={v.cargo.maxCapacityKg} compact />
                  </td>
                  <td className={rowPad}>
                    <span className="text-[11px] text-slate-400">{v.destination}</span>
                  </td>
                  <td className={rowPad}>
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[#1E2638] bg-[#161C2B] px-4 py-2.5 shadow-lg shadow-black/40">
          <span className="text-[11px] text-slate-300">
            <span className="font-mono tabular-nums">{selectedIds.size}</span> selected
          </span>
          <div className="h-4 w-px bg-[#1E2638]" />
          <button
            onClick={() => onBulkAction('force-route-sync')}
            className="focus-ring flex items-center gap-1.5 rounded border border-[#1E2638] bg-[#111622] px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:text-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Force route sync
          </button>
          <button
            onClick={() => onBulkAction('broadcast-notice')}
            className="focus-ring flex items-center gap-1.5 rounded border border-[#1E2638] bg-[#111622] px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:text-slate-100"
          >
            <Megaphone className="h-3.5 w-3.5" />
            Broadcast notice
          </button>
        </div>
      )}
    </div>
  );
}
