varying vec3 vColor;
varying float vAlpha;

uniform float uOpacity;

void main() {
  // Soft round point.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, vAlpha * uOpacity * smoothstep(0.5, 0.35, d));
}
