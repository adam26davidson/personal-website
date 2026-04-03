// Element system
export { Element } from "./Element/Element";
export type { ElementConfig, SizingMethod, CursorType, ElementStage } from "./Element/ElementBase";
export { ParentElement } from "./Element/ParentElement";
export { ContainerElement } from "./Element/ContainerElement";
export type { ContainerElementConfig, Alignment } from "./Element/ContainerElement";
export { default as TextElement } from "./Element/TextElement";
export type { TextElementConfig, HoverTextTransform } from "./Element/TextElement";
export { TableElement } from "./Element/TableElement";
export type { TableElementConfig, ColumnDef, TableRowConfig, TableCellConfig } from "./Element/TableElement";
export { TransitionSequence } from "./Element/TransitionSequence";

// Interfaces
export type { RenderTarget } from "./interfaces/RenderTarget";
export type { ElementAnimationHandler } from "./interfaces/ElementAnimationHandler";
export type { SurfaceTransform } from "./interfaces/SurfaceTransform";

// Render target utilities
export { RenderTargetBufferManager } from "./RenderTargetBufferManager";

// Types
export { CharMatrix, FULLWIDTH_CONTINUATION } from "./types/CharMatrix";
export { IntPoint, ZERO_POINT } from "./types/IntPoint";
export { NormPoint } from "./types/NormPoint";
export { RealPoint } from "./types/RealPoint";
export { X, Y, AXES } from "./types/Axes";
export type { Axis } from "./types/Axes";

// Constants
export {
  DOT_CHAR,
  SPACE_CHAR,
  DEFAULT_BACKGROUND_CHAR,
  FONT_SIZE,
  MOBILE_WIDTH,
  NUM_PARTICLES,
  NUM_PARTICLES_MOBILE,
} from "./constants";

// Utilities
export { charsToPixelsX, charsToPixelsY, toBold, toBoldChar, toNotBoldChar, getPostIdFromTitle } from "./utils/MiscUtils";
export { isFullwidth } from "./utils/fullwidthRanges";
export { throttledWarn } from "./utils/Logging";

// Octant
export { octantChar, octantFromGrid, octantFromPixels, OCTANT_LEFT, OCTANT_RIGHT, OCTANT_ROW } from "./utils/Octant";

// Bitmap-to-octant rendering
export { PixelBuffer, pixelBufferToOctant } from "./utils/BitmapOctant";

// Big text (Unifont 8×16 → 4×4 octants)
export { toBigChar, toBigText, parseHexGlyph } from "./utils/BigText";

// Full Unifont glyph registry (Planes 0–1)
export { getUnifontGlyph } from "./utils/UnifontRegistry";
export type { UnifontGlyph } from "./utils/UnifontRegistry";

// Compact big text (Spleen 5×8 → 3×2 octants)
export { toCompactBigChar, toCompactBigText, parseSpleenGlyph } from "./utils/BigTextCompact";

// Medium big text (Spleen 6×12 → 3×3 octants)
export { toMediumBigChar, toMediumBigText, parseSpleen6x12Glyph } from "./utils/BigTextMedium";
