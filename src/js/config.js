// config.js — shapes, parameter defaults, and named regimes.

export const MAX_V = 16;

export const SHAPES = ['triangle', 'square', 'disk', 'cross'];

// Gap fraction presets cycled by the `G` key. Smaller = inducers nearly touch
// = stronger illusion.
export const GAP_STEPS = [0.06, 0.16, 0.28, 0.42, 0.6];

export const DEFAULTS = {
  shape: 0,           // index into SHAPES
  gapIdx: 1,          // index into GAP_STEPS
  contrast: 1.0,      // 0..1
  invert: 0,          // 0 dark-on-light, 1 light-on-dark
  brightnessOn: 1,    // subjective brightness fill
  figureGround: 0,    // swap figure / ground
  rotation: 0,        // inducer spin in radians
  spinning: false,    // animate rotation
  tint: [0.55, 0.8, 1.0],   // neon-spreading colour
};

// Named regimes from the README — one-key presets (see main.js, number keys).
export const REGIMES = {
  'Kanizsa Triangle': { shape: 0, gapIdx: 1, contrast: 1.0, invert: 0, brightnessOn: 1, figureGround: 0, rotation: 0, spinning: false },
  'Kanizsa Square':   { shape: 1, gapIdx: 1, contrast: 1.0, invert: 0, brightnessOn: 1, figureGround: 0, rotation: 0, spinning: false },
  'Subjective Disk':  { shape: 2, gapIdx: 1, contrast: 1.0, invert: 0, brightnessOn: 1, figureGround: 0, rotation: 0, spinning: false },
  'Neon Spreading':   { shape: 1, gapIdx: 0, contrast: 0.9, invert: 1, brightnessOn: 1, figureGround: 0, rotation: 0, spinning: false, tint: [0.4, 1.0, 0.7] },
  'Figure-Ground':    { shape: 1, gapIdx: 0, contrast: 1.0, invert: 0, brightnessOn: 1, figureGround: 1, rotation: 0, spinning: false },
  'Fade (spin)':      { shape: 0, gapIdx: 1, contrast: 1.0, invert: 0, brightnessOn: 1, figureGround: 0, rotation: 0, spinning: true },
};

export const REGIME_NAMES = Object.keys(REGIMES);
