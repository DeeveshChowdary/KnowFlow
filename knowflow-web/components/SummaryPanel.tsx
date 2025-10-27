import type { SummaryBullet } from "../lib/api";

export function SummaryPanel({ bullets }: { bullets: SummaryBullet[] }) {
  if (!bullets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
        Summary will appear once processing finishes.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">TL;DR</p>
      <ul className="mt-4 space-y-3">
        {bullets.map((bullet, idx) => (
          <li key={`${bullet.section}-${idx}`} className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] uppercase text-slate-500">{bullet.section}</p>
            <p className="text-slate-700">{bullet.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
