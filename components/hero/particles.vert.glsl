// Hero particles (docs/design.md §4). All motion lives here: no per-particle
// loop on the CPU. Mirrors the canvas logic of design-reference/Main.dc.html.

uniform float uProgress;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uAccent;
uniform vec3 uChaos;

attribute vec3 aChaos;
attribute vec3 aOrder;
attribute vec3 aOrderEnd;
attribute float aDelay;
attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;

const float TAU = 6.2831853;
const float DELAY_WINDOW = 0.58;

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  float phase = aSeed * TAU;
  bool onNode = distance(aOrder, aOrderEnd) < 1e-4;

  // Chaos: each particle drifts around its rest position.
  float freq = 0.3 + fract(aSeed * 7.13) * 0.9;
  float a = uTime * freq + phase;
  vec3 chaos = aChaos + vec3(sin(a), cos(a * 1.3), sin(a * 0.7 + phase)) * 0.09;

  // Order: orbit the node, or flow along the edge (data in motion).
  vec3 order;
  if (onNode) {
    float b = uTime * 0.6 + phase;
    order = aOrder + vec3(sin(b), cos(b), 0.0) * 0.008;
  } else {
    float speed = 0.04 + fract(aSeed * 13.7) * 0.06;
    float t = fract(fract(aSeed * 3.17) + uTime * speed);
    vec2 jitter = (vec2(fract(aSeed * 17.3), fract(aSeed * 29.1)) - 0.5) * 0.03;
    order = mix(aOrder, aOrderEnd, t) + vec3(jitter, 0.0);
  }

  // The delay grows left → right, so order sweeps the graph.
  float p = clamp(uProgress * (1.0 + DELAY_WINDOW) - aDelay, 0.0, 1.0);
  float e = easeInOutCubic(p);

  vec4 mvPosition = modelViewMatrix * vec4(mix(chaos, order, e), 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspective factor as in the prototype: closer particles are bigger/brighter.
  float k = 3.6 / -mvPosition.z;
  gl_PointSize = uSize * (onNode ? 1.9 : 1.4) * k * uPixelRatio;

  vColor = mix(uChaos, uAccent, e);
  // 50x the prototype's particle count: lower per-particle alpha keeps the
  // same light density and the hero copy readable.
  vAlpha = (0.35 + 0.65 * clamp((k - 0.6) / 0.8, 0.0, 1.0)) * 0.55;
}
