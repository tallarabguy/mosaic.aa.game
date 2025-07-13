import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PatternGrid from "./PatternGrid";
import { build_margin } from "../utils/patternLogic";
import { rotateGrid90Left } from "../utils/gridHelpers";

const GRID_SIZE = 32,
  CELL_SIZE = 16;

const extract4x4 = (grid, which) => {
  if (which === "topRight") return grid.slice(0, 4).map((r) => r.slice(28, 32));
  if (which === "bottomRight")
    return grid.slice(28, 32).map((r) => r.slice(28, 32));
  throw new Error("Unknown corner: " + which);
};

const embedMarginAtRight = (grid, margin) => {
  const newGrid = grid.map((r) => [...r]);
  for (let i = 0; i < margin.length; i++)
    for (let j = 0; j < 4; j++) newGrid[i][28 + j] = margin[i][j];
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
  const [step, setStep] = useState(0);
  const [grid, setGrid] = useState(initialGrid);
  const [showMargin, setShowMargin] = useState(false);
  const [margin, setMargin] = useState(null);
  const [visualRotation, setVisualRotation] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (step >= 4) {
      onComplete && onComplete(grid);
      return;
    }

    let marginBlocks, marginFlat;
    try {
      // 1. Build and show margin overlay (could throw)
      const start = extract4x4(grid, "topRight");
      const end = extract4x4(grid, "bottomRight");
      marginBlocks = build_margin(start, end);
      marginFlat = flattenMarginBlocks(marginBlocks);

      // Defensive: ensure margin is not empty
      if (!marginFlat || !marginFlat.length) {
        throw new Error("No valid margin could be generated for this pattern.");
      }

      setMargin(marginFlat);
      setShowMargin(true);
    } catch (err) {
      // Call error handler (prop from parent)
      onError &&
        onError(err.message || "Failed to generate margin for this pattern.");
      return; // Prevent rest of effect from running
    }

    // 2. After pause, embed margin and animate rotation
    const overlayTimeout = setTimeout(() => {
      const gridWithMargin = embedMarginAtRight(grid, marginFlat);
      setGrid(gridWithMargin);
      setShowMargin(false);
      setVisualRotation(-90);
    }, 900);

    return () => clearTimeout(overlayTimeout);
  }, [step]);

  // Handle animation complete
  function handleAnimationComplete() {
    if (visualRotation === -90) {
      // 1. Hide grid
      setIsHidden(true);
      // 2. After a tick, reset rotation, update grid data, show grid again
      setTimeout(() => {
        setVisualRotation(0);
        setGrid((g) => rotateGrid90Left(g));
        setStep((s) => s + 1);
        setIsHidden(false);
      }, 25); // 25ms is enough for the browser to paint at rotation 0
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        margin: "40px auto",
      }}
    >
      <motion.div
        animate={{ rotate: visualRotation }}
        transition={{
          duration: visualRotation === 0 ? 0 : 0.9,
          ease: "easeInOut",
        }}
        onAnimationComplete={handleAnimationComplete}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: "absolute",
          left: 0,
          top: 0,
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? "none" : "auto",
        }}
      >
        <PatternGrid pattern={grid} size={CELL_SIZE} />
        {showMargin && margin && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 28 * CELL_SIZE,
              width: 4 * CELL_SIZE,
              height: margin.length * CELL_SIZE,
              zIndex: 2,
              pointerEvents: "none",
              boxShadow: "0 0 20px 2px #e90a",
            }}
          >
            <PatternGrid pattern={margin} size={CELL_SIZE} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
