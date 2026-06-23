#version 300 es
// contour.frag — final composite to the screen. Combines the physical inducers,
// the subjective brightness fill, and a faint illusory contour line drawn only
// in the gaps (where no inducer ink exists), all modulated by illusion strength.
precision highp float;
//@include common

uniform sampler2D u_ink;        // inducer image (rgb) + coverage (a)
uniform sampler2D u_bright;     // filled-in brightness field (r)
uniform vec2  u_resolution;
uniform float u_aspect;

uniform int   u_shapeType;
uniform vec2  u_verts[MAX_V];
uniform int   u_vertCount;
uniform float u_diskRadius;

uniform float u_strength;
uniform float u_brightnessOn;
uniform float u_invert;
uniform vec3  u_tint;           // neon-spreading colour

in  vec2 v_uv;
out vec4 outColor;

float shapeSD(vec2 p) {
  if (u_shapeType == 2) return sdCircle(p, u_diskRadius);
  return sdPolygon(p, u_verts, u_vertCount);
}

void main() {
  vec4 inkc = texture(u_ink, v_uv);
  vec3 col  = inkc.rgb;
  float ink = inkc.a;

  vec2 p = v_uv * 2.0 - 1.0;
  p.x *= u_aspect;
  float sd = shapeSD(p);

  // Subjective brightness / neon spreading fill. The filled interior is roughly
  // uniform, so this raises the whole surface above the background — the edge
  // where it meets the background IS the illusory contour.
  float b = texture(u_bright, v_uv).r;
  float fill = b * u_brightnessOn * u_strength;
  vec3 fillCol = mix(vec3(1.0), u_tint, 0.6);
  col += fill * 0.35 * fillCol * (1.0 - ink);

  // Whisper-thin crispening of the contour in the gaps — just enough to make the
  // edge read, never a drawn outline.
  float lw = 0.0025;
  float line = 1.0 - smoothstep(lw, lw * 2.5, abs(sd));
  col += line * u_strength * 0.06 * fillCol * (1.0 - ink);

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
