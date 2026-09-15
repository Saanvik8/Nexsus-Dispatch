import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import FleetTable from './components/FleetTable';
import VehicleDrawer from './components/VehicleDrawer';
import RerouteModal from './components/RerouteModal';
import UndoToast from './components/UndoToast';
import { fetchFleet, reroute as rerouteApi, bulkAction as bulkActionApi } from './api';

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState('standard');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const [rerouteTarget, setRerouteTarget] = useState(null);
  const [rerouteSubmitting, setRerouteSubmitting] = useState(false);
  const [rerouteError, setRerouteError] = useState(null);

  const [pendingReroute, setPendingReroute] = useState(null);
  const [bulkToastMessage, setBulkToastMessage] = useState(null);

  const [latencyMs, setLatencyMs] = useState(28);

  const searchRef = useRef(null);

  const loadFleet = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const started = performance.now();
    try {
      const res = await fetchFleet();
      setVehicles(res.data);
      setLatencyMs(Math.max(9, Math.round(performance.now() - started)));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  // "/" focuses the search field unless the user is already typing somewhere.
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
      list = list.filter(
        (v) =>
          v.vehicleId.toLowerCase().includes(q) ||
          v.driver.name.toLowerCase().includes(q) ||
          v.destination.toLowerCase().includes(q) ||
          v.cargo.manifest.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, filter, query]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v._id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked) {
    setSelectedIds(checked ? new Set(filteredVehicles.map((v) => v._id)) : new Set());
  }

  async function handleBulkAction(action) {
    const ids = Array.from(selectedIds);
    try {
      await bulkActionApi(ids, action);
      setBulkToastMessage(
        action === 'force-route-sync'
          ? `Route sync forced for ${ids.length} unit${ids.length === 1 ? '' : 's'}.`
          : `Broadcast notice sent to ${ids.length} unit${ids.length === 1 ? '' : 's'}.`
      );
      setSelectedIds(new Set());
    } catch (err) {
      setBulkToastMessage(`Bulk action failed: ${err.message}`);
    }
  }

  function openReroute(vehicle) {
    setRerouteError(null);
    setRerouteTarget(vehicle);
  }

  async function confirmReroute({ destination, replacementDriver }) {
    if (!rerouteTarget) return;
    setRerouteSubmitting(true);
    setRerouteError(null);

    const hosBlocked =
      rerouteTarget.driver.hoursLeft <= (rerouteTarget.driver.hosThreshold ?? 1.0);
    if (hosBlocked && !replacementDriver) {
      setRerouteError(
        'Regulatory violation: driver has exceeded legal shift threshold. Re-dispatch requires replacement driver assignment.'
      );
      setRerouteSubmitting(false);
      return;
    }

    // Optimistic, reversible update: the visible destination changes now,
    // but the PATCH to the API is deferred until the undo window expires.
    setVehicles((prev) =>
      prev.map((v) =>
        v._id === rerouteTarget._id
          ? {
              ...v,
              destination,
              status: hosBlocked ? 'in-transit' : v.status,
              driver: hosBlocked
                ? { ...v.driver, name: replacementDriver, hoursLeft: 11 }
                : v.driver,
            }
          : v
      )
    );

    setPendingReroute({
      vehicleId: rerouteTarget._id,
      previousVehicle: rerouteTarget,
      destination,
      replacementDriver,
    });

    setRerouteSubmitting(false);
    setRerouteTarget(null);
  }

  const commitPendingReroute = useCallback(async () => {
    if (!pendingReroute) return;
    try {
      await rerouteApi(pendingReroute.vehicleId, {
        destination: pendingReroute.destination,
        replacementDriver: pendingReroute.replacementDriver,
      });
    } catch (err) {
      // Roll back the optimistic UI if the server ultimately rejects it.
      setVehicles((prev) =>
        prev.map((v) => (v._id === pendingReroute.vehicleId ? pendingReroute.previousVehicle : v))
      );
    } finally {
      setPendingReroute(null);
    }
  }, [pendingReroute]);

  function undoPendingReroute() {
    if (!pendingReroute) return;
    setVehicles((prev) =>
      prev.map((v) => (v._id === pendingReroute.vehicleId ? pendingReroute.previousVehicle : v))
    );
    setPendingReroute(null);
  }

  const activeCount = vehicles.filter((v) => v.status !== 'idle').length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0F17] font-sans text-slate-200">
      <Header
        ref={searchRef}
        activeCount={activeCount}
        latencyMs={latencyMs}
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        density={density}
        onDensityChange={setDensity}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[60%] overflow-hidden border-r border-[#1E2638] bg-[#111622]">
          {loadError ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-xs text-rose-400">Couldn't load the fleet roster.</p>
                <p className="mt-1 text-[11px] text-slate-500">{loadError}</p>
                <button
                  onClick={loadFleet}
                  className="focus-ring mt-3 rounded border border-[#1E2638] px-3 py-1.5 text-[11px] text-slate-300 hover:border-slate-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <FleetTable
              vehicles={filteredVehicles}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onSelectVehicle={setSelectedVehicleId}
              selectedVehicleId={selectedVehicleId}
              density={density}
              onBulkAction={handleBulkAction}
            />
          )}
        </div>

        <div className="w-[40%] overflow-hidden bg-[#111622]">
          <VehicleDrawer vehicle={selectedVehicle} onReroute={openReroute} />
        </div>
      </div>

      {rerouteTarget && (
        <RerouteModal
          vehicle={rerouteTarget}
          onClose={() => setRerouteTarget(null)}
          onConfirm={confirmReroute}
          submitting={rerouteSubmitting}
          serverError={rerouteError}
        />
      )}

      {pendingReroute && (
        <UndoToast
          message={`Reroute to ${pendingReroute.destination} confirmed.`}
          onUndo={undoPendingReroute}
          onExpire={commitPendingReroute}
        />
      )}

      {bulkToastMessage && !pendingReroute && (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-[#1E2638] bg-[#161C2B] px-3.5 py-3 shadow-2xl shadow-black/60">
          <p className="text-[11px] text-slate-200">{bulkToastMessage}</p>
          <button
            onClick={() => setBulkToastMessage(null)}
            className="focus-ring mt-2 text-[10.5px] text-slate-500 hover:text-slate-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
