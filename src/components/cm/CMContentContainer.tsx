import { useMemo } from "react";
import { DOT_CHAR } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import { DefaultAnimationHandler } from "@adam26davidson/char-matrix-fx";
import { useMatrixView } from "./MatrixViewContext";

function createContentContainerHandler(
  view: RenderTarget
): DefaultAnimationHandler {
  const isMobile = view.getIsMobile();
  return new DefaultAnimationHandler(null, view, {
    entrance: {
      type: "diagonalSwipe",
      config: {
        slant: 2,
        tailLength: isMobile ? 20 : 40,
        headSpeed: isMobile ? 3 : 5,
        randomizationRange: 5,
        use: "entrance",
      },
    },
    exit: {
      type: "diagonalSwipe",
      config: {
        slant: 2,
        tailLength: isMobile ? 20 : 40,
        headSpeed: isMobile ? 3 : 5,
        randomizationRange: 5,
        use: "exit",
      },
    },
  });
}

export function CMContentContainer({
  elementKey,
  children,
  noYPadding,
}: {
  elementKey: string;
  children?: React.ReactNode;
  noYPadding?: boolean;
}) {
  const { view } = useMatrixView();
  const isMobile = view.getIsMobile();
  const handler = useMemo(
    () => createContentContainerHandler(view),
    [view]
  );

  return (
    <cm-container
      elementKey={elementKey}
      mainAxis="y"
      width={isMobile ? 1 : 0.8}
      paddingRight={1}
      widthType="relative"
      height={1}
      heightType="relative"
      scrollable
      spacing={1}
      paddingY={noYPadding ? 0 : 1}
      backgroundChar={DOT_CHAR}
      animationHandler={handler}
    >
      {children}
    </cm-container>
  );
}
