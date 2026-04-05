import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ContainerElement,
  TextElement,
} from "@adam26davidson/char-matrix";
import type { Element } from "@adam26davidson/char-matrix";
import { createMockRenderTarget } from "./mockRenderTarget";
import { render } from "../renderer";

let view: ReturnType<typeof createMockRenderTarget>;

beforeEach(() => {
  view = createMockRenderTarget(80, 24);
});

// ---------------------------------------------------------------------------
// commitUpdate — onClick clearing
// ---------------------------------------------------------------------------
describe("commitUpdate onClick handling", () => {
  it("clears onClick when handler is removed", async () => {
    let setHasClick: (v: boolean) => void;

    function App() {
      const [hasClick, _setHasClick] = useState(true);
      setHasClick = _setHasClick;
      return (
        <cm-text
          elementKey="t"
          text="Click"
          onClick={hasClick ? () => {} : undefined}
        />
      );
    }

    render(<App />, view);

    // Remove the onClick handler
    await React.act(() => {
      setHasClick!(false);
    });

    // Element should still be registered (updated in-place)
    const el = [...view.registeredElements].find((e) => e.getKey() === "t");
    expect(el).toBeDefined();
    // The onclick field is private, but the update should not throw
  });
});

// ---------------------------------------------------------------------------
// commitUpdate — prop updates via updateConfig methods
// ---------------------------------------------------------------------------
describe("commitUpdate prop updates", () => {
  it("updates container props via updateContainerConfig", async () => {
    let setSpacing: (n: number) => void;

    function App() {
      const [spacing, _setSpacing] = useState(0);
      setSpacing = _setSpacing;
      return (
        <cm-container elementKey="c" mainAxis="x" spacing={spacing}>
          <cm-text elementKey="a" text="A" />
          <cm-text elementKey="b" text="B" />
        </cm-container>
      );
    }

    render(<App />, view);

    await React.act(() => {
      setSpacing!(5);
    });

    const el = [...view.registeredElements].find((e) => e.getKey() === "c");
    expect(el).toBeInstanceOf(ContainerElement);
  });

  it("updates text props via updateTextConfig", async () => {
    let setText: (s: string) => void;

    function App() {
      const [text, _setText] = useState("hello");
      setText = _setText;
      return <cm-text elementKey="t" text={text} />;
    }

    render(<App />, view);

    await React.act(() => {
      setText!("world");
    });

    const el = [...view.registeredElements].find((e) => e.getKey() === "t");
    expect(el).toBeInstanceOf(TextElement);
  });

  it("updates padding on re-render", async () => {
    let setPadding: (n: number) => void;

    function App() {
      const [padding, _setPadding] = useState(0);
      setPadding = _setPadding;
      return (
        <cm-container elementKey="c" mainAxis="y" padding={padding} />
      );
    }

    const root = render(<App />, view);
    const boundary1 = (root as ContainerElement).getTotalBoundarySize();
    expect(boundary1.getX()).toBe(0);

    await React.act(() => {
      setPadding!(3);
    });

    const boundary2 = (root as ContainerElement).getTotalBoundarySize();
    expect(boundary2.getX()).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// commitUpdate — animationKey re-trigger
// ---------------------------------------------------------------------------
describe("commitUpdate animationKey", () => {
  it("re-triggers entrance animation when animationKey changes on a main-stage element", async () => {
    // Use a handler that does NOT auto-start entrance (so the element reaches
    // "main" stage instantly via the no-animation path).
    const mockHandler = {
      setElement: vi.fn(),
      startAnimation: vi.fn(() => false), // false = no animation, instant transition
      runAnimationStep: vi.fn(),
      hasActiveAnimation: vi.fn(() => false),
      setOnComplete: vi.fn(),
    };

    let setKey: (k: number) => void;

    function App() {
      const [key, _setKey] = useState(0);
      setKey = _setKey;
      return (
        <cm-text
          elementKey="t"
          text="Animated"
          animationHandler={mockHandler}
          animationKey={key}
        />
      );
    }

    render(<App />, view);

    // The reconciler creates the element in "queued" stage. In the real app,
    // MatrixController triggers entrance transitions. Manually start it here.
    const el = [...view.registeredElements].find((e) => e.getKey() === "t")!;
    el.startTransition("enter");
    // Handler returns false, so entrance completes instantly → stage is "main"
    expect(el.getStage()).toBe("main");

    // Record call count before the key change
    const enterCountBefore = mockHandler.startAnimation.mock.calls.filter(
      (c: any[]) => c[0] === "enter"
    ).length;

    // Change animationKey — should trigger startTransition("enter") in commitUpdate
    await React.act(() => {
      setKey!(1);
    });

    const enterCountAfter = mockHandler.startAnimation.mock.calls.filter(
      (c: any[]) => c[0] === "enter"
    ).length;
    expect(enterCountAfter).toBeGreaterThan(enterCountBefore);
  });
});

// ---------------------------------------------------------------------------
// Overlay handling
// ---------------------------------------------------------------------------
describe("overlay element", () => {
  it("creates overlay elements and routes to addOverlay", () => {
    const overlays: Element[] = [];
    const viewWithOverlay = {
      ...createMockRenderTarget(80, 24),
      addOverlay: (el: Element) => overlays.push(el),
      removeOverlay: (el: Element) => {
        const idx = overlays.indexOf(el);
        if (idx >= 0) overlays.splice(idx, 1);
      },
    };

    render(
      <cm-container elementKey="root" mainAxis="y">
        <cm-overlay elementKey="modal" mainAxis="y">
          <cm-text elementKey="modal-text" text="I am an overlay" />
        </cm-overlay>
      </cm-container>,
      viewWithOverlay
    );

    expect(overlays.length).toBe(1);
    expect(overlays[0].getKey()).toBe("modal");
  });

  it("removes overlay on unmount", async () => {
    const overlays: Element[] = [];
    const viewWithOverlay = {
      ...createMockRenderTarget(80, 24),
      addOverlay: (el: Element) => overlays.push(el),
      removeOverlay: (el: Element) => {
        const idx = overlays.indexOf(el);
        if (idx >= 0) overlays.splice(idx, 1);
      },
    };

    let setShow: (v: boolean) => void;

    function App() {
      const [show, _setShow] = useState(true);
      setShow = _setShow;
      return (
        <cm-container elementKey="root" mainAxis="y">
          {show && (
            <cm-overlay elementKey="modal" mainAxis="y">
              <cm-text elementKey="modal-text" text="overlay content" />
            </cm-overlay>
          )}
        </cm-container>
      );
    }

    render(<App />, viewWithOverlay);
    expect(overlays.length).toBe(1);

    await React.act(() => {
      setShow!(false);
    });

    expect(overlays.length).toBe(0);
  });
});
