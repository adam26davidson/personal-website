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
}

export interface TableRowConfig {
  cells: TableCellConfig[];
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
    this.rows = rows;
    this.reprocessContent();
    this.flagForRedraw();
  }

  public setTitle(title: string): void {
    this.title = title;
    this.reprocessContent();
    this.flagForRedraw();
  }

  // --- Element abstract methods ---

  protected reprocessContent(): void {
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

    // Word-wrap data cells
    const dataCells = this.rows.map((row) =>
      this.columns.map((_, colIndex) => {
        const cellText = row.cells[colIndex]?.text || "";
        return this.wrapText(cellText, this.resolvedColumnWidths[colIndex]);
      })
    );
    const rowHeights = dataCells.map((row) =>
      Math.max(1, ...row.map((cell) => cell.length))
    );

    // Build the grid
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
      // Title-to-headers/data separator
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
      // Header separator (only if there are data rows)
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
          const text = rowData[col]?.[lineIdx] || "";
          const align = this.columns[col].align || "start";
          row += this.padText(text, this.resolvedColumnWidths[col], align);
          row += "│";
        }
        lines.push(row);
      }

      // Row separator (not after last row)
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

    // First pass: absolute columns
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

    // Second pass: relative columns
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

    // Third pass: expand columns
    if (expandCount > 0) {
      const remaining = availableWidth - usedWidth;
      const perExpand = Math.floor(remaining / expandCount);
      let assigned = 0;
      for (let i = 0; i < numCols; i++) {
        if ((this.columns[i].widthType || "expand") === "expand") {
          assigned++;
          widths[i] =
            assigned === expandCount
              ? remaining - perExpand * (expandCount - 1)
              : perExpand;
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

    // Split on actual spaces (not SPACE_CHAR) for word wrapping
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const wordChars = [...word];
      if (wordChars.length > maxWidth) {
        // Break long word across lines
        if ([...currentLine].length > 0) {
          lines.push(currentLine);
          currentLine = "";
        }
        for (let i = 0; i < wordChars.length; i += maxWidth) {
          const chunk = wordChars.slice(i, i + maxWidth).join("");
          if (i + maxWidth < wordChars.length) {
            lines.push(chunk);
          } else {
            currentLine = chunk;
          }
        }
      } else if ([...currentLine].length === 0) {
        currentLine = word;
      } else if ([...currentLine].length + 1 + wordChars.length > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += " " + word;
      }
    }
    if ([...currentLine].length > 0 || lines.length === 0) {
      lines.push(currentLine);
    }
    return lines;
  }
}
