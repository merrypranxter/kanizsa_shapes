#version 300 es
// brightness.frag — one iteration of the subjective-brightness "filling-in"
// diffusion. Run repeatedly via FBO ping-pong (see main.js): brightness is
// seeded at the illusory contour and diffuses inward to fill the perceived
// surface. Inducer ink acts as a wall; the gaps between inducers let brightness
// leak out — which is exactly why a smaller gap yields a stronger, brighter
// illusory surface.
precision highp float;
//@include common

uniform sampler2D u_prev;       // previous brightness field
uniform sampler2D u_ink;        // inducer texture (alpha = ink coverage)
uniform vec2  u_resolution;     // resolution of THIS (half-res) target
uniform float u_aspect;

uniform int   u_shapeType;
uniform vec2  u_verts[MAX_V];
uniform int   u_vertCount;
uniform float u_diskRadius;

uniform float u_figureGround;   // 0/1 — swap which side is "figure"
uniform float u_decay;          // diffusion persistence (<1)

in  vec2 v_uv;
out vec4 outColor;

float shapeSD(vec2 p) {
  if (u_shapeType == 2) return sdCircle(p, u_diskRadius);
  return sdPolygon(p, u_verts, u_vertCount);
}

void main() {
  vec2 texel = 1.0 / u_resolution;

  // 5-tap blur of the previous field
  float c = texture(u_prev, v_uv).r;
  float l = texture(u_prev, v_uv + vec2(-texel.x, 0.0)).r;
  float r = texture(u_prev, v_uv + vec2( texel.x, 0.0)).r;
  float u = texture(u_prev, v_uv + vec2(0.0,  texel.y)).r;
  float d = texture(u_prev, v_uv + vec2(0.0, -texel.y)).r;
  float blur = c * 0.4 + (l + r + u + d) * 0.15;

  vec2 p = v_uv * 2.0 - 1.0;
  p.x *= u_aspect;

  float sd = shapeSD(p);
  // Figure-ground swap flips which side of the contour is the filled "figure".
  float fd = (u_figureGround > 0.5) ? -sd : sd;

  // Soft mask of the illusory surface: 1 well inside, feathering to 0 just past
  // the contour. Seeding and confining to this region fills the surface evenly
  // (clean illusory edge) and stops brightness from flooding out where the
  // inducers don't form walls (e.g. the disk's thin spokes).
  float regionSoft = 1.0 - smoothstep(0.0, 0.035, fd);
  float seed = regionSoft;

  float ink = texture(u_ink, v_uv).a;
  float b = max(seed, blur * u_decay);
  b *= regionSoft;               // confine the filled surface to the illusory region
  b *= (1.0 - ink * 0.9);        // ink walls suppress the glow

  outColor = vec4(vec3(b), 1.0);
}
