import { STATUS_META } from '../utils';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.idle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10.5px] font-medium leading-none ${meta.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
