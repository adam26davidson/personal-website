import { ElementConfig } from "./Element";
import { StructuralElement } from "./StructuralElement";

/**
 * Structural element that groups TableCellElements into a row.
 * Has no additional fields — its role is purely positional.
 */
export class TableRowElement extends StructuralElement {
  constructor(config: ElementConfig) {
    super(config);
  }
}
