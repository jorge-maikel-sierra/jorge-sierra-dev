// Graph and particle data for the hero scene (docs/design.md §4). Same layout
// as the `build` method in design-reference/Main.dc.html, made deterministic.

export const NODES_PER_LAYER = [4, 3, 3, 3, 2] as const;
export const LAYER_X0 = -1.3;
export const LAYER_DX = 0.65;
const LAYER_DY = 0.62;
const LAYER_DZ = 0.32;

/** Share of particles that orbit a node instead of flowing along an edge. */
export const NODE_PARTICLE_RATIO = 0.26;
/** Max delay: the order sweeps the graph left → right within this window. */
export const DELAY_SPAN = 0.42;
export const DELAY_JITTER = 0.16;

export type Vec3 = { x: number; y: number; z: number };
export type Edge = { from: number; to: number };
export type Graph = { layers: number[][]; nodes: Vec3[]; edges: Edge[] };

export function buildGraph(): Graph {
  const layers: number[][] = [];
  const nodes: Vec3[] = [];

  NODES_PER_LAYER.forEach((count, li) => {
    const indices: number[] = [];
    for (let k = 0; k < count; k++) {
      indices.push(nodes.length);
      nodes.push({
        x: LAYER_X0 + li * LAYER_DX,
        y: (k - (count - 1) / 2) * LAYER_DY,
        z: (k % 2 ? 1 : -1) * LAYER_DZ * (li % 2 ? -1 : 1),
      });
    }
    layers.push(indices);
  });

  // Node k links to nodes k and k + 1 (wrapping) of the next layer.
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (let li = 0; li < layers.length - 1; li++) {
    const next = layers[li + 1];
    layers[li].forEach((from, k) => {
      for (const to of [next[k % next.length], next[(k + 1) % next.length]]) {
        const key = `${from}-${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ from, to });
      }
    });
  }

  return { layers, nodes, edges };
}

/** Deterministic PRNG (mulberry32) so the scene and its tests are reproducible. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Delay grows with x so the order "sweeps" the graph from left to right. */
export function orderDelay(x: number, jitter: number) {
  const span = LAYER_X0 * -2;
  // Node particles can sit slightly left of the first layer: never below 0.
  const position = Math.min(1, Math.max(0, (x - LAYER_X0) / span));
  return DELAY_SPAN * position + jitter * DELAY_JITTER;
}

export type ParticleAttributes = {
  count: number;
  /** Chaotic rest position. */
  aChaos: Float32Array;
  /** Ordered position: node position, or the start of the particle's edge. */
  aOrder: Float32Array;
  /** End of the particle's edge (equals aOrder for node particles). */
  aOrderEnd: Float32Array;
  aDelay: Float32Array;
  /** Per-particle random in [0, 1): phase, speed and jitter in the shader. */
  aSeed: Float32Array;
};

export function buildParticles(
  graph: Graph,
  count: number,
  seed = 1,
): ParticleAttributes {
  const random = createRandom(seed);
  const aChaos = new Float32Array(count * 3);
  const aOrder = new Float32Array(count * 3);
  const aOrderEnd = new Float32Array(count * 3);
  const aDelay = new Float32Array(count);
  const aSeed = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    aChaos[i3] = (random() * 2 - 1) * 1.9;
    aChaos[i3 + 1] = (random() * 2 - 1) * 1.15;
    aChaos[i3 + 2] = random() * 2 - 1;

    let x: number;
    if (random() < NODE_PARTICLE_RATIO) {
      // Small sphere around a node.
      const node = graph.nodes[i % graph.nodes.length];
      const r = 0.06 * Math.cbrt(random());
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      aOrder[i3] = node.x + r * Math.sin(phi) * Math.cos(theta);
      aOrder[i3 + 1] = node.y + r * Math.sin(phi) * Math.sin(theta);
      aOrder[i3 + 2] = node.z + r * Math.cos(phi);
      aOrderEnd.set(aOrder.subarray(i3, i3 + 3), i3);
      x = aOrder[i3];
    } else {
      const edge = graph.edges[i % graph.edges.length];
      const a = graph.nodes[edge.from];
      const b = graph.nodes[edge.to];
      aOrder.set([a.x, a.y, a.z], i3);
      aOrderEnd.set([b.x, b.y, b.z], i3);
      // Delay follows the particle's starting point along its edge.
      x = a.x + (b.x - a.x) * random();
    }

    aDelay[i] = orderDelay(x, random());
    aSeed[i] = random();
  }

  return { count, aChaos, aOrder, aOrderEnd, aDelay, aSeed };
}
