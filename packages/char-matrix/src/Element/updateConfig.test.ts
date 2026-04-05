import { describe, it, expect } from "vitest";
import { ContainerElement } from "./ContainerElement";
import TextElement from "./TextElement";
import { TableElement } from "./TableElement";
import { IntPoint, ZERO_POINT } from "../types/IntPoint";
import { CharMatrix } from "../types/CharMatrix";
import { X, Y } from "../types/Axes";
import type { RenderTarget } from "../interfaces/RenderTarget";
import type { CursorType } from "./ElementBase";
import type { Element } from "./Element";

function createMockView(width: number, height: number): RenderTarget {
  const matrix = new CharMatrix(new IntPoint(width, height));
  const animMatrix = new CharMatrix(new IntPoint(width, height));
  return {
    setCursor(_cursor: CursorType) {},
    setContentLayerChar(char: string, location: IntPoint, offset: IntPoint = ZERO_POINT) {
      matrix.setChar(location, char, offset);
    },
    getContentLayerChar(location: IntPoint, offset: IntPoint = ZERO_POINT) {
      return matrix.getChar(location, offset);
    },
    setAnimationLayerChar(char: string, location: IntPoint, offset: IntPoint = ZERO_POINT) {
      animMatrix.setChar(location, char, offset);
    },
    getPixelOffset() { return ZERO_POINT; },
    getSize() { return new IntPoint(width, height); },
    getIsMobile() { return false; },
    registerElement(_element: Element) {},
    unregisterElement(_element: Element) {},
    setRoot(element: Element) {},
    getRoot(): Element { return null as any; },
  };
}

/** Helper to create a container inside a parent so it's on-view and can draw. */
function withParent(view: RenderTarget, child: Element): ContainerElement {
  const parent = new ContainerElement({
    key: "test-parent",
    view,
    mainAxis: Y,
    width: view.getSize().getX(),
    widthType: "absolute",
    height: view.getSize().getY(),
    heightType: "absolute",
  });
  parent.setChildren([child]);
  parent.startTransition("enter");
  return parent;
}

// ---------------------------------------------------------------------------
// ContainerElement.updateContainerConfig
// ---------------------------------------------------------------------------
describe("ContainerElement.updateContainerConfig", () => {
  it("updates mainAxis and re-layouts children", () => {
    const view = createMockView(40, 20);
    const container = new ContainerElement({
      key: "c",
      view,
      mainAxis: X,
      width: 40,
      widthType: "absolute",
      height: 20,
      heightType: "absolute",
    });
    const childA = new TextElement({ key: "a", view, text: "AA" });
    const childB = new TextElement({ key: "b", view, text: "BB" });

    withParent(view, container);
    container.setChildren([childA, childB]);

    // Children should be laid out along X initially
    const aOffsetX = childA.getOffset().getX();
    const bOffsetX = childB.getOffset().getX();
    expect(bOffsetX).toBeGreaterThan(aOffsetX);

    // Switch to Y axis
    container.updateContainerConfig({ mainAxis: Y });

    const aOffsetY = childA.getOffset().getY();
    const bOffsetY = childB.getOffset().getY();
    expect(bOffsetY).toBeGreaterThan(aOffsetY);
  });

  it("updates spacing between children", () => {
    const view = createMockView(40, 20);
    const container = new ContainerElement({
      key: "c",
      view,
      mainAxis: X,
      width: 40,
      widthType: "absolute",
      height: 20,
      heightType: "absolute",
    });
    const childA = new TextElement({ key: "a", view, text: "A" });
    const childB = new TextElement({ key: "b", view, text: "B" });

    withParent(view, container);
    container.setChildren([childA, childB]);

    const gapBefore = childB.getOffset().getX() - (childA.getOffset().getX() + childA.getSize().getX());

    container.updateContainerConfig({ spacing: 5 });

    const gapAfter = childB.getOffset().getX() - (childA.getOffset().getX() + childA.getSize().getX());
    expect(gapAfter).toBe(5);
    expect(gapAfter).toBeGreaterThan(gapBefore);
  });

  it("updates padding", () => {
    const view = createMockView(40, 20);
    const container = new ContainerElement({
      key: "c",
      view,
      mainAxis: Y,
      width: 40,
      widthType: "absolute",
      height: 20,
      heightType: "absolute",
    });

    withParent(view, container);

    const boundaryBefore = container.getTotalBoundarySize();
    expect(boundaryBefore.getX()).toBe(0);

    container.updateContainerConfig({ paddingLeft: 3, paddingRight: 3 });

    const boundaryAfter = container.getTotalBoundarySize();
    expect(boundaryAfter.getX()).toBe(6);
  });

  it("updates zIndex", () => {
    const view = createMockView(40, 20);
    const container = new ContainerElement({
      key: "c",
      view,
      mainAxis: Y,
    });

    withParent(view, container);
    expect(container.getZIndex()).toBe(0);

    container.updateContainerConfig({ zIndex: 5 });
    expect(container.getZIndex()).toBe(5);
  });

  it("updates position mode", () => {
    const view = createMockView(40, 20);
    const container = new ContainerElement({
      key: "c",
      view,
      mainAxis: Y,
    });

    withParent(view, container);
    expect(container.getPositionMode()).toBe("flow");

    container.updateContainerConfig({ position: "absolute" });
    expect(container.getPositionMode()).toBe("absolute");
  });
});

// ---------------------------------------------------------------------------
// TextElement.updateTextConfig
// ---------------------------------------------------------------------------
describe("TextElement.updateTextConfig", () => {
  it("updates text content", () => {
    const view = createMockView(40, 10);
    const text = new TextElement({ key: "t", view, text: "hello" });

    withParent(view, text);
    expect(text.getKey()).toBe("t");

    text.updateTextConfig({ text: "world" });
    // Element should still function after update (no crash)
    expect(text.getSize().getX()).toBeGreaterThan(0);
  });

  it("updates width and widthType", () => {
    const view = createMockView(40, 10);
    const text = new TextElement({ key: "t", view, text: "hi" });

    withParent(view, text);

    text.updateTextConfig({ width: 20, widthType: "absolute" });
    expect(text.getSize().getX()).toBe(20);
    expect(text.getSizingMethod().x).toBe("absolute");
  });

  it("updates border", () => {
    const view = createMockView(40, 10);
    const text = new TextElement({
      key: "t",
      view,
      text: "hi",
      width: 20,
      widthType: "absolute",
      height: 5,
      heightType: "absolute",
    });

    withParent(view, text);

    const boundaryBefore = text.getTotalBoundarySize();
    expect(boundaryBefore.getX()).toBe(0);

    text.updateTextConfig({ bordered: true });
    const boundaryAfter = text.getTotalBoundarySize();
    expect(boundaryAfter.getX()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// TableElement.updateTableConfig
// ---------------------------------------------------------------------------
describe("TableElement.updateTableConfig", () => {
  it("updates title", () => {
    const view = createMockView(40, 20);
    const table = new TableElement({
      key: "t",
      view,
      columns: [{ width: 10, widthType: "absolute" }],
      width: 40,
      widthType: "absolute",
      height: 10,
      heightType: "absolute",
      title: "Old Title",
    });

    withParent(view, table);

    // Should not throw
    table.updateTableConfig({ title: "New Title" });
    expect(table.getSize().getY()).toBeGreaterThan(0);
  });

  it("updates showRowSeparators", () => {
    const view = createMockView(40, 20);
    const table = new TableElement({
      key: "t",
      view,
      columns: [{ width: 10, widthType: "absolute" }],
      width: 40,
      widthType: "absolute",
      height: 10,
      heightType: "absolute",
    });

    withParent(view, table);

    // Should not throw
    table.updateTableConfig({ showRowSeparators: false });
  });

  it("updates columns", () => {
    const view = createMockView(40, 20);
    const table = new TableElement({
      key: "t",
      view,
      columns: [{ width: 10, widthType: "absolute" }],
      width: 40,
      widthType: "absolute",
      height: 10,
      heightType: "absolute",
    });

    withParent(view, table);

    table.updateTableConfig({
      columns: [
        { width: 15, widthType: "absolute" },
        { width: 20, widthType: "absolute" },
      ],
    });
    // Should not throw and element should still have valid dimensions
    expect(table.getSize().getX()).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ElementBase.updateBaseConfig sizing edge cases
// ---------------------------------------------------------------------------
describe("updateBaseConfig sizing", () => {
  it("explicit widthType takes precedence over width inference", () => {
    const view = createMockView(40, 10);
    const el = new ContainerElement({
      key: "c",
      view,
      mainAxis: Y,
      width: 20,
      widthType: "absolute",
      height: 10,
      heightType: "absolute",
    });

    withParent(view, el);

    // Set widthType to content explicitly, even though width is provided
    el.updateContainerConfig({ widthType: "content", width: 0.5 });
    expect(el.getSizingMethod().x).toBe("content");
  });

  it("updates offset via xOffset/yOffset", () => {
    const view = createMockView(40, 10);
    const el = new ContainerElement({
      key: "c",
      view,
      mainAxis: Y,
    });

    withParent(view, el);
    expect(el.getOffset().getX()).toBe(0);

    el.updateContainerConfig({ xOffset: 5, yOffset: 3 });
    expect(el.getOffset().getX()).toBe(5);
    expect(el.getOffset().getY()).toBe(3);
  });
});
