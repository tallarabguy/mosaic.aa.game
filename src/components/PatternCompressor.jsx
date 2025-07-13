import React, { useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";
import { getMarginDomains, isFilled } from "../utils/patternUtils";

const GRID_SIZE = 32;
const CELL_SIZE = 16;


function marginCompressionAuto(grid, side) {
  const { range, inputInds, orOutInds, andOutInd, axis } =
    getMarginDomains(side);
  for (let idx of range) {
    if (axis === 0) {
      // vertical: rows, index columns
      const cells = inputInds.map((col) => grid[idx][col]);
      const allFilled = cells.every(isFilled);
      if (allFilled) {
        grid[idx][orOutInds[0]] = 1;
        grid[idx][orOutInds[1]] = 1;
      } else {
        if (isFilled(cells[0]) || isFilled(cells[1]))
          grid[idx][orOutInds[0]] = 1;
        if (isFilled(cells[2]) || isFilled(cells[3]))
          grid[idx][orOutInds[1]] = 1;
      }
      const c1 = grid[idx][orOutInds[0]];
      const c2 = grid[idx][orOutInds[1]];
      if (c1 === 1 && c2 === 1) grid[idx][andOutInd] = 1;
    } else {
      // horizontal: cols, index rows
      const cells = inputInds.map((row) => grid[row][idx]);
      const allFilled = cells.every(isFilled);
      if (allFilled) {
        grid[orOutInds[0]][idx] = 1;
        grid[orOutInds[1]][idx] = 1;
      } else {
        if (isFilled(cells[0]) || isFilled(cells[1]))
          grid[orOutInds[0]][idx] = 1;
        if (isFilled(cells[2]) || isFilled(cells[3]))
          grid[orOutInds[1]][idx] = 1;
      }
      const c1 = grid[orOutInds[0]][idx];
      const c2 = grid[orOutInds[1]][idx];
      if (c1 === 1 && c2 === 1) grid[andOutInd][idx] = 1;
    }
  }
  return grid;
}

// --- Main component ---
export default function PatternCompressor({ grid, onComplete }) {
  const [compressed, setCompressed] = useState(() =>
    grid.map((row) => [...row])
  );

  useEffect(() => {
    // Deep copy so we don't mutate the parent grid
    let working = grid.map((row) => [...row]);
    // Apply margin compression for all sides
    marginCompressionAuto(working, "right");
    marginCompressionAuto(working, "left");
    marginCompressionAuto(working, "top");
    marginCompressionAuto(working, "bottom");
    setCompressed(working);
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
      <PatternGrid pattern={compressed} size={CELL_SIZE} />
    </div>
  );
}
