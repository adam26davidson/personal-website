import { Axis } from "./Axes";

export class NormPoint {
  private x: number = 0;
  private y: number = 0;

  constructor(x: number, y: number) {
    this.set("x", x);
    this.set("y", y);
  }
  
  public get(a: Axis): number {
    return this[a];
  }

  public set(a: Axis, v: number) {
    this[a] = Math.max(0, Math.min(1, v));
  }

  copy() {
    return new NormPoint(this.x, this.y);
  }
}