import { describe, it, expect } from "vitest";
import { TableElement } from "./TableElement";
import TextElement from "./TextElement";
import { IntPoint, ZERO_POINT } from "../types/IntPoint";
import { SPACE_CHAR } from "../constants";
import { CharMatrix } from "../types/CharMatrix";
import type { RenderTarget } from "../interfaces/RenderTarget";
import type { CursorType } from "./ElementBase";
import type { Element } from "./Element";
import { ContainerElement } from "./ContainerElement";
import { X, Y } from "../types/Axes";

/**
 * A minimal RenderTarget implementation for testing.
 * Captures characters written via setContentLayerChar into a CharMatrix.
 */
function createMockView(width: number, height: number): RenderTarget & { getMatrix: () => CharMatrix } {
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
    getMatrix() { return matrix; },
  };
}

/**
 * Helper: creates a table inside a parent container (required for draw to work,
 * since forEachVisiblePoint requires a parent), draws it, and returns the
 * rendered lines from the mock view's matrix.
 */
function renderTable(
  config: Parameters<typeof TableElement.prototype.constructor>[0] & { view: ReturnType<typeof createMockView> },
  rows?: Parameters<typeof TableElement['prototype']['setRows']>[0]
): string[] {
  const view = config.view;
  const size = view.getSize();

  // Create a parent container so forEachVisiblePoint works
  const parent = new ContainerElement({
    key: "test-parent",
    view,
    mainAxis: Y,
    width: size.getX(),
    widthType: "absolute",
    height: size.getY(),
    heightType: "absolute",
  });

  const table = new TableElement(config);
  if (rows) {
    table.setRows(rows);
  }

  parent.setChildren([table]);
  parent.draw(ZERO_POINT);

  // Extract rendered lines from matrix
  const matrix = view.getMatrix();
  const rawMatrix = matrix.getRawMatrix();
  return rawMatrix.map(row => row.join(""));
}

// ── Grid building tests (test the grid output directly) ──

describe("TableElement", () => {

  describe("grid structure", () => {
    it("renders a minimal table with no title, no headers, one row", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }, { widthType: "expand" }],
        width: 13,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "A" }, { text: "B" }] },
      ]);

      // Width 13: 3 border chars (│ │ │) + 10 content = 5 per column
      // Height: top border + 1 data row + bottom border = 3
      expect(lines[0]).toContain("╭─────┬─────╮");
      expect(lines[1]).toContain("│A" + SPACE_CHAR.repeat(4) + "│B" + SPACE_CHAR.repeat(4) + "│");
      expect(lines[2]).toContain("╰─────┴─────╯");
    });

    it("renders column headers with separator below", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [
          { header: "X", widthType: "expand" },
          { header: "Y", widthType: "expand" },
        ],
        width: 13,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "1" }, { text: "2" }] },
      ]);

      // top border with ┬
      expect(lines[0]).toContain("╭─────┬─────╮");
      // header row
      expect(lines[1]).toContain("│X" + SPACE_CHAR.repeat(4) + "│Y" + SPACE_CHAR.repeat(4) + "│");
      // header separator with ┼
      expect(lines[2]).toContain("├─────┼─────┤");
      // data row
      expect(lines[3]).toContain("│1" + SPACE_CHAR.repeat(4) + "│2" + SPACE_CHAR.repeat(4) + "│");
      // bottom border
      expect(lines[4]).toContain("╰─────┴─────╯");
    });

    it("renders a title row with no column separators on top", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [
          { header: "A", widthType: "expand" },
          { header: "B", widthType: "expand" },
        ],
        title: "My Title",
        width: 13,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "1" }, { text: "2" }] },
      ]);

      // top border: smooth, no ┬
      expect(lines[0]).toContain("╭───────────╮");
      // title row spans full width
      expect(lines[1]).toContain("│My Title");
      expect(lines[1]).toContain("│");
      // title-to-header separator has ┬
      expect(lines[2]).toContain("├─────┬─────┤");
      // header row
      expect(lines[3]).toContain("│A");
      // header separator
      expect(lines[4]).toContain("├─────┼─────┤");
      // data
      expect(lines[5]).toContain("│1");
      // bottom
      expect(lines[6]).toContain("╰─────┴─────╯");
    });

    it("renders row separators between data rows", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
        showRowSeparators: true,
      }, [
        { cells: [{ text: "A" }] },
        { cells: [{ text: "B" }] },
        { cells: [{ text: "C" }] },
      ]);

      expect(lines[0]).toContain("╭──────╮");
      expect(lines[1]).toContain("│A");
      expect(lines[2]).toContain("├──────┤"); // separator (no ┼ with 1 column)
      expect(lines[3]).toContain("│B");
      expect(lines[4]).toContain("├──────┤");
      expect(lines[5]).toContain("│C");
      expect(lines[6]).toContain("╰──────╯");
    });

    it("omits row separators when showRowSeparators is false", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
        showRowSeparators: false,
      }, [
        { cells: [{ text: "A" }] },
        { cells: [{ text: "B" }] },
      ]);

      expect(lines[0]).toContain("╭──────╮");
      expect(lines[1]).toContain("│A");
      expect(lines[2]).toContain("│B");
      expect(lines[3]).toContain("╰──────╯");
    });
  });

  describe("column width resolution", () => {
    it("distributes expand columns equally", () => {
      const view = createMockView(30, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [
          { widthType: "expand" },
          { widthType: "expand" },
          { widthType: "expand" },
        ],
        width: 16, // 4 border chars + 12 content = 4 per column
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "A" }, { text: "B" }, { text: "C" }] },
      ]);

      expect(lines[0]).toContain("╭────┬────┬────╮");
    });

    it("respects absolute column widths", () => {
      const view = createMockView(30, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [
          { width: 3, widthType: "absolute" },
          { widthType: "expand" },
        ],
        width: 12, // 3 border chars + 9 content; col0=3, col1=6
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "AB" }, { text: "CD" }] },
      ]);

      expect(lines[0]).toContain("╭───┬──────╮");
    });
  });

  describe("text alignment", () => {
    it("aligns text to start by default", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand", align: "start" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "Hi" }] },
      ]);

      expect(lines[1]).toContain("│Hi" + SPACE_CHAR.repeat(4) + "│");
    });

    it("aligns text to end", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand", align: "end" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "Hi" }] },
      ]);

      expect(lines[1]).toContain("│" + SPACE_CHAR.repeat(4) + "Hi│");
    });

    it("aligns text to center", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand", align: "center" }],
        width: 8, // 6 inner chars, "Hi" = 2 chars, 2 left pad, 2 right pad
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "Hi" }] },
      ]);

      expect(lines[1]).toContain("│" + SPACE_CHAR.repeat(2) + "Hi" + SPACE_CHAR.repeat(2) + "│");
    });
  });

  describe("word wrapping and row height", () => {
    it("wraps text and increases row height", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 6, // 2 border + 4 content
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "AB CD" }] }, // "AB" on line 1, "CD" on line 2
      ]);

      expect(lines[0]).toContain("╭────╮");
      expect(lines[1]).toContain("│AB" + SPACE_CHAR + SPACE_CHAR + "│"); // "AB" + 2 spaces
      expect(lines[2]).toContain("│CD" + SPACE_CHAR + SPACE_CHAR + "│");
      expect(lines[3]).toContain("╰────╯");
    });

    it("uses tallest cell for row height", () => {
      const view = createMockView(30, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [
          { width: 4, widthType: "absolute" },
          { width: 4, widthType: "absolute" },
        ],
        width: 11, // 3 borders + 8 content
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "AB CD" }, { text: "X" }] },
        // col0 wraps to 2 lines, col1 is 1 line → row height = 2
      ]);

      expect(lines[0]).toContain("╭────┬────╮");
      expect(lines[1]).toContain("│AB" + SPACE_CHAR + SPACE_CHAR + "│X" + SPACE_CHAR.repeat(3) + "│");
      expect(lines[2]).toContain("│CD" + SPACE_CHAR + SPACE_CHAR + "│" + SPACE_CHAR.repeat(4) + "│"); // col1 padded empty
      expect(lines[3]).toContain("╰────┴────╯");
    });
  });

  describe("edge cases", () => {
    it("handles fewer cells than columns", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }, { widthType: "expand" }],
        width: 11,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "A" }] }, // only 1 cell for 2 columns
      ]);

      // Should render both columns, second one empty
      expect(lines[1]).toContain("│A" + SPACE_CHAR.repeat(3) + "│" + SPACE_CHAR.repeat(4) + "│");
    });

    it("handles empty rows array", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ header: "Col", widthType: "expand" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
      });

      // Should render headers with no data rows
      expect(lines[0]).toContain("╭──────╮");
      expect(lines[1]).toContain("│Col");
      expect(lines[2]).toContain("╰──────╯");
    });

    it("handles empty string cell text", () => {
      const view = createMockView(20, 10);
      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 6,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ text: "" }] },
      ]);

      expect(lines[1]).toContain("│" + SPACE_CHAR.repeat(4) + "│");
    });
  });

  describe("setRows and setTitle", () => {
    it("updates rows dynamically", () => {
      const view = createMockView(20, 10);

      const parent = new ContainerElement({
        key: "p",
        view,
        mainAxis: Y,
        width: 20,
        widthType: "absolute",
        height: 10,
        heightType: "absolute",
      });

      const table = new TableElement({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
      });

      table.setRows([{ cells: [{ text: "A" }] }]);
      parent.setChildren([table]);
      parent.draw(ZERO_POINT);

      let rawMatrix = view.getMatrix().getRawMatrix();
      let firstDataLine = rawMatrix[1].join("");
      expect(firstDataLine).toContain("│A");

      // Update rows
      table.setRows([{ cells: [{ text: "Z" }] }]);
      parent.draw(ZERO_POINT);

      rawMatrix = view.getMatrix().getRawMatrix();
      firstDataLine = rawMatrix[1].join("");
      expect(firstDataLine).toContain("│Z");
    });
  });

  describe("content sizing height", () => {
    it("calculates correct height for title + headers + rows + separators", () => {
      const view = createMockView(30, 30);

      const parent = new ContainerElement({
        key: "p",
        view,
        mainAxis: Y,
        width: 30,
        widthType: "absolute",
        height: 30,
        heightType: "absolute",
      });

      const table = new TableElement({
        key: "t",
        view,
        columns: [{ header: "H", widthType: "expand" }],
        title: "Title",
        width: 10,
        widthType: "absolute",
        heightType: "content",
        showRowSeparators: true,
      });

      table.setRows([
        { cells: [{ text: "A" }] },
        { cells: [{ text: "B" }] },
      ]);

      parent.setChildren([table]);

      // Expected height:
      // 1 top border
      // 1 title row
      // 1 title-to-header separator
      // 1 header row
      // 1 header-to-data separator
      // 1 data row A
      // 1 row separator
      // 1 data row B
      // 1 bottom border
      // = 9
      expect(table.getSize().getY()).toBe(9);
    });
  });

  describe("resize with expand height", () => {
    it("table with expand height renders after parent resize", () => {
      const view = createMockView(40, 30);

      const root = new ContainerElement({
        key: "root", view, mainAxis: Y,
        width: 40, widthType: "absolute",
        height: 30, heightType: "absolute",
        spacing: 1,
      });

      const topRow = new TextElement({
        key: "top-row", view,
        text: "Header",
        widthType: "expand", heightType: "content",
      });

      const table = new TableElement({
        key: "calendar", view,
        columns: [
          { header: "A", widthType: "expand" },
          { header: "B", widthType: "expand" },
        ],
        title: "Calendar",
        width: 1, widthType: "relative",
        heightType: "expand",
        backgroundChar: SPACE_CHAR,
      });

      table.setRows([
        { cells: [{ text: "1" }, { text: "2" }] },
        { cells: [{ text: "3" }, { text: "4" }] },
      ]);

      root.setChildren([topRow, table]);

      const viewParent = new ContainerElement({
        key: "view", view, mainAxis: Y,
        width: 40, widthType: "absolute",
        height: 30, heightType: "absolute",
      });
      viewParent.setChildren([root]);
      viewParent.draw(ZERO_POINT);

      expect(table.getSize().getY()).toBeGreaterThan(0);
      expect(table.getSize().getX()).toBeGreaterThan(0);

      let raw = view.getMatrix().getRawMatrix().map(r => r.join(""));
      expect(raw.some(l => l.includes("Calendar"))).toBe(true);

      // Resize
      view.getMatrix().resize(new IntPoint(40, 30));
      root.setSize(new IntPoint(35, 25));
      root.flagForRedraw();
      root.draw(ZERO_POINT);

      expect(table.getSize().getY()).toBeGreaterThan(0);
      expect(table.getSize().getX()).toBeGreaterThan(0);

      raw = view.getMatrix().getRawMatrix().map(r => r.join(""));
      expect(raw.some(l => l.includes("Calendar"))).toBe(true);
    });

    it("table column widths update after parent width change", () => {
      const view = createMockView(40, 20);

      const root = new ContainerElement({
        key: "root", view, mainAxis: Y,
        width: 20, widthType: "absolute",
        height: 20, heightType: "absolute",
      });

      const table = new TableElement({
        key: "t", view,
        columns: [{ header: "Col", widthType: "expand" }],
        width: 1, widthType: "relative",
        heightType: "expand",
        backgroundChar: SPACE_CHAR,
      });

      table.setRows([{ cells: [{ text: "data" }] }]);
      root.setChildren([table]);
      root.draw(ZERO_POINT);

      expect(table.getSize().getX()).toBe(20);

      root.setSize(new IntPoint(30, 20));
      root.flagForRedraw();

      expect(table.getSize().getX()).toBe(30);
      expect(table.getSize().getY()).toBeGreaterThan(0);
    });

    it("expand table height adjusts when parent height changes", () => {
      const view = createMockView(40, 30);

      const root = new ContainerElement({
        key: "root", view, mainAxis: Y,
        width: 40, widthType: "absolute",
        height: 20, heightType: "absolute",
        spacing: 0,
      });

      const topRow = new ContainerElement({
        key: "top-row", view, mainAxis: X,
        width: 1, widthType: "relative",
        heightType: "content",
      });
      topRow.setChildren([new TextElement({
        key: "header-text", view,
        text: "Header",
        widthType: "content", heightType: "content",
      })]);

      const table = new TableElement({
        key: "t", view,
        columns: [{ widthType: "expand" }],
        width: 1, widthType: "relative",
        heightType: "expand",
        backgroundChar: SPACE_CHAR,
      });
      table.setRows([{ cells: [{ text: "X" }] }]);

      root.setChildren([topRow, table]);

      expect(topRow.getSize().getY()).toBe(1);
      expect(table.getSize().getY()).toBe(19);

      root.setSize(new IntPoint(40, 30));
      root.flagForRedraw();

      expect(topRow.getSize().getY()).toBe(1);
      expect(table.getSize().getY()).toBe(29);
    });

    it("dashboard-like layout: expand table survives resize", () => {
      const VIEW_W = 80;
      const VIEW_H = 40;
      const view = createMockView(VIEW_W, VIEW_H);

      const root = new ContainerElement({
        key: "dashboard-root", view, mainAxis: Y,
        width: 1, widthType: "relative",
        height: 1, heightType: "relative",
        spacing: 1, paddingX: 2, paddingY: 1,
      });

      const dateText = new TextElement({ key: "date", view, text: "Friday", widthType: "content", heightType: "content" });
      const clockText = new TextElement({ key: "clock", view, text: "12:00", widthType: "content", heightType: "content" });
      const dateTimeCol = new ContainerElement({ key: "date-time-col", view, mainAxis: Y, widthType: "expand", heightType: "content", spacing: 1 });
      dateTimeCol.setChildren([dateText, clockText]);

      const transitTable = new TableElement({
        key: "transit", view,
        columns: [{ header: "City", widthType: "expand" }, { header: "South", widthType: "expand" }],
        title: "U6", showRowSeparators: false,
        width: 32, widthType: "absolute", heightType: "content",
        backgroundChar: SPACE_CHAR,
      });
      transitTable.setRows([{ cells: [{ text: "3 min" }, { text: "5 min" }] }]);

      const topRow = new ContainerElement({
        key: "top-row", view, mainAxis: X,
        width: 1, widthType: "relative", heightType: "content",
        alignItems: "start", spacing: 2,
      });
      topRow.setChildren([dateTimeCol, transitTable]);

      const calendar = new TableElement({
        key: "calendar", view,
        columns: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(h => ({
          header: h, widthType: "expand" as const, align: "start" as const,
        })),
        title: "April 2026", titleAlign: "center",
        showRowSeparators: true,
        width: 1, widthType: "relative", heightType: "expand",
        backgroundChar: SPACE_CHAR,
      });
      calendar.setRows([
        { cells: [{ text: "" }, { text: "" }, { text: "" }, { text: "1" }, { text: "2" }, { text: "3" }, { text: "4" }] },
      ]);

      root.setChildren([topRow, calendar]);

      const viewParent = new ContainerElement({
        key: "view", view, mainAxis: Y,
        width: VIEW_W, widthType: "absolute",
        height: VIEW_H, heightType: "absolute",
      });
      viewParent.setChildren([root]);
      viewParent.draw(ZERO_POINT);

      expect(calendar.getSize().getX()).toBeGreaterThan(0);
      expect(calendar.getSize().getY()).toBeGreaterThan(5);

      let raw = view.getMatrix().getRawMatrix().map(r => r.join(""));
      expect(raw.some(l => l.includes("April 2026"))).toBe(true);

      // Resize
      view.getMatrix().resize(new IntPoint(VIEW_W, VIEW_H));
      viewParent.setSize(new IntPoint(60, 30));
      viewParent.flagForRedraw();
      viewParent.draw(ZERO_POINT);

      expect(calendar.getSize().getX()).toBeGreaterThan(0);
      expect(calendar.getSize().getY()).toBeGreaterThan(5);

      raw = view.getMatrix().getRawMatrix().map(r => r.join(""));
      expect(raw.some(l => l.includes("April 2026"))).toBe(true);
      expect(raw.some(l => l.includes("Sun"))).toBe(true);
    });
  });

  describe("element cells", () => {
    it("accepts an Element as a cell", () => {
      const view = createMockView(20, 10);

      const cellElement = new TextElement({
        key: "custom-cell",
        view,
        text: "HI",
        widthType: "content",
        heightType: "content",
      });

      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }, { widthType: "expand" }],
        width: 13,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [{ element: cellElement }, { text: "B" }] },
      ]);

      // The element cell should have spaces in the grid (element draws itself)
      // The text cell should render normally
      expect(lines[0]).toContain("╭─────┬─────╮");
      expect(lines[2]).toContain("╰─────┴─────╯");
      // Text cell B should be visible
      expect(lines[1]).toContain("B");
    });

    it("accepts an Element directly in the cells array", () => {
      const view = createMockView(20, 10);

      const cellElement = new TextElement({
        key: "direct-el",
        view,
        text: "X",
        widthType: "content",
        heightType: "content",
      });

      const lines = renderTable({
        key: "t",
        view,
        columns: [{ widthType: "expand" }],
        width: 8,
        widthType: "absolute",
        heightType: "content",
      }, [
        { cells: [cellElement as any] },
      ]);

      expect(lines[0]).toContain("╭──────╮");
      expect(lines[2]).toContain("╰──────╯");
    });

    it("element cell height drives row height", () => {
      const view = createMockView(30, 30);

      // Create a multi-line element
      const cellElement = new TextElement({
        key: "tall-cell",
        view,
        text: "Line1\nLine2\nLine3",
        widthType: "content",
        heightType: "content",
      });

      const parent = new ContainerElement({
        key: "p",
        view,
        mainAxis: Y,
        width: 30,
        widthType: "absolute",
        height: 30,
        heightType: "absolute",
      });

      const table = new TableElement({
        key: "t",
        view,
        columns: [{ widthType: "expand" }, { widthType: "expand" }],
        width: 15,
        widthType: "absolute",
        heightType: "content",
      });

      table.setRows([
        { cells: [{ element: cellElement }, { text: "Short" }] },
      ]);

      parent.setChildren([table]);

      // Row height should be driven by the element (3 lines)
      // Total: top border + 3 row lines + bottom border = 5
      expect(table.getSize().getY()).toBe(5);
    });
  });
});
