// Node rings and data pulses: screen-space marks that sit on the graph.
// Pulses travel from aFrom to aTo; nodes use aFrom == aTo.

uniform float uTime;
uniform float uSpeed;
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aOffset;

void main() {
  vec3 position = mix(aFrom, aTo, fract(aOffset + uTime * uSpeed));
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float k = 3.6 / -mvPosition.z;
  gl_PointSize = uSize * k * uPixelRatio;
}
