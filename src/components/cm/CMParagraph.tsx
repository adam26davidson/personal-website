import { SPACE_CHAR } from "@adam26davidson/char-matrix";
import { useMatrixView } from "./MatrixViewContext";

export function CMParagraph({
  elementKey,
  text,
  relativeWidth = 1,
}: {
  elementKey: string;
  text: string;
  relativeWidth?: number;
}) {
  const { view } = useMatrixView();
  const isMobile = view.getIsMobile();

  return (
    <cm-text
      elementKey={elementKey}
      text={text}
      width={relativeWidth}
      widthType="relative"
      heightType="content"
      paddingX={isMobile ? 1 : 2}
      paddingY={isMobile ? 0 : 1}
      bordered
      cursor="text"
      backgroundChar={SPACE_CHAR}
    />
  );
}
