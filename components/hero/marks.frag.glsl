uniform vec3 uColor;
uniform float uOpacity;
// 1.0 draws a node (ring + center dot), 0.0 a solid pulse dot.
uniform float uRing;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float aa = 0.08;
  float dot = 1.0 - smoothstep(uRing > 0.5 ? 0.27 : 0.8, (uRing > 0.5 ? 0.27 : 0.8) + aa, d);
  float ring = uRing * (smoothstep(0.82, 0.82 + aa, d) - smoothstep(0.92, 0.92 + aa, d));
  gl_FragColor = vec4(uColor, uOpacity * max(dot, ring));
}
