#version 300 es
// inducer.frag — renders the PHYSICAL stimulus: the inducers that are actually
// drawn on screen. For polygonal shapes (triangle/square/cross) these are
// pac-man sectors placed at the illusory shape's corners. For the disk they
// are radial line terminations (a "sun" of spokes ending at the circle).
//
// Output: rgb = displayed inducer image, a = ink coverage (1 where inducer
// material is). Downstream passes read alpha to know where the "walls" are.
precision highp float;
//@include common

uniform vec2  u_resolution;
uniform float u_aspect;
uniform float u_time;

uniform int   u_shapeType;          // 0 triangle, 1 square, 2 disk, 3 cross
uniform vec2  u_verts[MAX_V];
uniform int   u_vertCount;
uniform float u_facing[MAX_V];
uniform float u_wedge[MAX_V];
uniform float u_radius[MAX_V];
uniform float u_rotation;           // global inducer spin (radians)

uniform float u_contrast;           // 0..1 — collapses ink toward mid-grey as it drops
uniform float u_invert;             // 0 = dark ink on light, 1 = light ink on dark

// disk-only (line-termination inducers)
uniform float u_diskRadius;
uniform int   u_spokeCount;
uniform float u_spokeLen;
uniform float u_spokeWidth;

in  vec2 v_uv;
out vec4 outColor;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  p.x *= u_aspect;

  float ink = 0.0;

  if (u_shapeType == 2) {
    // Subjective disk: radial spokes whose inner ends terminate on the circle.
    float n = float(u_spokeCount);
    for (int i = 0; i < MAX_V * 4; i++) {
      if (i >= u_spokeCount) break;
      float a = (float(i) / n) * 2.0 * PI + u_rotation;
      vec2 dir = vec2(cos(a), sin(a));
      vec2 A = dir * u_diskRadius;
      vec2 B = dir * (u_diskRadius + u_spokeLen);
      float d = sdSegment(p, A, B);
      float aa = fwidth(d) + 1e-4;
      ink = max(ink, 1.0 - smoothstep(u_spokeWidth - aa, u_spokeWidth + aa, d));
    }
  } else {
    for (int i = 0; i < MAX_V; i++) {
      if (i >= u_vertCount) break;
      ink = max(ink, pacmanMask(p, u_verts[i],
                                u_facing[i] + u_rotation,
                                u_radius[i], u_wedge[i]));
    }
  }

  float bg = u_invert > 0.5 ? 0.0  : 0.92;   // background luminance
  float fg = u_invert > 0.5 ? 1.0  : 0.04;   // inducer ink luminance
  float col = mix(bg, fg, ink);
  col = mix(0.5, col, clamp(u_contrast, 0.0, 1.0));   // low contrast → grey

  outColor = vec4(vec3(col), ink);
}
