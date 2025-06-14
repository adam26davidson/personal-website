import { isoContours } from "marchingsquares";

export function extractOrderedBoundaryPoints(
  binaryImage: Uint8Array,
  size: number = 128
): Array<Array<[number, number]>> {
  // Convert 1D binary array into 2D array of numbers (0 or 1)
  const grid: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push(binaryImage[y * size + x]);
    }
    grid.push(row);
  }

  // Extract contours at level 0.5
  const contours = isoContours(grid, 0.5);

  if (!contours.length) {
    throw new Error("No contours found in the image.");
  }

  // Sort by length descending
  contours.sort((a: number[][], b: number[][]) => b.length - a.length);

  // Filter out contours that are too close to the edges (boundary)
  const filteredContours = contours.filter((contour: number[][]) => {
    return !contour.some(([x, y]) => {
      const tol = 1e-2; // small tolerance
      return x <= tol || y <= tol || x >= size - 1 - tol || y >= size - 1 - tol;
    });
  });

  if (!filteredContours.length) {
    throw new Error("Only outer contour found; no valid inner contours.");
  }

  return filteredContours;
}
