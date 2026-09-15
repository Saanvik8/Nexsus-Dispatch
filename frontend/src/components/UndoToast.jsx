import { useEffect, useRef, useState } from 'react';
import { Check, Undo2 } from 'lucide-react';

const DURATION_MS = 5000;

export default function UndoToast({ message, onUndo, onExpire }) {
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const left = Math.max(0, DURATION_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire();
      }
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
          <p className="mt-0.5 font-mono text-[10px] text-slate-600">
            Committing in {(remainingMs / 1000).toFixed(1)}s
          </p>
        </div>
        <button
          onClick={onUndo}
          className="focus-ring flex shrink-0 items-center gap-1 rounded border border-[#1E2638] px-2 py-1 text-[10.5px] text-slate-300 hover:border-slate-600 hover:text-slate-100"
        >
          <Undo2 className="h-3 w-3" />
          Undo
        </button>
      </div>
      <div className="h-0.5 w-full bg-[#0B0F17]">
        <div className="h-full bg-blue-500" style={{ width: `${pct}%`, transition: 'width 50ms linear' }} />
      </div>
    </div>
  );
}
