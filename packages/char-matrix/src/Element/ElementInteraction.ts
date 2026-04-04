import { AXES } from "../types/Axes";
import { RealPoint } from "../types/RealPoint";
import { CursorType, ElementConfig } from "./ElementBase";
import { ElementDrawing } from "./ElementDrawing";
import { ElementAnimationHandler } from "../interfaces/ElementAnimationHandler";

export abstract class ElementInteraction extends ElementDrawing {
  protected abstract handleMouseEnter(): void;
  protected abstract handleMouseLeave(): void;
  protected abstract handleClick(): void;

  protected cursor: CursorType;
  protected onclick: (() => void) | null = null;
  protected mouseIsInside: boolean = false;

  constructor(config: ElementConfig) {
    super(config);
    this.cursor = config.cursor || "default";
  }

  public setOnClick(onClick: () => void): void {
    this.onclick = onClick;
  }

  /**
   * Update interaction config fields. Does NOT call reprocessContent().
   */
  public updateInteractionConfig(partial: Partial<ElementConfig>): void {
    if (partial.cursor !== undefined) {
      this.cursor = partial.cursor;
    }
  }

  public getAnimationHandler(): ElementAnimationHandler | null {
    return this.animationHandler;
  }

  public handleMouseMove(p: RealPoint): boolean {
    // Handle scrollbar drag
    if (this.isDraggingScrollbar) {
      this.updateScrollbarDrag(p.getY());
      return true;
    }

    let determiningMouse = false;
    if (this.stage === "main" || this.stage === "entering") {
      const pointIsInside = this.pointIsInside(p);
      if (pointIsInside || this.mouseIsInside) {
        let childrenDeterminingMouse = false;
        this.children.forEach((c) => {
          const childIsDeterminingMouse = c.handleMouseMove(
            p.subtract(c.getOffset()).subtract(this.scrollOffset)
          );
          if (childIsDeterminingMouse) {
            childrenDeterminingMouse = true;
            determiningMouse = true;
          }
        });
        if (!pointIsInside && this.stage !== "entering") {
          this.animationHandler?.startAnimation("mouseExit", () => {});
          this.mouseIsInside = false;
          this.handleMouseLeave();
        } else if (!this.mouseIsInside && this.stage !== "entering") {
          this.animationHandler?.startAnimation("mouseEnter", () => {});
          this.mouseIsInside = true;
          this.handleMouseEnter();
        }
        if (!childrenDeterminingMouse && pointIsInside) {
          this.view.setCursor(this.cursor);
          determiningMouse = true;
        }
      }
    }
    return determiningMouse;
  }

  public handleMouseDown(p: RealPoint): void {
    if (
      (this.stage === "main" || this.stage === "entering") &&
      this.pointIsInside(p)
    ) {
      // Check scrollbar thumb click before delegating to children
      if (this.scrollable && this.isPointOnScrollbarThumb(p.getX(), p.getY())) {
        this.startScrollbarDrag(p.getY());
        return;
      }

      this.onclick && this.onclick();
      this.handleClick();
      this.children.forEach((c) =>
        c.handleMouseDown(p.subtract(c.getOffset()).subtract(this.scrollOffset))
      );
    }
  }

  public handleMouseUp(p: RealPoint): void {
    if (this.isDraggingScrollbar) {
      this.stopScrollbarDrag();
    }
    this.children.forEach((c) =>
      c.handleMouseUp(p.subtract(c.getOffset()).subtract(this.scrollOffset))
    );
  }

  public handleWheel(p: RealPoint, delta: number): boolean {
    if (this.stage !== "main" && this.stage !== "entering") return false;
    if (!this.pointIsInside(p)) return false;

    // Try children first (innermost scrollable element wins)
    for (const child of this.children) {
      if (child.handleWheel(p.subtract(child.getOffset()).subtract(this.scrollOffset), delta)) {
        return true;
      }
    }

    // Handle locally if scrollable
    if (this.scrollable) {
      return this.applyScroll(delta);
    }

    return false;
  }

  private pointIsInside(p: RealPoint): boolean {
    return AXES.every((a) => p.get(a) >= 0 && p.get(a) < this.size.get(a));
  }
}
