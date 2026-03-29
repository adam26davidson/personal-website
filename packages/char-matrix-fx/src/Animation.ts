import { Element, IntPoint, DEFAULT_BACKGROUND_CHAR } from "char-matrix";
import type { RenderTarget } from "char-matrix";

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
  protected view: RenderTarget;
  protected backgroundChar: string = DEFAULT_BACKGROUND_CHAR;
  protected onComplete: () => void = () => {};

  constructor(element: Element, view: RenderTarget, onComplete: () => void) {
    this.element = element;
    this.view = view;
    this.onComplete = onComplete;
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
