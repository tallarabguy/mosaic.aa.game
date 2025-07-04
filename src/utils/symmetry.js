// utils/symmetry.js
export function generateSymmetric4x4(seed) {
  // seed is a 2x2 array: [[a, b], [c, d]]
  const [row0, row1] = seed;
  // Make left-right symmetry for each row
  const fullRow0 = [...row0, ...row0.slice().reverse()]; // a b b a
  const fullRow1 = [...row1, ...row1.slice().reverse()]; // c d d c

  // Now top-bottom symmetry
  return [
    fullRow0,
    fullRow1,
    [...fullRow1],
    [...fullRow0],
  ];
}
