#!/usr/bin/env node
/**
 * Reads the Unifont .hex files and generates TypeScript modules
 * that export the raw hex data as string constants.
 *
 * Usage: node scripts/generate-unifont-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const assetsDir = join(pkgRoot, "src", "assets");
const outDir = join(pkgRoot, "src", "utils", "generated");

mkdirSync(outDir, { recursive: true });

function generate(hexFileName, exportName, outFileName) {
  const hexPath = join(assetsDir, hexFileName);
  const raw = readFileSync(hexPath, "utf-8").trimEnd();
  const lines = raw.split("\n").length;
  const outPath = join(outDir, outFileName);

  const content = [
    "// Auto-generated from " + hexFileName + " — do not edit manually.",
    "// " + lines + " glyphs from GNU Unifont 16.0.01.",
    "// Each line: CODEPOINT:HEXBITMAP (32 hex = 8×16, 64 hex = 16×16).",
    "",
    "export const " + exportName + " = " + JSON.stringify(raw) + ";",
    "",
  ].join("\n");

  writeFileSync(outPath, content, "utf-8");
  console.log(`Generated ${outFileName} (${lines} glyphs)`);
}

generate(
  "unifont-16.0.01.hex",
  "UNIFONT_PLANE0_HEX",
  "unifontPlane0.ts"
);

generate(
  "unifont_upper-16.0.01.hex",
  "UNIFONT_PLANE1_HEX",
  "unifontPlane1.ts"
);
