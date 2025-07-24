import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PatternGrid from "./PatternGrid";

const GRID_SIZE = 32;
const CELL_SIZE = 12;
const PATTERN_SIZE = 4;
const ANIMATION_DURATION = 0.7;

// Blank grid for background
const blankGrid = Array.from({ length: GRID_SIZE }, () =>
  Array(GRID_SIZE).fill(0)
);

const cornerPositions = {
  topLeft:     { x: 0, y: 0 },
  topRight:    { x: (GRID_SIZE - PATTERN_SIZE) * CELL_SIZE, y: 0 },
  bottomLeft:  { x: 0, y: (GRID_SIZE - PATTERN_SIZE) * CELL_SIZE },
  bottomRight: { x: (GRID_SIZE - PATTERN_SIZE) * CELL_SIZE, y: (GRID_SIZE - PATTERN_SIZE) * CELL_SIZE }
};

function toLocalCoords(coords, containerRect) {
  if (!coords || !containerRect) return null;
  return {
    x: coords.left - containerRect.left,
    y: coords.top - containerRect.top
  };
}

// Helper: embed 4x4s into a 32x32 grid
function embedCornersToGrid({ start4, end4, inv_start4, inv_end4 }) {
  const grid = blankGrid.map(row => [...row]);
  // Top-left
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      grid[i][j] = inv_end4[i][j];
  // Top-right
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      grid[i][GRID_SIZE - 4 + j] = start4[i][j];
  // Bottom-left
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      grid[GRID_SIZE - 4 + i][j] = inv_start4[i][j];
  // Bottom-right
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      grid[GRID_SIZE - 4 + i][GRID_SIZE - 4 + j] = end4[i][j];
  return grid;
}

export default function AnimatedToCorners({
  start4, end4, inv_start4, inv_end4,
  start4Pos, end4Pos, inv_start4Pos, inv_end4Pos,
  onDone
}) {
  const containerRef = useRef(null);
  const [containerRect, setContainerRect] = useState(null);
  const [embedded, setEmbedded] = useState(false);

  // After overlays land, fade out overlays and fade in grid
  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
    // Wait for overlays to animate, then show grid and hide overlays
    const t = setTimeout(() => setEmbedded(true), ANIMATION_DURATION * 1000);
    return () => clearTimeout(t);
  }, []);

  const fallbackY = 80;
  const fallbackX = [0, 120, 240, 360];
  const getStart = (coords, idx) => {
    const local = toLocalCoords(coords, containerRect);
    if (local) return local;
    return { x: fallbackX[idx], y: fallbackY };
  };

  if (!containerRect) {
    // Wait for first render/layout
    return (
      <div
        ref={containerRef}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          margin: "40px auto"
        }}
      />
    );
  }

  const embeddedGrid = embedCornersToGrid({ start4, end4, inv_start4, inv_end4 });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        margin: "40px auto",
        background: "#ccc",
        border: "2px solid #222",
        borderRadius: "0px",
        boxShadow: "0 2px 8px #0002"
      }}
    >
    <div
        style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 1,
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        pointerEvents: "none"
        }}
    >
        <PatternGrid
            pattern={embedded ? embeddedGrid : blankGrid}
            size={CELL_SIZE}
            title=""
        />
    </div>
      {/* Show overlays *only* before embedding */}
      <AnimatePresence>
        {!embedded && (
          <>
            <motion.div
              initial={getStart(start4Pos, 0)}
              animate={cornerPositions.topRight}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
              style={{ position: "absolute", zIndex: 2 }}
            >
              <PatternGrid pattern={start4} size={CELL_SIZE} />
            </motion.div>
            <motion.div
              initial={getStart(inv_end4Pos, 1)}
              animate={cornerPositions.topLeft}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
              style={{ position: "absolute", zIndex: 2 }}
            >
              <PatternGrid pattern={inv_end4} size={CELL_SIZE} />
            </motion.div>
            <motion.div
              initial={getStart(inv_start4Pos, 2)}
              animate={cornerPositions.bottomLeft}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
              style={{ position: "absolute", zIndex: 2 }}
            >
              <PatternGrid pattern={inv_start4} size={CELL_SIZE} />
            </motion.div>
            <motion.div
              initial={getStart(end4Pos, 3)}
              animate={cornerPositions.bottomRight}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
              style={{ position: "absolute", zIndex: 2 }}
            >
              <PatternGrid pattern={end4} size={CELL_SIZE} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The full grid appears only after overlays have embedded */}
        {embedded && (
        <div
            style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            pointerEvents: "none"
            }}
        >
            <PatternGrid pattern={embeddedGrid} size={CELL_SIZE} title="" />
        </div>
        )}


      <button
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "6px 28px",
          fontSize: 18,
          marginTop: 12
        }}
        disabled={!embedded}
        onClick={() => {
          onDone(embeddedGrid);
        }}
      >
        Next
      </button>
    </div>
  );
}
