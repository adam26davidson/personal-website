import { SPACE_CHAR } from "../constants";
import { throttledWarn } from "../utils/Logging";
import { IntPoint, ZERO_POINT } from "./IntPoint";
import { X, Y } from "./Axes";

export class CharMatrix {
  private matrix: string[][];

  constructor(size: IntPoint) {
    this.matrix = new Array(size.getY())
      .fill(null)
      .map(() => new Array(size.getX()).fill(SPACE_CHAR));
  }

  public getSize = () => {
    return new IntPoint(this.matrix[0]?.length || 0, this.matrix.length);
  };

  public getRawMatrix = () => this.matrix;

  public getChar(location: IntPoint, offset: IntPoint = ZERO_POINT) {
    const x = location.getX() + offset.getX();
    const y = location.getY() + offset.getY();
    if (
      x >= 0 &&
      x < this.matrix[0].length &&
      y >= 0 &&
      y < this.matrix.length
    ) {
      return this.matrix[y][x];
    }
    throttledWarn(`attempting to get a character outside of matrix bounds`);
    return SPACE_CHAR;
  }

  public setChar(
    location: IntPoint,
    char: string,
    offset: IntPoint = ZERO_POINT
  ) {
    const x = location.getX() + offset.getX();
    const y = location.getY() + offset.getY();
    if (
      x >= 0 &&
      x < this.matrix[0].length &&
      y >= 0 &&
      y < this.matrix.length
    ) {
      this.matrix[y][x] = char;
    } else {
      throttledWarn(`attempting to set a character outside of matrix bounds`);
    }
  }

  public clear() {
    const size = this.getSize();
    for (let y = 0; y < size.getY(); y++) {
      for (let x = 0; x < size.getX(); x++) {
        this.setChar(new IntPoint(x, y), SPACE_CHAR);
      }
    }
  }

  /**
   * resizes the matrix and wipes all contents
   * @param newSize the new size of the matrix
   */
  public resize(newSize: IntPoint) {
    this.matrix = new Array(newSize.getY())
      .fill(null)
      .map(() => new Array(newSize.getX()).fill(SPACE_CHAR));
  }

  /**
   * uses the provided function to map the contents of this matrix to another
   * @param fn the function to apply to each character
   */
  public map(
    fn: (char: string, location: IntPoint) => string,
    other: CharMatrix
  ) {
    const rows = this.matrix.length;
    const cols = this.matrix[0]?.length || 0;
    const otherRaw = other.getRawMatrix();
    const loc = new IntPoint(0, 0);
    for (let y = 0; y < rows; y++) {
      const srcRow = this.matrix[y];
      const dstRow = otherRaw[y];
      loc.set(Y, y);
      for (let x = 0; x < cols; x++) {
        loc.set(X, x);
        dstRow[x] = fn(srcRow[x], loc);
      }
    }
  }
}
