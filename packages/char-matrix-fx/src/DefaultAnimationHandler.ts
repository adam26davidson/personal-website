import { Element, IntPoint } from "@adam26davidson/char-matrix";
import type { ElementAnimationHandler, RenderTarget } from "@adam26davidson/char-matrix";
import { type Animation, type AnimationConfig } from "./Animation";
import { createAnimation } from "./createAnimation";

export interface AnimationConfigs {
  entrance?: AnimationConfig;
  exit?: AnimationConfig;
  mouseEnter?: AnimationConfig;
  mouseExit?: AnimationConfig;
  click?: AnimationConfig;
}

/**
 * Default animation handler that uses the existing Animation system
 * (RowTracer, DiagonalSwipe, etc.) with character similarity morphing.
 */
export class DefaultAnimationHandler implements ElementAnimationHandler {
  private animation: Animation | null = null;
  private configs: AnimationConfigs;
  private element: Element | null;
  private view: RenderTarget;

  constructor(element: Element | null, view: RenderTarget, configs: AnimationConfigs) {
    this.element = element;
    this.view = view;
    this.configs = configs;
  }

  /**
   * Set the element reference. Useful when the handler is created before
   * the element (e.g., to pass as a config option to the element constructor).
   */
  setElement(element: Element): void {
    this.element = element;
  }

  startAnimation(
    type: "enter" | "exit" | "mouseEnter" | "mouseExit" | "click",
    onComplete: () => void
  ): boolean {
    const config = this.getConfig(type);
    if (!config || !this.element) return false;

    this.animation = createAnimation(
      this.element,
      this.view,
      config,
      onComplete
    );

    // Signal the render loop to keep rendering during this animation
    this.view.getRenderLoop?.()?.requestContinuousRendering(this);

    return true;
  }

  runAnimationStep(offset: IntPoint): void {
    if (this.animation) {
      if (this.animation.runStep(offset)) {
        this.animation = null;
        // Release the render loop now that the animation is done
        this.view.getRenderLoop?.()?.releaseContinuousRendering(this);
      }
    }
  }

  hasActiveAnimation(): boolean {
    return this.animation !== null;
  }

  setOnComplete(onComplete: () => void): void {
    if (this.animation) {
      this.animation.setOnComplete(onComplete);
    }
  }

  private getConfig(
    type: "enter" | "exit" | "mouseEnter" | "mouseExit" | "click"
  ): AnimationConfig | undefined {
    switch (type) {
      case "enter":
        return this.configs.entrance;
      case "exit":
        return this.configs.exit;
      case "mouseEnter":
        return this.configs.mouseEnter;
      case "mouseExit":
        return this.configs.mouseExit;
      case "click":
        return this.configs.click;
    }
  }
}
