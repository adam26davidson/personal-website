import { PixelBuffer, pixelBufferToOctant } from "./BitmapOctant";

/**
 * Bundled Spleen 5×8 bitmap data for printable ASCII (U+0020–U+007E).
 * Each entry is 8 hex bytes (one per row), top 5 bits are the glyph pixels.
 */
const SPLEEN_5X8: Record<number, string[]> = {
  0x20: ["00","00","00","00","00","00","00","00"],
  0x21: ["20","20","20","20","20","00","20","00"],
  0x22: ["50","50","50","00","00","00","00","00"],
  0x23: ["00","50","F8","50","50","F8","50","00"],
  0x24: ["20","70","A0","60","30","30","E0","20"],
  0x25: ["10","90","A0","20","40","50","90","80"],
  0x26: ["20","50","50","60","A8","90","68","00"],
  0x27: ["20","20","20","00","00","00","00","00"],
  0x28: ["10","20","40","40","40","40","20","10"],
  0x29: ["40","20","10","10","10","10","20","40"],
  0x2a: ["00","00","90","60","F0","60","90","00"],
  0x2b: ["00","00","20","20","F8","20","20","00"],
  0x2c: ["00","00","00","00","00","20","20","40"],
  0x2d: ["00","00","00","00","F0","00","00","00"],
  0x2e: ["00","00","00","00","00","00","20","00"],
  0x2f: ["10","10","20","20","40","40","80","80"],
  0x30: ["00","60","90","B0","D0","90","60","00"],
  0x31: ["00","20","60","20","20","20","70","00"],
  0x32: ["00","60","90","10","60","80","F0","00"],
  0x33: ["00","60","90","20","10","90","60","00"],
  0x34: ["00","80","A0","A0","F0","20","20","00"],
  0x35: ["00","F0","80","E0","10","10","E0","00"],
  0x36: ["00","60","80","E0","90","90","60","00"],
  0x37: ["00","F0","90","10","20","40","40","00"],
  0x38: ["00","60","90","60","90","90","60","00"],
  0x39: ["00","60","90","90","70","10","60","00"],
  0x3a: ["00","00","00","20","00","00","20","00"],
  0x3b: ["00","00","00","20","00","20","20","40"],
  0x3c: ["00","10","20","40","40","20","10","00"],
  0x3d: ["00","00","00","F0","00","F0","00","00"],
  0x3e: ["00","40","20","10","10","20","40","00"],
  0x3f: ["60","90","10","20","40","00","40","00"],
  0x40: ["00","60","90","B0","B0","80","70","00"],
  0x41: ["00","60","90","90","F0","90","90","00"],
  0x42: ["00","E0","90","E0","90","90","E0","00"],
  0x43: ["00","70","80","80","80","80","70","00"],
  0x44: ["00","E0","90","90","90","90","E0","00"],
  0x45: ["00","70","80","E0","80","80","70","00"],
  0x46: ["00","70","80","80","E0","80","80","00"],
  0x47: ["00","70","80","B0","90","90","70","00"],
  0x48: ["00","90","90","F0","90","90","90","00"],
  0x49: ["00","70","20","20","20","20","70","00"],
  0x4a: ["00","70","20","20","20","20","C0","00"],
  0x4b: ["00","90","90","E0","90","90","90","00"],
  0x4c: ["00","80","80","80","80","80","70","00"],
  0x4d: ["00","90","F0","F0","90","90","90","00"],
  0x4e: ["00","90","D0","D0","B0","B0","90","00"],
  0x4f: ["00","60","90","90","90","90","60","00"],
  0x50: ["00","E0","90","90","E0","80","80","00"],
  0x51: ["00","60","90","90","90","90","60","30"],
  0x52: ["00","E0","90","90","E0","90","90","00"],
  0x53: ["00","70","80","60","10","10","E0","00"],
  0x54: ["00","F8","20","20","20","20","20","00"],
  0x55: ["00","90","90","90","90","90","70","00"],
  0x56: ["00","90","90","90","90","60","60","00"],
  0x57: ["00","90","90","90","F0","F0","90","00"],
  0x58: ["00","90","90","60","60","90","90","00"],
  0x59: ["00","90","90","90","70","10","E0","00"],
  0x5a: ["00","F0","10","20","40","80","F0","00"],
  0x5b: ["70","40","40","40","40","40","40","70"],
  0x5c: ["80","80","40","40","20","20","10","10"],
  0x5d: ["70","10","10","10","10","10","10","70"],
  0x5e: ["00","20","50","88","00","00","00","00"],
  0x5f: ["00","00","00","00","00","00","00","F0"],
  0x60: ["40","20","00","00","00","00","00","00"],
  0x61: ["00","00","60","10","70","90","70","00"],
  0x62: ["80","80","E0","90","90","90","E0","00"],
  0x63: ["00","00","70","80","80","80","70","00"],
  0x64: ["10","10","70","90","90","90","70","00"],
  0x65: ["00","00","70","90","F0","80","70","00"],
  0x66: ["30","40","40","E0","40","40","40","00"],
  0x67: ["00","00","70","90","90","60","10","E0"],
  0x68: ["80","80","E0","90","90","90","90","00"],
  0x69: ["00","20","00","60","20","20","30","00"],
  0x6a: ["00","20","00","20","20","20","20","C0"],
  0x6b: ["80","80","90","A0","C0","A0","90","00"],
  0x6c: ["40","40","40","40","40","40","30","00"],
  0x6d: ["00","00","90","F0","F0","90","90","00"],
  0x6e: ["00","00","E0","90","90","90","90","00"],
  0x6f: ["00","00","60","90","90","90","60","00"],
  0x70: ["00","00","E0","90","90","E0","80","80"],
  0x71: ["00","00","70","90","90","70","10","10"],
  0x72: ["00","00","70","90","80","80","80","00"],
  0x73: ["00","00","70","80","60","10","E0","00"],
  0x74: ["40","40","E0","40","40","40","30","00"],
  0x75: ["00","00","90","90","90","90","70","00"],
  0x76: ["00","00","90","90","90","60","60","00"],
  0x77: ["00","00","90","90","F0","F0","90","00"],
  0x78: ["00","00","90","60","60","90","90","00"],
  0x79: ["00","00","90","90","90","70","10","E0"],
  0x7a: ["00","00","F0","10","20","40","F0","00"],
  0x7b: ["30","40","40","C0","C0","40","40","30"],
  0x7c: ["20","20","20","20","20","20","20","20"],
  0x7d: ["C0","20","20","30","30","20","20","C0"],
  0x7e: ["00","00","00","48","B0","00","00","00"],
};

/** Width of Spleen 5×8 glyphs in pixels */
const GLYPH_WIDTH = 5;
/** Height of Spleen 5×8 glyphs in pixels */
const GLYPH_HEIGHT = 8;

/**
 * Map a Unicode codepoint to the ASCII codepoint whose glyph
 * should be used. Handles Mathematical Bold letters.
 */
function toAsciiCodepoint(codepoint: number): number {
  if (codepoint >= 0x1d400 && codepoint <= 0x1d419) {
    return codepoint - 0x1d400 + 0x41;
  }
  if (codepoint >= 0x1d41a && codepoint <= 0x1d433) {
    return codepoint - 0x1d41a + 0x61;
  }
  return codepoint;
}

/**
 * Parse Spleen hex rows into a pixel grid.
 * Returns an 8×5 boolean grid (8 rows, 5 columns).
 */
export function parseSpleenGlyph(hexRows: string[]): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    const byte = parseInt(hexRows[row], 16);
    const bits: boolean[] = [];
    for (let bit = 7; bit >= 7 - (GLYPH_WIDTH - 1); bit--) {
      bits.push(((byte >> bit) & 1) === 1);
    }
    grid.push(bits);
  }
  return grid;
}

/**
 * Get the pixel grid for a character, or null if unknown.
 */
function getGlyph(char: string): boolean[][] | null {
  const rawCodepoint = char.codePointAt(0) ?? 0;
  const codepoint = toAsciiCodepoint(rawCodepoint);
  const hexRows = SPLEEN_5X8[codepoint];
  if (!hexRows) return null;
  return parseSpleenGlyph(hexRows);
}

/**
 * Look up a Spleen 5×8 glyph by codepoint.
 * Returns the parsed pixel grid and dimensions, or null if not found.
 */
export function getSpleen5x8Glyph(codepoint: number): { grid: boolean[][]; width: number; height: number } | null {
  const mapped = toAsciiCodepoint(codepoint);
  const hexRows = SPLEEN_5X8[mapped];
  if (!hexRows) return null;
  return { grid: parseSpleenGlyph(hexRows), width: GLYPH_WIDTH, height: GLYPH_HEIGHT };
}

/**
 * Render a string as compact big text by compositing all character
 * bitmaps into a single pixel buffer, then converting to octants.
 *
 * Characters are placed at true pixel width (5px) with configurable
 * spacing, so adjacent glyphs can share octant cells at boundaries.
 *
 * @param text The string to render
 * @param spacing Extra pixels between characters (default 1)
 * @returns ceil(8/4) = 2 strings of octant characters
 */
export function toCompactBigText(text: string, spacing: number = 1): string[] {
  if (text.length === 0) {
    return ["", ""];
  }

  const chars = [...text];
  const advance = GLYPH_WIDTH + spacing;
  const totalWidth = chars.length * advance - spacing;
  const buf = new PixelBuffer(totalWidth, GLYPH_HEIGHT);

  for (let i = 0; i < chars.length; i++) {
    const glyph = getGlyph(chars[i]);
    if (glyph) {
      buf.blit(glyph, i * advance, 0);
    }
  }

  return pixelBufferToOctant(buf);
}

/**
 * Render a single character as compact big text using octants.
 * Returns 2 strings, each ceil(5/2) = 3 characters long.
 */
export function toCompactBigChar(char: string): string[] {
  return toCompactBigText(char, 0);
}
