# Math Reference: kanizsa_shapes

Mathematical foundations behind the renderer. Code references in
`src/js/completion.js`, `src/js/inducer.js`, and `src/shaders/`.

## 1. Inducer geometry

### Pac-man inducers (triangle / square / cross)

Each polygonal illusory shape is defined by a list of corner vertices
`vᵢ` (wound in order). A pac-man inducer is placed at every vertex: a filled
disk of radius `r` with an angular wedge (the "mouth") removed. The mouth must
open so that its two straight edges lie along the two polygon edges meeting at
that corner — that collinearity is what the visual system completes into a
continuous contour.

For a corner with incoming/outgoing unit edge directions `a` and `b`
(both pointing away from the vertex):

```
mouth bisector   facing = normalize(a + b)
mouth half-angle wedge  = ½ · acos(a · b)
```

`acos(a·b)` is the *smaller* of the interior/exterior angles, so this single
formula handles convex corners (mouth opens inward, e.g. 60° for a triangle,
90° for a square) **and** reflex corners (mouth opens outward, e.g. the four
inner corners of the Greek cross). See `cornersToInducers()` in
`src/js/inducer.js`.

### Line-termination inducers (disk)

A subjective disk uses radial spokes instead of pac-men. `N` line segments are
arranged around a circle of radius `R`, each running from `R` to `R + L` along
angle `θₖ = 2πk/N`. Their inner endpoints all terminate on the circle, and the
visual system completes the circular contour through the terminations.

## 2. Illusion strength

The perceived strength of the contour is modelled in `illusionStrength()` as a
product of three monotonic factors, each in `[0, 1]`:

```
strength = contrast · support · alignment
```

| Factor      | Definition                | Rationale |
|-------------|---------------------------|-----------|
| `contrast`  | inducer/background contrast | Higher contrast → stronger contour. |
| `support`   | `1 − gapFraction`         | Shipley & Kellman's **support ratio**: the fraction of the contour physically specified by inducers. Smaller gaps → more support → stronger. |
| `alignment` | `max(0, cos θ)` (pac-man) | Rotating inducers by `θ` breaks edge collinearity, so the contour fades and revives with `cos θ`. Radial-spoke disks are rotationally symmetric, so `alignment = 1`. |

### Support ratio

For a polygon with total perimeter `P` and `k` inducers each specifying an arc
of length `2r` of the contour, the support ratio is approximately

```
support_ratio ≈ (Σ 2rᵢ) / P
```

Shipley & Kellman (1992) found perceived contour clarity rises roughly linearly
with this ratio. We use the simpler proxy `1 − gapFraction` because the gap is
the directly exposed control.

## 3. Subjective brightness (filling-in)

Inside a Kanizsa figure the enclosed surface appears **brighter** than the
identical surrounding background — a *subjective surface*. We model this as a
diffusion / filling-in process (`src/shaders/brightness.frag`, run as an FBO
ping-pong):

```
bₜ₊₁(x) = max( seed(x), decay · blur(bₜ)(x) ) · region(x) · (1 − ink(x))
```

- `seed` injects brightness across the figure interior (`region`),
- `blur` is a small isotropic kernel (lateral spreading),
- `decay ∈ [0.90, 0.97]` grows with `strength` so stronger illusions hold a
  brighter, more solid surface (`diffusionDecay()`),
- `region` is a soft mask of the illusory surface so the fill cannot flood past
  the contour where the inducers don't form walls (notably the disk's spokes),
- `ink` lets the physical inducers act as walls that suppress the glow.

Toggling figure-ground negates the signed distance, swapping which side of the
contour is treated as the filled figure.

## 4. Coordinate space

All geometry lives in a centered, isotropic space: `y ∈ [−1, 1]` and
`x ∈ [−aspect, aspect]`. Fragment shaders reconstruct it from UVs as
`p = uv·2 − 1; p.x *= aspect`. Shape size is recomputed on resize as
`0.62 · min(1, aspect)` so the figure always fits the viewport.

## 5. Reference values

| Shape    | Inducers | Interior angle | Mouth half-angle |
|----------|----------|----------------|------------------|
| Triangle | 3        | 60°            | 30°              |
| Square   | 4        | 90°            | 45°              |
| Cross    | 12       | 90° / 270°     | 45°              |
| Disk     | 16 spokes| —              | — (line ends)    |

## References

- Kanizsa, G. (1979). *Organization in Vision: Essays on Gestalt Perception.*
- von der Heydt, R., Peterhans, E., & Baumgartner, G. (1984). Illusory contours
  and cortical neuron responses. *Science, 224*, 1260–1262.
- Shipley, T. F., & Kellman, P. J. (1992). Strength of visual interpolation
  depends on the ratio of physically specified to total edge length.
  *Perception & Psychophysics, 52*, 97–106.
