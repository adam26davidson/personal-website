export function linspace(start: number, end: number, num: number): number[] {
  const step = (end - start) / (num - 1);
  return Array.from({ length: num }, (_, i) => start + i * step);
}

export function logspace(
  logStart: number,
  logEnd: number,
  num: number
): number[] {
  const step = (logEnd - logStart) / (num - 1);
  return Array.from({ length: num }, (_, i) =>
    Math.pow(10, logStart + i * step)
  );
}

export function computePairwiseDistancesAndAngles(
  points: Array<[number, number]>
): {
  distances: number[][];
  angles: number[][];
  minDist: number;
  maxDist: number;
} {
  const nPoints = points.length;
  const distances: number[][] = Array(nPoints)
    .fill(null)
    .map(() => Array(nPoints).fill(0));
  const angles: number[][] = Array(nPoints)
    .fill(null)
    .map(() => Array(nPoints).fill(0));

  let minDist = Infinity;
  let maxDist = -Infinity;

  for (let i = 0; i < nPoints; i++) {
    for (let j = 0; j < nPoints; j++) {
      if (i === j) continue;
      const dx = points[j][0] - points[i][0];
      const dy = points[j][1] - points[i][1];
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      distances[i][j] = dist;
      angles[i][j] = angle;

      if (dist > 0) {
        minDist = Math.min(minDist, dist);
        maxDist = Math.max(maxDist, dist);
      }
    }
  }

  return { distances, angles, minDist, maxDist };
}

export function computeShapeContext(
  points: Array<[number, number]>,
  angleBins: number,
  radiusBins: number
): number[][] {
  const nPoints = points.length;
  const descriptors: number[][] = [];
  const { distances, angles, minDist, maxDist } =
    computePairwiseDistancesAndAngles(points);

  // bin edges
  const rEdges = logspace(
    Math.log10(minDist),
    Math.log10(maxDist),
    radiusBins + 1
  );
  const θEdges = linspace(-Math.PI, Math.PI, angleBins + 1);

  for (let i = 0; i < nPoints; i++) {
    const hist = new Array(radiusBins * angleBins).fill(0);

    for (let j = 0; j < nPoints; j++) {
      if (i === j) continue;
      const d = distances[i][j];
      const θ = angles[i][j];

      // find radial bin k so that rEdges[k] <= d < rEdges[k+1]
      let rBin = radiusBins - 1; // default to last
      for (let k = 0; k < radiusBins; k++) {
        if (d >= rEdges[k] && d < rEdges[k + 1]) {
          rBin = k;
          break;
        }
      }

      // find angular bin m so that θEdges[m] <= θ < θEdges[m+1]
      // note: θEdges[angleBins] === +π, but angles come in (-π, π]
      let θBin = angleBins - 1;
      for (let m = 0; m < angleBins; m++) {
        // wrap the last bin to include π
        const upper = m + 1 === angleBins ? Math.PI + 1e-8 : θEdges[m + 1];
        if (θ >= θEdges[m] && θ < upper) {
          θBin = m;
          break;
        }
      }

      hist[rBin * angleBins + θBin]++;
    }

    // normalize
    const sum = hist.reduce((s, v) => s + v, 0) + 1e-8;
    descriptors.push(hist.map((v) => v / sum));
  }

  return descriptors;
}
