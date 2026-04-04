import { DOT_CHAR } from "@adam26davidson/char-matrix";

const MIN_WIDTH = 20;

function addUnderline(text: string): string {
  return (
    DOT_CHAR +
    text +
    DOT_CHAR +
    "\n" +
    "─".repeat(Math.max(MIN_WIDTH, text.length + 2))
  );
}

export function CMHeader({
  elementKey,
  text,
}: {
  elementKey: string;
  text: string;
}) {
  return (
    <cm-text
      elementKey={elementKey}
      text={addUnderline(text)}
      backgroundChar={DOT_CHAR}
    />
  );
}
