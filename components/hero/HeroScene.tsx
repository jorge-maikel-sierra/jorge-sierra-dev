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
import type { HeroMotion, HeroVariant } from "./useHeroProgress";

const CAMERA_Z = 3.6;
const POINT_SIZE = 1;

export type HeroSceneProps = {
  /** Shared motion state. Read every frame, never causes a re-render. */
  motion: RefObject<HeroMotion>;
  variant: HeroVariant;
  particleCount: number;
  /** Stops the render loop while the hero is off screen. */
  paused?: boolean;
  layers: { label: string; sub: string }[];
  tokens: string[];
  /** Mobile strip status ("CAOS · 12%"), updated in place without re-renders. */
  status?: {
    element: RefObject<HTMLElement | null>;
    labels: StatusLabels;
  };
  onReady?: () => void;
};

type LayerProps = {
  graph: Graph;
  motion: RefObject<HeroMotion>;
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

// Same framing as the prototypes. Desktop: the graph sits at 71 % of the width
// on wide screens and under the text at half opacity below 900 px. Mobile: it
// fills its own strip (design-reference/Mobile-Hero.dc.html).
function framing(variant: HeroVariant, width: number, height: number) {
  if (variant === "mobile") {
    return { x: 0.5, y: 0.44, scale: Math.min(width * 0.27, height * 0.34), opacity: 1 };
  }
  const wide = width >= 900;
  return wide
    ? { x: 0.71, y: 0.5, scale: Math.min(width * 0.2, height * 0.33), opacity: 1 }
    : { x: 0.5, y: 0.68, scale: Math.min(width * 0.34, height * 0.22), opacity: 0.5 };
}

function useFraming(group: RefObject<Group | null>, variant: HeroVariant) {
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);

  const frame = framing(variant, size.width, size.height);
  const { scale } = frame;

  useLayoutEffect(() => {
    const perspective = get().camera as PerspectiveCamera;
    perspective.fov =
      (2 * Math.atan(size.height / (2 * scale * CAMERA_Z)) * 180) / Math.PI;
    perspective.updateProjectionMatrix();

    group.current?.position.set(
      (frame.x - 0.5) * (size.width / scale),
      -(frame.y - 0.5) * (size.height / scale),
      0,
    );
  }, [size, get, group, frame.x, frame.y, scale]);

  return frame.opacity;
}

/** Eases progress toward its target and smooths the pointer (prototype rates). */
function advanceMotion(state: HeroMotion, delta: number) {
  const dt = Math.min(50, delta * 1000) / 16.667;
  state.value += (state.target - state.value) * Math.min(1, 0.035 * dt);
  state.smoothX += (state.pointerX - state.smoothX) * Math.min(1, 0.05 * dt);
  state.smoothY += (state.pointerY - state.smoothY) * Math.min(1, 0.05 * dt);
}

type StatusLabels = { chaos: string; ordering: string; architecture: string };

/** Writes "CAOS · 12%" and data-state on the strip status; returns the text. */
function writeStatus(
  element: HTMLElement,
  value: number,
  labels: StatusLabels,
  previous: string,
) {
  const percent = Math.round(value * 100);
  const state = percent < 30 ? "chaos" : percent < 90 ? "ordering" : "architecture";
  const text = `${labels[state]} · ${percent}%`;
  if (text !== previous) {
    element.dataset.state = state;
    const target = element.querySelector("[data-status-text]");
    if (target) target.textContent = text;
  }
  return text;
}

// Rotation from design.md §4 (desktop) and Mobile-Hero.dc.html (mobile).
const ROTATION: Record<HeroVariant, { amp: number; base: number; yawPointer: number; pitchPointer: number }> = {
  desktop: { amp: 0.45, base: -0.28, yawPointer: 0.4, pitchPointer: 0.18 },
  mobile: { amp: 0.4, base: -0.22, yawPointer: 0.35, pitchPointer: 0.15 },
};

function Particles({
  graph,
  motion,
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
    current.uProgress.value = motion.current.value;
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
function Edges({ graph, motion, opacity, colors }: LayerProps) {
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
    material.current.opacity = 0.3 * ramp(motion.current.value, 0.55, 0.4) * opacity;
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
  motion,
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
      strength * ramp(motion.current.value, start, length) * opacity;
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
  motion,
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

    const labelAlpha = ramp(motion.current.value, 0.86, 0.14) * opacity;
    anchors.tops.forEach((anchor, i) => {
      point.copy(anchor);
      group.localToWorld(point);
      place(overlay.labels.current[i], labelAlpha);
    });

    const tokenAlpha = (1 - clamp01(motion.current.value * 1.6)) * 0.75 * opacity;
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
  motion,
  variant,
  particleCount,
  overlay,
  tokenCount,
  status,
}: HeroSceneProps & { overlay: OverlayRefs; tokenCount: number }) {
  const framed = useRef<Group>(null);
  const rotating = useRef<Group>(null);
  const opacity = useFraming(framed, variant);
  const graph = useMemo(() => buildGraph(), []);
  const colors = useMemo(
    () => ({
      accent: cssColor("--accent", "#6ef0b0"),
      chaos: cssColor("--chaos", "#ff9f5a"),
    }),
    [],
  );
  const lastStatus = useRef("");
  const shared = { graph, motion, opacity, colors };

  // Ease progress toward its target and smooth the pointer, as the prototype.
  useFrame(({ clock }, delta) => {
    const state = motion.current;
    advanceMotion(state, delta);

    const r = ROTATION[variant];
    const yaw =
      Math.sin(clock.elapsedTime * 0.18) * r.amp + r.base + state.smoothX * r.yawPointer;
    const pitch = 0.2 + state.smoothY * r.pitchPointer;
    rotating.current?.rotation.set(pitch, yaw, 0);

    const element = status?.element.current;
    if (element) {
      lastStatus.current = writeStatus(
        element,
        state.value,
        status.labels,
        lastStatus.current,
      );
    }
  });

  return (
    <group ref={framed}>
      <group ref={rotating}>
        <Edges {...shared} />
        <Particles {...shared} count={particleCount} />
        <Pulses {...shared} />
        <Nodes {...shared} />
        <OverlayProjector
          {...shared}
          overlay={overlay}
          tokenCount={tokenCount}
          root={rotating}
        />
      </group>
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
        frameloop={props.paused ? "never" : "always"}
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
        {props.variant === "desktop" &&
          props.layers.map((layer, i) => (
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
