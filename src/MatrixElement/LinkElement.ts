import { AnimationConfig, AnimationUse } from "./Animation";
import TextElement from "./TextElement";
import MatrixView from "../matrixView";
import { SPACE_CHAR } from "../constants";

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

export class ButtonStyleLinkElement extends TextElement {
  constructor(
    key: string,
    title: string,
    view: MatrixView,
    animate: boolean = true
  ) {
    super({
      key,
      view,
      text: title,
      bordered: true,
      paddingX: 1,
      backgroundChar: SPACE_CHAR,
      entranceAnimationConfig: animate
        ? createLinkAnimationConfig("entrance", view.getIsMobile())
        : undefined,
      mouseEnterAnimationConfig: createLinkAnimationConfig(
        "interaction",
        view.getIsMobile()
      ),
      mouseExitAnimationConfig: createLinkAnimationConfig(
        "interaction",
        view.getIsMobile()
      ),
      exitAnimationConfig: animate
        ? createLinkAnimationConfig("exit", view.getIsMobile())
        : undefined,
      hoverTransform: "bold",
      cursor: "pointer",
    });
  }
}

export class LinkElement extends TextElement {
  constructor(
    key: string,
    title: string,
    view: MatrixView,
    animate: boolean = true
  ) {
    super({
      key,
      view,
      text: title,
      bordered: view.getIsMobile(),
      paddingX: view.getIsMobile() ? 1 : 0,
      backgroundChar: SPACE_CHAR,
      entranceAnimationConfig: animate
        ? createLinkAnimationConfig("entrance", view.getIsMobile())
        : undefined,
      mouseEnterAnimationConfig: createLinkAnimationConfig(
        "interaction",
        view.getIsMobile()
      ),
      mouseExitAnimationConfig: createLinkAnimationConfig(
        "interaction",
        view.getIsMobile()
      ),
      exitAnimationConfig: animate
        ? createLinkAnimationConfig("exit", view.getIsMobile())
        : undefined,
      hoverTransform: "bold",
      cursor: "pointer",
    });
  }
}
