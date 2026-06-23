// pacman-sdf.glsl — a self-contained pac-man inducer field, ready to paste into
// Shadertoy (it defines mainImage) or adapt elsewhere. This is the geometric
// heart of the project distilled to ~40 lines: N pac-men whose mouths align
// to the edges of an illusory polygon.
//
// Try it: https://www.shadertoy.com/new  → paste → run.

#define PI 3.14159265

float angDiff(float a, float b){ float d = a - b; return atan(sin(d), cos(d)); }

// Pac-man ink in [0,1]: disk radius r, wedge of half-angle w removed toward face.
float pacman(vec2 p, vec2 c, float face, float r, float w){
    vec2 q = p - c;
    float d = length(q);
    float aa = fwidth(d) + 1e-4;
    float disk = 1.0 - smoothstep(r - aa, r + aa, d);
    float rel = abs(angDiff(atan(q.y, q.x), face));
    float aaA = fwidth(rel) + 1e-3;
    return disk * smoothstep(w - aaA, w + aaA, rel);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;   // y in [-1,1]

    // Square Kanizsa figure: four corners, mouths face the centre (the bisector
    // of a 90° corner), wedge half-angle 45°. Spin slowly to watch it fade.
    float spin = 0.4 * sin(iTime * 0.4);
    float h = 0.5, r = 0.34, w = radians(45.0);
    vec2 corners[4];
    corners[0] = vec2(-h, -h);  corners[1] = vec2(h, -h);
    corners[2] = vec2(h,  h);   corners[3] = vec2(-h, h);

    float ink = 0.0;
    for (int i = 0; i < 4; i++){
        vec2 c = corners[i];
        float face = atan(-c.y, -c.x) + spin;   // toward centre, plus spin
        ink = max(ink, pacman(p, c, face, r, w));
    }

    // Subjective surface: lift the square interior above the background.
    float inside = step(max(abs(p.x), abs(p.y)), h);
    float surface = inside * (1.0 - ink) * 0.18 * (1.0 - abs(spin) * 2.0);

    vec3 col = vec3(mix(0.92, 0.04, ink) + surface);
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
