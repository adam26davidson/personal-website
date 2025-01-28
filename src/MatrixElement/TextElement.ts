import { SPACE_CHAR } from "../constants";
import { AXES } from "../UtilityTypes/Axes";
import { IntPoint } from "../UtilityTypes/IntPoint";
import { Element, ElementConfig } from "./Element";

const CHILD_PLACEHOLDER = "XxcPzi6xKg";

export type HoverTextTransform = "none" | "uppercase";
export interface TextElementConfig extends ElementConfig {
  text: string;
  hoverTransform?: HoverTextTransform;
}

export default class TextElement extends Element {
  protected untransformedTemplateText: string = "";
  protected templateText: string = "";
  protected processedText: string = "";
  protected hoverTextTransform: HoverTextTransform;
  protected contentSize = new IntPoint(0, 0);

  constructor(config: TextElementConfig) {
    super(config);
    console.log("configuring text element", config);
    this.setBaseText(config.text);

    this.hoverTextTransform = config.hoverTransform || "none";
  }

  protected setBaseText(text: string) {
    this.templateText = this.replaceSpaceWithBreakingSpace(text);
    this.untransformedTemplateText = this.templateText;
    this.reprocessContent();
  }

  protected setCurrentText(text: string) {
    if (this.templateText === text) {
      return;
    }
    this.templateText = this.replaceSpaceWithBreakingSpace(text);
    this.reprocessContent();
  }

  protected handleMouseEnter() {
    if (this.hoverTextTransform === "uppercase") {
      this.setCurrentText(this.templateText.toUpperCase());
    }
  }

  protected handleMouseLeave() {
    if (this.hoverTextTransform !== "none") {
      this.setCurrentText(this.untransformedTemplateText);
    }
  }

  protected handleClick() {}

  protected drawOwnContent(offset: IntPoint) {
    console.log("drawing text element content for", this.key);
    const text = this.processedText;
    const lines = text.split("\n");
    const totalOffset = this.getContentOffset().add(offset);
    this.forEachVisiblePointInContentArea((p) => {
      const line: string = lines[p.getY()];
      if (!line) return;
      const char = [...line][p.getX()];
      if (!char) return;
      this.drawChar(char, p, totalOffset);
    });
  }

  // text will be formatted like this:
  // "first line \nline with <child placeholder> children \nline with <child placeholder> children"
  // children will be inserted in place of the <child placeholder> placeholders
  // add blocking spaces for the children's width, and new lines for the children's height
  protected reprocessContent() {
    console.log("reprocessing text element content for", this.key);
    const text = this.addNewLinesToTemplateText();
    console.log("text", text);
    const lines = this.addSpacesAndNewLinesForChildren(text);
    this.processedText = lines.join("\n");
    this.contentSize = new IntPoint(
      Math.max(...lines.map((line) => [...line].length)),
      lines.length
    );

    const newSize = this.size.copy();
    const boundarySize = this.getTotalBoundarySize();
    AXES.forEach((a) => {
      if (this.sizingMethod[a] === "content") {
        newSize.set(a, this.contentSize.get(a) + boundarySize.get(a));
      }
    });

    this.flagForRedraw();
    this.setSize(newSize);

    this.updateScrollShowing();
  }

  private addSpacesAndNewLinesForChildren(text: string) {
    const textLines = text.split("\n");
    const newLines: string[] = [];
    const children = this.children;
    const contentOffset = this.getContentOffset();
    let childIndex = 0;
    let yOffset = contentOffset.getY();
    for (const line of textLines) {
      let maxChildHeight = 1;
      let xOffset = contentOffset.getX();
      const lineParts = line.split(CHILD_PLACEHOLDER);
      const newLineParts: string[] = [];
      for (let i = 0; i < lineParts.length - 1; i++) {
        const linePart = lineParts[i];
        xOffset += [...linePart].length;
        newLineParts.push(linePart);
        const child = children[childIndex];
        child.setPosition(new IntPoint(xOffset, yOffset));
        const childHeight = child.getSize().getY();
        if (childHeight > maxChildHeight) {
          maxChildHeight = childHeight;
        }
        const childWidth = child.getSize().getX();
        const spaces = this.backgroundChar.repeat(childWidth);
        newLineParts.push(spaces);
        childIndex++;
        xOffset += childWidth;
      }
      newLineParts.push(lineParts[lineParts.length - 1]);
      newLines.push(newLineParts.join(""));
      for (let i = 1; i < maxChildHeight; i++) {
        newLines.push("");
      }
      yOffset += maxChildHeight;
    }

    // trim breaking space from the end of each line
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i];
      if (line.endsWith(SPACE_CHAR)) {
        newLines[i] = line.slice(0, -1);
      }
    }

    return newLines;
  }

  private addNewLinesToTemplateText() {
    if (this.sizingMethod.x === "content") {
      return this.templateText;
    }
    const maxWidth = this.size.getX();
    const textLines = this.templateText.split("\n");
    const newLines: string[] = [];
    const children = this.children;
    let childIndex = 0;
    for (const line of textLines) {
      const initialLineWidth =
        this.padding.start.getX() +
        this.padding.end.getX() +
        (this.bordered ? 2 : 0);
      let currentWidth = initialLineWidth;
      const lineParts = line.split(CHILD_PLACEHOLDER);
      const newLineParts: string[] = [];
      for (let i = 0; i < lineParts.length; i++) {
        const words = lineParts[i].split(SPACE_CHAR);
        const newWords: string[] = [];
        for (const word of words) {
          const wordLength = [...word].length;
          if (currentWidth + wordLength > maxWidth) {
            newWords.push(`\n${word}`);
            currentWidth = initialLineWidth + wordLength + 1;
          } else {
            newWords.push(word);
            currentWidth += wordLength + 1;
          }
        }
        currentWidth -= 1; // last word doesn't have a space after it
        if (i < lineParts.length - 1) {
          const childWidth = children[childIndex].getSize().getX();
          if (
            currentWidth + childWidth > maxWidth &&
            currentWidth !== initialLineWidth
          ) {
            newWords[newWords.length - 1] += "\n";
            currentWidth = initialLineWidth + childWidth;
          } else {
            currentWidth += childWidth;
          }
          childIndex++;
        }
        newLineParts.push(newWords.join(SPACE_CHAR));
      }
      const newLine = newLineParts.join("");
      newLines.push(newLine);
    }

    // trim breaking space from the end of each line
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i];
      if (line.endsWith(SPACE_CHAR)) {
        newLines[i] = line.slice(0, -1);
      }
    }
    return newLines.join("\n");
  }

  private replaceSpaceWithBreakingSpace(text: string) {
    return text.replace(/ /g, SPACE_CHAR);
  }
}
