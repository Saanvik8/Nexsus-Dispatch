import { useEffect, useRef, useState } from 'react';
import { X, ShieldAlert, TriangleAlert, ArrowRight } from 'lucide-react';

export default function RerouteModal({ vehicle, onClose, onConfirm, submitting, serverError }) {
  const [destination, setDestination] = useState('');
  const [replacementDriver, setReplacementDriver] = useState('');
  const inputRef = useRef(null);

  const hosBlocked = vehicle.driver.hoursLeft <= (vehicle.driver.hosThreshold ?? 1.0);
  const overCapacity = vehicle.cargo.weightKg > vehicle.cargo.maxCapacityKg;
  const needsReplacement = hosBlocked && !replacementDriver.trim();

  useEffect(() => {
    inputRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!destination.trim() || needsReplacement) return;
    onConfirm({ destination: destination.trim(), replacementDriver: replacementDriver.trim() || undefined });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-[#1E2638] bg-[#111622] shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-[#1E2638] px-4 py-3">
          <div>
            <h2 className="text-xs font-medium text-slate-200">Dispatch reroute</h2>
            <p className="font-mono text-[10.5px] text-slate-500">{vehicle.vehicleId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded p-1 text-slate-500 hover:bg-[#161C2B] hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4">
          {hosBlocked && (
            <div className="mb-3 rounded-md border border-rose-800/50 bg-rose-950/40 px-3 py-2.5">
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <p className="text-[11px] leading-snug text-rose-300">
                  Regulatory violation: driver has exceeded legal shift threshold. Re-dispatch requires
                  replacement driver assignment.
                </p>
              </div>
            </div>
          )}

          {overCapacity && (
            <div className="mb-3 rounded-md border border-amber-800/50 bg-amber-950/40 px-3 py-2.5">
              <div className="flex gap-2">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-snug text-amber-300">
                  Payload {vehicle.cargo.weightKg.toLocaleString()}kg exceeds rated capacity of{' '}
                  {vehicle.cargo.maxCapacityKg.toLocaleString()}kg. Reroute may proceed, but flag for
                  load review.
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-3 rounded-md border border-rose-800/50 bg-rose-950/40 px-3 py-2 text-[11px] text-rose-300">
              {serverError}
            </div>
          )}

          <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-slate-500">
            New destination
          </label>
          <input
            ref={inputRef}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Charlotte, NC \u2014 Terminal 6"
            className="focus-ring mb-3 w-full rounded-md border border-[#1E2638] bg-[#161C2B] px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600"
          />

          {hosBlocked && (
            <>
              <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-slate-500">
                Replacement driver
              </label>
              <input
                value={replacementDriver}
                onChange={(e) => setReplacementDriver(e.target.value)}
                placeholder="Driver name"
                className="focus-ring mb-3 w-full rounded-md border border-[#1E2638] bg-[#161C2B] px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600"
              />
            </>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10.5px] text-slate-600">
              <kbd className="rounded border border-[#1E2638] bg-[#0B0F17] px-1 py-0.5 font-mono">Esc</kbd>
              to cancel
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-md border border-[#1E2638] px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!destination.trim() || needsReplacement || submitting}
                className="focus-ring flex items-center gap-1.5 rounded-md border border-blue-800/60 bg-blue-950/50 px-3 py-1.5 text-[11px] font-medium text-blue-300 hover:bg-blue-950/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Confirming\u2026' : 'Confirm reroute'}
                {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
