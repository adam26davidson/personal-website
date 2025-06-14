import { Element } from "./Element";
import TOP_SIMILAR from "../topSimilar";
import MatrixView from "../matrixView";
import { IntPoint } from "../UtilityTypes/IntPoint";
import { DEFAULT_BACKGROUND_CHAR } from "../constants";

export type AnimationConfig =
  | {
      type: "rowTracer";
      config: RowTracerAnimationConfig;
    }
  | {
      type: "diagonalSwipe";
      config: DiagonalSwipeAnimationConfig;
    };

export interface HeadBasedAnimationConfig {
  tailLength: number;
  use: AnimationUse;
  headSpeed: number;
  randomizationRange: number;
}

export interface RowTracerAnimationConfig extends HeadBasedAnimationConfig {}

export interface DiagonalSwipeAnimationConfig extends HeadBasedAnimationConfig {
  slant: number;
}

export type AnimationUse = "entrance" | "exit" | "interaction";

export abstract class Animation {
  protected abstract isComplete(): boolean;
  protected abstract draw(o: IntPoint): void;
  protected abstract updateState(): void;

  protected element: Element;
  protected view: MatrixView;
  protected backgroundChar: string = DEFAULT_BACKGROUND_CHAR;
  protected onComplete: () => void = () => {};

  constructor(element: Element, view: MatrixView, onComplete: () => void) {
    this.element = element;
    this.view = view;
    this.onComplete = onComplete;
  }

  static createAnimation(
    element: Element,
    view: MatrixView,
    config: AnimationConfig,
    onComplete: () => void
  ): Animation {
    switch (config.type) {
      case "rowTracer":
        return new RowTracerAnimation(element, view, config.config, onComplete);
      case "diagonalSwipe":
        return new DiagonalSwipeAnimation(
          element,
          view,
          config.config,
          onComplete
        );
    }
  }

  public runStep(o: IntPoint): boolean {
    if (this.isComplete()) {
      this.onComplete();
      return true;
    }

    this.draw(o);
    this.updateState();

    return false;
  }

  public setOnComplete(onComplete: () => void) {
    this.onComplete = onComplete;
  }

  protected isOnBorder(p: IntPoint) {
    return (
      this.element.getHasBorder() &&
      (p.getX() === 0 ||
        p.getX() === this.element.getSize().getX() - 1 ||
        p.getY() === 0 ||
        p.getY() === this.element.getSize().getY() - 1)
    );
  }

  protected clearAnimationLayer(offset: IntPoint) {
    this.element.forEachVisiblePoint((p) => {
      this.view.setAnimationLayerChar(this.backgroundChar, p, offset);
    });
  }
}

export abstract class HeadBasedAnimation extends Animation {
  protected abstract isComplete(): boolean;

  // state
  protected headDistance: number;

  // parameters
  protected tailLength: number;
  protected randomizationRange: number;
  protected headSpeed: number;
  protected use: AnimationUse;

  constructor(
    element: Element,
    view: MatrixView,
    config: {
      tailLength: number;
      randomizationRange: number;
      headSpeed: number;
      use: AnimationUse;
    },
    onComplete: () => void = () => {}
  ) {
    super(element, view, onComplete);

    this.headDistance = 0;

    this.randomizationRange = config.randomizationRange;
    this.headSpeed = config.headSpeed;
    this.tailLength = config.tailLength;
    this.use = config.use;
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
      this.view.setAnimationLayerChar(char, p, o);
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

// DIAGONAL SWIPE ANIMATION ---------------------------------------------------

export class DiagonalSwipeAnimation extends HeadBasedAnimation {
  protected slant: number;

  constructor(
    element: Element,
    view: MatrixView,
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

// ROW TRACER ANIMATION -------------------------------------------------------

export class RowTracerAnimation extends HeadBasedAnimation {
  protected isComplete() {
    return (
      this.headDistance >=
      this.element.getSize().getX() * this.element.getSize().getY() +
        this.tailLength +
        2
    );
  }

  protected getDistanceBehindHead(p: IntPoint) {
    return this.headDistance - this.getdistanceFromStart(p);
  }

  private getdistanceFromStart(p: IntPoint) {
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
