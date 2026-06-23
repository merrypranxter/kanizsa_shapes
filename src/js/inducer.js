// inducer.js — pac-man and line-termination inducer geometry.
//
// All coordinates live in the renderer's centered space: y ∈ [-1, 1] and
// x ∈ [-aspect, aspect], isotropic units. The illusory shape is described by a
// polygon (triangle / square / cross) or a circle (disk). Inducers are derived
// directly from that geometry so the pac-man mouths always line up with the
// illusory edges — see cornersToInducers().

import { MAX_V } from './config.js';

const TAU = Math.PI * 2;

// --- tiny vec2 helpers -------------------------------------------------------
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const len = (a) => Math.hypot(a.x, a.y);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const norm = (a) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Vertex list for the illusory polygon, in winding order.
function polygonVerts(shapeType, size) {
  switch (shapeType) {
    case 0: { // triangle — apex up, centroid at origin
      const Rc = size;
      return [90, 210, 330].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return { x: Rc * Math.cos(a), y: Rc * Math.sin(a) };
      });
    }
    case 1: { // square
      const h = size * 0.72;
      return [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: -h, y: h }];
    }
    case 3: { // Greek cross (plus): 8 convex + 4 reflex corners
      const e = size * 0.92;   // arm reach
      const w = size * 0.34;   // arm half-width
      return [
        { x: -w, y:  e }, { x:  w, y:  e }, { x:  w, y:  w }, { x:  e, y:  w },
        { x:  e, y: -w }, { x:  w, y: -w }, { x:  w, y: -e }, { x: -w, y: -e },
        { x: -w, y: -w }, { x: -e, y: -w }, { x: -e, y:  w }, { x: -w, y:  w },
      ];
    }
    default:
      return [];
  }
}

// For each polygon corner, derive the pac-man that represents it: the mouth
// opens along the bisector of the corner's *smaller* angle (interior for convex
// corners, exterior for reflex ones), with half-width = half that angle. Radius
// is tied to the shorter incident edge so neighbouring inducers don't overlap;
// gapFrac controls how far the tips fall short of meeting.
function cornersToInducers(verts, gapFrac) {
  const n = verts.length;
  const facing = [], wedge = [], radius = [];
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const v = verts[i];
    const next = verts[(i + 1) % n];
    const a = norm(sub(prev, v));   // unit edge toward previous vertex
    const b = norm(sub(next, v));   // unit edge toward next vertex
    let bis = add(a, b);
    bis = len(bis) < 1e-5 ? { x: -a.y, y: a.x } : norm(bis); // guard straight corner
    facing.push(Math.atan2(bis.y, bis.x));
    const ang = Math.acos(clamp(dot(a, b), -1, 1));          // smaller corner angle
    wedge.push(ang / 2);
    const minEdge = Math.min(dist(prev, v), dist(next, v));
    radius.push(minEdge * 0.5 * (1 - gapFrac));
  }
  return { facing, wedge, radius };
}

// Builds the full geometry payload for a shape, ready to upload as uniforms.
// `size` is recomputed per-resize so the figure fits the viewport.
export function buildShape(shapeType, aspect, gapFrac) {
  const size = 0.62 * Math.min(1, aspect);

  // Disk: line-termination ("spoke") inducers around a circle.
  if (shapeType === 2) {
    return {
      shapeType,
      vertCount: 0,
      verts: new Float32Array(MAX_V * 2),
      facing: new Float32Array(MAX_V),
      wedge: new Float32Array(MAX_V),
      radius: new Float32Array(MAX_V),
      disk: {
        radius: size * 0.66,
        spokeCount: 16,
        // smaller gap → spokes reach closer to the circle, stronger contour
        spokeLen: size * (0.18 + 0.5 * gapFrac),
        spokeWidth: size * 0.012,
      },
    };
  }

  const v = polygonVerts(shapeType, size);
  const { facing, wedge, radius } = cornersToInducers(v, gapFrac);

  const vertsFlat = new Float32Array(MAX_V * 2);
  v.forEach((pt, i) => { vertsFlat[i * 2] = pt.x; vertsFlat[i * 2 + 1] = pt.y; });
  const pad = (arr) => { const f = new Float32Array(MAX_V); arr.forEach((x, i) => (f[i] = x)); return f; };

  return {
    shapeType,
    vertCount: v.length,
    verts: vertsFlat,
    facing: pad(facing),
    wedge: pad(wedge),
    radius: pad(radius),
    disk: { radius: 0, spokeCount: 0, spokeLen: 0, spokeWidth: 0 },
  };
}

export { TAU };
