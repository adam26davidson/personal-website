import { describe, it, expect } from "vitest";
import { toCompactBigChar, toCompactBigText, parseSpleenGlyph } from "./BigTextCompact";

describe("parseSpleenGlyph", () => {
  it("parses hex rows into an 8×5 boolean grid", () => {
    // 'A' in Spleen: 00 60 90 90 F0 90 90 00
    const grid = parseSpleenGlyph(["00","60","90","90","F0","90","90","00"]);
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(5);

    // Row 0: 0x00 = all false
    expect(grid[0]).toEqual([false, false, false, false, false]);

    // Row 1: 0x60 = 01100000 → top 5 bits = 01100
    expect(grid[1]).toEqual([false, true, true, false, false]);

    // Row 4: 0xF0 = 11110000 → top 5 bits = 11110
    expect(grid[4]).toEqual([true, true, true, true, false]);
  });
});

describe("toCompactBigChar", () => {
  it("returns a 2-row, 3-char-wide grid", () => {
    const result = toCompactBigChar("A");
    expect(result.length).toBe(2);
    expect([...result[0]].length).toBe(3);
    expect([...result[1]].length).toBe(3);
  });

  it("returns spaces for space character", () => {
    const result = toCompactBigChar(" ");
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" ");
      }
    }
  });

  it("returns spaces for unknown character", () => {
    const result = toCompactBigChar("\u9999");
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" ");
      }
    }
  });

  it("renders bold characters using their ASCII glyph", () => {
    const boldA = String.fromCodePoint(0x1d400); // 𝐀
    const resultBold = toCompactBigChar(boldA);
    const resultPlain = toCompactBigChar("A");
    expect(resultBold).toEqual(resultPlain);
  });
});

describe("toCompactBigText", () => {
  it("returns 2 rows of text", () => {
    const result = toCompactBigText("AB");
    expect(result.length).toBe(2);
  });

  it("concatenates characters horizontally", () => {
    const resultA = toCompactBigText("A");
    const resultB = toCompactBigText("B");
    const resultAB = toCompactBigText("AB");

    for (let row = 0; row < 2; row++) {
      expect(resultAB[row]).toBe(resultA[row] + resultB[row]);
    }
  });

  it("handles empty string", () => {
    const result = toCompactBigText("");
    expect(result).toEqual(["", ""]);
  });

  it("renders visible content for non-space characters", () => {
    const result = toCompactBigText("H");
    const hasContent = result.some(row => [...row].some(ch => ch !== " "));
    expect(hasContent).toBe(true);
  });
});
