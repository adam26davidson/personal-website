import { DEFAULT_BACKGROUND_CHAR, FONT_SIZE } from "../constants";
import { AXES, Axis, X, Y } from "../UtilityTypes/Axes";
import { IntPoint, ZERO_POINT } from "../UtilityTypes/IntPoint";
import { NormPoint } from "../UtilityTypes/NormPoint";
import { Animation, AnimationConfig } from "./Animation";
import { TransitionSequence } from "./TransitionSequence";
import { ParentElement } from "./ParentElement";
import { RealPoint } from "../UtilityTypes/RealPoint";
import MatrixView from "../matrixView";
import _ from "lodash";
import { charsToPixelsX, charsToPixelsY } from "../Utilities/MiscUtils";

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
  view: MatrixView;
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
  xOffset?: number; // offset from parent
  yOffset?: number; // offset from parent
  entranceAnimationConfig?: AnimationConfig;
  mouseEnterAnimationConfig?: AnimationConfig;
  mouseExitAnimationConfig?: AnimationConfig;
  onClickAnimationConfig?: AnimationConfig;
  exitAnimationConfig?: AnimationConfig;
  entranceTiming?: "parallel" | "series";
  exitTiming?: "parallel" | "series";
}

export abstract class Element extends ParentElement {
  // abstract methods ---------------------------------------------------------

  /**
   * draws the content of the element to the content matrix - does not draw children
   * @param offset absolute offset of the element relative to the top left of the screen
   */
  protected abstract drawOwnContent(offset: IntPoint): void;

  /**
   * reprocesses the content of the element - is responsible for:
   * - setting the size of the element
   * - positioning children
   * - reprocessing own content such as text
   */
  protected abstract reprocessContent(): void;

  /**
   * for subclass handling of mouse enter
   */
  protected abstract handleMouseEnter(): void;

  /**
   * for subclass handling of mouse leave
   */
  protected abstract handleMouseLeave(): void;

  /**
   * for subclass handling of click on element
   */
  protected abstract handleClick(): void;

  /**
   * for subclass handling of unregistering with view
   */
  protected abstract handleUnregisterWithView(): void;

  /**
   *
   */
  protected abstract handleTransitionStart(type: "enter" | "exit"): void;

  // class properties ---------------------------------------------------------

  protected key: string;

  protected relativeSize: NormPoint;
  protected sizingMethod: { x: SizingMethod; y: SizingMethod };
  protected padding: {
    start: IntPoint;
    end: IntPoint;
  };
  protected bordered: boolean;
  protected backgroundChar: string;
  protected cursor: CursorType;
  protected scrollable: boolean = false;

  protected parent: ParentElement | null;
  protected view: MatrixView;

  protected onclick: (() => void) | null = null;

  protected entranceAnimationConfig: AnimationConfig | null = null;
  protected mouseEnterAnimationConfig: AnimationConfig | null = null;
  protected mouseExitAnimationConfig: AnimationConfig | null = null;
  protected onClickAnimationConfig: AnimationConfig | null = null;
  protected exitAnimationConfig: AnimationConfig | null = null;
  protected entranceSequenceTiming: "parallel" | "series" = "parallel";
  protected exitSequenceTiming: "parallel" | "series" = "parallel";
  protected entranceSequence: TransitionSequence;
  protected exitSequence: TransitionSequence;
  private onEnterFuncs: (() => void)[] = [
    () => {
      this.stage = "main";
      this.flagForRedraw();
    },
  ];
  private onExitFuncs: (() => void)[] = [
    () => {
      this.stage = "exited";
    },
  ];

  // state --------------------------------------------------------------------

  protected stage: ElementStage = "queued";
  protected isOnView: boolean = false;
  protected animation: Animation | null = null;
  protected offset: IntPoint = new IntPoint(0, 0); // offset from parent
  protected scrollOffset: IntPoint = new IntPoint(0, 0); // content scroll state
  protected fullContentOffset: IntPoint = new IntPoint(0, 0); // offset from parent content
  protected mouseIsInside: boolean = false;
  protected mustRedraw: boolean = true;
  protected size: IntPoint = new IntPoint(0, 0);
  protected contentSize: IntPoint = new IntPoint(0, 0);
  protected showingScrollBar: boolean = false;
  protected scrollDiv: HTMLDivElement | null = null;
  protected innerScrollDiv: HTMLDivElement | null = null;

  // constructor --------------------------------------------------------------

  constructor(config: ElementConfig) {
    super();
    //console.log("configuring element", config);
    this.key = config.key;
    this.view = config.view;

    this.parent = null;
    this.bordered = config.bordered || false;
    this.backgroundChar = config.backgroundChar || DEFAULT_BACKGROUND_CHAR;
    this.cursor = config.cursor || "default";
    this.scrollable = config.scrollable || false;

    this.offset = new IntPoint(config.xOffset || 0, config.yOffset || 0);

    this.sizingMethod = {
      x: config.widthType || (config.width ? "absolute" : "content"),
      y: config.heightType || (config.height ? "absolute" : "content"),
    };

    //console.log("sizing method", this.sizingMethod, "for", this.key);

    for (const a of AXES) {
      if (this.sizingMethod[a] === "absolute") {
        this.size.set(a, config[a === X ? "width" : "height"] || 0);
      }
    }

    this.relativeSize = new NormPoint(config.width || 1, config.height || 1);

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

    this.entranceAnimationConfig = config.entranceAnimationConfig || null;
    this.mouseEnterAnimationConfig = config.mouseEnterAnimationConfig || null;
    this.mouseExitAnimationConfig = config.mouseExitAnimationConfig || null;
    this.onClickAnimationConfig = config.onClickAnimationConfig || null;
    this.exitAnimationConfig = config.exitAnimationConfig || null;

    this.entranceSequenceTiming = config.entranceTiming || "parallel";
    this.exitSequenceTiming = config.exitTiming || "parallel";

    this.entranceSequence = new TransitionSequence(
      [],
      config.entranceTiming || "parallel",
      "enter"
    );
    this.entranceSequence.setonComplete(this.getOnEnter());

    this.exitSequence = new TransitionSequence(
      [],
      config.exitTiming || "parallel",
      "exit"
    );
    this.exitSequence.setonComplete(this.getOnExit());
  }

  // getters ------------------------------------------------------------------

  public getIsOnView = () => this.isOnView;
  public getSize = () => this.size;
  public getRelativeSize = () => this.relativeSize;
  public getOffset = () => this.offset;
  public getScrollOffset = () => this.scrollOffset;
  public getKey = () => this.key;
  public getStage = () => this.stage;
  public getHasBorder = () => this.bordered;
  public getSizingMethod = () => this.sizingMethod;
  public getBackgroundChar = () => this.backgroundChar;
  public getParent = () => this.parent;
  public getContentEndOffset(): IntPoint {
    return this.size.subtract(this.padding.end);
  }
  public getContentAreaSize(): IntPoint {
    return this.size.subtract(this.getTotalBoundarySize());
  }

  // setters ------------------------------------------------------------------

  /**
   * set an element's position relative to its parent
   * @param p new offset from parent
   */
  public setPosition(p: IntPoint): void {
    this.offset = p;
  }

  public setOnClick(onClick: () => void): void {
    this.onclick = onClick;
  }

  public setParent(parent: ParentElement) {
    this.parent = parent;
  }

  public setChildren(children: Element[]) {
    console.log("setting children", children, "for", this.key);
    this.children.forEach((child) => child.unregisterWithView());
    this.children = children;
    this.children.forEach((child) => {
      child.setParent(this);
      if (this.isOnView) {
        child.registerWithView();
      }
      child.enforceNonCircularSizing();
    });
    this.resizeChildren();
    this.reprocessContent();
    if (this.stage === "queued") {
      this.entranceSequence = new TransitionSequence(
        this.children,
        this.entranceSequenceTiming,
        "enter"
      );
      this.entranceSequence.setonComplete(this.getOnEnter());
    }
    if (this.stage !== "exiting" && this.stage !== "exited") {
      this.exitSequence = new TransitionSequence(
        this.children,
        this.exitSequenceTiming,
        "exit"
      );
      this.exitSequence.setonComplete(this.getOnExit());
    }
  }

  // handlers -----------------------------------------------------------------

  /**
   * handle a mouse move event
   * @param p point where the mouse is
   * @returns
   */
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
          this.startMouseExitAnimation();
          this.mouseIsInside = false;
          this.handleMouseLeave();
        } else if (!this.mouseIsInside && this.stage !== "entering") {
          this.startMouseEnterAnimation();
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

  /**
   * handle a child resizing
   */
  public handleChildResize() {
    this.resizeChildren();
    this.reprocessContent();
    this.flagForRedraw();
  }

  /**
   * prune all children that have exited recursively
   * reprocesses content and flags for redraw if any children have been pruned
   * does not prune children if the element is exiting
   */
  public pruneExitedChildren() {
    if (this.stage !== "exiting") {
      const newChildren = this.children.filter(
        (child) => child.getStage() !== "exited"
      );
      if (newChildren.length !== this.children.length) {
        const exitedChildren = this.children.filter(
          (child) => child.getStage() === "exited"
        );
        console.log("pruning exited children", exitedChildren);
        exitedChildren.forEach((child) => child.unregisterWithView());
        this.children = newChildren;
        this.reprocessContent();
        this.flagForRedraw();
      }
      for (const child of this.children) {
        child.pruneExitedChildren();
      }
    }
  }

  /**
   * register the element and all children with the view recursively
   */
  public registerWithView() {
    this.view.registerElement(this);
    this.isOnView = true;
    this.children.forEach((child) => child.registerWithView());
  }

  /**
   * unregister the element and all children with the view recursively
   */
  public unregisterWithView() {
    this.handleUnregisterWithView();
    this.view.unregisterElement(this);
    this.isOnView = false;
    console.log("unregistering element", this.key);
    this.scrollDiv?.remove();
    this.innerScrollDiv?.remove();
    this.scrollDiv = null;
    this.innerScrollDiv = null;
    this.showingScrollBar = false;
    this.children.forEach((child) => child.unregisterWithView());
  }

  // draw -------------------------------------------------------------------

  /**
   * draws the element and all children recursively
   * @param offset the offset of the element relative to the top left of the screen
   */
  public draw(offset: IntPoint): void {
    const fullOffset = offset.add(this.scrollOffset);
    const fullContentOffset = offset.add(this.getContentOffset());

    if (!fullContentOffset.equals(this.fullContentOffset)) {
      this.fullContentOffset = fullContentOffset;
      if (this.scrollDiv) {
        const viewOffset = this.view.getPixelOffset();
        this.scrollDiv.style.top = `${
          charsToPixelsY(this.fullContentOffset.getY()) + viewOffset.getY()
        }px`;
        this.scrollDiv.style.left = `${
          charsToPixelsX(this.fullContentOffset.getX()) + viewOffset.getX()
        }px`;
      }
    }

    if (this.mustRedraw) {
      //console.log("drawing element", this.key, "at offset", offset);
      this.drawBackground(offset);
      this.drawVerticalScrollBar(offset);
      if (this.bordered) {
        this.drawBorder(offset);
      }
      this.drawOwnContent(fullOffset);
    }
    this.children.forEach((child) =>
      child.draw(fullOffset.add(child.getOffset()))
    );

    this.mustRedraw = false;
  }

  // runAnimationStep --------------------------------------------------------

  /**
   * runs the animation step for the element and all children recursively
   * @param offset the offset of the element relative to the top left of the screen
   */
  public runAnimationStep(offset: IntPoint): void {
    const fullOffset = offset.add(this.scrollOffset);
    if (this.animation) {
      if (this.animation.runStep(fullOffset)) {
        this.animation = null;
      }
    }
    this.children.forEach((child) =>
      child.runAnimationStep(fullOffset.add(child.getOffset()))
    );
  }

  // other public methods -----------------------------------------------------

  /**
   * adds a function after the entrance or exit animation is complete
   * @param type whether to add a function to be called on enter or exit
   * @param func the function to call
   */
  public addOnTransition(type: "enter" | "exit", func: () => void) {
    const funcs = type === "enter" ? this.onEnterFuncs : this.onExitFuncs;
    const config =
      type === "enter"
        ? this.entranceAnimationConfig
        : this.exitAnimationConfig;
    const stage = type === "enter" ? "entering" : "exiting";
    funcs.push(func);
    if (this.stage === stage && config && this.animation) {
      this.animation.setOnComplete(this.getOnTransitionFunction(type));
    }
  }

  /**
   * start exit or entrance of the element
   * @param type whether the element is entering or exiting
   * @param onComplete function to call when the transition is complete
   */
  public startTransition(
    type: "enter" | "exit",
    onComplete: () => void = () => {}
  ) {
    console.log("starting transition", type, "for", this.key);
    this.handleTransitionStart(type);
    this.addOnTransition(type, onComplete);
    this.stage = type === "enter" ? "entering" : "exiting";
    const config =
      type === "enter"
        ? this.entranceAnimationConfig
        : this.exitAnimationConfig;
    const sequence =
      type === "enter" ? this.entranceSequence : this.exitSequence;
    const onTransition = this.getOnTransitionFunction(type);
    if (config) {
      this.animation = Animation.createAnimation(
        this,
        this.view,
        config,
        onTransition
      );
    } else {
      onTransition();
    }
    sequence.setonComplete(onTransition);
    sequence.startSequence();
  }

  /**
   * get thee total boundary size along each axis, including start + end
   * for padding and border
   * @returns total boundary size
   */
  public getTotalBoundarySize() {
    const b = this.bordered ? 2 : 0;
    const withPadding = this.padding.start
      .add(this.padding.end)
      .add(new IntPoint(b, b));
    if (this.showingScrollBar) withPadding.set(X, withPadding.getX() + 1);
    return withPadding;
  }

  /**
   * set the size of the element.
   * should be called from reprocessContent()
   * calls parent / child handlers for child / parent resize, IF the dimmension has changed
   * @param size new element size
   */
  public setSize(size: IntPoint) {
    if (this.size.equals(size)) {
      return;
    }
    console.log("setting size", size, "for", this.key);

    const oldSize = this.size.copy();
    this.size = size;

    let axis: Axis | null = null;
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

    if (this.scrollDiv) {
      this.scrollDiv.style.height = `${charsToPixelsY(this.size.getY())}px`;
      this.scrollDiv.style.width = `${charsToPixelsX(this.size.getX())}px`;
    }

    this.reprocessContent();

    if (this.parent) {
      this.parent.handleChildResize(axis);
    }

    this.resizeChildren();
  }

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

  // protected methods --------------------------------------------------------

  /**
   * flag the element and all children for redraw recursively
   */
  protected flagForRedraw() {
    //console.log("flagging for redraw", this.key);
    this.mustRedraw = true;
    this.children.forEach((child) => child.flagForRedraw());
  }

  /**
   * get the offset of content relative to the top left of the element due to
   * padding and border
   * @returns the offset of the content relative to the top left of the element
   */
  public getContentOffset() {
    const b = this.bordered ? 1 : 0;
    return this.padding.start.add(new IntPoint(b, b));
  }

  protected drawChar(char: string, p: IntPoint, o: IntPoint = ZERO_POINT) {
    this.view.setContentLayerChar(char, p, o);
    if (!this.animation && this.stage !== "queued") {
      this.view.setAnimationLayerChar(char, p, o);
    }
  }

  protected updateScrollShowing() {
    if (this.innerScrollDiv) {
      // set size of first child of scroll element
      this.innerScrollDiv.style.height = `${charsToPixelsY(
        this.contentSize.getY()
      )}px`;
    }
    if (!this.scrollable) return;
    const contentAreaSize = this.size.subtract(this.getTotalBoundarySize());
    if (
      !this.showingScrollBar &&
      this.contentSize.getY() > contentAreaSize.getY()
    ) {
      this.showingScrollBar = true;
      this.scrollDiv = document.createElement("div");
      this.scrollDiv.style.overflowY = "scroll";
      const viewOffset = this.view.getPixelOffset();
      const contentAreaSize = this.size.subtract(this.getTotalBoundarySize());

      this.scrollDiv.className = "hidden-scrollbar";

      Object.assign(this.scrollDiv.style, {
        position: "absolute", // Position it absolutely
        top: `${
          charsToPixelsY(this.fullContentOffset.getY()) + viewOffset.getY()
        }px`, // Position at the top
        left: `${
          charsToPixelsX(this.fullContentOffset.getX()) + viewOffset.getX()
        }px`, // Position at the left
        width: `${charsToPixelsX(contentAreaSize.getX())}px`, // Full width
        height: `${charsToPixelsY(contentAreaSize.getY())}px`, // Full height
        margin: "0", // Reset the margin
        padding: "0", // Reset the padding
        border: "0", // Reset the border
        pointerEvents: "auto", // Ensure it can capture pointer events
        backgroundColor: "transparent", // Set a background color
        zIndex: "1000", // Adjust z-index to place it above other elements (if needed)
      });

      this.innerScrollDiv = document.createElement("div");
      this.innerScrollDiv.style.width = "100%";
      this.innerScrollDiv.style.height = `${charsToPixelsY(
        this.contentSize.getY()
      )}px`;
      this.scrollDiv.appendChild(this.innerScrollDiv);

      this.scrollDiv.addEventListener(
        "scroll",
        _.throttle(() => {
          this.scrollOffset.set(
            Y,
            (-1 * this.scrollDiv!.scrollTop) / FONT_SIZE
          );
          this.flagForRedraw();
        }, 20)
      );
      console.log("--------appending scroll div", this.key);

      document.body.appendChild(this.scrollDiv);
      this.reprocessContent();
    } else if (
      this.showingScrollBar &&
      this.contentSize.getY() <= contentAreaSize.getY()
    ) {
      this.showingScrollBar = false;
      this.reprocessContent();
      // remove scroll element from body
      console.log("--------removing scroll div", this.key);
      this.scrollDiv!.remove();
      this.scrollDiv = null;
      this.innerScrollDiv = null;
    }
  }

  // private methods ----------------------------------------------------------

  private drawBackground(o: IntPoint): void {
    this.forEachVisiblePoint((p) => {
      this.drawChar(this.backgroundChar, p, o);
    });
  }

  private drawBorder(o: IntPoint): void {
    const lastPoint = this.size.add(new IntPoint(-1, -1));
    this.forEachVisiblePoint((p) => {
      let char = "│";
      if (p.equals(ZERO_POINT)) {
        char = "╭";
      } else if (p.equals(lastPoint)) {
        char = "╯";
      } else if (p.getX() === 0 && p.getY() === lastPoint.getY()) {
        char = "╰";
      } else if (p.getX() === lastPoint.getX() && p.getY() === 0) {
        char = "╮";
      } else if (p.getX() === 0 || p.getX() === lastPoint.getX()) {
        char = "│";
      } else if (p.getY() === 0 || p.getY() === lastPoint.getY()) {
        char = "─";
      } else {
        return;
      }
      this.drawChar(char, p, o);
    });
  }

  private drawVerticalScrollBar = (offset: IntPoint) => {
    if (!this.showingScrollBar) return;
    const fullOffset = offset.add(this.getContentOffset());
    const boundarySize = this.getTotalBoundarySize();
    const scrollOffset = -1 * this.scrollOffset.getY();
    const contentAreaSize = this.size.subtract(boundarySize);
    const contentAreaHeight = contentAreaSize.getY();
    const contentHeight = this.contentSize.getY();
    const barHeight = (contentAreaHeight / contentHeight) * contentAreaHeight;
    const barOffset = (scrollOffset / contentHeight) * contentAreaHeight;
    const xOffset = contentAreaSize.getX() + this.padding.end.getX();
    this.forEachAlongAxisInContentArea(Y, (i) => {
      let char = "|";
      if (i >= barOffset && i < barOffset + barHeight) {
        char = "█";
      }
      const p = new IntPoint(xOffset, i);
      this.drawChar(char, p, fullOffset);
    });
  };

  private getOnEnter(): () => void {
    return this.getOnTransitionFunction("enter");
  }

  private getOnExit() {
    return this.getOnTransitionFunction("exit");
  }

  private getOnTransitionFunction(transition: "enter" | "exit") {
    const funcs = transition === "enter" ? this.onEnterFuncs : this.onExitFuncs;
    const nextStage = transition === "enter" ? "main" : "exited";
    let otherHasCompleted = false;
    return () => {
      if (otherHasCompleted) {
        console.log("transition complete", this.key);
        funcs.forEach((func) => func());
        this.stage = nextStage;
      } else {
        //console.log("other transition has not completed", this.key);
        otherHasCompleted = true;
      }
    };
  }

  protected enforceNonCircularSizing() {
    //console.log("enforcing non-circular sizing for", this.key);
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

  private pointIsInside(p: RealPoint): boolean {
    return AXES.every((a) => p[a] >= 0 && p[a] < this.size[a]);
  }

  private startMouseExitAnimation() {
    this.startMouseEventAnimation(this.mouseExitAnimationConfig);
  }

  private startMouseEnterAnimation() {
    this.startMouseEventAnimation(this.mouseEnterAnimationConfig);
  }

  private startMouseEventAnimation(config: AnimationConfig | null) {
    if (config) {
      this.animation = Animation.createAnimation(
        this,
        this.view,
        config,
        () => {}
      );
    }
  }
}
