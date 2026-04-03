import { Element, IntPoint, DEFAULT_BACKGROUND_CHAR, FULLWIDTH_CONTINUATION } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import { Animation, AnimationUse } from "./Animation";
import TOP_SIMILAR from "./topSimilar";

export abstract class HeadBasedAnimation extends Animation {
  protected abstract isComplete(): boolean;

  // state
  protected headDistance: number;

  // parameters
  protected tailLength: number;
  protected randomizationRange: number;
  protected headSpeed: number;

  constructor(
    element: Element,
    view: RenderTarget,
    config: {
      tailLength: number;
      randomizationRange: number;
      headSpeed: number;
      use: AnimationUse;
    },
    onComplete: () => void = () => {}
  ) {
    super(element, view, config.use, onComplete);

    this.headDistance = 0;

    this.randomizationRange = config.randomizationRange;
    this.headSpeed = config.headSpeed;
    this.tailLength = config.tailLength;
    this.backgroundChar =
      element.getParent()?.getBackgroundChar() || DEFAULT_BACKGROUND_CHAR;
  }

  protected updateState() {
    this.headDistance += this.headSpeed;
  }

  protected draw(o: IntPoint) {
    if (this.use === "entrance" && this.headDistance === 0) {
      this.clearAnimationLayer(o);
    }
    const z = this.element.getZIndex();
    this.element.forEachVisiblePoint((p) => {
      const distanceBehindHead = this.getDistanceBehindHead(p);
      let char = this.view.getContentLayerChar(p, o);
      if (distanceBehindHead <= 0) {
        // point is in front of the head
        return;
      } else if (
        distanceBehindHead >= 0 &&
        distanceBehindHead <= this.tailLength + 1
      ) {
        // point is in the tail
        char = this.getTailChar(distanceBehindHead, p, o);
      } else if (this.use === "exit") {
        // point is behind the tail in exit animation
        char = this.backgroundChar;
      }
      this.view.setAnimationLayerChar(char, p, o, z);
    });
  }

  protected randomizeIndex(index: number) {
    if (index !== 0) {
      return index + Math.floor(Math.random() * this.randomizationRange);
    }
    return index;
  }

  protected getTailChar(
    distanceBehindHead: number,
    p: IntPoint,
    o: IntPoint
  ): string {
    const baseChar = this.view.getContentLayerChar(p, o);
    if (baseChar === FULLWIDTH_CONTINUATION) return baseChar;
    if (!(baseChar in TOP_SIMILAR) || baseChar === "\u00a0") return baseChar;

    let index = 0;

    if (this.use === "exit" && distanceBehindHead <= this.tailLength / 2) {
      // point is in the first half of the tail of exit animation
      index = distanceBehindHead;
    } else {
      index = this.tailLength - distanceBehindHead + 1;
    }

    if (
      this.isOnBorder(p) ||
      baseChar === this.element.getBackgroundChar() ||
      (this.use === "exit" && distanceBehindHead > this.tailLength / 2)
    ) {
      index = this.randomizeIndex(index);
    }

    return TOP_SIMILAR[baseChar][index];
  }

  protected abstract getDistanceBehindHead(p: IntPoint): number;
}
