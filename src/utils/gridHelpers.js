// Rotates any 2D array (NxN) anti-clockwise by 90°
export function rotateGrid90Left(grid) {
  const N = grid.length;
  const out = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      out[N - 1 - x][y] = grid[y][x];
    }
  }
  return out;
}

// Extract a 4x4 corner from a grid given "corner name"
export function extractCorner(grid, corner) {
  const N = grid.length;
  if (corner === "topLeft") {
    return grid.slice(0, 4).map(row => row.slice(0, 4));
  } else if (corner === "topRight") {
    return grid.slice(0, 4).map(row => row.slice(N-4, N));
  } else if (corner === "bottomLeft") {
    return grid.slice(N-4, N).map(row => row.slice(0, 4));
  } else if (corner === "bottomRight") {
    return grid.slice(N-4, N).map(row => row.slice(N-4, N));
  }
}