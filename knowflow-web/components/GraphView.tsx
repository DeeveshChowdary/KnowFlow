"use client";

import CytoscapeComponent from "react-cytoscapejs";
import type cytoscape from "cytoscape";
import { useEffect, useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "../lib/api";

const layout = { name: "cose", animate: false };

const stylesheet = [
  {
    selector: "node",
    style: {
      width: "60px",
      height: "60px",
      "background-color": "#4f46e5",
      label: "data(label)",
      color: "#fff",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "10px",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#c7d2fe",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#c7d2fe",
      label: "data(label)",
      "font-size": "8px",
      color: "#475569",
    },
  },
  {
    selector: ".selected",
    style: {
      "background-color": "#f97316",
      "border-width": 3,
      "border-color": "#fb923c",
      "line-color": "#f97316",
    },
  },
];

const typePalette: Record<string, string> = {
  Model: "#4f46e5",
  Dataset: "#0891b2",
  Task: "#16a34a",
  Metric: "#db2777",
};

export type GraphViewProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  onSelectNode?: (node?: GraphNode) => void;
};

export function GraphView({ nodes, edges, selectedNodeId, onSelectNode }: GraphViewProps) {
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    return [
      ...nodes.map((node) => ({
        data: { id: node.node_id, label: node.label },
        classes: [selectedNodeId === node.node_id ? "selected" : "", node.type].join(" "),
        style: { "background-color": typePalette[node.type] ?? "#4f46e5" },
      })),
      ...edges.map((edge) => ({
        data: { id: edge.edge_id, source: edge.src, target: edge.dst, label: edge.relation },
        classes: selectedNodeId && (edge.src === selectedNodeId || edge.dst === selectedNodeId) ? "selected" : "",
      })),
    ];
  }, [nodes, edges, selectedNodeId]);

  useEffect(() => {
    if (!cyInstance || !onSelectNode) return;
    const handler = (event: cytoscape.EventObject) => {
      const id = event.target.id();
      const node = nodes.find((item) => item.node_id === id);
      onSelectNode(node);
    };
    cyInstance.on("tap", "node", handler);
    return () => {
      cyInstance.off("tap", "node", handler);
    };
  }, [cyInstance, nodes, onSelectNode]);

  return (
    <CytoscapeComponent
      cy={setCyInstance}
      elements={elements}
      layout={layout}
      stylesheet={stylesheet}
      style={{ width: "100%", height: "520px", borderRadius: "1rem", background: "#fff" }}
    />
  );
}
