import { Element } from "./Element";

export class TransitionSequence {
  private elements: (Element | TransitionSequence)[] = [];
  private type: "parallel" | "series" = "parallel";
  private stage: "enter" | "exit" = "enter";
  private onComplete: () => void = () => {};

  constructor(
    elements: (Element | TransitionSequence)[],
    type: "parallel" | "series",
    stage: "enter" | "exit"
  ) {
    this.elements = elements;
    this.type = type;
    this.stage = stage;
    this.chainElements();
  }

  public setonComplete(onComplete: () => void) {
    this.onComplete = onComplete;
  }

  public startSequence() {
    if (this.elements.length > 0) {
      if (this.type === "parallel") {
        this.elements.forEach((e) => {
          this.startElementSequence(e);
        });
      } else {
        this.startElementSequence(this.elements[0]);
      }
    } else {
      this.onComplete();
    }
  }

  public chainElements() {
    let numNotEntered = this.elements.length;
    if (this.type === "series") {
      const onComplete = (i: number) => () => {
        numNotEntered--;
        if (i < this.elements.length - 1) {
          this.startElementSequence(this.elements[i + 1]);
        }
        if (numNotEntered === 0) {
          this.onComplete();
        }
      };
      for (let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        this.setElementOnComplete(element, onComplete(i));
      }
    } else {
      const onComplete = () => {
        numNotEntered--;
        if (numNotEntered === 0) {
          this.onComplete();
        }
      };
      this.elements.forEach((e) => {
        this.setElementOnComplete(e, onComplete);
      });
    }
    this.elements.forEach((e) => {
      if (e instanceof TransitionSequence) {
        e.chainElements();
      }
    });
  }

  public extractAll(): Element[] {
    const elements: Element[] = [];
    this.elements.forEach((e) => {
      if (e instanceof TransitionSequence) {
        elements.push(...e.extractAll());
      } else {
        elements.push(e);
      }
    });
    return elements;
  }

  private startElementSequence(element: Element | TransitionSequence) {
    if (element instanceof TransitionSequence) {
      element.startSequence();
    } else {
      element.startTransition(this.stage, () => {});
    }
  }

  private setElementOnComplete(
    element: Element | TransitionSequence,
    onComplete: () => void
  ) {
    if (element instanceof TransitionSequence) {
      element.setonComplete(onComplete);
    } else {
      element.addOnTransition(this.stage, onComplete);
    }
  }
}
