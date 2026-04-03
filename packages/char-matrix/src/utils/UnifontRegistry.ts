import { UNIFONT_PLANE0_HEX } from "./generated/unifontPlane0";
import { UNIFONT_PLANE1_HEX } from "./generated/unifontPlane1";

export interface UnifontGlyph {
  /** Hex bitmap string (32 chars for 8×16, 64 chars for 16×16) */
  hex: string;
  /** Pixel width: 8 for half-width, 16 for full-width */
  width: number;
}

let plane0Map: Map<number, string> | null = null;
let plane1Map: Map<number, string> | null = null;

function parsePlane(raw: string): Map<number, string> {
  const map = new Map<number, string>();
  const lines = raw.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const cp = parseInt(line.slice(0, colonIdx), 16);
    const hex = line.slice(colonIdx + 1);
    if (hex.length >= 32) {
      map.set(cp, hex);
    }
  }
  return map;
}

function getPlane0(): Map<number, string> {
  if (!plane0Map) plane0Map = parsePlane(UNIFONT_PLANE0_HEX);
  return plane0Map;
}

function getPlane1(): Map<number, string> {
  if (!plane1Map) plane1Map = parsePlane(UNIFONT_PLANE1_HEX);
  return plane1Map;
}

/**
 * Look up the Unifont glyph for any codepoint in Plane 0 or Plane 1.
 * Returns null if the codepoint has no glyph in the Unifont data.
 */
export function getUnifontGlyph(codepoint: number): UnifontGlyph | null {
  let hex: string | undefined;
  if (codepoint <= 0xffff) {
    hex = getPlane0().get(codepoint);
  } else if (codepoint <= 0x1ffff) {
    hex = getPlane1().get(codepoint);
  }
  if (!hex) return null;
  const width = hex.length === 32 ? 8 : 16;
  return { hex, width };
}
