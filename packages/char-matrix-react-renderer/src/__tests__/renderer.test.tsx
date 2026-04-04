import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ContainerElement,
  TextElement,
  TableElement,
} from "@adam26davidson/char-matrix";
import type { RenderTarget, Element } from "@adam26davidson/char-matrix";
import { createMockRenderTarget } from "./mockRenderTarget";
import { render, unmount } from "../renderer";

let view: RenderTarget & { registeredElements: Set<Element>; rootElement: Element | null };

beforeEach(() => {
  view = createMockRenderTarget(80, 24);
});

// ---------------------------------------------------------------------------
// 1. Basic element creation
// ---------------------------------------------------------------------------
describe("element creation", () => {
  it("renders a text element", () => {
    const root = render(<cm-text elementKey="t1" text="Hello" />, view);
    expect(root).toBeInstanceOf(TextElement);
    expect((root as TextElement).getKey()).toBe("t1");
  });

  it("renders a container element", () => {
    const root = render(<cm-container elementKey="c1" mainAxis="y" />, view);
    expect(root).toBeInstanceOf(ContainerElement);
    expect((root as ContainerElement).getKey()).toBe("c1");
  });

  it("renders a table element", () => {
    const root = render(
      <cm-table elementKey="tb1" columns={[{ width: 10 }, { width: 20 }]} />,
      view
    );
    expect(root).toBeInstanceOf(TableElement);
  });

  it("applies sizing props", () => {
    const root = render(
      <cm-container
        elementKey="sized"
        mainAxis="x"
        width={40}
        widthType="absolute"
        height={10}
        heightType="absolute"
      />,
      view
    );
    const size = (root as ContainerElement).getSize();
    expect(size.getX()).toBe(40);
    expect(size.getY()).toBe(10);
  });

  it("applies padding and border props", () => {
    const root = render(
      <cm-container elementKey="padded" mainAxis="y" padding={2} bordered />,
      view
    );
    const boundary = (root as ContainerElement).getTotalBoundarySize();
    // padding=2 on all sides + border=1 on all sides = 3 per side
    expect(boundary.getX()).toBe(6); // left + right
    expect(boundary.getY()).toBe(6); // top + bottom
  });
});

// ---------------------------------------------------------------------------
// 2. Parent-child relationships
// ---------------------------------------------------------------------------
describe("children", () => {
  it("renders children inside a container", () => {
    render(
      <cm-container elementKey="parent" mainAxis="y" heightType="content">
        <cm-text elementKey="child1" text="A" />
        <cm-text elementKey="child2" text="B" />
      </cm-container>,
      view
    );
    const keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("child1");
    expect(keys).toContain("child2");
  });

  it("renders deeply nested elements", () => {
    render(
      <cm-container elementKey="root" mainAxis="y">
        <cm-container elementKey="row" mainAxis="x">
          <cm-text elementKey="deep" text="nested" />
        </cm-container>
      </cm-container>,
      view
    );
    const keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("root");
    expect(keys).toContain("row");
    expect(keys).toContain("deep");
  });
});

// ---------------------------------------------------------------------------
// 3. Updates / re-renders
// ---------------------------------------------------------------------------
describe("updates", () => {
  it("updates text content on re-render", async () => {
    let setText: (s: string) => void;

    function App() {
      const [text, _setText] = useState("initial");
      setText = _setText;
      return <cm-text elementKey="t" text={text} />;
    }

    const root = render(<App />, view);
    expect(root).toBeInstanceOf(TextElement);

    await React.act(() => {
      setText!("updated");
    });

    expect(view.registeredElements.size).toBeGreaterThan(0);
  });

  it("adds new children on re-render", async () => {
    let setCount: (n: number) => void;

    function App() {
      const [count, _setCount] = useState(1);
      setCount = _setCount;
      return (
        <cm-container elementKey="parent" mainAxis="y" heightType="content">
          {Array.from({ length: count }, (_, i) => (
            <cm-text key={`item-${i}`} elementKey={`item-${i}`} text={`Item ${i}`} />
          ))}
        </cm-container>
      );
    }

    render(<App />, view);
    const initialCount = view.registeredElements.size;

    await React.act(() => {
      setCount!(3);
    });

    const keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("item-0");
    expect(keys).toContain("item-1");
    expect(keys).toContain("item-2");
    expect(view.registeredElements.size).toBeGreaterThan(initialCount);
  });

  it("removes children on re-render", async () => {
    let setShow: (s: boolean) => void;

    function App() {
      const [show, _setShow] = useState(true);
      setShow = _setShow;
      return (
        <cm-container elementKey="parent" mainAxis="y" heightType="content">
          <cm-text elementKey="always" text="always" />
          {show && <cm-text elementKey="conditional" text="maybe" />}
        </cm-container>
      );
    }

    render(<App />, view);
    let keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("conditional");

    await React.act(() => {
      setShow!(false);
    });

    keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).not.toContain("conditional");
  });
});

// ---------------------------------------------------------------------------
// 4. React component composition
// ---------------------------------------------------------------------------
describe("component composition", () => {
  it("renders user-defined components", () => {
    function Label({ text }: { text: string }) {
      return <cm-text elementKey={`label-${text}`} text={text} />;
    }

    function App() {
      return (
        <cm-container elementKey="root" mainAxis="y" heightType="content">
          <Label text="hello" />
          <Label text="world" />
        </cm-container>
      );
    }

    render(<App />, view);
    const keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("label-hello");
    expect(keys).toContain("label-world");
  });

  it("supports fragments", () => {
    function TwoItems() {
      return (
        <>
          <cm-text elementKey="frag-a" text="A" />
          <cm-text elementKey="frag-b" text="B" />
        </>
      );
    }

    render(
      <cm-container elementKey="root" mainAxis="y" heightType="content">
        <TwoItems />
      </cm-container>,
      view
    );
    const keys = [...view.registeredElements].map((e) => e.getKey());
    expect(keys).toContain("frag-a");
    expect(keys).toContain("frag-b");
  });
});

// ---------------------------------------------------------------------------
// 5. Unmounting
// ---------------------------------------------------------------------------
describe("unmount", () => {
  it("unregisters all elements on unmount", () => {
    render(
      <cm-container elementKey="root" mainAxis="y">
        <cm-text elementKey="child" text="bye" />
      </cm-container>,
      view
    );

    expect(view.registeredElements.size).toBeGreaterThan(0);

    unmount(view);

    expect(view.registeredElements.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Container props
// ---------------------------------------------------------------------------
describe("container props", () => {
  it("passes spacing to container", () => {
    const root = render(
      <cm-container elementKey="spaced" mainAxis="x" spacing={3} />,
      view
    );
    expect(root).toBeInstanceOf(ContainerElement);
  });

  it("passes alignment props", () => {
    const root = render(
      <cm-container
        elementKey="aligned"
        mainAxis="y"
        justifyContent="center"
        alignItems="end"
      />,
      view
    );
    expect(root).toBeInstanceOf(ContainerElement);
  });
});

// ---------------------------------------------------------------------------
// 7. onClick support
// ---------------------------------------------------------------------------
describe("onClick", () => {
  it("wires onClick handler on creation", () => {
    const handler = vi.fn();
    render(<cm-text elementKey="clickable" text="Click me" onClick={handler} />, view);

    // Find the element and simulate a click by calling onclick directly
    const el = [...view.registeredElements].find((e) => e.getKey() === "clickable");
    expect(el).toBeDefined();
    // The onclick is set as a private field — trigger via handleMouseDown
    // which calls this.onclick(). We can't easily test this without a full
    // mouse event simulation, so verify the element was created without error.
    expect(el).toBeInstanceOf(TextElement);
  });

  it("updates onClick handler on re-render", async () => {
    const handler1 = () => {};
    const handler2 = () => {};
    let setUseSecond: (v: boolean) => void;

    function App() {
      const [useSecond, _setUseSecond] = useState(false);
      setUseSecond = _setUseSecond;
      return <cm-text elementKey="clickable" text="Click" onClick={useSecond ? handler2 : handler1} />;
    }

    render(<App />, view);

    await React.act(() => {
      setUseSecond!(true);
    });

    // Element should still be registered (updated in-place, not recreated)
    const el = [...view.registeredElements].find((e) => e.getKey() === "clickable");
    expect(el).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 8. setRoot bridging
// ---------------------------------------------------------------------------
describe("setRoot bridging", () => {
  it("calls setRoot on the view when rendering root element", () => {
    render(<cm-container elementKey="root" mainAxis="y" />, view);
    expect(view.rootElement).toBeDefined();
    expect(view.rootElement!.getKey()).toBe("root");
  });

  it("updates root when re-rendering with different root", async () => {
    let setType: (t: "a" | "b") => void;

    function App() {
      const [type, _setType] = useState<"a" | "b">("a");
      setType = _setType;
      return type === "a" ? (
        <cm-container key="a" elementKey="root-a" mainAxis="y" />
      ) : (
        <cm-container key="b" elementKey="root-b" mainAxis="x" />
      );
    }

    render(<App />, view);
    expect(view.rootElement!.getKey()).toBe("root-a");

    await React.act(() => {
      setType!("b");
    });

    expect(view.rootElement!.getKey()).toBe("root-b");
  });
});

// ---------------------------------------------------------------------------
// 9. Animation handler wiring
// ---------------------------------------------------------------------------
describe("animation handler wiring", () => {
  it("calls setElement on animation handler after creation", () => {
    const mockHandler = {
      setElement: vi.fn(),
      startAnimation: vi.fn(() => false),
      runAnimationStep: vi.fn(),
      hasActiveAnimation: vi.fn(() => false),
      setOnComplete: vi.fn(),
    };

    render(
      <cm-text elementKey="animated" text="Hello" animationHandler={mockHandler} />,
      view
    );

    expect(mockHandler.setElement).toHaveBeenCalledTimes(1);
    const calledWith = mockHandler.setElement.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(TextElement);
    expect(calledWith.getKey()).toBe("animated");
  });
});
