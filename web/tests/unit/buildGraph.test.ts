import { describe, expect, it } from "vitest";
import {
  buildGraph,
  buildParticles,
  DELAY_JITTER,
  DELAY_SPAN,
  LAYER_DX,
  LAYER_X0,
  NODES_PER_LAYER,
  orderDelay,
} from "@/components/hero/buildGraph";

const graph = buildGraph();

describe("buildGraph", () => {
  it("has 15 nodes in 5 layers of 4, 3, 3, 3 and 2", () => {
    expect(graph.nodes).toHaveLength(15);
    expect(graph.layers.map((layer) => layer.length)).toEqual([...NODES_PER_LAYER]);
  });

  it("places each layer at its x and alternates depth", () => {
    graph.layers.forEach((layer, li) => {
      for (const index of layer) {
        expect(graph.nodes[index].x).toBeCloseTo(LAYER_X0 + li * LAYER_DX);
        expect(Math.abs(graph.nodes[index].z)).toBeCloseTo(0.32);
      }
    });
  });

  it("connects every node with at least one incoming or outgoing edge", () => {
    graph.nodes.forEach((_, index) => {
      const degree = graph.edges.filter(
        (edge) => edge.from === index || edge.to === index,
      ).length;
      expect(degree).toBeGreaterThan(0);
    });
  });

  it("only links consecutive layers, left to right, without duplicates", () => {
    const layerOf = (index: number) =>
      graph.layers.findIndex((layer) => layer.includes(index));
    const keys = new Set<string>();
    for (const edge of graph.edges) {
      expect(layerOf(edge.to)).toBe(layerOf(edge.from) + 1);
      keys.add(`${edge.from}-${edge.to}`);
    }
    expect(keys.size).toBe(graph.edges.length);
  });

  it("gives every node 1–2 outgoing edges except the last layer", () => {
    const last = graph.layers[graph.layers.length - 1];
    graph.nodes.forEach((_, index) => {
      const out = graph.edges.filter((edge) => edge.from === index).length;
      if (last.includes(index)) expect(out).toBe(0);
      else expect(out).toBeGreaterThanOrEqual(1);
      expect(out).toBeLessThanOrEqual(2);
    });
  });
});

describe("delays", () => {
  it("grow from left to right", () => {
    const xs = graph.layers.map((layer) => graph.nodes[layer[0]].x);
    const delays = xs.map((x) => orderDelay(x, 0));
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
    expect(delays[0]).toBe(0);
    expect(delays[delays.length - 1]).toBeCloseTo(DELAY_SPAN);
  });

  it("increase on average across particles from left to right", () => {
    const particles = buildParticles(graph, 6000, 7);
    const buckets = NODES_PER_LAYER.map(() => ({ sum: 0, n: 0 }));
    for (let i = 0; i < particles.count; i++) {
      const x = particles.aOrder[i * 3];
      const bucket = Math.min(4, Math.max(0, Math.round((x - LAYER_X0) / LAYER_DX)));
      buckets[bucket].sum += particles.aDelay[i];
      buckets[bucket].n += 1;
    }
    const means = buckets.map((b) => b.sum / b.n);
    for (let i = 1; i < means.length; i++) {
      expect(means[i]).toBeGreaterThan(means[i - 1]);
    }
  });
});

describe("buildParticles", () => {
  it("returns typed attributes sized for the requested count", () => {
    const p = buildParticles(graph, 1000);
    expect(p.aChaos).toHaveLength(3000);
    expect(p.aOrder).toHaveLength(3000);
    expect(p.aOrderEnd).toHaveLength(3000);
    expect(p.aDelay).toHaveLength(1000);
    expect(p.aSeed).toHaveLength(1000);
  });

  it("keeps delays inside the sweep window", () => {
    const p = buildParticles(graph, 5000);
    for (const delay of p.aDelay) {
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(DELAY_SPAN + DELAY_JITTER);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = buildParticles(graph, 200, 42);
    const b = buildParticles(graph, 200, 42);
    const c = buildParticles(graph, 200, 43);
    expect(Array.from(a.aChaos)).toEqual(Array.from(b.aChaos));
    expect(Array.from(a.aChaos)).not.toEqual(Array.from(c.aChaos));
  });

  it("puts about a quarter of the particles on nodes", () => {
    const p = buildParticles(graph, 20000, 3);
    let onNode = 0;
    for (let i = 0; i < p.count; i++) {
      const i3 = i * 3;
      if (
        p.aOrder[i3] === p.aOrderEnd[i3] &&
        p.aOrder[i3 + 1] === p.aOrderEnd[i3 + 1]
      )
        onNode++;
    }
    expect(onNode / p.count).toBeGreaterThan(0.23);
    expect(onNode / p.count).toBeLessThan(0.29);
  });
});
