import { describe, it, expect } from "vitest";
import { toBigChar, toBigText, parseHexGlyph } from "./BigText";

describe("parseHexGlyph", () => {
  it("parses a half-width hex string into a 16x8 boolean grid", () => {
    // 'A' = 0000000018242442427E424242420000
    const grid = parseHexGlyph("0000000018242442427E424242420000");
    expect(grid.length).toBe(16); // 16 rows
    expect(grid[0].length).toBe(8); // 8 columns

    // Row 4: 0x18 = 00011000
    expect(grid[4]).toEqual([false, false, false, true, true, false, false, false]);

    // Row 9: 0x7E = 01111110
    expect(grid[9]).toEqual([false, true, true, true, true, true, true, false]);

    // Row 0: 0x00 = all false
    expect(grid[0]).toEqual([false, false, false, false, false, false, false, false]);
  });
});

describe("toBigChar", () => {
  it("returns a 4x4 grid of strings for a half-width character", () => {
    const result = toBigChar("A");
    expect(result.length).toBe(4); // 4 rows
    expect([...result[0]].length).toBe(4); // 4 chars wide
  });

  it("returns space-filled grid for space character", () => {
    const result = toBigChar(" ");
    // Space glyph is all zeros, so all octant chars should be space (empty octant)
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" "); // octantChar(0) = space
      }
    }
  });

  it("returns space-filled grid for unknown character", () => {
    const result = toBigChar("\u{2FFFE}"); // Plane 2 — not in Plane 0/1 registry
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" ");
      }
    }
  });

  it("renders non-ASCII Unifont characters", () => {
    const result = toBigChar("\u2600"); // ☀ — should now resolve from registry
    const hasPixels = result.some((row) => [...row].some((ch) => ch !== " "));
    expect(hasPixels).toBe(true);
  });
});

describe("toBigText", () => {
  it("returns 4 rows of text", () => {
    const result = toBigText("AB");
    expect(result.length).toBe(4);
  });

  it("concatenates characters horizontally", () => {
    const resultA = toBigText("A");
    const resultB = toBigText("B");
    const resultAB = toBigText("AB");

    // Each row of "AB" should be row of "A" + row of "B"
    for (let row = 0; row < 4; row++) {
      expect(resultAB[row]).toBe(resultA[row] + resultB[row]);
    }
  });

  it("handles empty string", () => {
    const result = toBigText("");
    expect(result).toEqual(["", "", "", ""]);
  });

  it("renders bold characters with distinct glyphs from the registry", () => {
    const boldA = String.fromCodePoint(0x1d400); // 𝐀
    const resultBold = toBigText(boldA);
    const resultPlain = toBigText("A");
    // Bold glyphs should have visible content
    const hasContent = resultBold.some(row => [...row].some(ch => ch !== " "));
    expect(hasContent).toBe(true);
    // Bold and plain should differ (bold uses its own Unifont glyph)
    expect(resultBold).not.toEqual(resultPlain);
  });

  it("renders bold digits with distinct glyphs from the registry", () => {
    const bold0 = String.fromCodePoint(0x1d7ce); // 𝟎
    const resultBold = toBigText(bold0);
    const resultPlain = toBigText("0");
    const hasContent = resultBold.some(row => [...row].some(ch => ch !== " "));
    expect(hasContent).toBe(true);
    expect(resultBold).not.toEqual(resultPlain);
  });

  it("renders 'I' with visible pixels", () => {
    // 'I' has centered vertical bar - should have non-space octant chars
    const result = toBigText("I");
    const hasContent = result.some(row => [...row].some(ch => ch !== " "));
    expect(hasContent).toBe(true);
  });
});
