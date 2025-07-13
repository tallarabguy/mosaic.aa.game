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
  if (Array.isArray(move[0])) { // bifurcation
    let moved = new Set();
    for (let [dx, dy] of move) {
      for (let [x, y] of component_coords) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= grid_shape[1] || ny < 0 || ny >= grid_shape[0]) return null;
        moved.add(`${nx},${ny}`);
      }
    }
    return new Set(Array.from(moved).map(s => s.split(',').map(Number)));
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

// --- Margin builder main routine ---

function build_margin(start_corner, end_corner, do_directionality_check = true) {
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
  if (!orig_dir_possible && do_directionality_check) {
    // Swap header and footer if header is empty
    const temp = header;
    header = footer;
    footer = temp;
    swap = true;
  }

  // --- segmentation ---
  const segments = apply_segmentation_w_type(header); // implement below

  // --- transmission pattern ---
  let [pattern, actual_footer] = compute_greedy_transmission_pattern(segments, footer, end_corner);

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

  return blocks;
}

function compute_greedy_transmission_pattern(segments, footer, end_pattern) {
  const footer_sum = footer.flat().reduce((a, b) => a + b, 0);
  let scoring_grid, need_generated_footer;
  if (footer_sum === 0) {
    scoring_grid = end_pattern;
    need_generated_footer = true;
  } else {
    scoring_grid = footer;
    need_generated_footer = false;
  }
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
  // pattern shape: 8x4
  // actual_footer is union of all moved header segments
  let actual_footer = zeros();
  if (need_generated_footer) {
    for (let idx = 1; idx <= 4; idx++) {
      const [moveName, movedCoords] = best_moves[idx] || [null, []];
      const movedArr = movedCoords ? (Array.isArray(movedCoords) ? movedCoords : Array.from(movedCoords)) : [];
      if (movedArr.length) {
        for (let [x, y] of movedArr) {
          actual_footer[y][x] = 1;
        }
      }
    }
  } else {
    actual_footer = footer;
  }
  return [pattern_rows, actual_footer];
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
  return label_and_get_subcomponents(grid, segmentation_type);
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
