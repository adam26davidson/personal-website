import { TransitionSequence } from "./TransitionSequence";
import { IntPoint } from "../types/IntPoint";
import { ElementInteraction } from "./ElementInteraction";
import { ElementConfig } from "./ElementBase";

export type { CursorType, SizingMethod, ElementStage, ElementConfig } from "./ElementBase";
export type { RenderTarget } from "../interfaces/RenderTarget";

export abstract class Element extends ElementInteraction {
  protected abstract handleUnregisterWithView(): void;
  protected abstract handleTransitionStart(type: "enter" | "exit"): void;

  // transition orchestration
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

  protected isOnView: boolean = false;

  constructor(config: ElementConfig) {
    super(config);

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

    // Use animation handler from config if provided
    this.animationHandler = config.animationHandler || null;
  }

  // --- getters ---

  public getIsOnView = () => this.isOnView;

  // --- child management ---

  public setChildren(children: Element[]) {
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

  public handleChildResize() {
    this.resizeChildren();
    this.reprocessContent();
    this.flagForRedraw();
  }

  public pruneExitedChildren() {
    if (this.stage !== "exiting") {
      const newChildren = this.children.filter(
        (child) => child.getStage() !== "exited"
      );
      if (newChildren.length !== this.children.length) {
        const exitedChildren = this.children.filter(
          (child) => child.getStage() === "exited"
        );
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

  // --- view registration ---

  public registerWithView() {
    this.view.registerElement(this);
    this.isOnView = true;
    this.children.forEach((child) => child.registerWithView());
  }

  public unregisterWithView() {
    this.handleUnregisterWithView();
    this.view.unregisterElement(this);
    this.isOnView = false;
    this.children.forEach((child) => child.unregisterWithView());
  }

  // --- animation step ---

  public runAnimationStep(offset: IntPoint): void {
    const fullOffset = offset.add(this.scrollOffset);
    if (this.animationHandler) {
      // Animation covers the element's own screen area (no scroll offset).
      // Scroll only shifts children, not the element's border/background/animation.
      this.animationHandler.runAnimationStep(offset);
    }
    this.children.forEach((child) =>
      child.runAnimationStep(fullOffset.add(child.getOffset()))
    );
  }

  // --- transitions ---

  public addOnTransition(type: "enter" | "exit", func: () => void) {
    const funcs = type === "enter" ? this.onEnterFuncs : this.onExitFuncs;
    const stage = type === "enter" ? "entering" : "exiting";
    funcs.push(func);
    if (
      this.stage === stage &&
      this.animationHandler?.hasActiveAnimation()
    ) {
      this.animationHandler.setOnComplete(
        this.getOnTransitionFunction(type)
      );
    }
  }

  public startTransition(
    type: "enter" | "exit",
    onComplete: () => void = () => {}
  ) {
    this.handleTransitionStart(type);
    this.addOnTransition(type, onComplete);
    this.stage = type === "enter" ? "entering" : "exiting";

    const sequence =
      type === "enter" ? this.entranceSequence : this.exitSequence;
    const onTransition = this.getOnTransitionFunction(type);

    // Try to start an animation via the handler
    const animationStarted = this.animationHandler?.startAnimation(
      type,
      onTransition
    );

    if (!animationStarted) {
      // No animation handler or no config for this type — instant transition
      onTransition();
    }

    sequence.setonComplete(onTransition);
    sequence.startSequence();
  }

  // --- private helpers ---

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
        funcs.forEach((func) => func());
        this.stage = nextStage;
      } else {
        otherHasCompleted = true;
      }
    };
  }
}
