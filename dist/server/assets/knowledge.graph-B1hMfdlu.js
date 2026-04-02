import { jsxs, jsx } from "react/jsx-runtime";
import { useReducer, useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { b as apiFetch } from "./router-Dve3S_a4.js";
import { K as KnowledgeHealthBanner } from "./KnowledgeHealthBanner-DkyCWad7.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
const AUDIENCE_COLOR = {
  human: "#3b82f6",
  agent: "#22c55e",
  bubble: "#eab308"
};
const DEFAULT_COLOR = "#6b7280";
const WIDTH = 900;
const HEIGHT = 600;
const ITERATIONS = 80;
const REPULSION = 5e3;
const ATTRACTION = 0.05;
const DAMPING = 0.85;
function buildSimNodes(graph) {
  return Object.entries(graph.nodes).map(([id, node]) => {
    const backlinks = graph.backlinks?.[id] ?? [];
    const radius = Math.min(3, backlinks.length) * 3 + 6;
    const color = node.audience ? AUDIENCE_COLOR[node.audience] ?? DEFAULT_COLOR : DEFAULT_COLOR;
    return {
      id,
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      vx: 0,
      vy: 0,
      radius,
      color,
      title: node.title,
      audience: node.audience ?? null
    };
  });
}
function runLayout(nodes, links) {
  const idxMap = /* @__PURE__ */ new Map();
  nodes.forEach((n, i) => idxMap.set(n.id, i));
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        nodes[i].vx += fx;
        nodes[i].vy += fy;
        nodes[j].vx -= fx;
        nodes[j].vy -= fy;
      }
    }
    for (const [src, targets] of Object.entries(links)) {
      const si = idxMap.get(src);
      if (si === void 0) continue;
      for (const tgt of targets) {
        const ti = idxMap.get(tgt);
        if (ti === void 0) continue;
        const dx = nodes[ti].x - nodes[si].x;
        const dy = nodes[ti].y - nodes[si].y;
        nodes[si].vx += dx * ATTRACTION;
        nodes[si].vy += dy * ATTRACTION;
        nodes[ti].vx -= dx * ATTRACTION;
        nodes[ti].vy -= dy * ATTRACTION;
      }
    }
    for (const n of nodes) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x = Math.max(n.radius, Math.min(WIDTH - n.radius, n.x + n.vx));
      n.y = Math.max(n.radius, Math.min(HEIGHT - n.radius, n.y + n.vy));
    }
  }
  return nodes;
}
function graphPageReducer(_, action) {
  return {
    graph: action.graph,
    health: action.health,
    simNodes: action.simNodes
  };
}
function KnowledgeGraphRoute() {
  const [{
    graph,
    health,
    simNodes
  }, dispatch] = useReducer(graphPageReducer, {
    graph: null,
    health: null,
    simNodes: []
  });
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();
  const svgRef = useRef(null);
  useEffect(() => {
    Promise.all([apiFetch("/api/knowledge/graph").then((r) => r.json()), apiFetch("/api/knowledge/health").then((r) => r.json())]).then(([g, h]) => {
      const graphData = g;
      const simNodes2 = graphData.node_count > 0 ? runLayout(buildSimNodes(graphData), graphData.links) : [];
      dispatch({
        type: "LOADED",
        graph: graphData,
        health: h,
        simNodes: simNodes2
      });
    }).catch(() => {
    });
  }, []);
  const edges = [];
  if (graph && simNodes.length > 0) {
    const posMap = new Map(simNodes.map((n) => [n.id, n]));
    for (const [src, targets] of Object.entries(graph.links)) {
      const s = posMap.get(src);
      if (!s) continue;
      for (const tgt of targets) {
        const t = posMap.get(tgt);
        if (!t) continue;
        edges.push({
          x1: s.x,
          y1: s.y,
          x2: t.x,
          y2: t.y,
          key: `${src}->${tgt}`
        });
      }
    }
  }
  return /* @__PURE__ */ jsxs("main", { className: "page", children: [
    /* @__PURE__ */ jsx("header", { className: "page-header", children: /* @__PURE__ */ jsx("h1", { children: "Knowledge Graph" }) }),
    /* @__PURE__ */ jsx(KnowledgeHealthBanner, { health, loading: graph === null }),
    graph?.node_count === 0 && /* @__PURE__ */ jsx("p", { className: "knowledge-graph__empty", children: "No knowledge notes found. Run the build pipeline to generate the graph." }),
    graph && graph.node_count > 0 && /* @__PURE__ */ jsxs("div", { className: "knowledge-graph__container", children: [
      /* @__PURE__ */ jsxs("svg", { ref: svgRef, width: WIDTH, height: HEIGHT, className: "knowledge-graph__svg border border-neutral-200 rounded-lg bg-neutral-50 block max-w-full", children: [
        /* @__PURE__ */ jsx("g", { className: "edges", children: edges.map((e) => /* @__PURE__ */ jsx("line", { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, stroke: "#d1d5db", strokeWidth: 1 }, e.key)) }),
        /* @__PURE__ */ jsx("g", { className: "nodes", children: simNodes.map((n) => /* @__PURE__ */ jsx("circle", { cx: n.x, cy: n.y, r: n.radius, fill: n.color, className: "cursor-pointer", onMouseEnter: () => setTooltip({
          x: n.x,
          y: n.y,
          title: n.title,
          audience: n.audience
        }), onMouseLeave: () => setTooltip(null), onClick: () => navigate({
          to: "/note",
          search: {
            p: n.id
          }
        }) }, n.id)) }),
        tooltip && /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("rect", { x: Math.min(tooltip.x + 8, WIDTH - 180), y: Math.max(tooltip.y - 30, 4), width: 170, height: 44, rx: 4, fill: "white", stroke: "#d1d5db" }),
          /* @__PURE__ */ jsxs("text", { x: Math.min(tooltip.x + 14, WIDTH - 174), y: Math.max(tooltip.y - 12, 20), fontSize: 12, fill: "#111827", children: [
            tooltip.title.slice(0, 22),
            tooltip.title.length > 22 ? "…" : ""
          ] }),
          /* @__PURE__ */ jsx("text", { x: Math.min(tooltip.x + 14, WIDTH - 174), y: Math.max(tooltip.y + 6, 38), fontSize: 11, fill: "#6b7280", children: tooltip.audience ?? "unknown" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "knowledge-graph__legend", children: [
        Object.entries(AUDIENCE_COLOR).map(([a, c]) => /* @__PURE__ */ jsxs("span", { className: "knowledge-graph__legend-item", children: [
          /* @__PURE__ */ jsx("svg", { width: 12, height: 12, children: /* @__PURE__ */ jsx("circle", { cx: 6, cy: 6, r: 5, fill: c }) }),
          a
        ] }, a)),
        /* @__PURE__ */ jsxs("span", { className: "knowledge-graph__legend-item", children: [
          /* @__PURE__ */ jsx("svg", { width: 12, height: 12, children: /* @__PURE__ */ jsx("circle", { cx: 6, cy: 6, r: 5, fill: DEFAULT_COLOR }) }),
          "other"
        ] })
      ] })
    ] })
  ] });
}
export {
  KnowledgeGraphRoute as component
};
