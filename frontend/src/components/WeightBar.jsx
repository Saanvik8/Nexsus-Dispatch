import { capacityColor, formatWeight } from '../utils';

export default function WeightBar({ weightKg, maxCapacityKg, compact = false }) {
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
      <div className="mt-0.5 font-mono text-[10px] text-slate-600">
        {formatWeight(weightKg)} / {formatWeight(maxCapacityKg)}
      </div>
    </div>
  );
}
