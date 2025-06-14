import { ComponentType } from "react";
import { charsToPixelsX, charsToPixelsY } from "../Utilities/MiscUtils";
import { ReactComponentType } from "../UtilityTypes/ReactNodeConfig";
import { Element, ElementConfig } from "./Element";

export interface ReactComponentElementConfig extends ElementConfig {
  type: ReactComponentType;
  content?: ComponentType;
}

export class ReactComponentElement extends Element {
  private type: ReactComponentType;
  private content?: ComponentType;

  constructor(config: ReactComponentElementConfig) {
    super(config);
    this.type = config.type;
    this.content = config.content;
    console.log(
      "configuring react component element",
      this.key,
      "of type",
      this.type
    );
  }

  public drawOwnContent() {
    const viewOffset = this.view.getPixelOffset();

    const contentSize = this.getSize().subtract(this.getTotalBoundarySize());

    if (!this.ancestorIsTransitioning("entering")) {
      this.view.updateReactNodeConfig(this.key, {
        key: this.key,
        type: this.type,
        height: charsToPixelsY(contentSize.getY()),
        width: charsToPixelsX(contentSize.getX()),
        top: charsToPixelsY(this.fullContentOffset.getY()) + viewOffset.getY(),
        left: charsToPixelsX(this.fullContentOffset.getX()) + viewOffset.getX(),
        content: this.content,
      });
    }
  }

  protected handleUnregisterWithView() {
    this.view.removeReactNodeConfig(this.key);
  }

  protected handleTransitionStart(type: "enter" | "exit"): void {
    if (type === "exit") {
      this.view.removeReactNodeConfig(this.key);
    }
  }

  protected reprocessContent(): void {}
  protected handleMouseEnter(): void {}
  protected handleMouseLeave(): void {}
  protected handleClick(): void {}

  private ancestorIsTransitioning(type: "entering" | "exiting") {
    let ancestor = this.getParent();
    while (ancestor) {
      if (ancestor.getStage() === type) {
        return true;
      }
      ancestor = ancestor.getParent();
    }
    return false;
  }
}
