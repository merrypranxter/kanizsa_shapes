// support-ratio.mjs — print the illusion-strength curve using the project's own
// model (no duplicated math). Demonstrates how gap, contrast and inducer
// rotation each modulate the perceived contour.
//
//   node examples/support-ratio.mjs        (or: npm run examples:strength)

import { illusionStrength } from '../src/js/completion.js';
import { GAP_STEPS, SHAPES } from '../src/js/config.js';

const bar = (v, width = 28) => {
  const n = Math.round(v * width);
  return '█'.repeat(n) + '·'.repeat(width - n);
};

console.log('\nIllusion strength vs gap  (triangle, contrast = 1.0, no spin)\n');
console.log('  gap    strength');
GAP_STEPS.forEach((g, i) => {
  const s = illusionStrength({ shape: 0, gapIdx: i, contrast: 1, rotation: 0 });
  console.log(`  ${g.toFixed(2)}   ${s.toFixed(2)}  ${bar(s)}`);
});

console.log('\nIllusion strength vs inducer rotation  (triangle, gap = 0.16)\n');
console.log('  angle  strength');
for (let deg = 0; deg <= 180; deg += 20) {
  const s = illusionStrength({ shape: 0, gapIdx: 1, contrast: 1, rotation: (deg * Math.PI) / 180 });
  console.log(`  ${String(deg).padStart(3)}°   ${s.toFixed(2)}  ${bar(s)}`);
}

console.log('\nNote: the disk is rotationally symmetric, so spinning it never fades:');
for (const deg of [0, 45, 90]) {
  const s = illusionStrength({ shape: SHAPES.indexOf('disk'), gapIdx: 1, contrast: 1, rotation: (deg * Math.PI) / 180 });
  console.log(`  disk @ ${String(deg).padStart(3)}°   strength ${s.toFixed(2)}`);
}
console.log();
