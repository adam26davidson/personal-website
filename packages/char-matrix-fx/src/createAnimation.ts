import { Element } from "char-matrix";
import type { RenderTarget } from "char-matrix";
import { Animation, AnimationConfig } from "./Animation";
import { RowTracerAnimation } from "./RowTracerAnimation";
import { DiagonalSwipeAnimation } from "./DiagonalSwipeAnimation";

export function createAnimation(
  element: Element,
  view: RenderTarget,
  config: AnimationConfig,
  onComplete: () => void
): Animation {
  switch (config.type) {
    case "rowTracer":
      return new RowTracerAnimation(element, view, config.config, onComplete);
    case "diagonalSwipe":
      return new DiagonalSwipeAnimation(element, view, config.config, onComplete);
  }
}
