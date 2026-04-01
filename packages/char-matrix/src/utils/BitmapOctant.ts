import { octantChar } from "./Octant";

/**
 * A 2D pixel buffer represented as a flat boolean array.
 * Pixels are stored row-major: index = y * width + x.
 */
export class PixelBuffer {
  public readonly width: number;
  public readonly height: number;
  private pixels: boolean[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Array(width * height).fill(false);
  }

  get(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.pixels[y * this.width + x];
  }

  set(x: number, y: number, value: boolean): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.pixels[y * this.width + x] = value;
  }

  /**
   * Blit a glyph (boolean[][]) onto this buffer at the given offset.
   * glyph[row][col] = true means pixel on.
   */
  blit(glyph: boolean[][], offsetX: number, offsetY: number): void {
    for (let y = 0; y < glyph.length; y++) {
      const row = glyph[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          this.set(offsetX + x, offsetY + y, true);
        }
      }
    }
  }
}

/**
 * Convert a PixelBuffer to octant character strings.
 * Each octant character represents a 2×4 sub-pixel region.
 * Returns ceil(height/4) strings, each ceil(width/2) characters long.
 */
export function pixelBufferToOctant(buf: PixelBuffer): string[] {
  const octRows = Math.ceil(buf.height / 4);
  const octCols = Math.ceil(buf.width / 2);
  const rows: string[] = [];

  for (let octRow = 0; octRow < octRows; octRow++) {
    let line = "";
    for (let octCol = 0; octCol < octCols; octCol++) {
      let bits = 0;
      for (let subRow = 0; subRow < 4; subRow++) {
        const py = octRow * 4 + subRow;
        const pxLeft = octCol * 2;
        const pxRight = octCol * 2 + 1;
        if (buf.get(pxLeft, py)) bits |= 1 << (subRow * 2);
        if (buf.get(pxRight, py)) bits |= 1 << (subRow * 2 + 1);
      }
      line += octantChar(bits);
    }
    rows.push(line);
  }

  return rows;
}
