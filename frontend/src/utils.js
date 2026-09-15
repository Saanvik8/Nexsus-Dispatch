export const STATUS_META = {
  'in-transit': {
    label: 'In transit',
    pill: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  delayed: {
    label: 'Delayed',
    pill: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    dot: 'bg-amber-500',
  },
  'hos-alert': {
    label: 'HOS alert',
    pill: 'bg-rose-950/40 text-rose-400 border-rose-800/50',
    dot: 'bg-rose-500',
  },
  idle: {
    label: 'Idle',
    pill: 'bg-slate-800/40 text-slate-400 border-slate-700/50',
    dot: 'bg-slate-500',
  },
};

export const FILTERS = [
  { key: 'all', label: 'All units' },
  { key: 'in-transit', label: 'In-transit' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'hos-alert', label: 'HOS alert' },
  { key: 'idle', label: 'Idle' },
];

export function hosSeverity(hoursLeft, threshold = 1.0) {
  if (hoursLeft <= threshold) return 'critical';
  if (hoursLeft <= threshold * 4) return 'warning';
  return 'ok';
}

export function hosColor(hoursLeft, threshold = 1.0) {
  const sev = hosSeverity(hoursLeft, threshold);
  if (sev === 'critical') return { bar: 'bg-rose-500', text: 'text-rose-400' };
  if (sev === 'warning') return { bar: 'bg-amber-500', text: 'text-amber-400' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
}

export function capacityColor(weightKg, maxCapacityKg) {
  const pct = maxCapacityKg > 0 ? (weightKg / maxCapacityKg) * 100 : 0;
  if (pct > 100) return { bar: 'bg-rose-500', text: 'text-rose-400', pct };
  if (pct >= 80) return { bar: 'bg-amber-500', text: 'text-amber-400', pct };
  return { bar: 'bg-emerald-500', text: 'text-emerald-400', pct };
}

export function formatCoord(value, axis) {
  const abs = Math.abs(value).toFixed(4);
  const suffix = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${abs}\u00b0 ${suffix}`;
}

export function formatWeight(kg) {
  return `${kg.toLocaleString('en-US')} kg`;
}
