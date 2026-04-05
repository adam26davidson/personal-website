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

export type PositionMode = "flow" | "absolute";

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
  /** Draw priority. Higher values render on top of lower values. Default: 0 */
  zIndex?: number;
  /** Positioning mode. "flow" (default) participates in parent layout; "absolute" is positioned freely via xOffset/yOffset. */
  position?: PositionMode;
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
  protected zIndex: number;
  protected positionMode: PositionMode;

  constructor(config: ElementConfig) {
    super();
    this.key = config.key;
    this.view = config.view;
    this.parent = null;
    this.zIndex = config.zIndex ?? 0;
    this.positionMode = config.position ?? "flow";

    this.offset = new IntPoint(config.xOffset || 0, config.yOffset || 0);

    this.sizingMethod = {
      x: ElementBase.resolveSizingMethod(config.widthType, config.width),
      y: ElementBase.resolveSizingMethod(config.heightType, config.height),
    };

    for (const a of AXES) {
      if (this.sizingMethod[a] === "absolute") {
        this.size.set(a, config[a === X ? "width" : "height"] || 0);
      }
    }

    this.relativeSize = new NormPoint(config.width || 1, config.height || 1);
  }

  /**
   * Resolve a sizing method from an explicit type and/or a dimension value.
   * Shared by the constructor and updateBaseConfig to keep inference consistent.
   */
  private static resolveSizingMethod(
    explicitType: SizingMethod | undefined,
    value: number | undefined
  ): SizingMethod {
    if (explicitType !== undefined) return explicitType;
    if (value !== undefined) return "absolute";
    return "content";
  }

  // getters
  public getSize = () => this.size;
  public getRelativeSize = () => this.relativeSize;
  public getOffset = () => this.offset;
  public getKey = () => this.key;
  public getStage = () => this.stage;
  public getZIndex = () => this.zIndex;
  public getSizingMethod = () => this.sizingMethod;
  public getParent = () => this.parent;
  public getPositionMode = () => this.positionMode;

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
    this.size = size.copy();

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

  /**
   * Update base config fields. Does NOT call reprocessContent() — the caller
   * is expected to batch all updates and call reprocessContent() once at the end.
   */
  public updateBaseConfig(partial: Partial<ElementConfig>): void {
    if (partial.xOffset !== undefined || partial.yOffset !== undefined) {
      this.offset = new IntPoint(
        partial.xOffset ?? this.offset.getX(),
        partial.yOffset ?? this.offset.getY()
      );
    }

    if (partial.zIndex !== undefined) {
      this.zIndex = partial.zIndex;
    }
    if (partial.position !== undefined) {
      this.positionMode = partial.position;
    }

    // Update sizing method and size/relativeSize
    this.updateSizingAxis(
      "x", X, partial.widthType, partial.width,
      (v) => new NormPoint(v, this.relativeSize.get(Y))
    );
    this.updateSizingAxis(
      "y", Y, partial.heightType, partial.height,
      (v) => new NormPoint(this.relativeSize.get(X), v)
    );
  }

  private updateSizingAxis(
    axisKey: "x" | "y",
    axis: import("../types/Axes").Axis,
    explicitType: SizingMethod | undefined,
    value: number | undefined,
    makeRelativeSize: (v: number) => NormPoint
  ): void {
    if (explicitType === undefined && value === undefined) return;

    // When explicitType is provided, use it directly. Otherwise infer from value.
    this.sizingMethod[axisKey] = ElementBase.resolveSizingMethod(
      explicitType,
      explicitType !== undefined ? undefined : value
    );

    if (value !== undefined) {
      if (this.sizingMethod[axisKey] === "absolute") {
        this.size.set(axis, value);
      }
      if (this.sizingMethod[axisKey] === "relative") {
        this.relativeSize = makeRelativeSize(value);
      }
    }
  }
}
