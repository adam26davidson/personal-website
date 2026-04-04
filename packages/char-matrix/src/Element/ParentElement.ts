import { SizingMethod, Element } from "./Element";
import { AXES, Axis } from "../types/Axes";
import { IntPoint } from "../types/IntPoint";

export abstract class ParentElement {
  protected children: Element[] = [];
  protected spacing: number = 0;

  abstract getSize(): IntPoint;
  abstract getParent(): ParentElement | null;
  abstract getScrollOffset(): IntPoint;
  abstract handleChildResize(axis: Axis | null): void;
  abstract getSizingMethod(): { x: SizingMethod; y: SizingMethod };
  abstract getIsOnView(): boolean;
  abstract getBackgroundChar(): string;
  abstract getTotalBoundarySize(): IntPoint;
  abstract getContentOffset(): IntPoint;
  abstract getContentEndOffset(): IntPoint;
  abstract getContentAreaSize(): IntPoint;
  abstract getStage(): string;

  private isResizingChildren = false;

  protected resizeChildren() {
    if (this.isResizingChildren) return;
    this.isResizingChildren = true;

    // Only flow children participate in relative/expand sizing calculations
    const flowChildren = this.children.filter(
      (c) => c.getPositionMode() === "flow"
    );

    const childSizes = flowChildren.map((c) => c.getSize().copy());
    const totalBoundarySize = this.getTotalBoundarySize();
    for (let i = 0; i < flowChildren.length; i++) {
      const child = flowChildren[i];
      const newSize = child.getSize().copy();
      for (const a of AXES) {
        if (child.getSizingMethod()[a] === "relative") {
          const contentSize = this.getSize().get(a) - totalBoundarySize.get(a);
          newSize.set(a, contentSize * child.getRelativeSize().get(a));
        }
      }
      childSizes[i] = newSize;
    }
    for (const a of AXES) {
      const numExpandingChildren = flowChildren.filter(
        (c) => c.getSizingMethod()[a] === "expand"
      ).length;
      const totalNonExpandingChildrenSize = flowChildren
        .filter((c) => c.getSizingMethod()[a] !== "expand")
        .reduce((acc, c) => acc + c.getSize().get(a), 0);
      const contentSize = this.getSize().get(a) - totalBoundarySize.get(a);
      const remainingSize =
        contentSize -
        (totalNonExpandingChildrenSize +
          this.spacing * (flowChildren.length - 1));
      const sizePerChild = Math.max(remainingSize / numExpandingChildren, 0);
      for (let i = 0; i < flowChildren.length; i++) {
        const c = flowChildren[i];
        if (c.getSizingMethod()[a] === "expand") {
          const newSize = c.getSize().copy();
          newSize.set(a, sizePerChild);
          childSizes[i].set(a, sizePerChild);
        }
      }
      flowChildren.forEach((c, i) => {
        c.setSize(childSizes[i]);
      });
    }

    this.isResizingChildren = false;
  }
}
