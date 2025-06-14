export function resampleBoundaryPoints(
  boundaryPointsList: Array<Array<[number, number]>>,
  numPoints: number
): Array<[number, number]> {
  // Step 1: Compute total lengths of all contours
  const totalLengths: number[] = boundaryPointsList.map((points) => {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0];
      const dy = points[i + 1][1] - points[i][1];
      length += Math.hypot(dx, dy);
    }
    return length;
  });

  const totalLength = totalLengths.reduce((a, b) => a + b, 0);

  // Step 2: Allocate number of points per contour
  const numPointsPerContour = totalLengths.map((length) =>
    Math.max(1, Math.round((length / totalLength) * numPoints))
  );

  // Step 3: Adjust to match exact numPoints
  let totalAllocated = numPointsPerContour.reduce((a, b) => a + b, 0);
  while (totalAllocated !== numPoints) {
    const diff = numPoints - totalAllocated;
    const idx = totalLengths.indexOf(Math.max(...totalLengths));
    numPointsPerContour[idx] += diff;
    totalAllocated = numPointsPerContour.reduce((a, b) => a + b, 0);
  }

  // Step 4: Resample each contour
  const resampledPoints: Array<[number, number]> = [];

  for (let i = 0; i < boundaryPointsList.length; i++) {
    const points = boundaryPointsList[i];
    const n = numPointsPerContour[i];

    if (n < 2 || points.length < 2) {
      resampledPoints.push(points[0]);
      continue;
    }

    // Compute segment lengths and cumulative arc lengths
    const segmentLengths: number[] = [];
    const cumulativeLengths: number[] = [0];

    for (let j = 0; j < points.length - 1; j++) {
      const dx = points[j + 1][0] - points[j][0];
      const dy = points[j + 1][1] - points[j][1];
      const len = Math.hypot(dx, dy);
      segmentLengths.push(len);
      cumulativeLengths.push(
        cumulativeLengths[cumulativeLengths.length - 1] + len
      );
    }

    const totalContourLength = cumulativeLengths[cumulativeLengths.length - 1];
    const spacing = totalContourLength / n;
    const desiredLengths = Array.from({ length: n }, (_, k) => k * spacing);

    let currentSegment = 0;
    for (const dl of desiredLengths) {
      while (
        currentSegment < cumulativeLengths.length - 2 &&
        dl > cumulativeLengths[currentSegment + 1]
      ) {
        currentSegment++;
      }

      const lenBefore = cumulativeLengths[currentSegment];
      const lenAfter = cumulativeLengths[currentSegment + 1];
      const t = (dl - lenBefore) / (lenAfter - lenBefore + 1e-8); // avoid div by zero

      const p0 = points[currentSegment];
      const p1 = points[currentSegment + 1];

      const x = p0[0] + t * (p1[0] - p0[0]);
      const y = p0[1] + t * (p1[1] - p0[1]);

      resampledPoints.push([x, y]);
    }
  }

  return resampledPoints;
}
