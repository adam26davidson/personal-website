import { AXES, X, Y } from "../types/Axes";
import { IntPoint } from "../types/IntPoint";
import { NormPoint } from "../types/NormPoint";
import { ParentElement } from "./ParentElement";
import { RenderTarget } from "../interfaces/RenderTarget";

export type CursorType = "pointer" | "text" | "default";
export type SizingMethod = "absolute" | "relative" | "expand" | "content";
export type ElementStage =
  | "queued"
  | "entering"
  | "main"
  | "exiting"
  | "exited";

export interface ElementConfig {
  key: string;
  view: RenderTarget;
  width?: number;
  widthType?: SizingMethod;
  height?: number;
  heightType?: SizingMethod;
  scrollable?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingX?: number;
  paddingY?: number;
  padding?: number;
  bordered?: boolean;
  backgroundChar?: string;
  cursor?: CursorType;
  xOffset?: number;
  yOffset?: number;
  animationHandler?: import("../interfaces/ElementAnimationHandler").ElementAnimationHandler;
  entranceTiming?: "parallel" | "series";
  exitTiming?: "parallel" | "series";
}

export abstract class ElementBase extends ParentElement {
  protected abstract reprocessContent(): void;

  protected key: string;
  protected view: RenderTarget;
  protected parent: ParentElement | null;

  protected relativeSize: NormPoint;
  protected sizingMethod: { x: SizingMethod; y: SizingMethod };
  protected size: IntPoint = new IntPoint(0, 0);
  protected offset: IntPoint = new IntPoint(0, 0);
  protected contentSize: IntPoint = new IntPoint(0, 0);
  protected stage: ElementStage = "queued";

  constructor(config: ElementConfig) {
    super();
    this.key = config.key;
    this.view = config.view;
    this.parent = null;

    this.offset = new IntPoint(config.xOffset || 0, config.yOffset || 0);

    this.sizingMethod = {
      x: config.widthType || (config.width ? "absolute" : "content"),
      y: config.heightType || (config.height ? "absolute" : "content"),
    };

    for (const a of AXES) {
      if (this.sizingMethod[a] === "absolute") {
        this.size.set(a, config[a === X ? "width" : "height"] || 0);
      }
    }

    this.relativeSize = new NormPoint(config.width || 1, config.height || 1);
  }

  // getters
  public getSize = () => this.size;
  public getRelativeSize = () => this.relativeSize;
  public getOffset = () => this.offset;
  public getKey = () => this.key;
  public getStage = () => this.stage;
  public getSizingMethod = () => this.sizingMethod;
  public getParent = () => this.parent;

  // setters
  public setPosition(p: IntPoint): void {
    this.offset = p;
  }

  public setParent(parent: ParentElement) {
    this.parent = parent;
  }

  public setSize(size: IntPoint) {
    if (this.size.equals(size)) {
      return;
    }
    const oldSize = this.size.copy();
    this.size = size;

    let axis: import("../types/Axes").Axis | null = null;
    if (
      oldSize.getX() !== this.size.getX() &&
      oldSize.getY() !== this.size.getY()
    ) {
      axis = null;
    } else if (oldSize.getX() !== this.size.getX()) {
      axis = X;
    } else if (oldSize.getY() !== this.size.getY()) {
      axis = Y;
    }

    this.onSizeChanged(oldSize, this.size);
    this.reprocessContent();

    if (this.parent) {
      this.parent.handleChildResize(axis);
    }

    this.resizeChildren();
  }

  protected enforceNonCircularSizing() {
    AXES.forEach((a) => {
      if (
        this.parent &&
        this.sizingMethod[a] === "relative" &&
        this.parent.getSizingMethod()[a] === "content"
      ) {
        console.error(
          "Cannot have relative size child of a content size parent"
        );
        this.sizingMethod[a] = "content";
      }
    });
  }

  /**
   * Hook for subclasses to respond to size changes (e.g., update scroll div)
   */
  protected onSizeChanged(_oldSize: IntPoint, _newSize: IntPoint): void {}
}
