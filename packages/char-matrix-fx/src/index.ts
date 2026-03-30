// Animation system
export { Animation } from "./Animation";
export type {
  AnimationConfig,
  AnimationUse,
  HeadBasedAnimationConfig,
  RowTracerAnimationConfig,
  DiagonalSwipeAnimationConfig,
} from "./Animation";
export { HeadBasedAnimation } from "./HeadBasedAnimation";
export { DiagonalSwipeAnimation } from "./DiagonalSwipeAnimation";
export { RowTracerAnimation } from "./RowTracerAnimation";
export { createAnimation } from "./createAnimation";

// Animation handler
export { DefaultAnimationHandler } from "./DefaultAnimationHandler";
export type { AnimationConfigs } from "./DefaultAnimationHandler";

// Physics
export { SpringLattice } from "./SpringLattice";

// Character similarity
export { default as TOP_SIMILAR } from "./topSimilar";
export type { TopSimilar } from "./topSimilar";

// Surface transforms
export { SpringLatticeSurfaceTransform } from "./transforms/SpringLatticeSurfaceTransform";
