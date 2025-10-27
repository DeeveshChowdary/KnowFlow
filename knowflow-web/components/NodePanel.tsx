import type { GraphNode } from "../lib/api";

export function NodePanel({ node }: { node?: GraphNode }) {
  if (!node) {
    return (
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Select a node in the graph to inspect its evidence.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Entity</p>
        <h3 className="text-xl font-semibold text-slate-800">{node.label}</h3>
        <p className="text-xs text-slate-500">{node.type}</p>
      </div>
      <p className="mt-4 text-sm text-slate-600">{node.summary}</p>
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase text-slate-400">Evidence</p>
        {node.evidence?.map((span) => (
          <div key={span.sentence_id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-[11px] uppercase text-slate-500">{span.section}</p>
            <p className="text-slate-700">{span.text}</p>
          </div>
        )) ?? <p className="text-sm text-slate-500">No supporting sentences tracked.</p>}
      </div>
    </div>
  );
}
