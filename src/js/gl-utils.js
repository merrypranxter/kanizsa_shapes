// gl-utils.js — minimal WebGL2 helpers: shader assembly, programs, render
// targets, and a fullscreen quad. No dependencies.

// Fetches a shader file and resolves `//@include <name>` markers against the
// provided map of include sources. The include is spliced in verbatim, so the
// including file keeps its own `#version` / `precision` lines at the top.
export async function loadShaderSource(url, includes = {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load shader ${url}: ${res.status}`);
  let src = await res.text();
  src = src.replace(/^[ \t]*\/\/@include[ \t]+(\S+)[ \t]*$/gm, (_, name) => {
    if (!(name in includes)) throw new Error(`Unknown shader include "${name}" in ${url}`);
    return includes[name];
  });
  return src;
}

export async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.text();
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile error:\n${log}\n--- source ---\n${numbered(src)}`);
  }
  return sh;
}

function numbered(src) {
  return src.split('\n').map((l, i) => `${String(i + 1).padStart(3)}  ${l}`).join('\n');
}

export function createProgram(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link error:\n${log}`);
  }
  return new Program(gl, prog);
}

// Thin wrapper that caches uniform locations and exposes terse setters.
class Program {
  constructor(gl, prog) {
    this.gl = gl;
    this.prog = prog;
    this._loc = new Map();
  }
  use() { this.gl.useProgram(this.prog); return this; }
  loc(name) {
    if (!this._loc.has(name)) this._loc.set(name, this.gl.getUniformLocation(this.prog, name));
    return this._loc.get(name);
  }
  int(n, v)   { this.gl.uniform1i(this.loc(n), v); return this; }
  float(n, v) { this.gl.uniform1f(this.loc(n), v); return this; }
  vec2(n, x, y) { this.gl.uniform2f(this.loc(n), x, y); return this; }
  vec3(n, x, y, z) { this.gl.uniform3f(this.loc(n), x, y, z); return this; }
  vec2v(n, arr) { this.gl.uniform2fv(this.loc(n), arr); return this; }
  floatv(n, arr) { this.gl.uniform1fv(this.loc(n), arr); return this; }
  tex(n, unit, texture) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.loc(n), unit);
    return this;
  }
}

// An offscreen RGBA8 render target (framebuffer + texture).
export function createTarget(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

export function resizeTarget(gl, target, w, h) {
  if (target.w === w && target.h === h) return target;
  gl.bindTexture(gl.TEXTURE_2D, target.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  target.w = w; target.h = h;
  return target;
}

// A fullscreen quad drawn as a triangle strip. Returns a bound-VAO drawer.
export function createFullscreenQuad(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return {
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
  };
}
