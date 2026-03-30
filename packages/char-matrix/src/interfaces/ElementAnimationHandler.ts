import { IntPoint } from "../types/IntPoint";

/**
 * Interface for handling element animations.
 * Without a handler, element transitions are instant.
 * The fx package provides an implementation that uses character-morphing animations.
 */
export interface ElementAnimationHandler {
  /**
   * Called when an element starts a transition (enter/exit) or mouse event animation.
   * The handler should create and manage the animation, calling onComplete when done.
   * Returns true if an animation was started, false if the event was ignored.
   */
  startAnimation(
    type: "enter" | "exit" | "mouseEnter" | "mouseExit" | "click",
    onComplete: () => void
  ): boolean;

  /**
   * Called each frame. The handler should run one animation step.
   * @param offset the absolute offset of the element
   */
  runAnimationStep(offset: IntPoint): void;

  /**
   * Whether this handler currently has an active animation running.
   */
  hasActiveAnimation(): boolean;

  /**
   * Set the completion callback for the current animation.
   * Used when additional onComplete handlers are added after animation starts.
   */
  setOnComplete(onComplete: () => void): void;
}
