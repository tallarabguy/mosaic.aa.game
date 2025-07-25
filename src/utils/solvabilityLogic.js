import { generateSymmetric4x4 } from "./symmetry";
import { build_margin } from "./patternLogic";

// SOLVABILITY ------------------------

function numTo2x2Grid(n) {
  // n is integer 0-15, returns a 2x2 binary grid
  return [
    [(n >> 3) & 1, (n >> 2) & 1],
    [(n >> 1) & 1, n & 1],
  ];
}

// Create a blank 32x32 grid
function blankGrid32() {
  return Array.from({ length: 32 }, () => Array(32).fill(0));
}

// Utility to invert a 4x4 pattern (0 <-> 1)
function invert4x4(grid) {
  return grid.map((row) => row.map((val) => (val ? 0 : 1)));
}

// Place a 4x4 block in the grid at position (row, col)
function place4x4(grid, block, row, col) {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) grid[row + r][col + c] = block[r][c];
}

export function computeSolvabilityMatrixMarginBuilder() {
  const results = [];
  for (let i = 0; i < 16; i++) {
    results[i] = [];
    for (let j = 0; j < 16; j++) {
      const seedA = numTo2x2Grid(i);
      const seedB = numTo2x2Grid(j);
      const patA = generateSymmetric4x4(seedA);
      const patB = generateSymmetric4x4(seedB);
      const invA = invert4x4(patA);
      const invB = invert4x4(patB);

      // Build initial grid
      const grid = blankGrid32();
      place4x4(grid, patA, 0, 28);
      place4x4(grid, patB, 28, 28);
      place4x4(grid, invA, 28, 0);
      place4x4(grid, invB, 0, 0);

      // True/false for solvability
      results[i][j] = isSolvableByMarginBuilder(grid, build_margin) ? 1 : 0;
    }
  }
  return results;
}

function printSolvabilityGrid(matrix) {
  console.log(
    "    " + [...Array(16).keys()].map((n) => n.toString(16)).join(" ")
  );
  for (let i = 0; i < 16; i++) {
    let row = matrix[i].map((val) => (val ? "✔" : "✘")).join(" ");
    console.log(i.toString(16).padStart(2, " ") + "  " + row);
  }
}

function extract4x4(grid, which) {
  if (which === "topRight") return grid.slice(0, 4).map((r) => r.slice(28, 32));
  if (which === "bottomRight")
    return grid.slice(28, 32).map((r) => r.slice(28, 32));
  throw new Error("Unknown corner: " + which);
}

function embedMarginAtRight(grid, margin) {
  const newGrid = grid.map((r) => [...r]);
  for (let i = 0; i < margin.length; i++)
    for (let j = 0; j < 4; j++) newGrid[i][28 + j] = margin[i][j];
  return newGrid;
}

function rotateGrid90Left(grid) {
  // Rotates a 32x32 grid 90° left (counter-clockwise)
  const N = grid.length;
  const out = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) out[N - c - 1][r] = grid[r][c];
  return out;
}

function hasRealMoves(best_moves) {
  // For indices 1-4 (skip 0 if unused)
  for (let i = 1; i <= 4; i++) {
    if (best_moves[i] && best_moves[i][0]) {
      // If moveName is not null/undefined, or movedCoords not empty
      return true;
    }
  }
  return false;
}

function isSolvableByMarginBuilder(grid, build_margin) {
  let working = grid.map((row) => [...row]);
  for (let step = 0; step < 4; step++) {
    const start = extract4x4(working, "topRight");
    const end = extract4x4(working, "bottomRight");
    try {
      //logToConsole(`Building margin step ${step + 1}...`);
      // If build_margin throws, it's unsolvable.
      build_margin(start, end, true, true); // debug=false for prod
      // (Optional) You could store/interrogate blocks if you need them.
    } catch (err) {
      //logToConsole(`Step ${step + 1} failed: ${err.message}`);
      return false;
    }
    // Progress: embed new margin and rotate
    // (If your build_margin returns blocks, use that to update working)
    // If not needed, you may just simulate the progress
    // If your UI cares about showing each intermediate, adjust as needed
    working = rotateGrid90Left(working);
  }
  return true;
}

// SOLVABILITY ------------------------
