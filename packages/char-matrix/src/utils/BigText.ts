import { PixelBuffer, pixelBufferToOctant } from "./BitmapOctant";
import { getUnifontGlyph } from "./UnifontRegistry";

/**
 * Map a Unicode codepoint to the ASCII codepoint whose Unifont glyph
 * should be used. Handles Mathematical Bold letters (U+1D400–U+1D433)
 * by mapping them back to their ASCII equivalents.
 */
function toAsciiCodepoint(codepoint: number): number {
  // Mathematical Bold Uppercase: U+1D400–U+1D419 → A-Z
  if (codepoint >= 0x1d400 && codepoint <= 0x1d419) {
    return codepoint - 0x1d400 + 0x41;
  }
  // Mathematical Bold Lowercase: U+1D41A–U+1D433 → a-z
  if (codepoint >= 0x1d41a && codepoint <= 0x1d433) {
    return codepoint - 0x1d41a + 0x61;
  }
  return codepoint;
}

/**
 * Bundled Unifont hex data for printable ASCII (U+0020–U+007E).
 * Kept inline for fast zero-parse access to the most common characters.
 * Each entry is codepoint:hex where hex is 32 hex chars (8×16 bitmap).
 */
const ASCII_HEX: Record<number, string> = {
  0x20: "00000000000000000000000000000000",
  0x21: "00000000080808080808080008080000",
  0x22: "00002222222200000000000000000000",
  0x23: "000000001212127E24247E4848480000",
  0x24: "00000000083E4948380E09493E080000",
  0x25: "00000000314A4A340808162929460000",
  0x26: "000000001C2222141829454246390000",
  0x27: "00000808080800000000000000000000",
  0x28: "00000004080810101010101008080400",
  0x29: "00000020101008080808080810102000",
  0x2a: "00000000000008492A1C2A4908000000",
  0x2b: "0000000000000808087F080808000000",
  0x2c: "00000000000000000000000018080810",
  0x2d: "0000000000000000003C000000000000",
  0x2e: "00000000000000000000000018180000",
  0x2f: "00000000020204080810102040400000",
  0x30: "00000000182442464A52624224180000",
  0x31: "000000000818280808080808083E0000",
  0x32: "000000003C4242020C102040407E0000",
  0x33: "000000003C4242021C020242423C0000",
  0x34: "00000000040C142444447E0404040000",
  0x35: "000000007E4040407C020202423C0000",
  0x36: "000000001C2040407C424242423C0000",
  0x37: "000000007E0202040404080808080000",
  0x38: "000000003C4242423C424242423C0000",
  0x39: "000000003C4242423E02020204380000",
  0x3a: "00000000000018180000001818000000",
  0x3b: "00000000000018180000001808081000",
  0x3c: "00000000000204081020100804020000",
  0x3d: "000000000000007E0000007E00000000",
  0x3e: "00000000004020100804081020400000",
  0x3f: "000000003C4242020408080008080000",
  0x40: "000000001C224A565252524E201E0000",
  0x41: "0000000018242442427E424242420000",
  0x42: "000000007C4242427C424242427C0000",
  0x43: "000000003C42424040404042423C0000",
  0x44: "00000000784442424242424244780000",
  0x45: "000000007E4040407C404040407E0000",
  0x46: "000000007E4040407C40404040400000",
  0x47: "000000003C424240404E4242463A0000",
  0x48: "00000000424242427E42424242420000",
  0x49: "000000003E08080808080808083E0000",
  0x4a: "000000001F0404040404044444380000",
  0x4b: "00000000424448506060504844420000",
  0x4c: "000000004040404040404040407E0000",
  0x4d: "00000000424266665A5A424242420000",
  0x4e: "0000000042626252524A4A4646420000",
  0x4f: "000000003C42424242424242423C0000",
  0x50: "000000007C4242427C40404040400000",
  0x51: "000000003C4242424242425A663C0300",
  0x52: "000000007C4242427C48444442420000",
  0x53: "000000003C424240300C0242423C0000",
  0x54: "000000007F0808080808080808080000",
  0x55: "000000004242424242424242423C0000",
  0x56: "00000000414141222222141408080000",
  0x57: "00000000424242425A5A666642420000",
  0x58: "00000000424224241818242442420000",
  0x59: "00000000414122221408080808080000",
  0x5a: "000000007E02020408102040407E0000",
  0x5b: "0000000E080808080808080808080E00",
  0x5c: "00000000404020101008080402020000",
  0x5d: "00000070101010101010101010107000",
  0x5e: "00001824420000000000000000000000",
  0x5f: "00000000000000000000000000007F00",
  0x60: "00201008000000000000000000000000",
  0x61: "0000000000003C42023E4242463A0000",
  0x62: "0000004040405C6242424242625C0000",
  0x63: "0000000000003C4240404040423C0000",
  0x64: "0000000202023A4642424242463A0000",
  0x65: "0000000000003C42427E4040423C0000",
  0x66: "0000000C1010107C1010101010100000",
  0x67: "0000000000023A44444438203C42423C",
  0x68: "0000004040405C624242424242420000",
  0x69: "000000080800180808080808083E0000",
  0x6a: "0000000404000C040404040404044830",
  0x6b: "00000040404044485060504844420000",
  0x6c: "000000180808080808080808083E0000",
  0x6d: "00000000000076494949494949490000",
  0x6e: "0000000000005C624242424242420000",
  0x6f: "0000000000003C4242424242423C0000",
  0x70: "0000000000005C6242424242625C4040",
  0x71: "0000000000003A4642424242463A0202",
  0x72: "0000000000005C624240404040400000",
  0x73: "0000000000003C4240300C02423C0000",
  0x74: "000000001010107C10101010100C0000",
  0x75: "000000000000424242424242463A0000",
  0x76: "00000000000042424224242418180000",
  0x77: "00000000000041494949494949360000",
  0x78: "00000000000042422418182442420000",
  0x79: "0000000000004242424242261A02023C",
  0x7a: "0000000000007E0204081020407E0000",
  0x7b: "0000000C10100808102010080810100C",
  0x7c: "00000808080808080808080808080808",
  0x7d: "00000030080810100804081010080830",
  0x7e: "00000031494600000000000000000000",
};

/** Height of Unifont glyphs in pixels (always 16) */
const GLYPH_HEIGHT = 16;

/**
 * Parse a Unifont hex string into a boolean pixel grid.
 * Handles both 8×16 (32 hex chars) and 16×16 (64 hex chars) glyphs.
 */
export function parseHexGlyph(hex: string): boolean[][] {
  const isWide = hex.length === 64;
  const bytesPerRow = isWide ? 2 : 1;
  const pixelWidth = isWide ? 16 : 8;
  const grid: boolean[][] = [];

  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    const bits: boolean[] = [];
    for (let b = 0; b < bytesPerRow; b++) {
      const byteVal = parseInt(hex.slice((row * bytesPerRow + b) * 2, (row * bytesPerRow + b) * 2 + 2), 16);
      for (let bit = 7; bit >= 0; bit--) {
        bits.push(((byteVal >> bit) & 1) === 1);
      }
    }
    // Ensure consistent width
    grid.push(bits.slice(0, pixelWidth));
  }
  return grid;
}

interface ResolvedGlyph {
  grid: boolean[][];
  width: number;
}

/**
 * Get the pixel grid for a character.
 * Checks inline ASCII table first, then falls back to the full Unifont registry.
 */
function getGlyph(char: string): ResolvedGlyph | null {
  const rawCodepoint = char.codePointAt(0) ?? 0;
  const codepoint = toAsciiCodepoint(rawCodepoint);

  // Fast path: inline ASCII glyphs (always 8px wide)
  const asciiHex = ASCII_HEX[codepoint];
  if (asciiHex) {
    return { grid: parseHexGlyph(asciiHex), width: 8 };
  }

  // Full Unifont registry lookup
  const unifontGlyph = getUnifontGlyph(codepoint);
  if (unifontGlyph) {
    return { grid: parseHexGlyph(unifontGlyph.hex), width: unifontGlyph.width };
  }

  return null;
}

/**
 * Render a string as big text by compositing all character bitmaps
 * into a single pixel buffer, then converting to octants.
 *
 * Supports any character in Unifont Planes 0–1, including
 * mixed half-width (8px) and full-width (16px) glyphs.
 *
 * @param text The string to render
 * @param spacing Extra pixels between characters (default 0)
 * @returns 4 strings of octant characters
 */
export function toBigText(text: string, spacing: number = 0): string[] {
  if (text.length === 0) {
    return ["", "", "", ""];
  }

  const chars = [...text];

  // Resolve all glyphs and calculate total width
  const glyphs: (ResolvedGlyph | null)[] = chars.map((c) => getGlyph(c));
  let totalWidth = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    totalWidth += g ? g.width : 8; // default to 8px for unknown
    if (i < glyphs.length - 1) totalWidth += spacing;
  }

  const buf = new PixelBuffer(totalWidth, GLYPH_HEIGHT);
  let x = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    if (g) {
      buf.blit(g.grid, x, 0);
      x += g.width;
    } else {
      x += 8;
    }
    if (i < glyphs.length - 1) x += spacing;
  }

  return pixelBufferToOctant(buf);
}

/**
 * Render a single character as big text using octants.
 * Returns 4 strings (4 octant rows for 8×16) or more for wider glyphs.
 */
export function toBigChar(char: string): string[] {
  return toBigText(char, 0);
}
