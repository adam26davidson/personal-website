import { Element, IntPoint } from "char-matrix";
import type { RenderTarget } from "char-matrix";
import { RowTracerAnimationConfig } from "./Animation";
import { HeadBasedAnimation } from "./HeadBasedAnimation";

export class RowTracerAnimation extends HeadBasedAnimation {
  constructor(
    element: Element,
    view: RenderTarget,
    config: RowTracerAnimationConfig,
    onComplete: () => void = () => {}
  ) {
    super(element, view, config, onComplete);
  }

  protected isComplete() {
    return (
      this.headDistance >=
      this.element.getSize().getX() * this.element.getSize().getY() +
        this.tailLength +
        2
    );
  }

  protected getDistanceBehindHead(p: IntPoint) {
    return this.headDistance - this.getDistanceFromStart(p);
  }

  private getDistanceFromStart(p: IntPoint) {
    const x = p.getX();
    const y = p.getY();
    const w = this.element.getSize().getX();
    const h = this.element.getSize().getY();
    if (this.element.getHasBorder()) {
      if (this.isOnBorder(new IntPoint(x, y))) {
        const internalArea = (w - 2) * (h - 2);
        let d = 0;
        if (y === 0) {
          d = x;
        } else if (x === w - 1) {
          d = y + x - 1;
        } else if (y === h - 1) {
          d = 2 * w + h - 3 - x;
        } else if (x === 0) {
          d = 2 * w + 2 * h - 4 - y;
        }
        return d + internalArea;
      } else {
        const internalDistance = (y - 1) * (w - 2) + (x - 1);
        return internalDistance;
      }
    } else {
      return y * w + x;
    }
  }
}
