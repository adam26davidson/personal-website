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

  public getAnimationHandler(): ElementAnimationHandler | null {
    return this.animationHandler;
  }

  public handleMouseMove(p: RealPoint): boolean {
    let determiningMouse = false;
    if (this.stage === "main" || this.stage === "entering") {
      const pointIsInside = this.pointIsInside(p);
      if (pointIsInside || this.mouseIsInside) {
        let childrenDeterminingMouse = false;
        this.children.forEach((c) => {
          const childIsDeterminingMouse = c.handleMouseMove(
            p.subtract(c.getOffset())
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
          if (document.body.style.cursor !== this.cursor) {
            document.body.style.cursor = this.cursor;
          }
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
      this.onclick && this.onclick();
      this.handleClick();
      this.children.forEach((c) =>
        c.handleMouseDown(p.subtract(c.getOffset()))
      );
    }
  }

  private pointIsInside(p: RealPoint): boolean {
    return AXES.every((a) => p[a] >= 0 && p[a] < this.size[a]);
  }
}
