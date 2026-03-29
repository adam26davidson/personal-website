// Element system
export { Element } from "./Element/Element";
export type { ElementConfig, SizingMethod, CursorType, ElementStage } from "./Element/ElementBase";
export { ParentElement } from "./Element/ParentElement";
export { ContainerElement } from "./Element/ContainerElement";
export type { ContainerElementConfig, Alignment } from "./Element/ContainerElement";
export { default as TextElement } from "./Element/TextElement";
export type { TextElementConfig, HoverTextTransform } from "./Element/TextElement";
export { HeaderElement } from "./Element/HeaderElement";
export { ParagraphElement } from "./Element/ParagraphElement";
export { TransitionSequence } from "./Element/TransitionSequence";

// Interfaces
export type { RenderTarget } from "./interfaces/RenderTarget";
export type { ElementAnimationHandler } from "./interfaces/ElementAnimationHandler";
export type { SurfaceTransform } from "./interfaces/SurfaceTransform";

// Types
export { CharMatrix } from "./types/CharMatrix";
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
export { throttledWarn } from "./utils/Logging";

// Octant
export { octantChar, octantFromGrid, octantFromPixels, OCTANT_LEFT, OCTANT_RIGHT, OCTANT_ROW } from "./utils/Octant";
