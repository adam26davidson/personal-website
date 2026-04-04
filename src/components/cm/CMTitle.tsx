import { useMemo } from "react";
import { SPACE_CHAR } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import { DefaultAnimationHandler } from "@adam26davidson/char-matrix-fx";
import { useMatrixView } from "./MatrixViewContext";

const largeTitleText =
  "  __   ____   __   _  _    ____   __   _  _  __  ____  ____   __   __ _  \n" +
  " / _\\ (    \\ / _\\ ( \\/ )  (    \\ / _\\ / )( \\(  )(    \\/ ___) /  \\ (  ( \\ \n" +
  "/    \\ ) D (/    \\/ \\/ \\   ) D (/    \\\\ \\/ / )(  ) D (\\___ \\(  O )/    / \n" +
  "\\_/\\_/(____/\\_/\\_/\\_)(_/  (____/\\_/\\_/ \\__/ (__)(____/(____/ \\__/ \\_)__) \n";

const smallTitleText = "Adam Davidson";

const mediumTitleText =
  "🬖🬏🬚🬏🬖🬏🬚🬖🬓\n" +
  "🬆🬄🬌🬀🬆🬄🬄 🬄\n" +
  "🬚🬏🬖🬏🬓🬓🬩🬃🬚🬏🬖🬃🬚🬓🬱🬦\n" +
  "🬌🬀🬆🬄🬈🬀🬍🬃🬌🬀🬍🬀🬌🬄🬄🬊";

function createTitleHandler(
  view: RenderTarget,
  entranceTailLength: number,
  entranceHeadSpeed: number,
  exitTailLength: number,
  exitHeadSpeed: number
): DefaultAnimationHandler {
  return new DefaultAnimationHandler(null, view, {
    entrance: {
      type: "rowTracer",
      config: {
        tailLength: entranceTailLength,
        headSpeed: entranceHeadSpeed,
        randomizationRange: 5,
        use: "entrance",
      },
    },
    exit: {
      type: "diagonalSwipe",
      config: {
        tailLength: exitTailLength,
        headSpeed: exitHeadSpeed,
        randomizationRange: 5,
        use: "exit",
        slant: 4,
      },
    },
  });
}

export function CMLargeTitle({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { view } = useMatrixView();
  const handler = useMemo(
    () => createTitleHandler(view, 40, 5, 30, 3),
    [view]
  );

  return (
    <cm-text
      elementKey="largeTitle"
      text={largeTitleText}
      bordered
      backgroundChar={SPACE_CHAR}
      paddingX={1}
      animationHandler={handler}
      onClick={onClick}
    />
  );
}

export function CMMediumTitle({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { view } = useMatrixView();
  const handler = useMemo(
    () => createTitleHandler(view, 20, 2, 20, 3),
    [view]
  );

  return (
    <cm-text
      elementKey="mediumTitle"
      text={mediumTitleText}
      bordered
      paddingX={1}
      backgroundChar={SPACE_CHAR}
      cursor={onClick ? "pointer" : "default"}
      animationHandler={handler}
      onClick={onClick}
    />
  );
}

export function CMSmallTitle({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { view } = useMatrixView();
  const handler = useMemo(
    () => createTitleHandler(view, 10, 1, 10, 1),
    [view]
  );

  return (
    <cm-text
      elementKey="smallTitle"
      text={smallTitleText}
      bordered
      paddingX={1}
      backgroundChar={SPACE_CHAR}
      cursor={onClick ? "pointer" : "default"}
      animationHandler={handler}
      onClick={onClick}
    />
  );
}
