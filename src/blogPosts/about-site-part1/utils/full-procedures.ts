import { extractOrderedBoundaryPoints } from "./character-contours";
import { computeShapeContext } from "./compute-context";
import { renderCharacter } from "./render-character";
import { resampleBoundaryPoints } from "./sample-character-points";

export function computeSamplePointsFromScratch(
  character: string,
  numPoints: number,
  ctx: CanvasRenderingContext2D,
  imageSize: number,
  fontSize: number
): Array<[number, number]> {
  const binaryImage = renderCharacter(character, ctx, imageSize, fontSize);
  const contours = extractOrderedBoundaryPoints(binaryImage, imageSize);
  const sampledPoints = resampleBoundaryPoints(contours, numPoints);

  return sampledPoints;
}

export function computeContextFromScratch(
  character: string,
  numPoints: number,
  thetaBins: number,
  rBins: number,
  ctx: CanvasRenderingContext2D,
  imageSize: number,
  fontSize: number
) {
  const sampledPoints = computeSamplePointsFromScratch(
    character,
    numPoints,
    ctx,
    imageSize,
    fontSize
  );

  const shapeContext = computeShapeContext(sampledPoints, thetaBins, rBins);

  return { shapeContext, sampledPoints };
}
