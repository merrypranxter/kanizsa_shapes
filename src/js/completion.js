// completion.js — the perceptual model: how strong is the illusion, given the
// current inducer configuration? This drives the brightness fill and contour
// intensity in the shaders. The relationships are deliberately simple and
// monotonic, matching the qualitative findings in the literature (Kanizsa 1979;
// Shipley & Kellman 1992 on "support ratio").

import { GAP_STEPS, SHAPES } from './config.js';

// Illusion strength in [0, 1].
//
//   strength ∝ contrast              (higher contrast → stronger)
//   strength ∝ (1 - gapFraction)     (smaller gap → stronger; "support ratio")
//   strength ∝ alignment             (misaligned inducers → contour collapses)
//
// For pac-man shapes, rotating the inducers away from 0 breaks the collinearity
// of the mouth edges, so the contour fades and revives with cos(rotation).
// Radial-spoke disks are rotationally symmetric, so spinning them does not
// weaken the illusion.
export function illusionStrength(state) {
  const gapFrac = GAP_STEPS[state.gapIdx];
  const support = 1 - gapFrac;            // Shipley–Kellman support ratio proxy
  const contrast = clamp01(state.contrast);

  let alignment = 1;
  if (SHAPES[state.shape] !== 'disk') {
    alignment = Math.max(0, Math.cos(state.rotation));
  }

  return clamp01(contrast * support * alignment);
}

// Subjective-brightness boost magnitude. Lateral inhibition makes the enclosed
// surface read brighter as contrast and the number of inducers grow.
export function brightnessBoost(state, inducerCount) {
  const s = illusionStrength(state);
  const crowd = Math.min(1, inducerCount / 4);   // more inducers → fuller fill
  return clamp01(s * (0.6 + 0.4 * crowd));
}

// Diffusion persistence for the filling-in step. Stronger illusions hold the
// fill more tightly (less decay), so the surface reads brighter and more solid.
export function diffusionDecay(state) {
  return 0.9 + 0.07 * illusionStrength(state);   // 0.90 .. 0.97
}

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
