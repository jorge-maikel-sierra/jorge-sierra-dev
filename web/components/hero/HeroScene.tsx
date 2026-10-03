"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import {
  Color,
  Vector3,
  type Group,
  type LineBasicMaterial,
  type PerspectiveCamera,
  type ShaderMaterial,
} from "three";
import {
  buildGraph,
  buildParticles,
  createRandom,
  type Graph,
} from "./buildGraph";
import marksFragment from "./marks.frag.glsl";
import marksVertex from "./marks.vert.glsl";
import particlesFragment from "./particles.frag.glsl";
import particlesVertex from "./particles.vert.glsl";

const CAMERA_Z = 3.6;
const POINT_SIZE = 1;

export type HeroSceneProps = {
  /** 0 = chaos, 1 = architecture. Read every frame, never causes a re-render. */
  progress: RefObject<number>;
  particleCount: number;
  layers: { label: string; sub: string }[];
  tokens: string[];
  onReady?: () => void;
};

type LayerProps = {
  graph: Graph;
  progress: RefObject<number>;
  /** 1 on wide screens, 0.5 when the graph sits under the text. */
  opacity: number;
  colors: { accent: Color; chaos: Color };
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Fades a layer in between `start` and `start + length` of the progress. */
const ramp = (progress: number, start: number, length: number) =>
  clamp01((progress - start) / length);

const cssColor = (token: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return new Color(value || fallback);
};

// Same framing as the prototype: on wide screens the graph sits at 71 % of the
// width; below 900 px it moves under the text at half opacity.
function useFraming(group: RefObject<Group | null>) {
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);

  useLayoutEffect(() => {
    const wide = size.width >= 900;
    const scale = wide
      ? Math.min(size.width * 0.2, size.height * 0.33)
      : Math.min(size.width * 0.34, size.height * 0.22);
    const perspective = get().camera as PerspectiveCamera;
    perspective.fov =
      (2 * Math.atan(size.height / (2 * scale * CAMERA_Z)) * 180) / Math.PI;
    perspective.updateProjectionMatrix();

    group.current?.position.set(
      ((wide ? 0.71 : 0.5) - 0.5) * (size.width / scale),
      -((wide ? 0.5 : 0.68) - 0.5) * (size.height / scale),
      0,
    );
  }, [size, get, group]);

  return size.width >= 900 ? 1 : 0.5;
}

function Particles({
  graph,
  progress,
  opacity,
  colors,
  count,
}: LayerProps & { count: number }) {
  const attributes = useMemo(() => buildParticles(graph, count), [graph, count]);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: POINT_SIZE },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uAccent: { value: colors.accent },
      uChaos: { value: colors.chaos },
    }),
    [colors],
  );

  // Uniforms change every frame through the material ref, never via state.
  useFrame(({ clock, gl }) => {
    const current = material.current?.uniforms;
    if (!current) return;
    current.uTime.value = clock.elapsedTime;
    current.uProgress.value = progress.current;
    current.uPixelRatio.value = gl.getPixelRatio();
    current.uOpacity.value = opacity;
  });

  return (
    // The chaotic positions double as "position" so three can size the buffer.
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.aChaos, 3]} />
        <bufferAttribute attach="attributes-aChaos" args={[attributes.aChaos, 3]} />
        <bufferAttribute attach="attributes-aOrder" args={[attributes.aOrder, 3]} />
        <bufferAttribute attach="attributes-aOrderEnd" args={[attributes.aOrderEnd, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[attributes.aDelay, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.aSeed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={particlesVertex}
        fragmentShader={particlesFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/** Edges appear from progress 0.55. */
function Edges({ graph, progress, opacity, colors }: LayerProps) {
  const material = useRef<LineBasicMaterial>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        graph.edges.flatMap(({ from, to }) => {
          const a = graph.nodes[from];
          const b = graph.nodes[to];
          return [a.x, a.y, a.z, b.x, b.y, b.z];
        }),
      ),
    [graph],
  );

  useFrame(() => {
    if (!material.current) return;
    material.current.opacity = 0.3 * ramp(progress.current, 0.55, 0.4) * opacity;
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={material}
        color={colors.accent}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </lineSegments>
  );
}

type MarksProps = LayerProps & {
  from: Float32Array;
  to: Float32Array;
  offset: Float32Array;
  /** Point diameter in CSS pixels at depth 0. */
  size: number;
  speed: number;
  ring: boolean;
  start: number;
  length: number;
  strength: number;
};

/** Screen-space node rings and edge pulses, drawn by marks.*.glsl. */
function Marks({
  progress,
  opacity,
  colors,
  from,
  to,
  offset,
  size,
  speed,
  ring,
  start,
  length,
  strength,
}: MarksProps) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uColor: { value: colors.accent },
      uOpacity: { value: 0 },
      uRing: { value: ring ? 1 : 0 },
    }),
    [speed, size, colors, ring],
  );

  useFrame(({ clock, gl }) => {
    const current = material.current?.uniforms;
    if (!current) return;
    current.uTime.value = clock.elapsedTime;
    current.uPixelRatio.value = gl.getPixelRatio();
    current.uOpacity.value =
      strength * ramp(progress.current, start, length) * opacity;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[from, 3]} />
        <bufferAttribute attach="attributes-aFrom" args={[from, 3]} />
        <bufferAttribute attach="attributes-aTo" args={[to, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[offset, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={marksVertex}
        fragmentShader={marksFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/** Node rings from 0.65 (10 px radius + 3 px dot, as in the prototype). */
function Nodes(props: LayerProps) {
  const { graph } = props;
  const positions = useMemo(
    () => new Float32Array(graph.nodes.flatMap((n) => [n.x, n.y, n.z])),
    [graph],
  );
  const offset = useMemo(
    () => new Float32Array(graph.nodes.length),
    [graph],
  );
  return (
    <Marks
      {...props}
      from={positions}
      to={positions}
      offset={offset}
      size={22}
      speed={0}
      ring
      start={0.65}
      length={0.3}
      strength={0.9}
    />
  );
}

/** Two data pulses per edge from 0.8. */
function Pulses(props: LayerProps) {
  const { graph } = props;
  const { from, to, offset } = useMemo(() => {
    const random = createRandom(11);
    const starts: number[] = [];
    const ends: number[] = [];
    const offsets: number[] = [];
    for (const edge of graph.edges) {
      const a = graph.nodes[edge.from];
      const b = graph.nodes[edge.to];
      const base = random();
      for (const shift of [0, 0.5]) {
        starts.push(a.x, a.y, a.z);
        ends.push(b.x, b.y, b.z);
        offsets.push(base + shift);
      }
    }
    return {
      from: new Float32Array(starts),
      to: new Float32Array(ends),
      offset: new Float32Array(offsets),
    };
  }, [graph]);

  return (
    <Marks
      {...props}
      from={from}
      to={to}
      offset={offset}
      size={5}
      speed={0.28}
      ring={false}
      start={0.8}
      length={0.2}
      strength={1}
    />
  );
}

type OverlayRefs = {
  labels: RefObject<(HTMLElement | null)[]>;
  tokens: RefObject<(HTMLElement | null)[]>;
};

/**
 * Layer labels (from 0.86) and chaos tokens (fade with 1 - p × 1.6) are plain
 * DOM siblings of the canvas. Each frame projects their 3D anchor to screen
 * space and moves them with a transform: one React tree, no extra roots.
 */
function OverlayProjector({
  graph,
  progress,
  opacity,
  overlay,
  tokenCount,
  root,
}: LayerProps & {
  overlay: OverlayRefs;
  tokenCount: number;
  root: RefObject<Group | null>;
}) {
  const size = useThree((state) => state.size);
  const anchors = useMemo(() => {
    const tops = graph.layers.map((indices) => {
      const top = indices.reduce((best, index) =>
        graph.nodes[index].y > graph.nodes[best].y ? index : best,
      );
      const node = graph.nodes[top];
      return new Vector3(node.x, node.y, node.z);
    });
    const random = createRandom(23);
    const tokens = Array.from({ length: tokenCount }, () => ({
      x: (random() * 2 - 1) * 1.6,
      y: (random() * 2 - 1) * 1.0,
      z: (random() * 2 - 1) * 0.8,
      phase: random() * Math.PI * 2,
    }));
    return { tops, tokens };
  }, [graph, tokenCount]);
  const point = useMemo(() => new Vector3(), []);

  useFrame(({ camera, clock }) => {
    const group = root.current;
    if (!group) return;
    const place = (element: HTMLElement | null, alpha: number) => {
      if (!element) return;
      point.project(camera);
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      element.style.opacity = String(alpha);
    };

    const labelAlpha = ramp(progress.current, 0.86, 0.14) * opacity;
    anchors.tops.forEach((anchor, i) => {
      point.copy(anchor);
      group.localToWorld(point);
      place(overlay.labels.current[i], labelAlpha);
    });

    const tokenAlpha = (1 - clamp01(progress.current * 1.6)) * 0.75 * opacity;
    anchors.tokens.forEach((token, i) => {
      const a = clock.elapsedTime * 0.4 + token.phase;
      point.set(
        token.x + Math.sin(a) * 0.06,
        token.y + Math.cos(a * 1.2) * 0.06,
        token.z,
      );
      group.localToWorld(point);
      place(overlay.tokens.current[i], tokenAlpha);
    });
  });

  return null;
}

function Scene({
  progress,
  particleCount,
  overlay,
  tokenCount,
}: HeroSceneProps & { overlay: OverlayRefs; tokenCount: number }) {
  const group = useRef<Group>(null);
  const opacity = useFraming(group);
  const graph = useMemo(() => buildGraph(), []);
  const colors = useMemo(
    () => ({
      accent: cssColor("--accent", "#6ef0b0"),
      chaos: cssColor("--chaos", "#ff9f5a"),
    }),
    [],
  );
  const shared = { graph, progress, opacity, colors };

  return (
    <group ref={group}>
      <Edges {...shared} />
      <Particles {...shared} count={particleCount} />
      <Pulses {...shared} />
      <Nodes {...shared} />
      <OverlayProjector
        {...shared}
        overlay={overlay}
        tokenCount={tokenCount}
        root={group}
      />
    </group>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  const labels = useRef<(HTMLElement | null)[]>([]);
  const tokens = useRef<(HTMLElement | null)[]>([]);

  return (
    <>
      <Canvas
        aria-hidden="true"
        dpr={[1, 2]}
        camera={{ position: [0, 0, CAMERA_Z], near: 0.1, far: 20 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => props.onReady?.()}
      >
        <Scene
          {...props}
          overlay={{ labels, tokens }}
          tokenCount={props.tokens.length}
        />
      </Canvas>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {props.layers.map((layer, i) => (
          <div
            key={layer.label}
            ref={(element) => {
              labels.current[i] = element;
            }}
            className="absolute left-0 top-0 opacity-0"
          >
            <div className="-translate-x-1/2 -translate-y-[calc(100%+18px)] whitespace-nowrap text-center font-mono">
              <p className="text-[11px] font-medium text-text">{layer.label}</p>
              <p className="text-[10px] text-text-muted">{layer.sub}</p>
            </div>
          </div>
        ))}
        {props.tokens.map((token, i) => (
          <span
            key={token}
            ref={(element) => {
              tokens.current[i] = element;
            }}
            className="absolute left-0 top-0 whitespace-nowrap font-mono text-[11px] text-chaos opacity-0"
          >
            {token}
          </span>
        ))}
      </div>
    </>
  );
}
