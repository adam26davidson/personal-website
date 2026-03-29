import { Element, IntPoint } from "char-matrix";
import type { RenderTarget } from "char-matrix";
import { DiagonalSwipeAnimationConfig } from "./Animation";
import { HeadBasedAnimation } from "./HeadBasedAnimation";

export class DiagonalSwipeAnimation extends HeadBasedAnimation {
  protected slant: number;

  constructor(
    element: Element,
    view: RenderTarget,
    config: DiagonalSwipeAnimationConfig,
    onComplete: () => void = () => {}
  ) {
    super(element, view, config, onComplete);
    this.slant = config.slant;
  }

  protected isComplete() {
    return (
      this.headDistance >=
      this.element.getSize().getX() +
        this.slant * this.element.getSize().getY() +
        this.tailLength +
        2
    );
  }

  protected getDistanceBehindHead(p: IntPoint) {
    return this.headDistance - (p.getX() + p.getY() * this.slant);
  }
}
