import { SPACE_CHAR } from "../constants";
import { AXES } from "../types/Axes";
import { IntPoint } from "../types/IntPoint";
import { Element, ElementConfig } from "./Element";

export interface ColumnDef {
  width?: number;
  widthType?: "absolute" | "relative" | "expand";
  header?: string;
  align?: "start" | "center" | "end";
}

export interface TableCellConfig {
  text?: string;
  element?: Element;
}

export interface TableRowConfig {
  cells: (TableCellConfig | Element)[];
}

export interface TableElementConfig extends ElementConfig {
  columns: ColumnDef[];
  title?: string;
  titleAlign?: "start" | "center" | "end";
  showRowSeparators?: boolean;
}

export class TableElement extends Element {
  private columns: ColumnDef[];
  private title: string | undefined;
  private titleAlign: "start" | "center" | "end";
  private showRowSeparators: boolean;
  private rows: TableRowConfig[] = [];

  // Computed layout state
  private resolvedColumnWidths: number[] = [];
  private cachedGrid: string[] = [];

  // Element cells: track which cells are Elements vs text
  private elementCells: { element: Element; row: number; col: number }[] = [];
  private isProcessing = false;

  constructor(config: TableElementConfig) {
    super({ ...config, bordered: false });
    this.columns = config.columns;
    this.title = config.title;
    this.titleAlign = config.titleAlign ?? "start";
    this.showRowSeparators = config.showRowSeparators ?? true;
    this.reprocessContent();
  }

  // --- Public API ---

  public setRows(rows: TableRowConfig[]): void {
    // Unregister old element children
    for (const { element } of this.elementCells) {
      element.unregisterWithView();
    }

    this.rows = rows;

    // Collect element cells and register them as children
    this.elementCells = [];
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      for (let colIdx = 0; colIdx < row.cells.length; colIdx++) {
        const cell = row.cells[colIdx];
        const el = cell instanceof Element
          ? cell
          : (cell as TableCellConfig).element;
        if (el) {
          this.elementCells.push({ element: el, row: rowIdx, col: colIdx });
        }
      }
    }

    this.children = this.elementCells.map((ec) => ec.element);
    for (const child of this.children) {
      child.setParent(this);
      if (this.isOnView) {
        child.registerWithView();
      }
    }

    this.reprocessContent();
    this.flagForRedraw();
  }

  public setTitle(title: string): void {
    this.title = title;
    this.reprocessContent();
    this.flagForRedraw();
  }

  // --- Override child management ---

  // Table manages cell sizes directly; use reprocessContent instead of generic resize logic.
  protected override resizeChildren(): void {
    if (this.isProcessing) return;
    this.reprocessContent();
  }

  public override handleChildResize(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.reprocessContent();
    this.flagForRedraw();
    this.isProcessing = false;
  }

  // --- Element abstract methods ---

  protected reprocessContent(): void {
    this.isProcessing = true;
    this.resolveColumnWidths();

    const hasTitle = !!this.title;
    const hasHeaders = this.columns.some((c) => c.header !== undefined);

    // Word-wrap title
    const titleLines = hasTitle
      ? this.wrapText(this.title!, this.getInnerContentWidth())
      : [];

    // Word-wrap headers
    const headerCells = hasHeaders
      ? this.columns.map((col, i) =>
          this.wrapText(col.header || "", this.resolvedColumnWidths[i])
        )
      : [];
    const headerHeight = hasHeaders
      ? Math.max(1, ...headerCells.map((h) => h.length))
      : 0;

    // Process data cells: text cells get word-wrapped, element cells get sized
    const dataCells: string[][][] = [];
    const rowHeights: number[] = [];

    for (let rowIdx = 0; rowIdx < this.rows.length; rowIdx++) {
      const row = this.rows[rowIdx];
      const rowCells: string[][] = [];
      let maxHeight = 1;

      for (let colIdx = 0; colIdx < this.columns.length; colIdx++) {
        const cellConfig = row.cells[colIdx];
        const colWidth = this.resolvedColumnWidths[colIdx];

        // Check if this cell has an element
        const el = this.getElementCell(rowIdx, colIdx);
        if (el) {
          // Element cell: size it, use its height, put empty text in grid
          el.setSize(new IntPoint(colWidth, 0));
          const elHeight = Math.max(1, el.getSize().getY());
          if (elHeight > maxHeight) maxHeight = elHeight;
          rowCells.push([""]); // placeholder — element draws itself
        } else {
          // Text cell
          const text = cellConfig
            ? (cellConfig instanceof Element ? "" : (cellConfig as TableCellConfig).text || "")
            : "";
          const wrapped = this.wrapText(text, colWidth);
          if (wrapped.length > maxHeight) maxHeight = wrapped.length;
          rowCells.push(wrapped);
        }
      }

      dataCells.push(rowCells);
      rowHeights.push(maxHeight);
    }

    // Vertical expansion
    if (this.sizingMethod.y !== "content" && this.rows.length > 0) {
      this.expandRowHeights(rowHeights, titleLines.length, headerHeight, dataCells.length);
    }

    // Resize element cells to final row heights and position all element cells
    this.positionElementCells(rowHeights, titleLines.length, headerHeight);

    // Build the grid (element cell slots will be empty/spaces)
    this.cachedGrid = this.buildGrid(
      titleLines,
      headerCells,
      headerHeight,
      dataCells,
      rowHeights
    );

    // Update content size
    const totalWidth = this.calculateTotalWidth();
    const totalHeight = this.cachedGrid.length;
    this.contentSize = new IntPoint(totalWidth, totalHeight);

    // If content-sized, update element size
    const newSize = this.size.copy();
    const boundarySize = this.getTotalBoundarySize();
    for (const a of AXES) {
      if (this.sizingMethod[a] === "content") {
        newSize.set(a, this.contentSize.get(a) + boundarySize.get(a));
      }
    }
    this.flagForRedraw();
    this.setSize(newSize);
    this.updateScrollShowing();
    this.isProcessing = false;
  }

  protected drawOwnContent(offset: IntPoint): void {
    const totalOffset = this.getContentOffset().add(offset);
    const grid = this.cachedGrid;

    this.forEachVisiblePointInContentArea((p) => {
      const y = p.getY();
      const x = p.getX();
      if (y < grid.length) {
        const chars = [...grid[y]];
        if (x < chars.length) {
          this.drawChar(chars[x], p, totalOffset);
        }
      }
    });
  }

  protected handleClick(): void {}
  protected handleMouseEnter(): void {}
  protected handleMouseLeave(): void {}
  protected handleUnregisterWithView(): void {}
  protected handleTransitionStart(): void {}

  // --- Element cell helpers ---

  private getElementCell(row: number, col: number): Element | null {
    const found = this.elementCells.find(
      (ec) => ec.row === row && ec.col === col
    );
    return found ? found.element : null;
  }

  private positionElementCells(
    rowHeights: number[],
    titleLineCount: number,
    headerHeight: number
  ): void {
    for (const { element, row, col } of this.elementCells) {
      const colWidth = this.resolvedColumnWidths[col];
      const rowHeight = rowHeights[row];

      // Set final size (width from column, height from row)
      element.setSize(new IntPoint(colWidth, rowHeight));

      // Calculate position within the table's content area
      let xOffset = 1; // left border
      for (let c = 0; c < col; c++) {
        xOffset += this.resolvedColumnWidths[c] + 1; // column width + separator
      }

      let yOffset = 1; // top border
      if (titleLineCount > 0) {
        yOffset += titleLineCount + 1; // title rows + separator
      }
      if (headerHeight > 0) {
        yOffset += headerHeight;
        if (this.rows.length > 0) yOffset += 1; // header separator
      }
      for (let r = 0; r < row; r++) {
        yOffset += rowHeights[r];
        if (this.showRowSeparators) yOffset += 1;
      }

      element.setPosition(new IntPoint(xOffset, yOffset));
    }
  }

  private expandRowHeights(
    rowHeights: number[],
    titleLineCount: number,
    headerHeight: number,
    numDataRows: number
  ): void {
    const contentAreaHeight = this.getContentAreaSize().getY();
    let fixedHeight = 2; // top + bottom border
    if (titleLineCount > 0) {
      fixedHeight += titleLineCount + 1;
    }
    if (headerHeight > 0) {
      fixedHeight += headerHeight;
      if (numDataRows > 0) fixedHeight += 1;
    }
    if (this.showRowSeparators && numDataRows > 1) {
      fixedHeight += numDataRows - 1;
    }

    const contentRowHeight = rowHeights.reduce((a, b) => a + b, 0);
    const availableForRows = contentAreaHeight - fixedHeight;
    if (availableForRows > contentRowHeight) {
      const targetHeight = Math.floor(availableForRows / rowHeights.length);
      let shortRows = 0;
      for (const h of rowHeights) {
        if (h <= targetHeight) shortRows++;
      }
      const spaceForShort = availableForRows - rowHeights.reduce(
        (acc, h) => acc + (h > targetHeight ? h : 0), 0
      );
      const perShort = shortRows > 0 ? Math.floor(spaceForShort / shortRows) : 0;
      const shortRemainder = shortRows > 0 ? spaceForShort - perShort * shortRows : 0;
      let shortIdx = 0;
      for (let i = 0; i < rowHeights.length; i++) {
        if (rowHeights[i] <= targetHeight) {
          rowHeights[i] = perShort + (shortIdx < shortRemainder ? 1 : 0);
          shortIdx++;
        }
      }
    }
  }

  // --- Grid building ---

  private buildGrid(
    titleLines: string[],
    headerCells: string[][],
    headerHeight: number,
    dataCells: string[][][],
    rowHeights: number[]
  ): string[] {
    const lines: string[] = [];
    const hasTitle = titleLines.length > 0;
    const hasHeaders = headerHeight > 0;

    // Top border
    if (hasTitle) {
      lines.push(this.buildHorizontalLine("╭", "─", "─", "╮"));
    } else {
      lines.push(this.buildHorizontalLine("╭", "─", "┬", "╮"));
    }

    // Title rows
    if (hasTitle) {
      const innerWidth = this.getInnerContentWidth();
      for (const line of titleLines) {
        lines.push("│" + this.padText(line, innerWidth, this.titleAlign) + "│");
      }
      lines.push(this.buildHorizontalLine("├", "─", "┬", "┤"));
    }

    // Header rows
    if (hasHeaders) {
      for (let lineIdx = 0; lineIdx < headerHeight; lineIdx++) {
        let row = "│";
        for (let col = 0; col < this.columns.length; col++) {
          const text = headerCells[col]?.[lineIdx] || "";
          const align = this.columns[col].align || "start";
          row += this.padText(text, this.resolvedColumnWidths[col], align);
          row += "│";
        }
        lines.push(row);
      }
      if (dataCells.length > 0) {
        lines.push(this.buildHorizontalLine("├", "─", "┼", "┤"));
      }
    }

    // Data rows
    for (let rowIdx = 0; rowIdx < dataCells.length; rowIdx++) {
      const rowData = dataCells[rowIdx];
      const rowHeight = rowHeights[rowIdx];

      for (let lineIdx = 0; lineIdx < rowHeight; lineIdx++) {
        let row = "│";
        for (let col = 0; col < this.columns.length; col++) {
          // Element cells have empty text — the element draws itself
          const isElementCell = this.getElementCell(rowIdx, col) !== null;
          if (isElementCell) {
            row += SPACE_CHAR.repeat(this.resolvedColumnWidths[col]);
          } else {
            const text = rowData[col]?.[lineIdx] || "";
            const align = this.columns[col].align || "start";
            row += this.padText(text, this.resolvedColumnWidths[col], align);
          }
          row += "│";
        }
        lines.push(row);
      }

      if (this.showRowSeparators && rowIdx < dataCells.length - 1) {
        lines.push(this.buildHorizontalLine("├", "─", "┼", "┤"));
      }
    }

    // Bottom border
    lines.push(this.buildHorizontalLine("╰", "─", "┴", "╯"));

    return lines;
  }

  private buildHorizontalLine(
    left: string,
    fill: string,
    junction: string,
    right: string
  ): string {
    let line = left;
    for (let col = 0; col < this.resolvedColumnWidths.length; col++) {
      line += fill.repeat(this.resolvedColumnWidths[col]);
      if (col < this.resolvedColumnWidths.length - 1) {
        line += junction;
      }
    }
    line += right;
    return line;
  }

  private padText(
    text: string,
    width: number,
    align: "start" | "center" | "end"
  ): string {
    const chars = [...text];
    const textLen = chars.length;
    if (textLen >= width) {
      return chars.slice(0, width).join("");
    }
    const gap = width - textLen;
    switch (align) {
      case "end":
        return SPACE_CHAR.repeat(gap) + text;
      case "center": {
        const leftPad = Math.floor(gap / 2);
        const rightPad = gap - leftPad;
        return SPACE_CHAR.repeat(leftPad) + text + SPACE_CHAR.repeat(rightPad);
      }
      case "start":
      default:
        return text + SPACE_CHAR.repeat(gap);
    }
  }

  // --- Column width resolution ---

  private resolveColumnWidths(): void {
    const numCols = this.columns.length;
    const contentAreaWidth = this.getContentAreaSize().getX();
    const borderChars = numCols + 1;
    const availableWidth = contentAreaWidth - borderChars;

    if (availableWidth <= 0) {
      this.resolvedColumnWidths = new Array(numCols).fill(0);
      return;
    }

    const widths = new Array(numCols).fill(0);
    let usedWidth = 0;
    let expandCount = 0;

    for (let i = 0; i < numCols; i++) {
      const col = this.columns[i];
      const type = col.widthType || "expand";
      if (type === "absolute") {
        widths[i] = col.width || 0;
        usedWidth += widths[i];
      } else if (type === "expand") {
        expandCount++;
      }
    }

    const afterAbsolute = availableWidth - usedWidth;
    let relativeTotal = 0;
    for (let i = 0; i < numCols; i++) {
      if ((this.columns[i].widthType || "expand") === "relative") {
        relativeTotal += this.columns[i].width || 1;
      }
    }
    for (let i = 0; i < numCols; i++) {
      const col = this.columns[i];
      if ((col.widthType || "expand") === "relative") {
        const proportion = (col.width || 1) / relativeTotal;
        widths[i] = Math.floor(afterAbsolute * proportion);
        usedWidth += widths[i];
      }
    }

    if (expandCount > 0) {
      const remaining = availableWidth - usedWidth;
      const perExpand = Math.floor(remaining / expandCount);
      const extraPixels = remaining - perExpand * expandCount;
      let assigned = 0;
      for (let i = 0; i < numCols; i++) {
        if ((this.columns[i].widthType || "expand") === "expand") {
          widths[i] = perExpand + (assigned < extraPixels ? 1 : 0);
          assigned++;
        }
      }
    }

    this.resolvedColumnWidths = widths;
  }

  // --- Utilities ---

  private calculateTotalWidth(): number {
    return (
      this.resolvedColumnWidths.reduce((a, b) => a + b, 0) +
      this.columns.length +
      1
    );
  }

  private getInnerContentWidth(): number {
    return (
      this.resolvedColumnWidths.reduce((a, b) => a + b, 0) +
      (this.columns.length - 1)
    );
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) return [""];
    if (text === "") return [""];

    const inputLines = text.split("\n");
    const result: string[] = [];

    for (const inputLine of inputLines) {
      const words = inputLine.split(" ");
      let currentLine = "";

      for (const word of words) {
        const wordChars = [...word];
        if (wordChars.length > maxWidth) {
          if ([...currentLine].length > 0) {
            result.push(currentLine);
            currentLine = "";
          }
          for (let i = 0; i < wordChars.length; i += maxWidth) {
            const chunk = wordChars.slice(i, i + maxWidth).join("");
            if (i + maxWidth < wordChars.length) {
              result.push(chunk);
            } else {
              currentLine = chunk;
            }
          }
        } else if ([...currentLine].length === 0) {
          currentLine = word;
        } else if ([...currentLine].length + 1 + wordChars.length > maxWidth) {
          result.push(currentLine);
          currentLine = word;
        } else {
          currentLine += " " + word;
        }
      }
      result.push(currentLine);
    }

    return result.length > 0 ? result : [""];
  }
}
