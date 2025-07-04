import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PatternGrid from "./PatternGrid";
import { build_margin } from "../utils/patternLogic";
import { rotateGrid90Left } from "../utils/gridHelpers";

const GRID_SIZE = 32, CELL_SIZE = 16;

// Utility for extracting 4x4 from a 32x32 grid
// "topRight" => rows 0:4, cols 28:32
// "bottomRight" => rows 28:32, cols 28:32
const extract4x4 = (grid, which) => {
  if (which === "topRight") return grid.slice(0, 4).map(r => r.slice(28, 32));
  if (which === "bottomRight") return grid.slice(28, 32).map(r => r.slice(28, 32));
  throw new Error("Unknown corner: " + which);
};

// Place margin along right edge, skipping 4 cells at top/bottom
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


export default function MarginBuilder({ grid, step, onGridUpdate, onContinue }) {
  const [showMargin, setShowMargin] = useState(false);
  const [margin, setMargin] = useState(null);
  const [animatedGrid, setAnimatedGrid] = useState(grid);
  const [rotation, setRotation] = useState(0);

    useEffect(() => {
        // Build and overlay the margin for this step
        const start = extract4x4(grid, "topRight");
        const end = extract4x4(grid, "bottomRight");
        const marginBlocks = build_margin(start, end);
        const margin = flattenMarginBlocks(marginBlocks);

        setMargin(margin);
        setShowMargin(true);

        // Show margin overlay for a while, then embed and animate rotation
        const marginTimeout = setTimeout(() => {
            const gridWithMargin = embedMarginAtRight(grid, margin);
            setAnimatedGrid(gridWithMargin);
            setShowMargin(false);

                // Animate the rotation
            setTimeout(() => {
                setRotation(r => r - 90);
                // After animation finishes, update the grid data and call parent
                setTimeout(() => {
                    const rotated = rotateGrid90Left(gridWithMargin);
                    setAnimatedGrid(rotated);
                    setRotation(0);
                    // Only update parent and advance step ONCE per step
                    onGridUpdate(rotated);
                    onContinue();
                }, 1000); // rotation duration
            }, 500); // margin pulse duration
        }, 1200); // show margin before embedding

        return () => clearTimeout(marginTimeout);
        // ------ CRITICAL: ONLY depend on `step`! ------
    }, [step]); // <---- This is the fix!

  // Overlay margin on right edge before it gets "embedded"
  return (
    <div style={{
      position: "relative",
      width: GRID_SIZE * CELL_SIZE,
      height: GRID_SIZE * CELL_SIZE,
      margin: "40px auto"
    }}>
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: "absolute",
          left: 0,
          top: 0
        }}
      >
        <PatternGrid pattern={animatedGrid} size={CELL_SIZE} />
        {showMargin && margin && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 28 * CELL_SIZE,
            width: 4 * CELL_SIZE,
            height: margin.length * CELL_SIZE,
            zIndex: 2,
            pointerEvents: "none",
            boxShadow: "0 0 20px 2px #e90a",
            transition: "box-shadow 0.5s"
          }}>
            <PatternGrid pattern={margin} size={CELL_SIZE} />
          </div>
        )}
      </motion.div>
    </div>
  );
}