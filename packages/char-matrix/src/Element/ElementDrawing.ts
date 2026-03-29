import { Y } from "../types/Axes";
import { IntPoint, ZERO_POINT } from "../types/IntPoint";
import { ElementLayout } from "./ElementLayout";
import { ElementConfig } from "./ElementBase";
import { ScrollHandler } from "../interfaces/ScrollHandler";
import { ElementAnimationHandler } from "../interfaces/ElementAnimationHandler";

export abstract class ElementDrawing extends ElementLayout {
  protected scrollOffset: IntPoint = new IntPoint(0, 0);
  protected fullContentOffset: IntPoint = new IntPoint(0, 0);
  protected mustRedraw: boolean = true;
  protected scrollHandler: ScrollHandler | null = null;
  protected animationHandler: ElementAnimationHandler | null = null;

  constructor(config: ElementConfig) {
    super(config);
    this.scrollable = config.scrollable || false;
    this.scrollHandler = config.scrollHandler || null;
  }

  public getScrollOffset = () => this.scrollOffset;

  protected drawChar(char: string, p: IntPoint, o: IntPoint = ZERO_POINT) {
    this.view.setContentLayerChar(char, p, o);
    // Also write to animation layer if no animation is active.
    // When an animation IS active, the animation handler manages the animation layer.
    const hasAnimation = this.animationHandler?.hasActiveAnimation() ?? false;
    if (!hasAnimation && this.stage !== "queued") {
      this.view.setAnimationLayerChar(char, p, o);
    }
  }


  public draw(offset: IntPoint): void {
    const fullOffset = offset.add(this.scrollOffset);
    const fullContentOffset = offset.add(this.getContentOffset());

    if (!fullContentOffset.equals(this.fullContentOffset)) {
      this.fullContentOffset = fullContentOffset;
      this.scrollHandler?.updatePosition(
        this.fullContentOffset,
        this.view.getPixelOffset()
      );
    }

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
    if (!this.scrollHandler?.isShowingScrollBar()) return;
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

  protected updateScrollShowing() {
    if (!this.scrollHandler) return;

    this.scrollHandler.updateContentSize(this.contentSize);

    const contentAreaSize = this.size.subtract(this.getTotalBoundarySize());
    this.scrollHandler.update({
      contentSize: this.contentSize,
      viewableSize: contentAreaSize,
      fullContentOffset: this.fullContentOffset,
      pixelOffset: this.view.getPixelOffset(),
      onScrollChange: (offset) => {
        this.scrollOffset = offset;
        this.flagForRedraw();
      },
      onReprocessNeeded: () => {
        this.reprocessContent();
      },
    });

    // Sync the showingScrollBar flag for boundary size calculation
    this.showingScrollBar = this.scrollHandler.isShowingScrollBar();
  }

  protected destroyScrollHandler(): void {
    this.scrollHandler?.destroy();
    this.showingScrollBar = false;
  }

  protected override onSizeChanged(_oldSize: IntPoint, _newSize: IntPoint): void {
    this.scrollHandler?.updateSize(this.size);
  }
}
