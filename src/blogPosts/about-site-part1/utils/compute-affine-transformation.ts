type Point2D = [number, number];

/**
 * Solve for the 3×2 affine matrix A mapping points1→points2 in a least-squares sense.
 * Returns { A, points1H } where:
 *  - points1H is N×3 homogeneous [x,y,1] array
 *  - A is 3×2 matrix so that points1H · A ≈ points2
 */
export function findAffineTransformation(
  points1: Point2D[],
  points2: Point2D[]
): { A: number[][]; points1H: number[][] } {
  const n = points1.length;
  if (n !== points2.length || n < 3) {
    throw new Error("Need same number of source/target points, at least 3");
  }

  // 1) build X: N×3 homogeneous source matrix
  const X: number[][] = points1.map(([x, y]) => [x, y, 1]);

  // 2) build Y: N×2 target matrix
  const Y: number[][] = points2.map(([x, y]) => [x, y]);

  // 3) compute XᵀX  (3×3) and XᵀY (3×2)
  const Xt = transpose(X);
  const XtX = multiply(Xt, X); // 3×3
  const XtY = multiply(Xt, Y); // 3×2

  // 4) invert XtX
  const invXtX = invert3x3(XtX);

  // 5) A = (XᵀX)⁻¹ · (XᵀY)  → 3×2
  const A = multiply(invXtX, XtY);

  return { A, points1H: X };
}

//— matrix utilities --------------------------------

function transpose(M: number[][]): number[][] {
  const rows = M.length,
    cols = M[0].length;
  const T: number[][] = Array(cols)
    .fill(0)
    .map(() => Array(rows).fill(0));
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) T[j][i] = M[i][j];
  return T;
}

function multiply(A: number[][], B: number[][]): number[][] {
  const m = A.length,
    n = A[0].length,
    p = B[0].length;
  const C: number[][] = Array(m)
    .fill(0)
    .map(() => Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const aik = A[i][k];
      for (let j = 0; j < p; j++) {
        C[i][j] += aik * B[k][j];
      }
    }
  }
  return C;
}

function invert3x3(m: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) {
    throw new Error("Matrix is singular or nearly singular");
  }
  const invDet = 1 / det;
  // cofactor matrix, then transpose = adjugate
  const adj: number[][] = [
    [e * i - f * h, -(b * i - c * h), b * f - c * e],
    [-(d * i - f * g), a * i - c * g, -(a * f - c * d)],
    [d * h - e * g, -(a * h - b * g), a * e - b * d],
  ];
  return adj.map((row) => row.map((v) => v * invDet));
}
