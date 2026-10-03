import type { Profile } from "@/lib/content/schema";

// Temporary static image of the final "order" state, drawn with the same
// projection as design-reference/Main.dc.html. Task 2.6 replaces it with an
// AVIF/WebP captured from the real scene.

const NODES_PER_LAYER = [4, 3, 3, 3, 2];
const YAW = -0.28;
const PITCH = 0.2;
const SCALE = 100;

type Point = { x: number; y: number; k: number };

function project(x: number, y: number, z: number): Point {
  const x1 = x * Math.cos(YAW) - z * Math.sin(YAW);
  const z1 = x * Math.sin(YAW) + z * Math.cos(YAW);
  const y1 = y * Math.cos(PITCH) - z1 * Math.sin(PITCH);
  const z2 = y * Math.sin(PITCH) + z1 * Math.cos(PITCH);
  const k = 3.6 / (3.6 + z2);
  return { x: x1 * SCALE * k, y: y1 * SCALE * k, k };
}

function buildStaticGraph() {
  const layers: number[][] = [];
  const nodes: Point[] = [];
  NODES_PER_LAYER.forEach((count, li) => {
    const indices: number[] = [];
    for (let k = 0; k < count; k++) {
      const y = (k - (count - 1) / 2) * 0.62;
      const z = (k % 2 ? 1 : -1) * 0.32 * (li % 2 ? -1 : 1);
      indices.push(nodes.length);
      nodes.push(project(-1.3 + li * 0.65, y, z));
    }
    layers.push(indices);
  });

  const edges: [number, number][] = [];
  const seen = new Set<string>();
  for (let li = 0; li < layers.length - 1; li++) {
    const next = layers[li + 1];
    layers[li].forEach((a, k) => {
      for (const b of [next[k % next.length], next[(k + 1) % next.length]]) {
        if (seen.has(`${a}-${b}`)) continue;
        seen.add(`${a}-${b}`);
        edges.push([a, b]);
      }
    });
  }

  const tops = layers.map((indices) =>
    indices.reduce((top, i) => (nodes[i].y < top.y ? nodes[i] : top), nodes[indices[0]]),
  );
  return { nodes, edges, tops };
}

const graph = buildStaticGraph();
const round = (value: number) => Math.round(value * 10) / 10;

export function HeroFallback({
  layers,
  className,
}: {
  layers: Profile["hero"]["graphLayers"];
  className?: string;
}) {
  return (
    <svg
      viewBox="-160 -110 320 210"
      aria-hidden="true"
      overflow="visible"
      className={className}
      fontFamily="var(--font-mono)"
    >
      <g stroke="var(--accent)" strokeOpacity="0.3" strokeWidth="0.4">
        {graph.edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={round(graph.nodes[a].x)}
            y1={round(graph.nodes[a].y)}
            x2={round(graph.nodes[b].x)}
            y2={round(graph.nodes[b].y)}
          />
        ))}
      </g>
      {graph.nodes.map((node, i) => (
        <g key={i} fill="var(--accent)" stroke="var(--accent)">
          <circle
            cx={round(node.x)}
            cy={round(node.y)}
            r={round(3.9 * node.k)}
            fill="none"
            strokeWidth="0.5"
            strokeOpacity="0.9"
          />
          <circle
            cx={round(node.x)}
            cy={round(node.y)}
            r={round(1.2 * node.k)}
            stroke="none"
          />
        </g>
      ))}
      <g className="hidden sm:block" textAnchor="middle">
        {layers.map((layer, i) => (
          <g key={layer.label}>
            <text
              x={round(graph.tops[i].x)}
              y={round(graph.tops[i].y - 14 * graph.tops[i].k)}
              fill="var(--text)"
              fontSize="4.3"
              fontWeight="500"
            >
              {layer.label}
            </text>
            <text
              x={round(graph.tops[i].x)}
              y={round(graph.tops[i].y - 8.7 * graph.tops[i].k)}
              fill="var(--text-muted)"
              fontSize="3.9"
            >
              {layer.sub}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
