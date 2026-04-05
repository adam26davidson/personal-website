import { describe, it, expect, vi, beforeEach } from "vitest";
import { RenderLoopController } from "./RenderLoopController";

// Mock requestAnimationFrame for synchronous testing
let rafCallbacks: (() => void)[] = [];
function flushRAF() {
  const cbs = rafCallbacks;
  rafCallbacks = [];
  cbs.forEach((cb) => cb());
}

beforeEach(() => {
  rafCallbacks = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    (cb: () => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }
  );
});

describe("RenderLoopController", () => {
  it("calls onFrame when a frame is scheduled", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);

    ctrl.scheduleFrame();
    expect(onFrame).not.toHaveBeenCalled();

    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it("does not double-schedule frames", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);

    ctrl.scheduleFrame();
    ctrl.scheduleFrame();
    ctrl.scheduleFrame();

    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it("keeps running while continuous sources are active", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);
    const source = {};

    ctrl.requestContinuousRendering(source);
    expect(ctrl.isActive()).toBe(true);

    // First frame — should schedule another because source is active
    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(1); // another frame was scheduled

    // Second frame
    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(2);
    expect(rafCallbacks.length).toBe(1); // still going
  });

  it("stops looping when all sources are released", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);
    const source = {};

    ctrl.requestContinuousRendering(source);
    flushRAF();
    expect(rafCallbacks.length).toBe(1);

    ctrl.releaseContinuousRendering(source);
    expect(ctrl.isActive()).toBe(false);

    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(2);
    // No more frames scheduled since the source was released
    expect(rafCallbacks.length).toBe(0);
  });

  it("tracks multiple sources independently", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);
    const a = {};
    const b = {};

    ctrl.requestContinuousRendering(a);
    ctrl.requestContinuousRendering(b);
    expect(ctrl.isActive()).toBe(true);

    ctrl.releaseContinuousRendering(a);
    expect(ctrl.isActive()).toBe(true);

    ctrl.releaseContinuousRendering(b);
    expect(ctrl.isActive()).toBe(false);
  });

  it("destroy stops all rendering", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);
    const source = {};

    ctrl.requestContinuousRendering(source);
    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(1);

    ctrl.destroy();
    expect(ctrl.isDestroyed()).toBe(true);
    expect(ctrl.isActive()).toBe(false);

    // Pending rAF callback should be a no-op after destroy
    flushRAF();
    expect(onFrame).toHaveBeenCalledTimes(1); // no additional calls
  });

  it("ignores requests after destroy", () => {
    const onFrame = vi.fn();
    const ctrl = new RenderLoopController(onFrame);

    ctrl.destroy();

    ctrl.scheduleFrame();
    ctrl.requestContinuousRendering({});
    expect(rafCallbacks.length).toBe(0);
    expect(ctrl.isActive()).toBe(false);
  });

  it("release is safe for unknown sources", () => {
    const ctrl = new RenderLoopController(vi.fn());
    // Should not throw
    ctrl.releaseContinuousRendering({});
    expect(ctrl.isActive()).toBe(false);
  });
});
