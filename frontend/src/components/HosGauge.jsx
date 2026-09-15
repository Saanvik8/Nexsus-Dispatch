import { hosColor } from '../utils';

export default function HosGauge({ hoursLeft, threshold = 1.0, compact = false }) {
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
