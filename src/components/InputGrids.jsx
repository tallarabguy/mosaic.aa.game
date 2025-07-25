import React, { useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";

const makeGrid = () => [
  [0, 0],
  [0, 0],
];

function InputGrids({ onDone, logToConsole }) {
  const [startGrid, setStartGrid] = useState(makeGrid());
  const [endGrid, setEndGrid] = useState(makeGrid());

  useEffect(() => {
    logToConsole("Enter input patterns.");
  }, []);

  function toggleCell(grid, setGrid, row, col) {
    const newGrid = grid.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? 1 - cell : cell))
    );
    setGrid(newGrid);
  }

  

  return (
    <div className="input-grids" style={{ display: "flex", gap: "2rem" }}>
      <PatternGrid
        pattern={startGrid}
        size={40}
        title="Input 1"
        onCellClick={(i, j) => toggleCell(startGrid, setStartGrid, i, j)}
      />
      <PatternGrid
        pattern={endGrid}
        size={40}
        title="Input 2"
        onCellClick={(i, j) => toggleCell(endGrid, setEndGrid, i, j)}
      />
      <button onClick={() => onDone({ start: startGrid, end: endGrid })}>Continue</button>
    </div>
  );
}

export default InputGrids;
