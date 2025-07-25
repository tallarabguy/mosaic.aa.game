import React, { useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";

const GRID_SIZE = 32;

function drawSquareBorder(grid, offset) {
  const N = grid.length;
  if (offset < 0 || offset >= N) return;
  for (let c = offset; c < N - offset; c++) {
    grid[offset][c] = 1;
    grid[N - offset - 1][c] = 1;
  }
  for (let r = offset; r < N - offset; r++) {
    grid[r][offset] = 1;
    grid[r][N - offset - 1] = 1;
  }
}

function drawOffsetLines(grid, offset) {
  const N = grid.length;
  for (let c = 0; c < N; c++) {
    grid[offset][c] = 1;
    grid[N - offset - 1][c] = 1;
  }
  for (let r = 0; r < N; r++) {
    grid[r][offset] = 1;
    grid[r][N - offset - 1] = 1;
  }
}

export default function PatternFiller({ grid, onComplete, logToConsole, CELL_SIZE  }) {
  const [workingGrid, setWorkingGrid] = useState(() =>
    grid.map((row) => [...row])
  );

  useEffect(() => {
    logToConsole("Filling in gridlines.");
  }, []);

  useEffect(() => {
    let working = grid.map((row) => [...row]);
    [4, 5, 8, 10, 11].forEach((offset) => drawSquareBorder(working, offset));
    drawOffsetLines(working, 10);
    setWorkingGrid(working);
    if (onComplete) onComplete(working);
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
