import { Element, ElementConfig } from "./Element";

/**
 * Abstract base class for elements that exist as reconciler-managed nodes
 * but don't participate in view registration, drawing, or layout.
 *
 * Concrete subclasses (TableRowElement, TableCellElement) carry structural
 * data for their parent element (e.g., TableElement) without being rendered.
 */
export abstract class StructuralElement extends Element {
  constructor(config: ElementConfig) {
    super(config);
  }

  override registerWithView(): void {}
  override unregisterWithView(): void {}
  protected override drawOwnContent(): void {}
  protected override reprocessContent(): void {}
  protected override handleUnregisterWithView(): void {}
  protected override handleTransitionStart(): void {}
  protected override handleClick(): void {}
  protected override handleMouseEnter(): void {}
  protected override handleMouseLeave(): void {}
}
