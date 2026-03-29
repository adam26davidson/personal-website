/**
 * Block Octant character utilities.
 *
 * Each character cell is a 2×4 grid of pixels (8 cells).
 * Bit layout:
 *   bit0 bit1   (row 0, top)
 *   bit2 bit3   (row 1)
 *   bit4 bit5   (row 2)
 *   bit6 bit7   (row 3, bottom)
 *
 * Characters are encoded at U+1CD00-U+1CDE5 (230 chars),
 * with 26 patterns pre-existing in other Unicode blocks.
 */

/** The 26 pre-existing octant patterns and their codepoints */
const PRE_EXISTING: Record<number, number> = {
  0x00: 0x0020,  // SPACE
  0x01: 0x1CEA8, // LEFT HALF UPPER ONE QUARTER
  0x02: 0x1CEAB, // RIGHT HALF UPPER ONE QUARTER
  0x03: 0x1FB82, // UPPER ONE QUARTER BLOCK
  0x05: 0x2598,  // QUADRANT UPPER LEFT
  0x0A: 0x259D,  // QUADRANT UPPER RIGHT
  0x0F: 0x2580,  // UPPER HALF BLOCK
  0x14: 0x1FBE6, // MIDDLE LEFT ONE QUARTER BLOCK
  0x28: 0x1FBE7, // MIDDLE RIGHT ONE QUARTER BLOCK
  0x3F: 0x1FB85, // UPPER THREE QUARTERS BLOCK
  0x40: 0x1CEA3, // LEFT HALF LOWER ONE QUARTER
  0x50: 0x2596,  // QUADRANT LOWER LEFT
  0x55: 0x258C,  // LEFT HALF BLOCK
  0x5A: 0x259E,  // QUADRANT UPPER RIGHT AND LOWER LEFT
  0x5F: 0x259B,  // QUADRANT UL+UR+LL
  0x80: 0x1CEA0, // RIGHT HALF LOWER ONE QUARTER
  0xA0: 0x2597,  // QUADRANT LOWER RIGHT
  0xA5: 0x259A,  // QUADRANT UL+LR
  0xAA: 0x2590,  // RIGHT HALF BLOCK
  0xAF: 0x259C,  // QUADRANT UL+UR+LR
  0xC0: 0x2582,  // LOWER ONE QUARTER BLOCK
  0xF0: 0x2584,  // LOWER HALF BLOCK
  0xF5: 0x2599,  // QUADRANT UL+LL+LR
  0xFA: 0x259F,  // QUADRANT UR+LL+LR
  0xFC: 0x2586,  // LOWER THREE QUARTERS BLOCK
  0xFF: 0x2588,  // FULL BLOCK
};

/** Sorted pre-existing pattern values for offset calculation */
const PRE_EXISTING_SORTED = Object.keys(PRE_EXISTING)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * Convert an 8-bit octant pattern to the corresponding Unicode character.
 *
 * @param bits 8-bit pattern (0-255) where each bit represents one cell
 *   in the 2×4 grid (bit 0 = top-left, bit 7 = bottom-right)
 */
export function octantChar(bits: number): string {
  if (bits in PRE_EXISTING) {
    return String.fromCodePoint(PRE_EXISTING[bits]);
  }
  const skip = PRE_EXISTING_SORTED.filter((e) => e < bits).length;
  return String.fromCodePoint(0x1CD00 + bits - skip);
}

/**
 * Convert a 2×4 boolean grid to an octant character.
 *
 * @param grid Array of 4 rows, each an array of 2 booleans [left, right].
 *   grid[0] is the top row, grid[3] is the bottom row.
 */
export function octantFromGrid(grid: [boolean, boolean][]): string {
  let bits = 0;
  for (let row = 0; row < 4; row++) {
    const r = grid[row] ?? [false, false];
    if (r[0]) bits |= 1 << (row * 2);
    if (r[1]) bits |= 1 << (row * 2 + 1);
  }
  return octantChar(bits);
}

/**
 * Convert a 2×4 grid of pixel values to an octant character.
 * Each value is treated as truthy/falsy.
 *
 * @param pixels Flat array of 8 values in row-major order:
 *   [row0left, row0right, row1left, row1right, row2left, row2right, row3left, row3right]
 */
export function octantFromPixels(pixels: (boolean | number)[]): string {
  let bits = 0;
  for (let i = 0; i < 8; i++) {
    if (pixels[i]) bits |= 1 << i;
  }
  return octantChar(bits);
}

/** Bit mask for left column of a row (0-3) */
export const OCTANT_LEFT = [0x01, 0x04, 0x10, 0x40] as const;

/** Bit mask for right column of a row (0-3) */
export const OCTANT_RIGHT = [0x02, 0x08, 0x20, 0x80] as const;

/** Bit mask for both columns of a row (0-3) */
export const OCTANT_ROW = [0x03, 0x0C, 0x30, 0xC0] as const;
