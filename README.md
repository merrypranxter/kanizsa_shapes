# kanizsa_shapes

> pac-man inducers. missing edges. the brain draws the rest.

Kanizsa-type illusory contour generator. Configurable inducer arrangements (pac-man sectors, line terminations, figure-ground) produce shapes that are not physically present in the image. The brain’s contour completion mechanisms create vivid triangles, squares, and subjective surfaces. Parameterize inducer rotation, gap size, and contrast to explore the illusion space.

WebGL2, vanilla JS modules, no frameworks, no build step.

## Run it

Because the page uses ES modules and `fetch()`es its shaders, it needs to be
served over HTTP (opening `index.html` from `file://` is blocked by the
browser). Any static server works — pick one:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or
npx serve .                      # or:  npm start
```

There is still **no build step** — the server just serves the files as-is.

## Live Controls

| Key | Action |
|-----|--------|
| `Space` | Cycle shape type (triangle / square / disk / cross) |
| `R` | Toggle inducer spin (watch the contour fade and revive) |
| `G` | Step gap size |
| `C` | Toggle contrast inversion |
| `B` | Toggle subjective brightness fill |
| `F` | Toggle figure-ground swap |
| `1`–`6` | Jump to a named regime (below) |
| `H` | Toggle the HUD overlay |
| drag | Set inducer rotation directly (mouse or touch) |

The HUD (top-left) shows the live parameters and the computed illusion
**strength**.

## Named Regimes

Press the number key to load each.

1. **Kanizsa Triangle** — Classic 3-inducer triangle
2. **Kanizsa Square** — 4-inducer square with subjective brightness
3. **Subjective Disk** — Circular illusory contour from radial line terminations
4. **Neon Spreading** — Tinted surface bleeding past the physical edges
5. **Figure-Ground** — Swap which side of the contour fills
6. **Fade (spin)** — Auto-rotating inducers; the illusion strengthens and fades

## Examples

Standalone snippets live in [`examples/`](examples/) — a single-file
`file://`-friendly triangle, a Shadertoy-ready pac-man SDF, and Node scripts
that print the inducer geometry and the strength curve. See
[`examples/README.md`](examples/README.md).

## The Math

Inducer geometry:
- Pac-man sector: angle θ (typically 60°–90°)
- Gap size: g = distance between inducer tips
- Illusion strength ∝ 1/g (smaller gap = stronger)
- Illusion strength ∝ contrast

Subjective brightness model:
- The illusory shape region receives a brightness boost
- Boost magnitude depends on inducer contrast and number
- Lateral inhibition: inducers are darker, making the interior appear lighter by comparison

## Acknowledgments

Gaetano Kanizsa, *Organization in Vision* (1979), V2 neuron research by von der Heydt and Peterhans.
