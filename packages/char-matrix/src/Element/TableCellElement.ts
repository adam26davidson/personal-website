import { ElementConfig } from "./Element";
import { StructuralElement } from "./StructuralElement";

export interface TableCellElementConfig extends ElementConfig {
  text?: string;
}

/**
 * Structural element representing a single table cell.
 * If `text` is set, the cell is a text cell. If it has element children
 * (tracked by the reconciler's childrenMap), the first child is the
 * cell's element content.
 */
export class TableCellElement extends StructuralElement {
  private _text: string | undefined;

  constructor(config: TableCellElementConfig) {
    super(config);
    this._text = config.text;
  }

  get text(): string | undefined {
    return this._text;
  }

  /** Sets cell text. Does not trigger a table re-commit on its own —
   *  the reconciler's commitUpdate calls bubbleCommitToAncestor after this. */
  set text(value: string | undefined) {
    this._text = value;
  }
}
