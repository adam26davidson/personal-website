import {
  FONT_SIZE,
  IntPoint,
  Y,
  charsToPixelsX,
  charsToPixelsY,
} from "char-matrix";
import type { ScrollHandler, ScrollUpdateConfig } from "char-matrix";
import _ from "lodash";

export class DOMScrollHandler implements ScrollHandler {
  private scrollDiv: HTMLDivElement | null = null;
  private innerScrollDiv: HTMLDivElement | null = null;
  private scrollOffset: IntPoint = new IntPoint(0, 0);
  private showingScrollBar: boolean = false;
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  isShowingScrollBar(): boolean {
    return this.showingScrollBar;
  }

  getScrollOffset(): IntPoint {
    return this.scrollOffset;
  }

  updatePosition(contentOffset: IntPoint, pixelOffset: IntPoint): void {
    if (this.scrollDiv) {
      this.scrollDiv.style.top = `${
        charsToPixelsY(contentOffset.getY()) + pixelOffset.getY()
      }px`;
      this.scrollDiv.style.left = `${
        charsToPixelsX(contentOffset.getX()) + pixelOffset.getX()
      }px`;
    }
  }

  updateSize(size: IntPoint): void {
    if (this.scrollDiv) {
      this.scrollDiv.style.height = `${charsToPixelsY(size.getY())}px`;
      this.scrollDiv.style.width = `${charsToPixelsX(size.getX())}px`;
    }
  }

  updateContentSize(contentSize: IntPoint): void {
    if (this.innerScrollDiv) {
      this.innerScrollDiv.style.height = `${charsToPixelsY(
        contentSize.getY()
      )}px`;
    }
  }

  update(config: ScrollUpdateConfig): void {
    this.updateContentSize(config.contentSize);

    const needsScroll =
      config.contentSize.getY() > config.viewableSize.getY();

    if (!this.showingScrollBar && needsScroll) {
      this.showingScrollBar = true;
      this.createScrollDiv(config);
      config.onReprocessNeeded();
    } else if (this.showingScrollBar && !needsScroll) {
      this.showingScrollBar = false;
      config.onReprocessNeeded();
      this.removeScrollDiv();
    }
  }

  destroy(): void {
    this.removeScrollDiv();
    this.showingScrollBar = false;
  }

  private createScrollDiv(config: ScrollUpdateConfig): void {
    this.scrollDiv = document.createElement("div");
    this.scrollDiv.style.overflowY = "scroll";
    this.scrollDiv.className = "hidden-scrollbar";

    Object.assign(this.scrollDiv.style, {
      position: "absolute",
      top: `${
        charsToPixelsY(config.fullContentOffset.getY()) +
        config.pixelOffset.getY()
      }px`,
      left: `${
        charsToPixelsX(config.fullContentOffset.getX()) +
        config.pixelOffset.getX()
      }px`,
      width: `${charsToPixelsX(config.viewableSize.getX())}px`,
      height: `${charsToPixelsY(config.viewableSize.getY())}px`,
      margin: "0",
      padding: "0",
      border: "0",
      pointerEvents: "auto",
      backgroundColor: "transparent",
      zIndex: "1000",
    });

    this.innerScrollDiv = document.createElement("div");
    this.innerScrollDiv.style.width = "100%";
    this.innerScrollDiv.style.height = `${charsToPixelsY(
      config.contentSize.getY()
    )}px`;
    this.scrollDiv.appendChild(this.innerScrollDiv);

    this.scrollDiv.addEventListener(
      "scroll",
      _.throttle(() => {
        this.scrollOffset.set(
          Y,
          (-1 * this.scrollDiv!.scrollTop) / FONT_SIZE
        );
        config.onScrollChange(this.scrollOffset);
      }, 20)
    );

    console.log("--------appending scroll div", this.key);
    document.body.appendChild(this.scrollDiv);
  }

  private removeScrollDiv(): void {
    if (this.scrollDiv) {
      console.log("--------removing scroll div", this.key);
      this.scrollDiv.remove();
      this.scrollDiv = null;
      this.innerScrollDiv = null;
    }
  }
}
