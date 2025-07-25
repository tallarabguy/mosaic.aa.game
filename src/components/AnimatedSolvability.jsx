import React, { useMemo, useEffect, useState } from "react";
import PatternGrid from "./PatternGrid";
import { computeSolvabilityMatrixMarginBuilder } from "../utils/solvabilityLogic";

const ANIMATION_DELAY = 100;
const BORDER_DELAY = 45;
const DISSIPATE_DELAY = ANIMATION_DELAY; // Speed of fade-out
const SOLVABILITY_SIZE = 16;
const GRID_SIZE = 32;

function blank32() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function gameOfLifeStep(grid) {
  const H = grid.length,
    W = grid[0].length;
  let next = Array.from({ length: H }, () => Array(W).fill(0));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let alive = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx || dy) {
            const ny = y + dy,
              nx = x + dx;
            if (ny >= 0 && ny < H && nx >= 0 && nx < W) alive += grid[ny][nx];
          }
      next[y][x] = grid[y][x]
        ? alive === 2 || alive === 3
          ? 1
          : 0
        : alive === 3
        ? 1
        : 0;
    }
  return next;
}

export default function AnimatedSolvabilityBitmap({ size = 14, onFinalGrid }) {
  // Center solvability matrix
  const matrix16 = useMemo(() => computeSolvabilityMatrixMarginBuilder(), []);
  const centerOffset = 8;

  // Step 1: Animate in the solvability pattern with GOL (emergence)
  const initial = useMemo(() => {
    const base = blank32();
    for (let y = 0; y < SOLVABILITY_SIZE; y++)
      for (let x = 0; x < SOLVABILITY_SIZE; x++)
        base[centerOffset + y][centerOffset + x] = matrix16[y][x];
    return base;
  }, [matrix16]);

  // Precompute all GOL frames (collapse, then we show them in reverse for "emergence")
  const golFrames = useMemo(() => {
    let arr = [initial];
    let curr = initial;
    let seen = new Set();
    for (let i = 0; i < 150; i++) {
      let next = blank32();
      for (let y = 0; y < GRID_SIZE; y++)
        for (let x = 0; x < GRID_SIZE; x++) {
          let alive = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (dx || dy) {
                const ny = y + dy,
                  nx = x + dx;
                if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE)
                  alive += curr[ny][nx];
              }
          next[y][x] = curr[y][x]
            ? alive === 2 || alive === 3
              ? 1
              : 0
            : alive === 3
            ? 1
            : 0;
        }
      const hash = JSON.stringify(next);
      if (seen.has(hash)) break;
      seen.add(hash);
      arr.push(next);
      curr = next;
      if (curr.every((row) => row.every((cell) => cell === 0))) break;
    }
    return arr.reverse();
  }, [initial]);

  // Animation phases:
  // 0: Solvability emerges (GOL)
  // 1: Single border animates in (with spacing)
  // 2: Double border animates in (with spacing)
  // 3: All done: final pattern with borders available!
  const [phase, setPhase] = useState(0);
  const [dissipateFrames, setDissipateFrames] = useState([]);
  const [dissipateIdx, setDissipateIdx] = useState(0);

  // 1. GOL emergence
  const [frameIdx, setFrameIdx] = useState(0);
  // 2. Single border
  const [border1Step, setBorder1Step] = useState(0);
  // 3. Double border
  const [border2Step, setBorder2Step] = useState(0);

  // Advance phases
  useEffect(() => {
    if (phase === 0 && frameIdx < golFrames.length - 1) {
      const t = setTimeout(() => setFrameIdx((i) => i + 1), ANIMATION_DELAY);
      return () => clearTimeout(t);
    }
    if (phase === 0 && frameIdx === golFrames.length - 1) {
      setTimeout(() => setPhase(1), ANIMATION_DELAY + 120);
    }
  }, [phase, frameIdx, golFrames.length]);

  useEffect(() => {
    if (phase === 1 && border1Step < SOLVABILITY_SIZE + 2) {
      // for a full loop
      const t = setTimeout(() => setBorder1Step((s) => s + 1), BORDER_DELAY);
      return () => clearTimeout(t);
    }
    if (phase === 1 && border1Step === SOLVABILITY_SIZE + 2) {
      setTimeout(() => setPhase(2), BORDER_DELAY + 120);
    }
  }, [phase, border1Step]);

  useEffect(() => {
    if (phase === 2 && border2Step < SOLVABILITY_SIZE + 6) {
      // for a full loop
      const t = setTimeout(() => setBorder2Step((s) => s + 1), BORDER_DELAY);
      return () => clearTimeout(t);
    }
    if (phase === 2 && border2Step === SOLVABILITY_SIZE + 6) {
      setTimeout(() => setPhase(3), BORDER_DELAY + 180);
    }
  }, [phase, border2Step]);

  // Helper to build the grid at the current animation step
  function buildGridWithBorders() {
    // Start from last GOL frame or current GOL anim
    let base =
      phase === 0 ? golFrames[frameIdx] : golFrames[golFrames.length - 1];

    let g = base.map((row) => [...row]);

    // Draw single border at offset 7 (1-cell gap): size = 18
    if (phase > 0 || (phase === 1 && border1Step > 0)) {
      const o = 7,
        end = o + SOLVABILITY_SIZE + 2; // start after 1-cell gap
      const limit = phase === 1 ? border1Step : SOLVABILITY_SIZE + 2;
      // Top
      for (let x = o; x < o + limit && x < end; x++) g[o][x] = g[o][x] || 1;
      // Right
      for (let y = o; y < o + limit && y < end; y++)
        g[y][end - 1] = g[y][end - 1] || 1;
      // Bottom
      for (let x = end - 1; x >= end - limit && x >= o; x--)
        g[end - 1][x] = g[end - 1][x] || 1;
      // Left
      for (let y = end - 1; y >= end - limit && y >= o; y--)
        g[y][o] = g[y][o] || 1;
    }

    // Draw double border at offset 4 (2-cell gap from border1): size = 24
    if (phase > 1 || (phase === 2 && border2Step > 0)) {
      for (let d = 0; d < 2; d++) {
        const o = 4 + d,
          end = o + SOLVABILITY_SIZE + 8 - d * 2; // 2-cell gap between borders
        const limit = phase === 2 ? border2Step : SOLVABILITY_SIZE + 6;
        // Top
        for (let x = o; x < o + limit && x < end; x++) g[o][x] = g[o][x] || 1;
        // Right
        for (let y = o; y < o + limit && y < end; y++)
          g[y][end - 1] = g[y][end - 1] || 1;
        // Bottom
        for (let x = end - 1; x >= end - limit && x >= o; x--)
          g[end - 1][x] = g[end - 1][x] || 1;
        // Left
        for (let y = end - 1; y >= end - limit && y >= o; y--)
          g[y][o] = g[y][o] || 1;
      }
    }
    return g;
  }

  // Provide the final grid (after all animations) to parent
  const finalPatternWithBorders = useMemo(() => {
    let g = golFrames[golFrames.length - 1].map((row) => [...row]);
    // Add single border
    {
      const o = 7,
        end = o + SOLVABILITY_SIZE + 2;
      for (let x = o; x < end; x++) g[o][x] = g[o][x] || 1;
      for (let y = o; y < end; y++) g[y][end - 1] = g[y][end - 1] || 1;
      for (let x = end - 1; x >= o; x--) g[end - 1][x] = g[end - 1][x] || 1;
      for (let y = end - 1; y >= o; y--) g[y][o] = g[y][o] || 1;
    }
    // Add double border (two layers)
    for (let d = 0; d < 2; d++) {
      const o = 4 + d,
        end = o + SOLVABILITY_SIZE + 8 - d * 2;
      for (let x = o; x < end; x++) g[o][x] = g[o][x] || 1;
      for (let y = o; y < end; y++) g[y][end - 1] = g[y][end - 1] || 1;
      for (let x = end - 1; x >= o; x--) g[end - 1][x] = g[end - 1][x] || 1;
      for (let y = end - 1; y >= o; y--) g[y][o] = g[y][o] || 1;
    }
    return g;
  }, [golFrames]);

  // When phase 3 finishes, precompute GoL fade-out frames from final pattern
  useEffect(() => {
    if (phase === 3) {
      // Use finalPatternWithBorders as the new GoL starting pattern
      let arr = [finalPatternWithBorders];
      let curr = finalPatternWithBorders;
      let seen = new Set();
      for (let i = 0; i < 200; i++) {
        let next = gameOfLifeStep(curr);
        let hash = JSON.stringify(next);
        if (seen.has(hash)) break; // Loop detected
        seen.add(hash);
        arr.push(next);
        curr = next;
        if (curr.every((row) => row.every((cell) => cell === 0))) break;
      }
      setDissipateFrames(arr);
      setDissipateIdx(0);
      setPhase(4); // Enter new phase for dissipation animation
    }
    // eslint-disable-next-line
  }, [phase, finalPatternWithBorders]);

  // Animate through the dissipation frames
  useEffect(() => {
    if (phase === 4 && dissipateIdx < dissipateFrames.length - 1) {
      const t = setTimeout(
        () => setDissipateIdx((i) => i + 1),
        DISSIPATE_DELAY
      );
      return () => clearTimeout(t);
    }
  }, [phase, dissipateIdx, dissipateFrames.length]);

  // Render logic: which grid to display
  let displayPattern;
  if (phase < 4) {
    displayPattern = buildGridWithBorders();
  } else if (phase === 4) {
    displayPattern = dissipateFrames[dissipateIdx] || dissipateFrames[0];
  }

  //const pattern = buildGridWithBorders();

  return (
    <div style={{ margin: "0 auto", width: "max-content" }}>
      <PatternGrid pattern={displayPattern} size={size} />
    </div>
  );
}
