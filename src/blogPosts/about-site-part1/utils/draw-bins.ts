import {
  computePairwiseDistancesAndAngles,
  logspace,
  linspace,
} from "./compute-context";

export function drawBins(
  ctx: CanvasRenderingContext2D,
  angleBins = 14,
  radiusBins = 5,
  samplePoints: Array<[number, number]> = [],
  pointIdx: number = 0,
  color: string = "rgba(255, 255, 255, 0.4)"
) {
  if (!samplePoints.length || pointIdx >= samplePoints.length) return;

  const center = samplePoints[pointIdx];

  // Determine maximum radius based on nearest/farthest point
  const data = computePairwiseDistancesAndAngles(samplePoints);
  const rBins = logspace(
    Math.log10(data.minDist),
    Math.log10(data.maxDist),
    radiusBins + 1
  );
  const angleStep = (2 * Math.PI) / angleBins;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Draw circles for radius bins
  for (let i = 1; i <= radiusBins; i++) {
    const r = rBins[i];
    ctx.beginPath();
    ctx.arc(center[0], center[1], r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Draw angle lines
  const startAngle = -Math.PI;
  for (let i = 0; i < angleBins; i++) {
    const angle = startAngle + i * angleStep;
    const x = center[0] + Math.cos(angle) * rBins[rBins.length - 1];
    const y = center[1] + Math.sin(angle) * rBins[rBins.length - 1];
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBinHighlight(
  ctx: CanvasRenderingContext2D,
  binIndex: number,
  angleBins = 14,
  radiusBins = 5,
  samplePoints: Array<[number, number]> = [],
  pointIdx: number = 0,
  highlightColor = "rgba(255, 255, 255, 0.2)"
) {
  if (
    !samplePoints.length ||
    pointIdx >= samplePoints.length ||
    binIndex < 0 ||
    binIndex >= angleBins * radiusBins
  ) {
    return;
  }

  const center = samplePoints[pointIdx];
  const { minDist, maxDist } = computePairwiseDistancesAndAngles(samplePoints);

  // build edges
  const rEdges = logspace(
    Math.log10(minDist),
    Math.log10(maxDist),
    radiusBins + 1
  );
  const θEdges = linspace(-Math.PI, Math.PI, angleBins + 1);

  // decode binIndex into (rBin, θBin)
  const rBin = Math.floor(binIndex / angleBins);
  const θBin = binIndex % angleBins;

  const innerR = rEdges[rBin];
  const outerR = rEdges[rBin + 1];
  const startAng = θEdges[θBin];
  const endAng = θEdges[θBin + 1];

  ctx.save();
  ctx.fillStyle = highlightColor;

  ctx.beginPath();
  // outer arc
  ctx.moveTo(
    center[0] + Math.cos(startAng) * outerR,
    center[1] + Math.sin(startAng) * outerR
  );
  ctx.arc(center[0], center[1], outerR, startAng, endAng, false);
  // line back to inner arc start
  ctx.lineTo(
    center[0] + Math.cos(endAng) * innerR,
    center[1] + Math.sin(endAng) * innerR
  );
  // inner arc (reverse)
  ctx.arc(center[0], center[1], innerR, endAng, startAng, true);
  ctx.closePath();

  ctx.fill();
  ctx.restore();
}
