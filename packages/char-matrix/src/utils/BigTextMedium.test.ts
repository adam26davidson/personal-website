import { describe, it, expect } from "vitest";
import { toMediumBigChar, toMediumBigText, parseSpleen6x12Glyph } from "./BigTextMedium";

describe("parseSpleen6x12Glyph", () => {
  it("parses hex rows into a 12×6 boolean grid", () => {
    // 'A' in Spleen 6x12: 00 70 88 88 88 F8 88 88 88 00 00 00
    const grid = parseSpleen6x12Glyph(["00","70","88","88","88","F8","88","88","88","00","00","00"]);
    expect(grid.length).toBe(12);
    expect(grid[0].length).toBe(6);

    // Row 0: 0x00 = all false
    expect(grid[0]).toEqual([false, false, false, false, false, false]);

    // Row 1: 0x70 = 01110000 → top 6 bits = 011100
    expect(grid[1]).toEqual([false, true, true, true, false, false]);

    // Row 5: 0xF8 = 11111000 → top 6 bits = 111110
    expect(grid[5]).toEqual([true, true, true, true, true, false]);
  });
});

describe("toMediumBigChar", () => {
  it("returns a 3-row, 3-char-wide grid", () => {
    const result = toMediumBigChar("A");
    expect(result.length).toBe(3);
    expect([...result[0]].length).toBe(3);
  });

  it("returns spaces for space character", () => {
    const result = toMediumBigChar(" ");
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" ");
      }
    }
  });

  it("returns spaces for unknown character", () => {
    const result = toMediumBigChar("\u9999");
    for (const row of result) {
      for (const char of [...row]) {
        expect(char).toBe(" ");
      }
    }
  });

  it("renders bold characters using their ASCII glyph", () => {
    const boldA = String.fromCodePoint(0x1d400);
    expect(toMediumBigChar(boldA)).toEqual(toMediumBigChar("A"));
  });
});

describe("toMediumBigText", () => {
  it("returns 3 rows of text", () => {
    const result = toMediumBigText("AB");
    expect(result.length).toBe(3);
  });

  it("concatenates characters horizontally", () => {
    const a = toMediumBigText("A");
    const b = toMediumBigText("B");
    const ab = toMediumBigText("AB");
    // With spacing=1, AB is composited as one buffer, not simple concat
    // But total width should be 6+1+6 = 13 pixels = ceil(13/2) = 7 octant chars
    for (let row = 0; row < 3; row++) {
      expect([...ab[row]].length).toBe(7);
    }
  });

  it("handles empty string", () => {
    expect(toMediumBigText("")).toEqual(["", "", ""]);
  });

  it("renders visible content for non-space characters", () => {
    const result = toMediumBigText("H");
    const hasContent = result.some(row => [...row].some(ch => ch !== " "));
    expect(hasContent).toBe(true);
  });
});
