// Returns object with domain metadata for margin compression and core filling
export function getMarginDomains(side) {
  if (side === "right")
    return {
      range: Array.from({ length: 10 }, (_, i) => 11 + i),
      inputInds: [28, 29, 30, 31],
      orOutInds: [24, 25],
      andOutInd: 22,
      axis: 0,
    };
  if (side === "left")
    return {
      range: Array.from({ length: 10 }, (_, i) => 11 + i),
      inputInds: [0, 1, 2, 3],
      orOutInds: [6, 7],
      andOutInd: 9,
      axis: 0,
    };
  if (side === "top")
    return {
      range: Array.from({ length: 10 }, (_, i) => 11 + i),
      inputInds: [0, 1, 2, 3],
      orOutInds: [6, 7],
      andOutInd: 9,
      axis: 1,
    };
  if (side === "bottom")
    return {
      range: Array.from({ length: 10 }, (_, i) => 11 + i),
      inputInds: [28, 29, 30, 31],
      orOutInds: [24, 25],
      andOutInd: 22,
      axis: 1,
    };
  throw new Error("Unknown side " + side);
}

export function isFilled(cell) {
  return cell !== 0;
}
