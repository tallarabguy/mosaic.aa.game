import React, { useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";
import { getMarginDomains, isFilled } from "../utils/patternUtils";

const GRID_SIZE = 32;

export default function CentrePuller({ grid, onComplete, logToConsole, CELL_SIZE }) {
  const [workingGrid, setWorkingGrid] = useState(() => grid.map((r) => [...r]));

  useEffect(() => {
    logToConsole("Filling centre convolution pattern.");
  }, []);

  useEffect(() => {
    // Make a fresh copy to work with
    const newGrid = grid.map((row) => [...row]);

    ["right", "left", "top", "bottom"].forEach((side) => {
      const { range, inputInds, axis } = getMarginDomains(side);
      const centralInds = range.slice(1, -1); // Exclude first/last

      if (side === "right") {
        centralInds.forEach((row) => {
          inputInds.forEach((in_id, j) => {
            const tgtRow = row,
              tgtCol = 16 + j;
            if (!isFilled(newGrid[tgtRow][tgtCol])) {
              newGrid[tgtRow][tgtCol] = newGrid[row][in_id];
            }
          });
        });
      } else if (side === "left") {
        centralInds.forEach((row) => {
          inputInds.forEach((in_id, j) => {
            const tgtRow = row,
              tgtCol = 12 + j;
            if (!isFilled(newGrid[tgtRow][tgtCol])) {
              newGrid[tgtRow][tgtCol] = newGrid[row][in_id];
            }
          });
        });
      } else if (side === "top") {
        centralInds.forEach((col) => {
          inputInds.forEach((in_id, j) => {
            const tgtRow = 12 + j,
              tgtCol = col;
            if (!isFilled(newGrid[tgtRow][tgtCol])) {
              newGrid[tgtRow][tgtCol] = newGrid[in_id][col];
            }
          });
        });
      } else if (side === "bottom") {
        centralInds.forEach((col) => {
          inputInds.forEach((in_id, j) => {
            const tgtRow = 16 + j,
              tgtCol = col;
            if (!isFilled(newGrid[tgtRow][tgtCol])) {
              newGrid[tgtRow][tgtCol] = newGrid[in_id][col];
            }
          });
        });
      }
    });

    setWorkingGrid(newGrid);
    if (onComplete) onComplete(newGrid);
    // eslint-disable-next-line
  }, [grid, onComplete]);

  return (
    <div
      style={{
        position: "relative",
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        margin: "40px auto",
      }}
    >
      <PatternGrid pattern={workingGrid} size={CELL_SIZE} />
    </div>
  );
}
