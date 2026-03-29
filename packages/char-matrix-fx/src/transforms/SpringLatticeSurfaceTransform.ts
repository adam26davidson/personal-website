import { CharMatrix, IntPoint } from "char-matrix";
import type { SurfaceTransform } from "char-matrix";
import { SpringLattice } from "../SpringLattice";
import TOP_SIMILAR from "../topSimilar";

/**
 * Surface transform that applies spring lattice physics distortion
 * using character similarity lookup.
 */
export class SpringLatticeSurfaceTransform implements SurfaceTransform {
  private springLattice: SpringLattice;

  constructor(springLattice: SpringLattice) {
    this.springLattice = springLattice;
  }

  transform(source: CharMatrix, output: CharMatrix, viewSize: IntPoint): void {
    source.map((c: string, p: IntPoint) => {
      const x = p.getX() / viewSize.getX();
      const y = p.getY() / viewSize.getY();
      const position = this.springLattice.sample(x, y);
      const index = Math.min(Math.floor(Math.abs(position) * 10), 99);
      let newChar = c;
      if (c in TOP_SIMILAR) {
        newChar = TOP_SIMILAR[c][index];
      }
      return newChar;
    }, output);
  }
}
