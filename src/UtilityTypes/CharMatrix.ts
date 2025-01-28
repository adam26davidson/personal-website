import { SPACE_CHAR } from "../constants";
import { throttledWarn } from "../Utilities/Logging";
import { IntPoint, ZERO_POINT } from "./IntPoint";

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
    console.log("clearing matrix");
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
    console.log("resizing matrix to", newSize.getX(), newSize.getY());
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
    const size = this.getSize();
    for (let y = 0; y < size.getY(); y++) {
      for (let x = 0; x < size.getX(); x++) {
        const location = new IntPoint(x, y);
        const char = this.getChar(location);
        other.setChar(location, fn(char, location));
      }
    }
  }
}
