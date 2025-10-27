"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphView } from "../components/GraphView";
import { NodePanel } from "../components/NodePanel";
import { SummaryPanel } from "../components/SummaryPanel";
import { StatusBadge } from "../components/StatusBadge";
import type { GraphNode, GraphResponse, SummaryBullet } from "../lib/api";
import {
  fetchGraph,
  fetchStatus,
  ingestArxiv,
  searchSentences,
  uploadPdf,
} from "../lib/api";

const demoGraph: GraphResponse = {
  paper_id: "demo",
  title: "KnowFlow Demo",
  nodes: [
    {
      node_id: "n1",
      label: "KnowFlow",
      type: "Model",
      summary: "Prototype pipeline that extracts entities and relations from papers.",
      score: 0.91,
      evidence: [
        {
          sentence_id: "s1",
          section: "Abstract",
          text: "KnowFlow turns dense research papers into a knowledge graph and summary.",
        },
      ],
    },
    {
      node_id: "n2",
      label: "COCO",
      type: "Dataset",
      summary: "Large-scale object detection benchmark used for evaluation.",
      score: 0.74,
      evidence: [
        {
          sentence_id: "s2",
          section: "Experiments",
          text: "We evaluate on MS-COCO to measure downstream transfer quality.",
        },
      ],
    },
    {
      node_id: "n3",
      label: "BLEU",
      type: "Metric",
      summary: "BLEU captures translation fidelity on held-out sets.",
      score: 0.62,
      evidence: [
        {
          sentence_id: "s3",
          section: "Experiments",
          text: "BLEU and Rouge-L improve by 4.3 and 2.1 respectively.",
        },
      ],
    },
  ],
  edges: [
    {
      edge_id: "e1",
      src: "n1",
      dst: "n2",
      relation: "evaluated_on",
      confidence: 0.83,
      evidence: {
        sentence_id: "s2",
        section: "Experiments",
        text: "We evaluate on MS-COCO to measure downstream transfer quality.",
      },
    },
    {
      edge_id: "e2",
      src: "n1",
      dst: "n3",
      relation: "reports",
      confidence: 0.51,
      evidence: {
        sentence_id: "s3",
        section: "Experiments",
        text: "BLEU and Rouge-L improve by 4.3 and 2.1 respectively.",
      },
    },
  ],
  summary: [
    { section: "Abstract", text: "KnowFlow builds explorable graphs from PDFs in <60s.", weight: 0.8 },
    { section: "Method", text: "A hybrid rule + embedding pipeline extracts canonical entities.", weight: 0.6 },
    { section: "Experiments", text: "Evaluated on COCO and BLEU with double-digit gains.", weight: 0.7 },
  ],
};

const demoSearchResults = [
  {
    paper_id: "demo",
    sentence_id: "s1",
    section: "Abstract",
    text: "KnowFlow turns dense research papers into a knowledge graph and summary.",
    score: 1,
  },
  {
    paper_id: "demo",
    sentence_id: "s4",
    section: "Method",
    text: "We link SciSpaCy entities with YAKE key phrases to canonical nodes.",
    score: 0.6,
  },
];

export default function Home() {
  const [paperId, setPaperId] = useState<string | null>(null);
  const [graph, setGraph] = useState<GraphResponse>(demoGraph);
  const [status, setStatus] = useState<string>("ready");
  const [selectedNode, setSelectedNode] = useState<GraphNode | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(demoSearchResults);

  useEffect(() => {
    if (!paperId || status === "ready") return;
    const interval = setInterval(async () => {
      try {
        const nextStatus = await fetchStatus(paperId);
        if (nextStatus.status !== status) {
          setStatus(nextStatus.status as string);
        }
        if (nextStatus.status === "ready") {
          const graphData = await fetchGraph(paperId);
          setGraph(graphData);
          setStatus("ready");
          setSelectedNode(undefined);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to refresh paper status.");
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [paperId, status]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const runSearch = async () => {
      try {
        const { results } = await searchSentences(searchQuery);
        setSearchResults(results);
      } catch {
        // silently use demo fallback when backend is not up
        setSearchResults(demoSearchResults);
      }
    };
    const handle = setTimeout(runSearch, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handlePdfUpload = async (file?: File) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const { paper_id } = await uploadPdf(file);
      setPaperId(paper_id);
      setStatus("processing");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleArxivSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = String(formData.get("arxiv"));
    if (!url) return;
    setError(null);
    setLoading(true);
    try {
      const { paper_id } = await ingestArxiv(url);
      setPaperId(paper_id);
      setStatus("queued");
    } catch (err) {
      console.error(err);
      setError("arXiv ingest failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = () => {
    setPaperId("demo");
    setGraph(demoGraph);
    setStatus("ready");
    setSelectedNode(undefined);
    setSearchResults(demoSearchResults);
  };

  const nodeCount = useMemo(() => graph?.nodes.length ?? 0, [graph]);
  const edgeCount = useMemo(() => graph?.edges.length ?? 0, [graph]);
  const summaryBullets: SummaryBullet[] = graph?.summary ?? [];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-10">
      <header className="flex flex-col gap-4 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">KnowFlow</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Upload a paper → get an explorable knowledge graph
            </h1>
            <p className="mt-2 text-base text-slate-600">
              PDFs, arXiv URLs, and demo data all flow through the same UI. Sub-60s
              turnaround with clickable evidence.
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">Nodes: {nodeCount}</span>
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">Edges: {edgeCount}</span>
          {paperId && <span className="rounded-full bg-white px-4 py-2 shadow-sm">Paper ID: {paperId}</span>}
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upload PDF</p>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 hover:border-brand-500">
              <span className="font-medium text-slate-700">Select a PDF or drop it here</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => handlePdfUpload(event.target.files?.[0])}
              />
            </label>
            <p className="mt-3 text-xs text-slate-400">Max 25 pages, 15MB</p>
          </div>
          <form onSubmit={handleArxivSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">or arXiv URL</p>
            <div className="mt-3 flex gap-2">
              <input
                name="arxiv"
                placeholder="https://arxiv.org/abs/XXXX.XXXXX"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
                disabled={loading}
              >
                Ingest
              </button>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="mt-3 text-left text-xs font-semibold text-brand-600"
            >
              Load demo graph
            </button>
          </form>
        </div>
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Knowledge graph</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Filters coming soon</span>
              </div>
            </div>
            <div className="mt-4">
              <GraphView nodes={graph?.nodes ?? []} edges={graph?.edges ?? []} selectedNodeId={selectedNode?.node_id} onSelectNode={setSelectedNode} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Semantic search</h2>
              <p className="text-xs text-slate-500">Hybrid pgvector + FTS</p>
            </div>
            <div className="mt-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search across uploaded papers"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <ul className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <li key={result.sentence_id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase text-slate-500">{result.section}</p>
                  <p className="text-sm text-slate-800">{result.text}</p>
                </li>
              ))}
              {!searchResults.length && (
                <li className="text-sm text-slate-500">Type to search your corpus.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="space-y-6">
          <SummaryPanel bullets={summaryBullets} />
          <NodePanel node={selectedNode} />
        </div>
      </section>
    </main>
  );
}
