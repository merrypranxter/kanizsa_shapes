// inducer-placement.mjs — dump the computed inducer geometry for each shape,
// reusing the project's own buildShape(). Handy for sanity-checking the corner
// math: mouth bisector (facing), wedge half-angle, and per-inducer radius.
//
//   node examples/inducer-placement.mjs    (or: npm run examples:geometry)

import { buildShape } from '../src/js/inducer.js';
import { SHAPES } from '../src/js/config.js';

const deg = (rad) => `${((rad * 180) / Math.PI).toFixed(1)}°`;
const ASPECT = 16 / 9;     // pretend landscape viewport
const GAP = 0.16;

for (let t = 0; t < SHAPES.length; t++) {
  const g = buildShape(t, ASPECT, GAP);
  console.log(`\n── ${SHAPES[t]} ─────────────────────────────`);

  if (SHAPES[t] === 'disk') {
    console.log(`  line-termination inducers (spokes): ${g.disk.spokeCount}`);
    console.log(`  illusory radius : ${g.disk.radius.toFixed(3)}`);
    console.log(`  spoke length    : ${g.disk.spokeLen.toFixed(3)}`);
    continue;
  }

  console.log(`  ${g.vertCount} pac-man inducers`);
  console.log('   #   pos (x, y)         facing    wedge(½)   radius');
  for (let i = 0; i < g.vertCount; i++) {
    const x = g.verts[i * 2].toFixed(3).padStart(6);
    const y = g.verts[i * 2 + 1].toFixed(3).padStart(6);
    console.log(
      `  ${String(i).padStart(2)}  (${x}, ${y})   ` +
      `${deg(g.facing[i]).padStart(7)}   ${deg(g.wedge[i]).padStart(6)}   ${g.radius[i].toFixed(3)}`
    );
  }
}
console.log();
