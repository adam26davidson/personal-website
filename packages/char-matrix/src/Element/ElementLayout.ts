import { DEFAULT_BACKGROUND_CHAR } from "../constants";
import { Axis, X } from "../types/Axes";
import { IntPoint } from "../types/IntPoint";
import { ElementBase, ElementConfig } from "./ElementBase";

export abstract class ElementLayout extends ElementBase {
  protected padding: {
    start: IntPoint;
    end: IntPoint;
  };
  protected bordered: boolean;
  protected backgroundChar: string;

  constructor(config: ElementConfig) {
    super(config);
    this.bordered = config.bordered || false;
    this.backgroundChar = config.backgroundChar || DEFAULT_BACKGROUND_CHAR;

    this.padding = {
      start: new IntPoint(
        config.paddingLeft || config.paddingX || config.padding || 0,
        config.paddingTop || config.paddingY || config.padding || 0
      ),
      end: new IntPoint(
        config.paddingRight || config.paddingX || config.padding || 0,
        config.paddingBottom || config.paddingY || config.padding || 0
      ),
    };
  }

  public getHasBorder = () => this.bordered;
  public getBackgroundChar = () => this.backgroundChar;

  public getContentEndOffset(): IntPoint {
    return this.size.subtract(this.padding.end);
  }

  public getContentAreaSize(): IntPoint {
    return this.size.subtract(this.getTotalBoundarySize());
  }

  public getTotalBoundarySize() {
    const b = this.bordered ? 2 : 0;
    const withPadding = this.padding.start
      .add(this.padding.end)
      .add(new IntPoint(b, b));
    if (this.showingScrollBar) withPadding.set(X, withPadding.getX() + 1);
    return withPadding;
  }

  public getContentOffset() {
    const b = this.bordered ? 1 : 0;
    return this.padding.start.add(new IntPoint(b, b));
  }

  // --- Scroll state (managed here for boundary size calculation, DOM logic elsewhere) ---
  protected scrollable: boolean = false;
  protected showingScrollBar: boolean = false;

  // --- Iteration helpers ---

  // p is measured from the top left of content area
  protected forEachVisiblePointInContentArea(fn: (p: IntPoint) => void) {
    if (!this.parent) return;
    const p0FromParentContent = this.offset
      .add(this.parent.getScrollOffset())
      .add(this.getContentOffset())
      .subtract(this.parent.getContentOffset());
    const parentContentAreaSize = this.parent.getContentAreaSize();
    const contentAreaSize = this.getContentAreaSize();
    for (let y = 0; y < contentAreaSize.getY(); y++) {
      if (
        y + p0FromParentContent.getY() < 0 ||
        y + p0FromParentContent.getY() >= parentContentAreaSize.getY()
      ) {
        continue;
      }
      for (let x = 0; x < contentAreaSize.getX(); x++) {
        if (
          x + p0FromParentContent.getX() < 0 ||
          x + p0FromParentContent.getX() >= parentContentAreaSize.getX()
        ) {
          continue;
        }
        fn(new IntPoint(x, y));
      }
    }
  }

  public forEachAlongAxisInContentArea(a: Axis, fn: (i: number) => void) {
    if (!this.parent) return;
    const p0 = this.offset
      .add(this.parent.getScrollOffset())
      .add(this.getContentOffset())
      .subtract(this.parent.getContentOffset());
    const parentContentEnd = this.parent.getContentAreaSize();
    const contentAreaSize = this.getContentAreaSize();
    for (
      let i = 0;
      i < contentAreaSize.get(a) &&
      i + p0.get(a) < parentContentEnd.get(a) &&
      i + p0.get(a) >= 0;
      i++
    ) {
      fn(i);
    }
  }

  // p is measured from the top left of element
  public forEachVisiblePoint(fn: (p: IntPoint) => void) {
    if (!this.parent) return;
    const p0 = this.offset
      .add(this.parent.getScrollOffset())
      .subtract(this.parent.getContentOffset());
    const parentContentAreaSize = this.parent.getContentAreaSize();
    for (
      let y = 0;
      y < this.size.getY() && y + p0.getY() < parentContentAreaSize.getY();
      y++
    ) {
      if (y + p0.getY() < 0) {
        continue;
      }
      for (
        let x = 0;
        x < this.size.getX() && x + p0.getX() < parentContentAreaSize.getX();
        x++
      ) {
        if (x + p0.getX() < 0) {
          continue;
        }
        fn(new IntPoint(x, y));
      }
    }
  }

  /**
   * Update layout config fields. Does NOT call reprocessContent().
   */
  public updateLayoutConfig(partial: Partial<ElementConfig>): void {
    if (partial.bordered !== undefined) {
      this.bordered = partial.bordered;
    }
    if (partial.backgroundChar !== undefined) {
      this.backgroundChar = partial.backgroundChar;
    }
    if (partial.scrollable !== undefined) {
      this.scrollable = partial.scrollable;
    }

    // Recalculate padding if any padding prop changed
    if (
      partial.padding !== undefined ||
      partial.paddingX !== undefined ||
      partial.paddingY !== undefined ||
      partial.paddingTop !== undefined ||
      partial.paddingBottom !== undefined ||
      partial.paddingLeft !== undefined ||
      partial.paddingRight !== undefined
    ) {
      this.padding = {
        start: new IntPoint(
          partial.paddingLeft ?? partial.paddingX ?? partial.padding ?? this.padding.start.getX(),
          partial.paddingTop ?? partial.paddingY ?? partial.padding ?? this.padding.start.getY()
        ),
        end: new IntPoint(
          partial.paddingRight ?? partial.paddingX ?? partial.padding ?? this.padding.end.getX(),
          partial.paddingBottom ?? partial.paddingY ?? partial.padding ?? this.padding.end.getY()
        ),
      };
    }
  }

  public forEachVisibleAlongAxis(a: Axis, fn: (i: number) => void) {
    if (!this.parent) return;
    const p0 = this.offset
      .add(this.parent.getScrollOffset())
      .subtract(this.parent.getContentOffset());
    const parentCASize = this.parent.getContentAreaSize();
    for (
      let i = 0;
      i < this.size.get(a) && i + p0.get(a) < parentCASize.get(a);
      i++
    ) {
      if (i + p0.get(a) < 0) {
        continue;
      }
      fn(i);
    }
  }
}
