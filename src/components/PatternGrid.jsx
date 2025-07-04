import React, { forwardRef } from "react";

// pattern: 2D array of 0s and 1s (or colors)
// size: pixel width/height of each cell
// title: (optional) label for the grid
// onCellClick: (optional) function (row, col) => {}

const cellColors = {
  0: "#fff",      // White/off
  1: "#333",      // Filled/black
  "R": "#e53935", // Example for colored patterns, e.g. Red
  // Add more if you have custom color/number encodings
};

const PatternGrid = forwardRef(function PatternGrid(
  { pattern, size = 40, title = "", onCellClick },
  ref
) {
  if (!pattern || !pattern.length) return null;
  const nRows = pattern.length;
  const nCols = pattern[0].length;

  return (
    <div ref={ref} style={{ display: "inline-block", textAlign: "center" }}>
      {title && <div style={{ marginBottom: 6 }}>{title}</div>}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${nRows}, ${size}px)`,
          gridTemplateColumns: `repeat(${nCols}, ${size}px)`,
          border: "2px solid #222",
          background: "#bbb",
          margin: "0 auto",
          boxShadow: "0 2px 8px #0002",
        }}
      >
        {pattern.map((row, y) =>
          row.map((val, x) => (
            <div
              key={`${y}-${x}`}
              style={{
                width: size,
                height: size,
                background: cellColors[val] || "#888",
                border: "1px solid #444",
                boxSizing: "border-box",
                transition: "background 0.25s",
                cursor: onCellClick ? "pointer" : "default",
              }}
              onClick={onCellClick ? () => onCellClick(y, x) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default PatternGrid;
