import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PatternGrid from "./PatternGrid";
import { build_margin } from "../utils/patternLogic";
import { rotateGrid90Left } from "../utils/gridHelpers";

const GRID_SIZE = 32, CELL_SIZE = 16;

const extract4x4 = (grid, which) => {
  if (which === "topRight") return grid.slice(0, 4).map(r => r.slice(28, 32));
  if (which === "bottomRight") return grid.slice(28, 32).map(r => r.slice(28, 32));
  throw new Error("Unknown corner: " + which);
};

const embedMarginAtRight = (grid, margin) => {
  const newGrid = grid.map(r => [...r]);
  for (let i = 0; i < margin.length; i++)
    for (let j = 0; j < 4; j++)
      newGrid[i][28 + j] = margin[i][j];
  return newGrid;
};

function flattenMarginBlocks(blocks) {
  let allRows = [];
  for (const { block } of blocks) {
    allRows.push(...block);
  }
  return allRows;
}

export default function MarginBuilder({ initialGrid, onComplete }) {
  const [step, setStep] = useState(0); // step 0–4 (0–3 = margin builds, 4 = final rotate/upright)
  const [grid, setGrid] = useState(initialGrid);
  const [showMargin, setShowMargin] = useState(false);
  const [margin, setMargin] = useState(null);
  const [rotation, setRotation] = useState(0); // degrees

  useEffect(() => {
    // If all four margins + final rotation done, pass to parent
    if (step >= 5) {
      onComplete && onComplete(grid);
      return;
    }

    // Animate building margins for steps 0–3, final rotate on step 4
    if (step < 4) {
      // 1. Extract corners on the current grid (axes "reset" each step)
      const start = extract4x4(grid, "topRight");
      const end = extract4x4(grid, "bottomRight");
      const marginBlocks = build_margin(start, end);
      const marginFlat = flattenMarginBlocks(marginBlocks);
      setMargin(marginFlat);
      setShowMargin(true);

      // 2. Overlay the margin visually for a moment
      const overlayTimeout = setTimeout(() => {
        // 3. Embed margin at right edge of CURRENT grid
        const gridWithMargin = embedMarginAtRight(grid, marginFlat);
        setGrid(gridWithMargin);
        setShowMargin(false);

        // 4. Visually rotate the DOM (anti-clockwise 90°)
        setRotation((step + 1) * -90);

        // 5. After rotation, rotate grid data left and move to next step
        const rotateTimeout = setTimeout(() => {
          const rotatedGrid = rotateGrid90Left(gridWithMargin);
          setGrid(rotatedGrid);
          setStep(s => s + 1);
        }, 900);

        return () => clearTimeout(rotateTimeout);
      }, 1100);

      return () => clearTimeout(overlayTimeout);

    } else if (step === 4) {
      // FINAL STEP: rotate grid upright (without margin build)
      setRotation(-360);

      const finalRotateTimeout = setTimeout(() => {
        // Bring the grid back upright for next stage
        let uprightGrid = grid;
        for (let i = 0; i < 3; i++) uprightGrid = rotateGrid90Left(uprightGrid);
        setGrid(uprightGrid);
        setStep(s => s + 1);
      }, 900);

      return () => clearTimeout(finalRotateTimeout);
    }
  }, [step, grid]);

  // Display the grid at its current orientation for this animation step
  return (
    <div style={{
      position: "relative",
      width: GRID_SIZE * CELL_SIZE,
      height: GRID_SIZE * CELL_SIZE,
      margin: "40px auto"
    }}>
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: "absolute",
          left: 0,
          top: 0
        }}
      >
        <PatternGrid pattern={grid} size={CELL_SIZE} />
        {showMargin && margin && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 28 * CELL_SIZE,
            width: 4 * CELL_SIZE,
            height: margin.length * CELL_SIZE,
            zIndex: 2,
            pointerEvents: "none",
            boxShadow: "0 0 20px 2px #e90a"
          }}>
            <PatternGrid pattern={margin} size={CELL_SIZE} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
