import React, { useMemo } from "react";
import { computeSolvabilityMatrixMarginBuilder } from "../utils/solvabilityLogic";

export default function SolvabilityBitmap() {
  // useMemo: Only compute once (unless logic changes)
  const matrix = useMemo(() => computeSolvabilityMatrixMarginBuilder(), []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(16, 18px)",
        gridTemplateRows: "repeat(16, 18px)",
        gap: "1px",
        background: "#222",
        width: "max-content",
      }}
    >
      {Array.from({ length: 16 }).flatMap((_, rowIdx) =>
        Array.from({ length: 16 }).map((_, colIdx) => {
          // (0,0) bottom left: so flip Y
          const y = rowIdx;
          const x = colIdx;
          const val = matrix[y][x];
          return (
            <div
              key={`${y},${x}`}
              style={{
                width: 18,
                height: 18,
                background: val ? "#111" : "#fff",
                border: "1px solid #333",
                boxSizing: "border-box",
              }}
              title={`(${x},${y}): ${val ? "solvable" : "unsolvable"}`}
            />
          );
        })
      )}
    </div>
  );
}
