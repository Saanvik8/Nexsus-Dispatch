import { forwardRef } from 'react';
import { Search, Radio, Gauge, Rows3, LayoutList } from 'lucide-react';
import { FILTERS } from '../utils';

const Header = forwardRef(function Header(
  { activeCount, latencyMs, filter, onFilterChange, query, onQueryChange, density, onDensityChange },
  searchRef
) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[#1E2638] bg-[#111622] px-4">
      <div className="flex items-center gap-2 pr-4">
        <div className="flex h-6 w-6 items-center justify-center rounded border border-[#1E2638] bg-[#161C2B]">
          <Radio className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <span className="font-mono text-xs font-medium tracking-wide text-slate-200">
          NEXUS <span className="text-slate-600">//</span> DISPATCH DISCIPLINE
        </span>
      </div>

      <div className="flex items-center gap-3 border-l border-[#1E2638] pl-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" />
          <span className="font-mono tabular-nums text-slate-300">{latencyMs}ms</span>
        </span>
        <span className="text-slate-700">|</span>
        <span>
          <span className="font-mono tabular-nums text-slate-300">{activeCount}</span> active units
        </span>
        <span className="text-slate-700">|</span>
        <span className="inline-flex items-center gap-1.5 rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10.5px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live mode
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-[#1E2638] bg-[#161C2B] p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`focus-ring rounded px-2.5 py-1 text-[11px] transition-colors ${
              filter === f.key
                ? 'bg-[#1E2638] text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative ml-2 flex-1 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search vehicle, driver, terminal"
          className="focus-ring w-full rounded-md border border-[#1E2638] bg-[#161C2B] py-1.5 pl-8 pr-8 text-[11px] text-slate-200 placeholder:text-slate-600"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#1E2638] bg-[#0B0F17] px-1 py-0.5 font-mono text-[10px] text-slate-600">
          /
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1 rounded-md border border-[#1E2638] bg-[#161C2B] p-0.5">
        <button
          onClick={() => onDensityChange('compact')}
          aria-label="Compact density"
          className={`focus-ring flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${
            density === 'compact' ? 'bg-[#1E2638] text-slate-100' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Rows3 className="h-3.5 w-3.5" />
          Compact
        </button>
        <button
          onClick={() => onDensityChange('standard')}
          aria-label="Standard density"
          className={`focus-ring flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${
            density === 'standard' ? 'bg-[#1E2638] text-slate-100' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Standard
        </button>
      </div>
    </header>
  );
});

export default Header;
