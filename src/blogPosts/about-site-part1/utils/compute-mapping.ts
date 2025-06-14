// npm install munkres-js
import { Munkres } from "munkres-js";

export interface AssignmentResult {
  totalCost: number;
  rowIndices: number[];
  colIndices: number[];
}

export function findBestMapping(
  descriptors1: number[][],
  descriptors2: number[][]
): AssignmentResult {
  const eps = 1e-8;
  const n1 = descriptors1.length;
  const n2 = descriptors2.length;
  if (n1 === 0 || n2 === 0) {
    return { totalCost: 0, rowIndices: [], colIndices: [] };
  }
  const nBins = descriptors1[0].length;

  // build cost matrix
  const costMatrix: number[][] = Array.from({ length: n1 }, (_, i) =>
    Array.from({ length: n2 }, (_, j) => {
      let chi2 = 0;
      const h1 = descriptors1[i];
      const h2 = descriptors2[j];
      for (let k = 0; k < nBins; k++) {
        const num = (h1[k] - h2[k]) ** 2;
        const den = h1[k] + h2[k] + eps;
        chi2 += num / den;
      }
      return 0.5 * chi2;
    })
  );

  // solve assignment
  const munkres = new Munkres();
  const pairs: [number, number][] = munkres.compute(costMatrix);

  let totalCost = 0;
  const rowIndices: number[] = [];
  const colIndices: number[] = [];

  for (const [r, c] of pairs) {
    rowIndices.push(r);
    colIndices.push(c);
    totalCost += costMatrix[r][c];
  }

  return { totalCost, rowIndices, colIndices };
}
