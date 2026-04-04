import type { CMContainerProps, CMTextProps, CMTableProps, CMOverlayProps } from "./hostConfig";
import type {
  ElementStage,
  ElementAnimationHandler,
  IntPoint,
} from "@adam26davidson/char-matrix";

/**
 * Public imperative API exposed via React refs on char-matrix elements.
 * The underlying Element satisfies this interface — no wrapper needed.
 */
export interface CMElementRef {
  startTransition(type: "enter" | "exit", onComplete?: () => void): void;
  getStage(): ElementStage;
  getAnimationHandler(): ElementAnimationHandler | null;
  getSize(): IntPoint;
  getKey(): string;
  flagForRedraw(): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "cm-container": CMContainerProps;
      "cm-text": CMTextProps;
      "cm-table": CMTableProps;
      "cm-overlay": CMOverlayProps;
    }
  }
}
