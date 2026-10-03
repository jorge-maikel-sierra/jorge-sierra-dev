"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Color, type Group, type PerspectiveCamera, type ShaderMaterial } from "three";
import { buildGraph, buildParticles } from "./buildGraph";
import fragmentShader from "./particles.frag.glsl";
import vertexShader from "./particles.vert.glsl";

const CAMERA_Z = 3.6;
const POINT_SIZE = 1;

export type HeroSceneProps = {
  /** 0 = chaos, 1 = architecture. Read every frame, never causes a re-render. */
  progress: RefObject<number>;
  particleCount: number;
  onReady?: () => void;
};

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

function Particles({ progress, particleCount }: HeroSceneProps) {
  const group = useRef<Group>(null);
  const opacity = useFraming(group);
  const attributes = useMemo(
    () => buildParticles(buildGraph(), particleCount),
    [particleCount],
  );

  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: POINT_SIZE },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uAccent: { value: cssColor("--accent", "#6ef0b0") },
      uChaos: { value: cssColor("--chaos", "#ff9f5a") },
    }),
    [],
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
    <group ref={group}>
      {/* The chaotic positions double as "position" so three can size the buffer. */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[attributes.aChaos, 3]}
          />
          <bufferAttribute attach="attributes-aChaos" args={[attributes.aChaos, 3]} />
          <bufferAttribute attach="attributes-aOrder" args={[attributes.aOrder, 3]} />
          <bufferAttribute
            attach="attributes-aOrderEnd"
            args={[attributes.aOrderEnd, 3]}
          />
          <bufferAttribute attach="attributes-aDelay" args={[attributes.aDelay, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[attributes.aSeed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      camera={{ position: [0, 0, CAMERA_Z], near: 0.1, far: 20 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => props.onReady?.()}
    >
      <Particles {...props} />
    </Canvas>
  );
}
