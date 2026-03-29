import { IntPoint } from "../types/IntPoint";

/**
 * Interface for handling scroll behavior.
 * The DOM-based implementation creates real <div> overlays for scroll capture.
 * Without a handler, scrollable content simply clips at the element boundary.
 */
export interface ScrollHandler {
  /**
   * Called when the element's content or viewable size changes.
   * Implementation should decide whether to show/hide scroll UI.
   */
  update(config: ScrollUpdateConfig): void;

  /**
   * Returns the current scroll offset (typically negative Y for downward scroll).
   */
  getScrollOffset(): IntPoint;

  /**
   * Called when the element is unregistered / removed from the view.
   */
  destroy(): void;

  /**
   * Whether the scroll bar is currently visible.
   */
  isShowingScrollBar(): boolean;

  /**
   * Called when element position changes, to reposition the scroll overlay.
   */
  updatePosition(contentOffset: IntPoint, pixelOffset: IntPoint): void;

  /**
   * Called when element size changes.
   */
  updateSize(size: IntPoint): void;

  /**
   * Update the inner content height (for the scroll thumb size calculation).
   */
  updateContentSize(contentSize: IntPoint): void;
}

export interface ScrollUpdateConfig {
  contentSize: IntPoint;
  viewableSize: IntPoint;
  fullContentOffset: IntPoint;
  pixelOffset: IntPoint;
  onScrollChange: (scrollOffset: IntPoint) => void;
  onReprocessNeeded: () => void;
}
