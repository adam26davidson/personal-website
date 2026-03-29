// Animation system
export {
  Animation,
  HeadBasedAnimation,
  DiagonalSwipeAnimation,
  RowTracerAnimation,
} from "./Animation";
export type {
  AnimationConfig,
  AnimationUse,
  HeadBasedAnimationConfig,
  RowTracerAnimationConfig,
  DiagonalSwipeAnimationConfig,
} from "./Animation";

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
