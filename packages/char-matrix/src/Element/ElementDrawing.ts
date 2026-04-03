import { Y } from "../types/Axes";
import { IntPoint, ZERO_POINT } from "../types/IntPoint";
import { ElementLayout } from "./ElementLayout";
import { ElementConfig } from "./ElementBase";
import { ElementAnimationHandler } from "../interfaces/ElementAnimationHandler";
import { octantChar, OCTANT_ROW, OCTANT_RIGHT } from "../utils/Octant";

export abstract class ElementDrawing extends ElementLayout {
  protected scrollOffset: IntPoint = new IntPoint(0, 0);
  protected fullContentOffset: IntPoint = new IntPoint(0, 0);
  protected mustRedraw: boolean = true;
  protected animationHandler: ElementAnimationHandler | null = null;

  // Scrollbar drag state
  protected isDraggingScrollbar: boolean = false;
  private dragStartY: number = 0;
  private dragStartScroll: number = 0;

  constructor(config: ElementConfig) {
    super(config);
    this.scrollable = config.scrollable || false;
  }

  public getScrollOffset = () => this.scrollOffset;

  protected drawChar(char: string, p: IntPoint, o: IntPoint = ZERO_POINT) {
    this.view.setContentLayerChar(char, p, o, this.zIndex);
    const hasAnimation = this.animationHandler?.hasActiveAnimation() ?? false;
    if (!hasAnimation && this.stage !== "queued") {
      this.view.setAnimationLayerChar(char, p, o, this.zIndex);
    }
  }

  public draw(offset: IntPoint): void {
    const fullOffset = offset.add(this.scrollOffset);
    const fullContentOffset = offset.add(this.getContentOffset());
    this.fullContentOffset = fullContentOffset;

    if (this.mustRedraw) {
      this.drawBackground(offset);
      this.drawVerticalScrollBar(offset);
      if (this.bordered) {
        this.drawBorder(offset);
      }
      this.drawOwnContent(fullOffset);
    }
    this.children.forEach((child) =>
      child.draw(fullOffset.add(child.getOffset()))
    );

    this.mustRedraw = false;
  }

  protected abstract drawOwnContent(offset: IntPoint): void;

  public flagForRedraw() {
    this.mustRedraw = true;
    this.children.forEach((child) => child.flagForRedraw());
  }

  /**
   * Apply a scroll delta (in character rows). Returns true if scroll was consumed.
   */
  protected applyScroll(delta: number): boolean {
    const contentAreaSize = this.size.subtract(this.getTotalBoundarySize());
    const maxScroll = Math.max(0, this.contentSize.getY() - contentAreaSize.getY());

    if (maxScroll === 0) return false;

    const currentScroll = -this.scrollOffset.getY();
    const newScroll = Math.round(Math.max(0, Math.min(maxScroll, currentScroll + delta)));

    if (newScroll === currentScroll) return false;

    this.scrollOffset.set(Y, -newScroll);
    this.showingScrollBar = maxScroll > 0;
    this.flagForRedraw();
    return true;
  }

  /**
   * Update showingScrollBar based on content vs viewable size.
   * Called from reprocessContent in subclasses.
   */
  protected updateScrollShowing() {
    if (!this.scrollable) return;
    const contentAreaSize = this.size.subtract(this.getTotalBoundarySize());
    this.showingScrollBar = this.contentSize.getY() > contentAreaSize.getY();
  }

  /** Check if a point (relative to element top-left) is on the scrollbar thumb */
  protected isPointOnScrollbarThumb(px: number, py: number): boolean {
    if (!this.showingScrollBar) return false;

    const contentOffset = this.getContentOffset();
    const boundarySize = this.getTotalBoundarySize();
    const contentAreaSize = this.size.subtract(boundarySize);
    const scrollbarX = contentOffset.getX() + contentAreaSize.getX() + this.padding.end.getX();

    if (Math.floor(px) !== scrollbarX) return false;

    const scrollOffset = -this.scrollOffset.getY();
    const contentAreaHeight = contentAreaSize.getY();
    const contentHeight = this.contentSize.getY();
    const subRows = contentAreaHeight * 4;
    const thumbSize = Math.max(4, Math.round((contentAreaHeight / contentHeight) * subRows));
    const thumbStart = Math.round((scrollOffset / contentHeight) * subRows);
    const thumbEnd = thumbStart + thumbSize;

    const subRow = (py - contentOffset.getY()) * 4;
    return subRow >= thumbStart && subRow < thumbEnd;
  }

  /** Start a scrollbar drag */
  protected startScrollbarDrag(mouseY: number): void {
    this.isDraggingScrollbar = true;
    this.dragStartY = mouseY;
    this.dragStartScroll = -this.scrollOffset.getY();
  }

  /** Update scroll position during drag */
  protected updateScrollbarDrag(mouseY: number): void {
    if (!this.isDraggingScrollbar) return;

    const boundarySize = this.getTotalBoundarySize();
    const contentAreaSize = this.size.subtract(boundarySize);
    const contentAreaHeight = contentAreaSize.getY();
    const contentHeight = this.contentSize.getY();

    // Mouse delta in characters → scroll delta in content rows
    const mouseDelta = mouseY - this.dragStartY;
    const scrollDelta = mouseDelta * (contentHeight / contentAreaHeight);
    const newScroll = Math.round(
      Math.max(0, Math.min(contentHeight - contentAreaHeight, this.dragStartScroll + scrollDelta))
    );

    if (newScroll !== -this.scrollOffset.getY()) {
      this.scrollOffset.set(Y, -newScroll);
      this.showingScrollBar = true;
      this.flagForRedraw();
    }
  }

  /** Stop scrollbar drag */
  protected stopScrollbarDrag(): void {
    this.isDraggingScrollbar = false;
  }

  private drawBackground(o: IntPoint): void {
    this.forEachVisiblePoint((p) => {
      this.drawChar(this.backgroundChar, p, o);
    });
  }

  private drawBorder(o: IntPoint): void {
    const lastPoint = this.size.add(new IntPoint(-1, -1));
    this.forEachVisiblePoint((p) => {
      let char = "│";
      if (p.equals(ZERO_POINT)) {
        char = "╭";
      } else if (p.equals(lastPoint)) {
        char = "╯";
      } else if (p.getX() === 0 && p.getY() === lastPoint.getY()) {
        char = "╰";
      } else if (p.getX() === lastPoint.getX() && p.getY() === 0) {
        char = "╮";
      } else if (p.getX() === 0 || p.getX() === lastPoint.getX()) {
        char = "│";
      } else if (p.getY() === 0 || p.getY() === lastPoint.getY()) {
        char = "─";
      } else {
        return;
      }
      this.drawChar(char, p, o);
    });
  }

  private drawVerticalScrollBar = (offset: IntPoint) => {
    if (!this.showingScrollBar) return;
    const fullOffset = offset.add(this.getContentOffset());
    const boundarySize = this.getTotalBoundarySize();
    const scrollOffset = -1 * this.scrollOffset.getY();
    const contentAreaSize = this.size.subtract(boundarySize);
    const contentAreaHeight = contentAreaSize.getY();
    const contentHeight = this.contentSize.getY();

    // 4 sub-rows per character cell
    const GAP = 1; // sub-rows of gap between thumb and track
    const subRows = contentAreaHeight * 4;
    const thumbSize = Math.max(4, Math.round((contentAreaHeight / contentHeight) * subRows));
    const thumbStart = Math.round((scrollOffset / contentHeight) * subRows);
    const thumbEnd = thumbStart + thumbSize;

    const xOffset = contentAreaSize.getX() + this.padding.end.getX();
    this.forEachAlongAxisInContentArea(Y, (i) => {
      let bits = 0;
      for (let r = 0; r < 4; r++) {
        const sub = i * 4 + r;
        if (sub >= thumbStart && sub < thumbEnd) {
          bits |= OCTANT_ROW[r];    // thumb: both columns
        } else if (sub < thumbStart - GAP || sub >= thumbEnd + GAP) {
          bits |= OCTANT_RIGHT[r];  // track: right column only
        }
        // else: gap — leave empty
      }
      const p = new IntPoint(xOffset, i);
      this.drawChar(octantChar(bits), p, fullOffset);
    });
  };

  protected override onSizeChanged(_oldSize: IntPoint, _newSize: IntPoint): void {}
}
