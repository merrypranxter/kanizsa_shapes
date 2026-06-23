// main.js — Kanizsa illusory-contour renderer.
//
// Pipeline (SURFACE archetype, FBO ping-pong):
//   1. inducer pass   → renders the physical pac-man / spoke inducers to an FBO.
//   2. brightness pass → iterative filling-in diffusion, ping-ponged between two
//                        half-res FBOs, seeded at the illusory contour.
//   3. contour pass    → composites inducers + filled brightness + faint contour
//                        line to the screen.

import {
  loadShaderSource, fetchText, createProgram,
  createTarget, resizeTarget, createFullscreenQuad,
} from './gl-utils.js';
import { SHAPES, GAP_STEPS, DEFAULTS, REGIMES, REGIME_NAMES } from './config.js';
import { buildShape } from './inducer.js';
import { illusionStrength, diffusionDecay } from './completion.js';

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
if (!gl) {
  showFatal('WebGL2 is not available in this browser.');
  throw new Error('WebGL2 unavailable');
}

const state = { ...DEFAULTS, tint: [...DEFAULTS.tint] };
let geom = null;          // current shape geometry (uniform payload)
let aspect = 1;
const DIFFUSION_ITERS = 6;   // filling-in steps per frame (persists across frames)

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const quad = createFullscreenQuad(gl);
let inducerProg, brightProg, contourProg;
let inkTarget, brightA, brightB;

init().catch((e) => showFatal(e.message));

async function init() {
  const base = 'src/shaders/';
  const common = await fetchText(base + 'common.glsl');
  const includes = { common };

  const [vert, inducerFs, brightFs, contourFs] = await Promise.all([
    loadShaderSource(base + 'inducer.vert', includes),
    loadShaderSource(base + 'inducer.frag', includes),
    loadShaderSource(base + 'brightness.frag', includes),
    loadShaderSource(base + 'contour.frag', includes),
  ]);

  inducerProg = createProgram(gl, vert, inducerFs);
  brightProg = createProgram(gl, vert, brightFs);
  contourProg = createProgram(gl, vert, contourFs);

  inkTarget = createTarget(gl, 2, 2);
  brightA = createTarget(gl, 2, 2);
  brightB = createTarget(gl, 2, 2);

  window.addEventListener('resize', resize);
  installControls();
  resize();
  buildHUD();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(2, Math.floor(window.innerWidth * dpr));
  const h = Math.max(2, Math.floor(window.innerHeight * dpr));
  canvas.width = w; canvas.height = h;
  aspect = w / h;

  resizeTarget(gl, inkTarget, w, h);
  const hw = Math.max(2, Math.floor(w / 2));
  const hh = Math.max(2, Math.floor(h / 2));
  resizeTarget(gl, brightA, hw, hh);
  resizeTarget(gl, brightB, hw, hh);
  clearTarget(brightA);
  clearTarget(brightB);
  rebuildGeometry();
}

function rebuildGeometry() {
  geom = buildShape(state.shape, aspect, GAP_STEPS[state.gapIdx]);
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------
function frame(t) {
  if (state.spinning) {
    state.rotation = (t * 0.0006) % (Math.PI * 2);
    updateHUD();
  }
  const strength = illusionStrength(state);

  // --- 1. inducers → inkTarget ---
  bindTarget(inkTarget);
  inducerProg.use();
  setShapeUniforms(inducerProg);
  inducerProg
    .vec2('u_resolution', inkTarget.w, inkTarget.h)
    .float('u_aspect', aspect)
    .float('u_time', t * 0.001)
    .float('u_rotation', state.rotation)
    .float('u_contrast', state.contrast)
    .float('u_invert', state.invert);
  quad.draw();

  // --- 2. brightness filling-in (ping-pong, persistent) ---
  const decay = diffusionDecay(state);
  for (let i = 0; i < DIFFUSION_ITERS; i++) {
    const src = (i % 2 === 0) ? brightA : brightB;
    const dst = (i % 2 === 0) ? brightB : brightA;
    bindTarget(dst);
    brightProg.use();
    setShapeUniforms(brightProg);
    brightProg
      .vec2('u_resolution', dst.w, dst.h)
      .float('u_aspect', aspect)
      .float('u_strength', strength)
      .float('u_figureGround', state.figureGround)
      .float('u_decay', decay)
      .tex('u_prev', 0, src.tex)
      .tex('u_ink', 1, inkTarget.tex);
    quad.draw();
  }
  const brightOut = (DIFFUSION_ITERS % 2 === 0) ? brightA : brightB;

  // --- 3. composite → screen ---
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  contourProg.use();
  setShapeUniforms(contourProg);
  contourProg
    .vec2('u_resolution', canvas.width, canvas.height)
    .float('u_aspect', aspect)
    .float('u_strength', strength)
    .float('u_brightnessOn', state.brightnessOn)
    .float('u_invert', state.invert)
    .vec3('u_tint', state.tint[0], state.tint[1], state.tint[2])
    .tex('u_ink', 0, inkTarget.tex)
    .tex('u_bright', 1, brightOut.tex);
  quad.draw();

  requestAnimationFrame(frame);
}

function setShapeUniforms(prog) {
  prog
    .int('u_shapeType', state.shape)
    .int('u_vertCount', geom.vertCount)
    .vec2v('u_verts', geom.verts)
    .floatv('u_facing', geom.facing)
    .floatv('u_wedge', geom.wedge)
    .floatv('u_radius', geom.radius)
    .float('u_diskRadius', geom.disk.radius)
    .int('u_spokeCount', geom.disk.spokeCount)
    .float('u_spokeLen', geom.disk.spokeLen)
    .float('u_spokeWidth', geom.disk.spokeWidth);
}

function bindTarget(target) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
  gl.viewport(0, 0, target.w, target.h);
}

function clearTarget(target) {
  bindTarget(target);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
function installControls() {
  window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
      case ' ':
        state.shape = (state.shape + 1) % SHAPES.length;
        rebuildGeometry(); e.preventDefault(); break;
      case 'r':
        state.spinning = !state.spinning;
        if (!state.spinning) state.rotation = 0;
        break;
      case 'g':
        state.gapIdx = (state.gapIdx + 1) % GAP_STEPS.length;
        rebuildGeometry(); break;
      case 'c': state.invert = state.invert ? 0 : 1; break;
      case 'b': state.brightnessOn = state.brightnessOn ? 0 : 1; break;
      case 'f': state.figureGround = state.figureGround ? 0 : 1; break;
      case 'h': toggleHUD(); break;
      default:
        if (e.key >= '1' && e.key <= '6') {
          applyRegime(REGIME_NAMES[+e.key - 1]);
          updateHUD();
        }
        return;
    }
    updateHUD();
  });

  // Drag (mouse / touch) to set inducer rotation directly.
  let dragging = false, lastX = 0;
  const start = (x) => { dragging = true; lastX = x; state.spinning = false; };
  const move = (x) => {
    if (!dragging) return;
    state.rotation += (x - lastX) * 0.01;
    lastX = x;
    updateHUD();
  };
  const end = () => { dragging = false; };
  canvas.addEventListener('mousedown', (e) => start(e.clientX));
  window.addEventListener('mousemove', (e) => move(e.clientX));
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend', end);
}

function applyRegime(name) {
  const r = REGIMES[name];
  if (!r) return;
  Object.assign(state, r);
  if (r.tint) state.tint = [...r.tint];
  else state.tint = [...DEFAULTS.tint];
  rebuildGeometry();
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
let hud, hudVisible = true;

function buildHUD() {
  hud = document.createElement('div');
  hud.style.cssText = `
    position:fixed; top:12px; left:14px; font:12px/1.5 ui-monospace,Menlo,monospace;
    color:#9fe; text-shadow:0 1px 2px #000; pointer-events:none; white-space:pre;
    user-select:none;`;
  document.body.appendChild(hud);
  updateHUD();
}

function toggleHUD() { hudVisible = !hudVisible; hud.style.display = hudVisible ? '' : 'none'; }

function updateHUD() {
  if (!hud) return;
  const s = illusionStrength(state).toFixed(2);
  hud.textContent =
    `kanizsa_shapes\n` +
    `shape       ${SHAPES[state.shape]}   [Space]\n` +
    `gap         ${GAP_STEPS[state.gapIdx].toFixed(2)}   [G]\n` +
    `contrast    ${state.invert ? 'inverted' : 'normal'}   [C]\n` +
    `brightness  ${state.brightnessOn ? 'on' : 'off'}   [B]\n` +
    `figure/grnd ${state.figureGround ? 'swapped' : 'normal'}   [F]\n` +
    `rotation    ${state.rotation.toFixed(2)}  ${state.spinning ? '(spin)' : ''}   [R / drag]\n` +
    `strength    ${s}\n` +
    `regimes     [1-6]   hud [H]`;
}

function showFatal(msg) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#f66;font:14px monospace;background:#000;padding:2rem;text-align:center';
  d.textContent = msg;
  document.body.appendChild(d);
}
