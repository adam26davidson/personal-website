import { IntPoint } from "../types/IntPoint";
import type { CursorType } from "../Element/ElementBase";
import type { Element } from "../Element/Element";

/**
 * Interface that decouples elements from the concrete MatrixView.
 * Elements interact with the rendering system only through this interface.
 */
export interface RenderTarget {
  // --- Cursor ---
  setCursor(cursor: CursorType): void;
  // --- Character buffer operations ---
  setContentLayerChar(
    char: string,
    location: IntPoint,
    offset?: IntPoint,
    zIndex?: number
  ): void;

  getContentLayerChar(location: IntPoint, offset?: IntPoint): string;

  setAnimationLayerChar(
    char: string,
    location: IntPoint,
    offset?: IntPoint,
    zIndex?: number
  ): void;

  // --- Layout info ---
  getPixelOffset(): IntPoint;
  getSize(): IntPoint;
  getIsMobile(): boolean;

  // --- Element registry ---
  registerElement(element: Element): void;
  unregisterElement(element: Element): void;
}
