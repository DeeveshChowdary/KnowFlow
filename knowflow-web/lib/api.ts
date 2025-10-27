export type EvidenceSpan = {
  sentence_id: string;
  text: string;
  section: string;
};

export type GraphNode = {
  node_id: string;
  label: string;
  type: string;
  summary: string;
  score: number;
  evidence: EvidenceSpan[];
};

export type GraphEdge = {
  edge_id: string;
  src: string;
  dst: string;
  relation: string;
  confidence: number;
  evidence?: EvidenceSpan;
};

export type SummaryBullet = {
  section: string;
  text: string;
  weight: number;
};

export type GraphResponse = {
  paper_id: string;
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: SummaryBullet[];
};

export type SearchResult = {
  paper_id: string;
  sentence_id: string;
  section: string;
  text: string;
  score: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function uploadPdf(file: File): Promise<{ paper_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return request(`${API_BASE}/ingest/pdf`, {
    method: "POST",
    body: formData,
  });
}

export async function ingestArxiv(url: string): Promise<{ paper_id: string }> {
  return request(`${API_BASE}/ingest/arxiv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function fetchGraph(paperId: string): Promise<GraphResponse> {
  return request(`${API_BASE}/paper/${paperId}/graph`);
}

export async function fetchStatus(paperId: string): Promise<{ status: string } & Record<string, unknown>> {
  return request(`${API_BASE}/paper/${paperId}/status`);
}

export async function searchSentences(query: string): Promise<{ results: SearchResult[] }> {
  return request(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
}
