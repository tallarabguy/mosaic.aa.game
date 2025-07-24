// patternLogic.js

// --- Move definitions ---
const MOVE_VECTORS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up_left: [-1, -1],
  up_right: [1, -1],
  down_left: [-1, 1],
  down_right: [1, 1],
  // bifurcations: array of 2 moves each
  bifurcate_up_right: [[0, -1], [1, 0]],
  bifurcate_up_left:  [[0, -1], [-1, 0]],
  bifurcate_down_right: [[0, 1], [1, 0]],
  bifurcate_down_left: [[0, 1], [-1, 0]],
};

const MOVE_DIRECTION_BITS = {
  up: [1, 0, 0, 0],
  right: [0, 1, 0, 0],
  down: [0, 0, 1, 0],
  left: [0, 0, 0, 1],
  up_right: [1, 1, 0, 0],
  up_left: [1, 0, 0, 1],
  down_right: [0, 1, 1, 0],
  down_left: [0, 0, 1, 1],
  bifurcate_up_right: [1, 1, 0, 0],
  bifurcate_up_left: [1, 0, 0, 1],
  bifurcate_down_right: [0, 1, 1, 0],
  bifurcate_down_left: [0, 0, 1, 1],
};

function encode_component_index(index) {
  // 1–4, returns 4-bit array
  return [0,0,0,0].map((_,i) => (index) & (8>>i) ? 1 : 0);
}
function encode_move_direction(moveName) {
  return MOVE_DIRECTION_BITS[moveName] || [0, 0, 0, 0];
}

// --- Utility for 4x4 grid of 0/1 ---

function zeros(rows=4, cols=4) {
  return Array.from({length: rows}, () => Array(cols).fill(0));
}

// --- Movement/Greedy Matching Logic ---

function apply_move(component_coords, move, grid_shape=[4,4]) {
  // move: either [dx, dy] or [[dx, dy], [dx, dy]] for bifurcation
  if (Array.isArray(move[0])) {
    // bifurcation
    let moved = [];
    for (let [dx, dy] of move) {
      for (let [x, y] of component_coords) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || nx >= grid_shape[1] || ny < 0 || ny >= grid_shape[0])
          return null;
        moved.push([nx, ny]);
      }
    }
    return moved;
  } else {
    let moved = [];
    for (let [x, y] of component_coords) {
      const nx = x + move[0], ny = y + move[1];
      if (nx < 0 || nx >= grid_shape[1] || ny < 0 || ny >= grid_shape[0]) return null;
      moved.push([nx, ny]);
    }
    return moved;
  }
}

function evaluate_move(moved_coords, footer_grid) {
  if (!moved_coords) return 0;
  let hits = 0, overfills = 0;
  for (let [x, y] of moved_coords) {
    if (footer_grid[y][x] === 1) hits++;
    else overfills++;
  }
  return overfills === 0 ? hits : 0;
}

function best_move_for_component(component_coords, footer_grid) {
  let best_score = 0, best_move = null, best_coords = null;
  for (let moveName in MOVE_VECTORS) {
    let moved = apply_move(component_coords, MOVE_VECTORS[moveName]);
    let score = evaluate_move(moved, footer_grid);
    if (score > best_score) {
      best_score = score;
      best_move = moveName;
      best_coords = moved;
    }
  }
  return [best_move, best_coords];
}

function compute_greedy_transmission(segments, footer) {
  let best_moves = {};
  Object.entries(segments).forEach(([idx, coords]) => {
    if (coords && coords.length) {
      let [moveName, movedCoords] = best_move_for_component(coords, footer);
      best_moves[idx] = [moveName, movedCoords];
    } else {
      best_moves[idx] = [null, []];
    }
  });
  // No DataFrame in JS; you can assemble details if needed.
  return [best_moves, null];
}

function rotateBlock180(block) {
  // Rotates a 2D array by 180°
  return block.slice().reverse().map(row => row.slice().reverse());
}

// --- TRANSMISSION VALIDATION ----

function applyMovesToPattern(start_pattern, segments, best_moves) {
  // Defensive clone to avoid mutating input
  const result = start_pattern.map((row) => [...row]);
  for (let seg = 1; seg <= 4; seg++) {
    const sourceCells = segments[seg];
    if (!sourceCells || !sourceCells.length) continue;
    const moveEntry = best_moves[seg];
    if (!moveEntry) continue;
    const [moveName, movedCoords] = moveEntry;
    if (!movedCoords || !movedCoords.length) continue;

    // --- Detect bifurcation ---
    // (One source cell moved to multiple destinations)
    if (movedCoords.length > sourceCells.length) {
      // Usually: only one source cell per segment, multiple destinations
      for (let fromIdx = 0; fromIdx < sourceCells.length; fromIdx++) {
        const [fromX, fromY] = sourceCells[fromIdx];
        // "Move" to all target locations
        for (let [toX, toY] of movedCoords) {
          if (start_pattern[fromY][fromX]) {
            result[fromY][fromX] = 0;
            result[toY][toX] = 1;
          }
        }
      }
    } else {
      // 1-to-1 mapping
      for (let k = 0; k < sourceCells.length; k++) {
        const [fromX, fromY] = sourceCells[k];
        const [toX, toY] = movedCoords[k];
        if (start_pattern[fromY][fromX]) {
          result[fromY][fromX] = 0;
          result[toY][toX] = 1;
        }
      }
    }
  }
  return result;
}

function gridsEqual(a, b) {
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) if (a[i][j] !== b[i][j]) return false;
  return true;
}

// --- Printing to console ---

function gridToString(grid) {
  // Turns a 2D grid into lines of "0101"
  return grid
    .map((row) => row.map((cell) => (cell ? "■" : "·")).join(" "))
    .join("\n");
}

// Side-by-side comparison with diff highlighting
function compareGridsString(gridA, gridB) {
  let result = [];
  for (let y = 0; y < gridA.length; y++) {
    let rowA = "";
    let rowB = "";
    let diff = "";
    for (let x = 0; x < gridA[0].length; x++) {
      rowA += gridA[y][x] ? "■" : "·";
      rowB += gridB[y][x] ? "■" : "·";
      diff += gridA[y][x] === gridB[y][x] ? " " : "✗";
    }
    result.push(`A: ${rowA}   B: ${rowB}   Diff: ${diff}`);
  }
  return result.join("\n");
}

function hasRealMoves(best_moves) {
  // For indices 1-4 (skip 0 if unused)
  for (let i = 1; i <= 4; i++) {
    if (best_moves[i] && best_moves[i][0]) {
      // If moveName is not null/undefined, or movedCoords not empty
      return true;
    }
  }
  return false;
}

// --- Margin builder main routine ---

function build_margin(
  start_corner,
  end_corner,
  do_directionality_check = true,
  debug = false,
  logToConsole = () => {}
) {
  // header = (start==1 & end==0)
  let header = start_corner.map((row, i) =>
    row.map((cell, j) => (cell === 1 && end_corner[i][j] === 0 ? 1 : 0))
  );
  // footer = (start==0 & end==1)
  let footer = start_corner.map((row, i) =>
    row.map((cell, j) => (cell === 0 && end_corner[i][j] === 1 ? 1 : 0))
  );

  // --- Directionality check ---
  const orig_dir_possible = header.flat().reduce((sum, v) => sum + v, 0) > 0;
  let swap = false;
  let end_corner_temp;
  let start_corner_temp;
  
  if (!orig_dir_possible && do_directionality_check) {
    // Swap header and footer if header is empty
    const temp = header;
    header = footer;
    footer = temp;
    end_corner_temp = start_corner;
    start_corner_temp = end_corner;
    swap = true;
  } else {
    end_corner_temp = end_corner;
    start_corner_temp = start_corner;
  }


  // *** ADDITIONAL ERROR CHECK HERE ***
  const headerFilled = header.flat().some((v) => v === 1);
  if (!headerFilled) {
    logToConsole(
      "Header segment is empty after directionality check (unsolvable margin)."
    );
    //throw new Error("Pattern cannot be solved: header segment is empty after directionality check.");
  }

  // --- segmentation ---
  const segments = apply_segmentation_w_type(header); // implement below

  // --- transmission pattern ---
  let [pattern, actual_footer, best_moves] =
    compute_greedy_transmission_pattern(segments, footer, end_corner_temp);

  // TRANSMISSION MOVES EXISTENCE CHECK
  if (!hasRealMoves(best_moves)) {
    logToConsole("No valid transmission moves found for margin.");
    //throw new Error("No valid transmission moves exist for this margin pattern.");
  }

  const finalPattern = applyMovesToPattern(
    start_corner_temp,
    segments,
    best_moves
  );

  logToConsole("Checking moves for margin...");

  if (!gridsEqual(finalPattern, end_corner_temp)) {
    logToConsole("Transmission Pattern Failed!");
    logToConsole(compareGridsString(finalPattern, end_corner_temp));
    //throw new Error("Final Transmission pattern is not a match");
    logToConsole(`Segments: ${JSON.stringify(segments)}`);
    logToConsole(`Best Moves: ${JSON.stringify(best_moves)}`);
  } else {
    logToConsole("Transmission Pattern Passed!");
    logToConsole(compareGridsString(finalPattern, end_corner_temp)); // (optional for confirmation)
    logToConsole(`Segments: ${JSON.stringify(segments)}`);
    logToConsole(`Best Moves: ${JSON.stringify(best_moves)}`);
  }

  // --- Assemble margin blocks (2 rows separator, etc.) ---
  const separator = Array.from({ length: 2 }, () => Array(4).fill(1));
  let blocks = [
    { name: "start", block: start_corner },
    { name: "separator", block: separator },
    { name: "header", block: header },
    { name: "separator", block: separator },
    { name: "transmission", block: pattern },
    { name: "separator", block: separator },
    { name: "footer", block: actual_footer },
    { name: "separator", block: separator },
    { name: "end", block: end_corner }
  ];

  if (swap) {
    // Only reverse/rotate the "middle" blocks, not start/end
    const start = blocks[0];
    const end = blocks[blocks.length - 1];
    const middle = blocks.slice(1, -1).reverse().map(({ name, block }) => ({
      name,
      block: rotateBlock180(block)
    }));
    blocks = [start, ...middle, end];
  }

  if (debug) {
    return { blocks, best_moves };
  }
  return blocks;
}

function compute_greedy_transmission_pattern(segments, footer, end_pattern) {
  const footer_sum = footer.flat().reduce((a, b) => a + b, 0);

  // Choose scoring grid and corresponding actual_footer directly
  let scoring_grid = footer_sum === 0 ? end_pattern : footer;
  let actual_footer = scoring_grid; // Direct assignment

  const [best_moves, _] = compute_greedy_transmission(segments, scoring_grid);

  // Construct the pattern as an 8x4 array:
  let pattern_rows = [];
  for (let i = 1; i <= 4; i++) {
    // index as 4-bit
    pattern_rows.push(encode_component_index(i));
    // direction as 4-bit
    const moveName = best_moves[i] ? best_moves[i][0] : null;
    pattern_rows.push(encode_move_direction(moveName));
  }

  return [pattern_rows, actual_footer, best_moves];
}

// --- Segmentation Logic (needs real implementation) ---

function check_diagonal_clear(grid) {
  // Checks if main or anti diagonal is all 0s
  const diag_main = [0,1,2,3].map(i => grid[i][i]);
  const diag_anti = [0,1,2,3].map(i => grid[i][3 - i]);
  return diag_main.every(val => val === 0) || diag_anti.every(val => val === 0);
}

function label_and_get_subcomponents(grid, segmentation_type) {
  // grid: 4x4 array of 0/1, returns {1: [[x,y],...], ...}
  const segments = {1: [], 2: [], 3: [], 4: []}; // Clockwise, starting from top/north
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const val = grid[y][x];
      if (val === 0) continue;
      if (segmentation_type === "Orthogonal") {
        if (y < 2 && x < 2) {
          segments[1].push([x, y]); // top-left
        } else if (y < 2 && x >= 2) {
          segments[2].push([x, y]); // top-right
        } else if (y >= 2 && x >= 2) {
          segments[3].push([x, y]); // bottom-right
        } else {
          segments[4].push([x, y]); // bottom-left
        }
      } else { // "Diagonal" segmentation, relabel as top/right/bottom/left
        if (y <= x && y + x < 3) {
          segments[1].push([x, y]); // north/top
        } else if (x > y && x + y >= 3) {
          segments[2].push([x, y]); // right
        } else if (y >= x && x + y > 3) {
          segments[3].push([x, y]); // south/bottom
        } else {
          segments[4].push([x, y]); // left
        }
      }
    }
  }
  return segments;
}

function apply_segmentation_w_type(grid) {
  const diagonal_clear = check_diagonal_clear(grid);
  const segmentation_type = diagonal_clear ? "Diagonal" : "Orthogonal";
  // console.log(`Segmentation type: ${segmentation_type}`);
  let segments = label_and_get_subcomponents(grid, segmentation_type);
  const hasEmpty = Object.values(segments).some((arr) => arr.length === 0);
  if (hasEmpty) {
    segments = label_and_get_subcomponents(grid, "Orthogonal");
    return segments;
  }
  return segments;
}

// --- EXPORTS ---
export {
  build_margin,
  apply_segmentation_w_type,
  compute_greedy_transmission_pattern,
  compute_greedy_transmission,
  encode_component_index,
  encode_move_direction,
  apply_move,
  evaluate_move,
  best_move_for_component,
  // ...etc.
}
