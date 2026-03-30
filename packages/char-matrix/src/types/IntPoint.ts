import { Axis, X, Y } from "./Axes";

export class IntPoint {
  private x: number = 0;
  private y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.set(X, x);
    this.set(Y, y);
  }

  public getX = () => this.x;
  public getY = () => this.y;
  public get = (a: Axis) => this[a];

  public set(a: Axis, v: number) {
    this[a] = Math.floor(v);
  }

  /**
   * returns a new point that is the sum of this point and the given point
   * @param p the point to be added to this point
   * @returns a new point that is the sum of this point and the given point
   */
  public add(p: IntPoint): IntPoint {
    return new IntPoint(this.x + p.x, this.y + p.y);
  }

  public subtract(p: IntPoint): IntPoint {
    return new IntPoint(this.x - p.x, this.y - p.y);
  }

  copy() {
    return new IntPoint(this.x, this.y);
  }

  equals(p: IntPoint) {
    return this.x === p.x && this.y === p.y;
  }
}

export const ZERO_POINT = new IntPoint(0, 0);
