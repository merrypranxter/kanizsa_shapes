# Visual Targets: kanizsa_shapes

What the renderer should look like, and how it should behave.

## Core look

A minimal, high-contrast field of inducers on a flat background. The illusory
shape should read **immediately** but should never be drawn with a hard outline
— the surface appears as a clean brightness step against the background, and the
contour is something the viewer's brain supplies. If it looks like a deliberately
stroked triangle, the brightness fill is too strong or seeded at the edge (a
glowing halo). Seed the interior uniformly instead.

## Palettes

| Mode            | Background | Inducers   | Subjective surface |
|-----------------|------------|------------|--------------------|
| Normal          | light grey `#eaeaea` | near-black | brighter than bg, → white |
| Contrast invert | black      | white      | tinted glow (neon) |
| Neon spreading  | black      | white      | green/cyan tint bleeding slightly past the contour |

Keep the palette flat and desaturated except for the neon-spreading tint. The
illusion is about *form*, not colour; colour is a garnish on one regime.

## Shapes (cycle with `Space`)

1. **Triangle** — 3 pac-men, mouths to the centroid. The canonical Kanizsa figure.
2. **Square** — 4 pac-men. Strongest subjective-brightness percept.
3. **Disk** — 16 radial spokes terminating on a circle. Tests smooth contours.
4. **Cross** — Greek cross, 12 inducers including 4 reflex (outward-mouth) corners.

## Animation behaviour

- **Rotation (`R` / drag):** spinning the inducers should make the figure
  **fade and revive** — strongest at 0°, gone near 90°, back at 180°. This is the
  headline demonstration: the contour is contingent on alignment.
- **Gap (`G`):** stepping the gap larger should visibly weaken the surface
  brightness and soften the contour.
- **Brightness (`B`):** toggling the subjective fill off should leave only the
  bare inducers — proving the surface was never physically there.
- **Figure-ground (`F`):** swap which side of the contour fills, flipping figure
  and ground.

Target 60 fps at devicePixelRatio ≤ 2; the brightness diffusion runs at half
resolution to stay within budget.

## HUD

A small monospace overlay (top-left) reporting the live parameters and the
computed illusion `strength`, with the key bindings. Toggle with `H`. It must
never occlude the figure (which stays centered).

## Stills to reproduce

- Classic black-on-white Kanizsa triangle, gap ≈ 0.16, strength ≈ 0.84.
- Neon square: inverted, small gap, cyan/green tint (regime `4`).
- Mid-spin triangle showing a half-faded surface (the "fade" frame).
