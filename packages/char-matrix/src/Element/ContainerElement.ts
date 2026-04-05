import { Axis, X, Y } from "../types/Axes";
import { IntPoint } from "../types/IntPoint";
import { Element, ElementConfig } from "./Element";

export type Alignment = "start" | "end" | "center";

export interface ContainerElementConfig extends ElementConfig {
  mainAxis: Axis;
  justifyContent?: Alignment; // spacing of elements along main axis
  alignItems?: Alignment; // spacing of element along secondary axis
  spacing?: number;
}

export class ContainerElement extends Element {
  private mainAxis: Axis = X;
  private secondaryAxis = Y;
  private justifyContent: Alignment = "start";
  private alignItems: Alignment = "start";

  constructor(config: ContainerElementConfig) {
    super(config);
    this.mainAxis = config.mainAxis;
    this.secondaryAxis = this.mainAxis === X ? Y : X;
    this.justifyContent = config.justifyContent || "start";
    this.alignItems = config.alignItems || "start";
    this.stage = "queued";

    this.spacing = config.spacing || 0;
  }

  /**
   * Batch-update all container config fields, then reprocess once.
   */
  public updateContainerConfig(partial: Partial<ContainerElementConfig>): void {
    this.updateCommonConfig(partial);

    // Container-specific fields
    if (partial.mainAxis !== undefined) {
      this.mainAxis = partial.mainAxis;
      this.secondaryAxis = this.mainAxis === X ? Y : X;
    }
    if (partial.justifyContent !== undefined) {
      this.justifyContent = partial.justifyContent;
    }
    if (partial.alignItems !== undefined) {
      this.alignItems = partial.alignItems;
    }
    if (partial.spacing !== undefined) {
      this.spacing = partial.spacing;
    }

    // Single reprocess + redraw
    this.reprocessContent();
    this.flagForRedraw();
  }

  protected reprocessContent() {
    const ma = this.mainAxis; // main axis
    const sa = this.secondaryAxis; // secondary axis
    const flowChildren = this.flowChildren;

    const size = this.calculateSize(flowChildren);

    const totalBoundary = this.getTotalBoundarySize();
    const innerSizeM = size.get(ma) - totalBoundary.get(ma);
    const innerSizeS = size.get(sa) - totalBoundary.get(sa);

    const contentOffset = this.getContentOffset();
    const globalOffsetS = contentOffset.get(sa);
    let offsetM = contentOffset.get(ma);
    const minContentSizeM = this.calculateMinContentSizeM(flowChildren);

    if (this.justifyContent !== "start" && minContentSizeM < innerSizeM) {
      if (this.justifyContent === "center") {
        offsetM += (innerSizeM - minContentSizeM) / 2;
      } else if (this.justifyContent === "end") {
        offsetM += innerSizeM - minContentSizeM;
      }
    }

    // Only layout flow children
    flowChildren.forEach((e) => {
      let offsetS = globalOffsetS;

      const eSizeM = e.getSize().get(ma);
      const eSizeS = e.getSize().get(sa);

      // calculate secondary offset
      if (eSizeS < innerSizeS) {
        if (this.alignItems === "center") {
          offsetS += (innerSizeS - eSizeS) / 2;
        } else if (this.alignItems === "end") {
          offsetS += innerSizeS - eSizeS;
        }
      }

      const eOffset = new IntPoint();
      eOffset.set(ma, offsetM);
      eOffset.set(sa, offsetS);

      e.setPosition(eOffset);

      offsetM += eSizeM + this.spacing;
    });

    // Absolute children keep their offset as-is (set via xOffset/yOffset)

    this.flagForRedraw();
    this.setSize(size);
    this.contentSize = this.calculateContentSize(flowChildren);

    this.updateScrollShowing();
  }

  protected drawOwnContent(): void {}
  protected handleClick(): void {}
  protected handleMouseEnter(): void {}
  protected handleMouseLeave(): void {}
  protected handleUnregisterWithView(): void {}
  protected handleTransitionStart(): void {}

  private calculateContentSize(flowChildren: Element[]) {
    const size = new IntPoint();
    size.set(this.mainAxis, this.calculateMinContentSizeM(flowChildren));
    size.set(this.secondaryAxis, this.calculateMinContentSizeS(flowChildren));
    return size;
  }

  private calculateSize(flowChildren: Element[]) {
    const size = this.getSize().copy();
    const boundarySize = this.getTotalBoundarySize();
    if (this.sizingMethod[this.mainAxis] === "content") {
      size.set(
        this.mainAxis,
        boundarySize.get(this.mainAxis) + this.calculateMinContentSizeM(flowChildren)
      );
    }
    if (this.sizingMethod[this.secondaryAxis] === "content") {
      size.set(
        this.secondaryAxis,
        boundarySize.get(this.secondaryAxis) + this.calculateMinContentSizeS(flowChildren)
      );
    }
    return size;
  }

  private calculateMinContentSizeS(flowChildren: Element[]) {
    let minSize = 0;
    for (const e of flowChildren) {
      const eSize = e.getSize().get(this.secondaryAxis);
      if (eSize > minSize) {
        minSize = eSize;
      }
    }
    return minSize;
  }

  private calculateMinContentSizeM(flowChildren: Element[]) {
    let minSize = 0;
    for (const e of flowChildren) {
      minSize += e.getSize().get(this.mainAxis);
    }
    minSize += Math.max(0, flowChildren.length - 1) * this.spacing;
    return minSize;
  }
}
