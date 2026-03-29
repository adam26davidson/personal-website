import { CharMatrix } from "../types/CharMatrix";
import { IntPoint } from "../types/IntPoint";

/**
 * A transform applied to the character matrix before rendering.
 * Transforms are chained: the output of one becomes the input of the next.
 */
export interface SurfaceTransform {
  /**
   * Transform the source matrix and write results to the output matrix.
   * @param source The input character matrix
   * @param output The output character matrix to write to
   * @param viewSize The dimensions of the view
   */
  transform(source: CharMatrix, output: CharMatrix, viewSize: IntPoint): void;
}
