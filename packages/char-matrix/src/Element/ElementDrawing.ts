import { Y } from "../types/Axes";
import { IntPoint, ZERO_POINT } from "../types/IntPoint";
import { ElementLayout } from "./ElementLayout";
import { ElementConfig } from "./ElementBase";
import { ElementAnimationHandler } from "../interfaces/ElementAnimationHandler";

export abstract class ElementDrawing extends ElementLayout {
  protected scrollOffset: IntPoint = new IntPoint(0, 0);
  protected fullContentOffset: IntPoint = new IntPoint(0, 0);
  protected mustRedraw: boolean = true;
  protected animationHandler: ElementAnimationHandler | null = null;

  constructor(config: ElementConfig) {
    super(config);
    this.scrollable = config.scrollable || false;
  }

  public getScrollOffset = () => this.scrollOffset;

  protected drawChar(char: string, p: IntPoint, o: IntPoint = ZERO_POINT) {
    this.view.setContentLayerChar(char, p, o);
    const hasAnimation = this.animationHandler?.hasActiveAnimation() ?? false;
    if (!hasAnimation && this.stage !== "queued") {
      this.view.setAnimationLayerChar(char, p, o);
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

  protected flagForRedraw() {
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
    const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta));

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
    const barHeight = (contentAreaHeight / contentHeight) * contentAreaHeight;
    const barOffset = (scrollOffset / contentHeight) * contentAreaHeight;
    const xOffset = contentAreaSize.getX() + this.padding.end.getX();
    this.forEachAlongAxisInContentArea(Y, (i) => {
      let char = "|";
      if (i >= barOffset && i < barOffset + barHeight) {
        char = "█";
      }
      const p = new IntPoint(xOffset, i);
      this.drawChar(char, p, fullOffset);
    });
  };

  protected override onSizeChanged(_oldSize: IntPoint, _newSize: IntPoint): void {}
}
