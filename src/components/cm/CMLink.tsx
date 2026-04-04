import { useMemo } from "react";
import { SPACE_CHAR } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import {
  DefaultAnimationHandler,
  AnimationConfig,
  AnimationUse,
} from "@adam26davidson/char-matrix-fx";
import { useMatrixView } from "./MatrixViewContext";

function createLinkAnimationConfigMobile(use: AnimationUse): AnimationConfig {
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
}

function createLinkAnimationConfig(
  use: AnimationUse,
  isMobile: boolean
): AnimationConfig | undefined {
  if (isMobile) {
    if (use === "entrance" || use === "exit") {
      return createLinkAnimationConfigMobile(use);
    }
    return undefined;
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
}

function createLinkAnimationHandler(
  view: RenderTarget,
  animate: boolean
): DefaultAnimationHandler {
  const isMobile = view.getIsMobile();
  return new DefaultAnimationHandler(null, view, {
    entrance: animate
      ? createLinkAnimationConfig("entrance", isMobile)
      : undefined,
    exit: animate ? createLinkAnimationConfig("exit", isMobile) : undefined,
    mouseEnter: createLinkAnimationConfig("interaction", isMobile),
    mouseExit: createLinkAnimationConfig("interaction", isMobile),
  });
}

export function CMLink({
  elementKey,
  text,
  onClick,
  animate = true,
}: {
  elementKey: string;
  text: string;
  onClick?: () => void;
  animate?: boolean;
}) {
  const { view } = useMatrixView();
  const isMobile = view.getIsMobile();
  const handler = useMemo(
    () => createLinkAnimationHandler(view, animate),
    [view, animate]
  );

  return (
    <cm-text
      elementKey={elementKey}
      text={text}
      bordered={isMobile}
      paddingX={isMobile ? 1 : 0}
      backgroundChar={SPACE_CHAR}
      hoverTransform="bold"
      cursor="pointer"
      animationHandler={handler}
      onClick={onClick}
    />
  );
}

export function CMButtonLink({
  elementKey,
  text,
  onClick,
  animate = true,
}: {
  elementKey: string;
  text: string;
  onClick?: () => void;
  animate?: boolean;
}) {
  const { view } = useMatrixView();
  const handler = useMemo(
    () => createLinkAnimationHandler(view, animate),
    [view, animate]
  );

  return (
    <cm-text
      elementKey={elementKey}
      text={text}
      bordered
      paddingX={1}
      backgroundChar={SPACE_CHAR}
      hoverTransform="bold"
      cursor="pointer"
      animationHandler={handler}
      onClick={onClick}
    />
  );
}
