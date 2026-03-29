import { SPACE_CHAR, TextElement } from "char-matrix";
import type { RenderTarget } from "char-matrix";
import { DefaultAnimationHandler, AnimationConfig, AnimationUse } from "char-matrix-fx";

const createLinkAnimationConfigMobile = (
  use: AnimationUse
): AnimationConfig => {
  return {
    type: "diagonalSwipe",
    config: {
      slant: 4,
      tailLength: 6,
      headSpeed: 2,
      randomizationRange: 3,
      use,
    },
  };
};

const createLinkAnimationConfig = (
  use: AnimationUse,
  isMobile: boolean
): AnimationConfig | undefined => {
  if (isMobile) {
    if (use === "entrance" || use === "exit") {
      return createLinkAnimationConfigMobile(use);
    } else {
      return undefined;
    }
  }
  return {
    type: "diagonalSwipe",
    config: {
      slant: 2,
      tailLength: isMobile ? 10 : 30,
      headSpeed: isMobile ? 1 : 2,
      randomizationRange: 5,
      use,
    },
  };
};

function createLinkAnimationHandler(
  view: RenderTarget,
  animate: boolean
): DefaultAnimationHandler {
  return new DefaultAnimationHandler(null, view, {
    entrance: animate
      ? createLinkAnimationConfig("entrance", view.getIsMobile())
      : undefined,
    exit: animate
      ? createLinkAnimationConfig("exit", view.getIsMobile())
      : undefined,
    mouseEnter: createLinkAnimationConfig("interaction", view.getIsMobile()),
    mouseExit: createLinkAnimationConfig("interaction", view.getIsMobile()),
  });
}

export class ButtonStyleLinkElement extends TextElement {
  constructor(
    key: string,
    title: string,
    view: RenderTarget,
    animate: boolean = true
  ) {
    const handler = createLinkAnimationHandler(view, animate);
    super({
      key,
      view,
      text: title,
      bordered: true,
      paddingX: 1,
      backgroundChar: SPACE_CHAR,
      hoverTransform: "bold",
      cursor: "pointer",
      animationHandler: handler,
    });
    handler.setElement(this);
  }
}

export class LinkElement extends TextElement {
  constructor(
    key: string,
    title: string,
    view: RenderTarget,
    animate: boolean = true
  ) {
    const handler = createLinkAnimationHandler(view, animate);
    super({
      key,
      view,
      text: title,
      bordered: view.getIsMobile(),
      paddingX: view.getIsMobile() ? 1 : 0,
      backgroundChar: SPACE_CHAR,
      hoverTransform: "bold",
      cursor: "pointer",
      animationHandler: handler,
    });
    handler.setElement(this);
  }
}
