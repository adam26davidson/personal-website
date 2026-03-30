import { Axis, X, Y } from "./Axes";
import { IntPoint } from "./IntPoint";

export class RealPoint {
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
    this[a] = v;
  }

  /**
   * returns a new point that is the sum of this point and the given point
   * @param p the point to be added to this point
   * @returns a new point that is the sum of this point and the given point
   */
  public add(p: RealPoint): RealPoint {
    return new RealPoint(this.x + p.x, this.y + p.y);
  }

  public subtract(p: RealPoint | IntPoint): RealPoint {
    return new RealPoint(this.x - p.getX(), this.y - p.getY());
  }

  copy() {
    return new RealPoint(this.x, this.y);
  }

  equals(p: RealPoint) {
    return this.x === p.x && this.y === p.y;
  }
}
