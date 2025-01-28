import { Axis, X, Y } from "../UtilityTypes/Axes";
import { IntPoint } from "../UtilityTypes/IntPoint";
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
  private spacing: number = 0;

  constructor(config: ContainerElementConfig) {
    super(config);
    this.mainAxis = config.mainAxis;
    this.secondaryAxis = this.mainAxis === X ? Y : X;
    this.justifyContent = config.justifyContent || "start";
    this.alignItems = config.alignItems || "start";
    this.stage = "queued";

    this.spacing = config.spacing || 0;
  }

  protected reprocessContent() {
    console.log("reprocessing content for container element", this.key);
    const ma = this.mainAxis; // main axis
    const sa = this.secondaryAxis; // secondary axis
    const size = this.calculateSize();
    console.log("calculated size", size, "for", this.key);

    const totalBoundary = this.getTotalBoundarySize();
    const innerSizeM = size.get(ma) - totalBoundary.get(ma);
    const innerSizeS = size.get(sa) - totalBoundary.get(sa);

    const contentOffset = this.getContentOffset();
    const globalOffsetS = contentOffset.get(sa);
    let offsetM = contentOffset.get(ma);
    const minContentSizeM = this.calculateMinContentSizeM();

    if (this.justifyContent !== "start" && minContentSizeM < innerSizeM) {
      if (this.justifyContent === "center") {
        offsetM += (innerSizeM - minContentSizeM) / 2;
      } else if (this.justifyContent === "end") {
        offsetM += innerSizeM - minContentSizeM;
      }
    }

    this.children.forEach((e) => {
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

      console.log("setting position", eOffset, "for", e.getKey());
      e.setPosition(eOffset);

      offsetM += eSizeM + this.spacing;
    });

    this.flagForRedraw();
    this.setSize(size);
    this.contentSize = this.calculateContentSize();

    this.updateScrollShowing();
  }

  protected drawOwnContent(): void {}
  protected handleClick(): void {}
  protected handleMouseEnter(): void {}
  protected handleMouseLeave(): void {}

  private calculateContentSize() {
    const size = new IntPoint();
    size.set(this.mainAxis, this.calculateMinContentSizeM());
    size.set(this.secondaryAxis, this.calculateMinContentSizeS());
    return size;
  }

  private calculateSize() {
    const size = this.getSize().copy();
    //console.log("size in calculateSize", size, "for", this.key);
    const boundarySize = this.getTotalBoundarySize();
    //console.log("boundary size", boundarySize);
    if (this.sizingMethod[this.mainAxis] === "content") {
      size.set(
        this.mainAxis,
        boundarySize.get(this.mainAxis) + this.calculateMinContentSizeM()
      );
    }
    if (this.sizingMethod[this.secondaryAxis] === "content") {
      size.set(
        this.secondaryAxis,
        boundarySize.get(this.secondaryAxis) + this.calculateMinContentSizeS()
      );
    }
    return size;
  }

  private calculateMinContentSizeS() {
    let minSize = 0;
    this.children.forEach((e) => {
      const eSize = e.getSize().get(this.secondaryAxis);
      if (eSize > minSize) {
        minSize = eSize;
      }
    });
    return minSize;
  }

  private calculateMinContentSizeM() {
    let minSize = 0;
    this.children.forEach((e) => {
      minSize += e.getSize().get(this.mainAxis);
    });
    minSize += (this.children.length - 1) * this.spacing;
    return minSize;
  }
}
