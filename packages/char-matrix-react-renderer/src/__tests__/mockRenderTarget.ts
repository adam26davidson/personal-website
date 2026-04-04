import { IntPoint } from "@adam26davidson/char-matrix";
import type { RenderTarget, Element, CursorType } from "@adam26davidson/char-matrix";

/**
 * Minimal mock RenderTarget for testing the reconciler.
 * Tracks registered elements and root element.
 */
export function createMockRenderTarget(
  width = 80,
  height = 24
): RenderTarget & {
  registeredElements: Set<Element>;
  rootElement: Element | null;
} {
  const registeredElements = new Set<Element>();
  let rootElement: Element | null = null;

  const target: RenderTarget & {
    registeredElements: Set<Element>;
    rootElement: Element | null;
  } = {
    registeredElements,
    get rootElement() {
      return rootElement;
    },
    set rootElement(el: Element | null) {
      rootElement = el;
    },
    setCursor(_cursor: CursorType) {},
    setContentLayerChar(
      _char: string,
      _location: IntPoint,
      _offset?: IntPoint,
      _zIndex?: number
    ) {},
    getContentLayerChar(_location: IntPoint, _offset?: IntPoint): string {
      return " ";
    },
    setAnimationLayerChar(
      _char: string,
      _location: IntPoint,
      _offset?: IntPoint,
      _zIndex?: number
    ) {},
    getPixelOffset(): IntPoint {
      return new IntPoint(0, 0);
    },
    getSize(): IntPoint {
      return new IntPoint(width, height);
    },
    getIsMobile(): boolean {
      return false;
    },
    registerElement(element: Element) {
      registeredElements.add(element);
    },
    unregisterElement(element: Element) {
      registeredElements.delete(element);
    },
    setRoot(element: Element) {
      // Unregister old root tree
      if (rootElement) {
        rootElement.unregisterWithView();
      }
      rootElement = element;
      element.registerWithView();
    },
    getRoot(): Element {
      return rootElement!;
    },
  };

  return target;
}
