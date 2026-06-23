// common.glsl — shared GLSL helpers, injected via the `//@include common` marker
// (see src/js/gl-utils.js → loadShaderSource). No #version / precision here:
// those belong to the including file so this stays composable.

#define MAX_V 16
const float PI = 3.14159265359;

// Signed minimal angular difference, wrapped to (-PI, PI].
float angDiff(float a, float b) {
  float d = a - b;
  return atan(sin(d), cos(d));
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Generic polygon SDF (Inigo Quilez). Negative inside. `v` is wound either way.
float sdPolygon(vec2 p, vec2 v[MAX_V], int n) {
  if (n < 3 || n > MAX_V) return 1e5;
  float d = dot(p - v[0], p - v[0]);
  float s = 1.0;
  int j = n - 1;
  for (int i = 0; i < MAX_V; i++) {
    if (i >= n) break;
    vec2 e = v[j] - v[i];
    vec2 w = p - v[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= v[i].y, p.y < v[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s = -s;
    j = i;
  }
  return s * sqrt(d);
}

// Pac-man inducer coverage. Returns ink amount in [0,1]: a filled disk of
// radius r with an angular wedge of half-width `wedge` removed. The "mouth"
// (the removed bite) opens toward `facing`. Antialiased via screen-space
// derivatives.
float pacmanMask(vec2 p, vec2 c, float facing, float r, float wedge) {
  vec2 q = p - c;
  float dist = length(q);
  float aa = fwidth(dist) * 1.5 + 1e-4;
  float disk = 1.0 - smoothstep(r - aa, r + aa, dist);
  float ang = (dist < 1e-5) ? 0.0 : atan(q.y, q.x);
  float rel = abs(angDiff(ang, facing));
  float aaA = fwidth(rel) * 1.5 + 1e-3;
  float outsideBite = smoothstep(wedge - aaA, wedge + aaA, rel);
  return disk * outsideBite;
}
