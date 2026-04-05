import { describe, it, expect } from "vitest";
import {
  IntPoint,
  ZERO_POINT,
  SPACE_CHAR,
  DEFAULT_BACKGROUND_CHAR,
  Element,
  ParentElement,
  ContainerElement,
  RenderTargetBufferManager,
} from "../index";
import type { RenderTarget, CursorType, SizingMethod } from "../index";
import TextElement from "./TextElement";

/**
 * A headless render target with z-buffer support for testing.
 * Delegates all buffer/z-buffer/compositing logic to RenderTargetBufferManager.
 */
class TestRenderTarget extends ParentElement implements RenderTarget {
  private buffers: RenderTargetBufferManager;
  private size: IntPoint;

  // Expose layers for tests that access them directly
  get contentLayer() { return this.buffers.contentLayer; }
  get animationLayer() { return this.buffers.animationLayer; }

  constructor(width: number, height: number) {
    super();
    this.size = new IntPoint(width, height);
    this.buffers = new RenderTargetBufferManager(this.size);
  }

  resetZBuffers(): void { this.buffers.resetZBuffers(); }

  getSize(): IntPoint { return this.size; }
  getParent(): ParentElement | null { return null; }
  getScrollOffset(): IntPoint { return ZERO_POINT; }
  getSizingMethod(): { x: SizingMethod; y: SizingMethod } { return { x: "absolute", y: "absolute" }; }
  getIsOnView(): boolean { return true; }
  getBackgroundChar(): string { return DEFAULT_BACKGROUND_CHAR; }
  getTotalBoundarySize(): IntPoint { return ZERO_POINT; }
  getContentOffset(): IntPoint { return ZERO_POINT; }
  getContentEndOffset(): IntPoint { return this.size; }
  getContentAreaSize(): IntPoint { return this.size; }
  getStage(): string { return "main"; }
  handleChildResize(): void {}

  setCursor(_cursor: CursorType): void {}

  setContentLayerChar(char: string, location: IntPoint, offset: IntPoint = ZERO_POINT, zIndex: number = 0): void {
    this.buffers.setContentLayerChar(char, location, offset, zIndex);
  }

  getContentLayerChar(location: IntPoint, offset: IntPoint = ZERO_POINT): string {
    return this.buffers.getContentLayerChar(location, offset);
  }

  setAnimationLayerChar(char: string, location: IntPoint, offset: IntPoint = ZERO_POINT, zIndex: number = 0): void {
    this.buffers.setAnimationLayerChar(char, location, offset, zIndex);
  }

  getPixelOffset(): IntPoint { return ZERO_POINT; }
  getIsMobile(): boolean { return false; }
  registerElement(_element: Element): void {}
  unregisterElement(_element: Element): void {}

  renderToString(): string[] {
    const surface = this.buffers.getSurface([]);
    return surface.map((row) => row.join(""));
  }

  setRoot(element: Element): void {
    this.children.forEach((child) => child.unregisterWithView());
    this.children = [element];
    this.updateFlowChildren();
    element.setParent(this);
    element.registerWithView();
    this.resizeChildren();
  }
}

/** Helper: get char at (x, y) from rendered output */
function charAt(lines: string[], x: number, y: number): string {
  return [...lines[y]][x];
}

/** Register an element with the view and advance it to "main" stage. */
function activate(element: TextElement | ContainerElement, view: TestRenderTarget): void {
  element.setParent(view);
  element.registerWithView();
  element.startTransition("enter");
}

describe("z-index", () => {
  it("elements with default z-index (0) render normally — last draw wins", () => {
    const view = new TestRenderTarget(10, 3);

    const bg = new TextElement({ key: "bg", view, text: "AAAAAAAAAA", widthType: "content", heightType: "content" });
    const fg = new TextElement({ key: "fg", view, text: "BB", widthType: "content", heightType: "content" });

    activate(bg, view);
    activate(fg, view);

    view.resetZBuffers();
    bg.flagForRedraw();
    bg.draw(new IntPoint(0, 0));
    fg.flagForRedraw();
    fg.draw(new IntPoint(0, 0)); // draws on top at same position

    const lines = view.renderToString();
    // fg overwrites first 2 chars since same z-index (0) and drawn later
    expect(charAt(lines, 0, 0)).toBe("B");
    expect(charAt(lines, 1, 0)).toBe("B");
    expect(charAt(lines, 2, 0)).toBe("A");
  });

  it("higher z-index element wins even when drawn first", () => {
    const view = new TestRenderTarget(10, 1);

    const overlay = new TextElement({ key: "overlay", view, text: "XX", widthType: "content", heightType: "content", zIndex: 1 });
    const base = new TextElement({ key: "base", view, text: "AAAAAAAAAA", widthType: "content", heightType: "content", zIndex: 0 });

    activate(overlay, view);
    activate(base, view);

    view.resetZBuffers();

    // Draw overlay FIRST, then base
    overlay.flagForRedraw();
    overlay.draw(new IntPoint(0, 0));
    base.flagForRedraw();
    base.draw(new IntPoint(0, 0));

    const lines = view.renderToString();
    // Overlay should still win at (0,0) and (1,0) despite being drawn first
    expect(charAt(lines, 0, 0)).toBe("X");
    expect(charAt(lines, 1, 0)).toBe("X");
    // Base shows where overlay doesn't cover
    expect(charAt(lines, 2, 0)).toBe("A");
  });

  it("lower z-index element cannot overwrite higher z-index element", () => {
    const view = new TestRenderTarget(5, 1);

    const high = new TextElement({ key: "high", view, text: "HH", widthType: "content", heightType: "content", zIndex: 5 });
    const low = new TextElement({ key: "low", view, text: "LLLLL", widthType: "content", heightType: "content", zIndex: 1 });

    activate(high, view);
    activate(low, view);

    view.resetZBuffers();

    high.flagForRedraw();
    high.draw(new IntPoint(0, 0));
    low.flagForRedraw();
    low.draw(new IntPoint(0, 0));

    const lines = view.renderToString();
    expect(charAt(lines, 0, 0)).toBe("H");
    expect(charAt(lines, 1, 0)).toBe("H");
    expect(charAt(lines, 2, 0)).toBe("L");
  });

  it("equal z-index: later draw wins (last-writer-wins)", () => {
    const view = new TestRenderTarget(3, 1);

    const a = new TextElement({ key: "a", view, text: "AAA", widthType: "content", heightType: "content", zIndex: 2 });
    const b = new TextElement({ key: "b", view, text: "BB", widthType: "content", heightType: "content", zIndex: 2 });

    activate(a, view);
    activate(b, view);

    view.resetZBuffers();

    a.flagForRedraw();
    a.draw(new IntPoint(0, 0));
    b.flagForRedraw();
    b.draw(new IntPoint(0, 0));

    const lines = view.renderToString();
    // b drawn last, same z, so b wins at (0,0) and (1,0)
    expect(charAt(lines, 0, 0)).toBe("B");
    expect(charAt(lines, 1, 0)).toBe("B");
    expect(charAt(lines, 2, 0)).toBe("A");
  });

  it("negative z-index renders below default z-index (0)", () => {
    const view = new TestRenderTarget(5, 1);

    const behind = new TextElement({ key: "behind", view, text: "BBBBB", widthType: "content", heightType: "content", zIndex: -1 });
    const normal = new TextElement({ key: "normal", view, text: "NN", widthType: "content", heightType: "content" }); // zIndex defaults to 0

    activate(behind, view);
    activate(normal, view);

    view.resetZBuffers();

    behind.flagForRedraw();
    behind.draw(new IntPoint(0, 0));
    normal.flagForRedraw();
    normal.draw(new IntPoint(0, 0));

    const lines = view.renderToString();
    expect(charAt(lines, 0, 0)).toBe("N");
    expect(charAt(lines, 1, 0)).toBe("N");
    expect(charAt(lines, 2, 0)).toBe("B");
  });

  it("z-index works with elements at different positions", () => {
    const view = new TestRenderTarget(10, 1);

    // base fills the whole row
    const base = new TextElement({ key: "base", view, text: "AAAAAAAAAA", widthType: "content", heightType: "content", zIndex: 0 });
    // overlay at position (3, 0)
    const overlay = new TextElement({ key: "overlay", view, text: "OO", widthType: "content", heightType: "content", zIndex: 1 });

    activate(base, view);
    activate(overlay, view);

    view.resetZBuffers();

    base.flagForRedraw();
    base.draw(new IntPoint(0, 0));
    overlay.flagForRedraw();
    overlay.draw(new IntPoint(3, 0)); // offset by 3

    const lines = view.renderToString();
    expect(charAt(lines, 2, 0)).toBe("A");
    expect(charAt(lines, 3, 0)).toBe("O");
    expect(charAt(lines, 4, 0)).toBe("O");
    expect(charAt(lines, 5, 0)).toBe("A");
  });

  it("animation layer at lower z does not bleed through higher-z content", () => {
    const view = new TestRenderTarget(5, 1);

    // Simulate: element A (z=0) has animation chars on the animation layer
    // Element B (z=1) draws normally to both layers
    view.resetZBuffers();

    // A writes to animation layer at z=0 (simulating an active animation)
    view.setAnimationLayerChar("a", new IntPoint(0, 0), ZERO_POINT, 0);
    view.setAnimationLayerChar("a", new IntPoint(1, 0), ZERO_POINT, 0);
    view.setAnimationLayerChar("a", new IntPoint(2, 0), ZERO_POINT, 0);

    // B writes to content layer at z=1
    view.setContentLayerChar("B", new IntPoint(0, 0), ZERO_POINT, 1);
    view.setContentLayerChar("B", new IntPoint(1, 0), ZERO_POINT, 1);

    const lines = view.renderToString();
    // B's content (z=1) should win over A's animation (z=0)
    expect(charAt(lines, 0, 0)).toBe("B");
    expect(charAt(lines, 1, 0)).toBe("B");
    // Cell (2,0): only A's animation at z=0, no higher-z content → animation wins
    expect(charAt(lines, 2, 0)).toBe("a");
  });

  it("animation layer at same z wins over content layer (normal animation behavior)", () => {
    const view = new TestRenderTarget(3, 1);

    view.resetZBuffers();

    // Both at z=0: content has "C", animation has "A"
    view.setContentLayerChar("C", new IntPoint(0, 0), ZERO_POINT, 0);
    view.setAnimationLayerChar("A", new IntPoint(0, 0), ZERO_POINT, 0);

    const lines = view.renderToString();
    // Animation wins at same z (preserves existing animation behavior)
    expect(charAt(lines, 0, 0)).toBe("A");
  });

  it("animation layer at higher z wins over lower-z content", () => {
    const view = new TestRenderTarget(3, 1);

    view.resetZBuffers();

    view.setContentLayerChar("C", new IntPoint(0, 0), ZERO_POINT, 0);
    view.setAnimationLayerChar("A", new IntPoint(0, 0), ZERO_POINT, 1);

    const lines = view.renderToString();
    expect(charAt(lines, 0, 0)).toBe("A");
  });

  it("higher-z content wins over lower-z animation", () => {
    const view = new TestRenderTarget(3, 1);

    view.resetZBuffers();

    // Animation at z=0, content at z=1
    view.setAnimationLayerChar("A", new IntPoint(0, 0), ZERO_POINT, 0);
    view.setContentLayerChar("C", new IntPoint(0, 0), ZERO_POINT, 1);

    const lines = view.renderToString();
    // Content at z=1 beats animation at z=0
    expect(charAt(lines, 0, 0)).toBe("C");
  });

  it("z-buffer resets between frames", () => {
    const view = new TestRenderTarget(3, 1);

    // Frame 1: high-z element writes
    view.resetZBuffers();
    view.setContentLayerChar("H", new IntPoint(0, 0), ZERO_POINT, 10);

    // Frame 2: reset, then low-z element should succeed
    view.resetZBuffers();
    view.contentLayer.clear();
    view.animationLayer.clear();
    view.setContentLayerChar("L", new IntPoint(0, 0), ZERO_POINT, 0);

    const lines = view.renderToString();
    expect(charAt(lines, 0, 0)).toBe("L");
  });

  it("multiple z-levels stack correctly", () => {
    const view = new TestRenderTarget(5, 1);

    view.resetZBuffers();

    // z=0: fills all 5 cells
    for (let x = 0; x < 5; x++) {
      view.setContentLayerChar("0", new IntPoint(x, 0), ZERO_POINT, 0);
    }
    // z=1: covers cells 1-3
    for (let x = 1; x < 4; x++) {
      view.setContentLayerChar("1", new IntPoint(x, 0), ZERO_POINT, 1);
    }
    // z=2: covers cell 2 only
    view.setContentLayerChar("2", new IntPoint(2, 0), ZERO_POINT, 2);

    const lines = view.renderToString();
    expect([...lines[0]].slice(0, 5).join("")).toBe("01210");
  });

  it("SPACE_CHAR in animation layer falls through to content regardless of z", () => {
    const view = new TestRenderTarget(3, 1);

    view.resetZBuffers();

    view.setContentLayerChar("C", new IntPoint(0, 0), ZERO_POINT, 0);
    // Animation layer has SPACE_CHAR at higher z — should still fall through
    view.setAnimationLayerChar(SPACE_CHAR, new IntPoint(0, 0), ZERO_POINT, 5);

    const lines = view.renderToString();
    expect(charAt(lines, 0, 0)).toBe("C");
  });

  it("overlay container with zIndex renders on top of base content", () => {
    const view = new TestRenderTarget(10, 3);

    const base = new TextElement({
      key: "base",
      view,
      text: "XXXXXXXXXX",
      widthType: "content",
      heightType: "content",
      zIndex: 0,
    });

    const overlay = new TextElement({
      key: "overlay",
      view,
      text: "OO",
      widthType: "content",
      heightType: "content",
      zIndex: 1,
    });

    activate(base, view);
    activate(overlay, view);

    view.resetZBuffers();

    // Draw base first (fills row 0)
    base.flagForRedraw();
    base.draw(new IntPoint(0, 0));

    // Draw overlay at position (4, 0)
    overlay.flagForRedraw();
    overlay.draw(new IntPoint(4, 0));

    const lines = view.renderToString();
    expect(charAt(lines, 3, 0)).toBe("X");
    expect(charAt(lines, 4, 0)).toBe("O");
    expect(charAt(lines, 5, 0)).toBe("O");
    expect(charAt(lines, 6, 0)).toBe("X");
  });
});
