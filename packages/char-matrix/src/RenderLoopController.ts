/**
 * Manages a requestAnimationFrame render loop with automatic idle detection.
 *
 * Animation sources (e.g., DefaultAnimationHandler, SpringLattice) register
 * when they need continuous rendering and release when done. The loop idles
 * when no sources are active.
 *
 * One-shot frame requests are also supported for discrete updates.
 */
export class RenderLoopController {
  private frameScheduled = false;
  private destroyed = false;
  private continuousSources = new Set<object>();
  private onFrame: () => void;

  constructor(onFrame: () => void) {
    this.onFrame = onFrame;
  }

  /**
   * Stop the loop permanently and release all sources.
   * After calling destroy(), no further frames will be scheduled.
   */
  public destroy(): void {
    this.destroyed = true;
    this.continuousSources.clear();
    this.frameScheduled = false;
  }

  /**
   * Whether this controller has been destroyed.
   */
  public isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Register a source that needs continuous rendering (e.g., an active animation).
   * The loop will keep running until all sources are released.
   */
  public requestContinuousRendering(source: object): void {
    if (this.destroyed) return;
    this.continuousSources.add(source);
    this.scheduleFrame();
  }

  /**
   * Release a source that no longer needs continuous rendering.
   */
  public releaseContinuousRendering(source: object): void {
    this.continuousSources.delete(source);
  }

  /**
   * Schedule a single frame. If continuous sources are active, the loop
   * continues automatically.
   */
  public scheduleFrame(): void {
    if (this.destroyed) return;
    if (!this.frameScheduled) {
      this.frameScheduled = true;
      requestAnimationFrame(() => this.frame());
    }
  }

  /**
   * Returns true if there are active continuous rendering sources.
   */
  public isActive(): boolean {
    return this.continuousSources.size > 0;
  }

  private frame(): void {
    if (this.destroyed) return;
    this.frameScheduled = false;
    this.onFrame();

    // Keep the loop running while there are continuous sources
    if (this.continuousSources.size > 0) {
      this.scheduleFrame();
    }
  }
}
