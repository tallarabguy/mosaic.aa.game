import React, { useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";
import { getMarginDomains } from "../utils/patternUtils";

const GRID_SIZE = 32;
const CELL_SIZE = 16;

// Check if a single "AND-band" for a side is filled (any cell != 0 in the middle band)
function marginAndBandFilled(grid, side) {
  const { range, andOutInd, axis } = getMarginDomains(side);
  const checkRange = range.slice(1, -1); // ignore first and last
  for (let idx of checkRange) {
    let cell = axis === 0 ? grid[idx][andOutInd] : grid[andOutInd][idx];
    if (cell !== 0) return true;
  }
  return false;
}

// Core intersection/corner meta
const coreCoords = {
  top_left: [9, 9],
  top_right: [9, 22],
  bottom_left: [22, 9],
  bottom_right: [22, 22],
};
const combos = {
  top_left: ["top", "left"],
  top_right: ["top", "right"],
  bottom_left: ["bottom", "left"],
  bottom_right: ["bottom", "right"],
};
const blocks = {
  top_left: { row: [6, 10], col: [6, 10] },
  top_right: { row: [6, 10], col: [22, 26] },
  bottom_left: { row: [22, 26], col: [6, 10] },
  bottom_right: { row: [22, 26], col: [22, 26] },
};
const diagonals = {
  top_left: "slash", // /
  top_right: "backslash", // \
  bottom_left: "backslash", // \
  bottom_right: "slash", // /
};

// Fill main core intersections or diagonal
function fillCoreCornersAndDiagonals(grid) {
  // 1. Check which margins are filled
  const marginFilled = {};
  ["top", "bottom", "left", "right"].forEach(
    (side) => (marginFilled[side] = marginAndBandFilled(grid, side))
  );
  // 2. For each core corner
  for (let corner in coreCoords) {
    const [r, c] = coreCoords[corner];
    const [m1, m2] = combos[corner];
    if (marginFilled[m1] && marginFilled[m2]) {
      // Center pixel fill
      grid[r][c] = 1;
    } else {
      // Fill diagonal in 4x4 block
      const { row, col } = blocks[corner];
      for (let i = row[0]; i < row[1]; i++) {
        for (let j = col[0]; j < col[1]; j++) {
          if (
            (diagonals[corner] === "slash" &&
              i - row[0] + (j - col[0]) === 3) ||
            (diagonals[corner] === "backslash" && i - row[0] === j - col[0])
          ) {
            grid[i][j] = 1;
          }
        }
      }
    }
  }
}

// --- Main component ---
export default function InnerCornerFiller({ grid, onComplete }) {
  const [filledGrid, setFilledGrid] = useState(() =>
    grid.map((row) => [...row])
  );

  useEffect(() => {
    let working = grid.map((row) => [...row]);
    fillCoreCornersAndDiagonals(working);
    setFilledGrid(working);
    if (onComplete) onComplete(working);
    // eslint-disable-next-line
  }, [grid]);

  return (
    <div
      style={{
        position: "relative",
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        margin: "40px auto",
      }}
    >
      <PatternGrid pattern={filledGrid} size={CELL_SIZE} />
    </div>
  );
}
