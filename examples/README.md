# Examples

Standalone snippets that complement the full app in [`../index.html`](../index.html).

| File | What it is | How to run |
|------|------------|------------|
| [`minimal-triangle.html`](minimal-triangle.html) | The whole illusion in one fragment shader, no modules/fetch — a Kanizsa triangle that runs straight from `file://`. | Open the file in a browser (double-click works). |
| [`pacman-sdf.glsl`](pacman-sdf.glsl) | A Shadertoy-ready pac-man inducer field (spinning Kanizsa square). | Paste into a new [Shadertoy](https://www.shadertoy.com/new) and run. |
| [`support-ratio.mjs`](support-ratio.mjs) | Prints the illusion-strength curve vs gap and vs inducer rotation, reusing the project's own model. | `node examples/support-ratio.mjs` or `npm run examples:strength` |
| [`inducer-placement.mjs`](inducer-placement.mjs) | Dumps the computed inducer geometry (position, mouth bisector, wedge, radius) for every shape. | `node examples/inducer-placement.mjs` or `npm run examples:geometry` |

The two `.mjs` scripts import directly from `../src/js/`, so they double as a
check that the geometry and perceptual model are reusable outside the browser.

## Ideas to extend

- A real Rubin vase (figure-ground) from two mirrored face profiles.
- The Ehrenstein figure (radial lines → illusory bright disk) — a close cousin
  of the spoke disk already implemented.
- Animated **support-ratio sweep** that grows the inducers until the contour
  snaps into being.
