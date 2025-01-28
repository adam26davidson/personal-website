import { SpringLattice } from "./springLattice";
import topSimilarData from "./assets/top_similar.json";
import { Element, SizingMethod } from "./MatrixElement/Element";
import MatrixController from "./matrixController";
import { CharMatrix } from "./UtilityTypes/CharMatrix";
import { IntPoint, ZERO_POINT } from "./UtilityTypes/IntPoint";
import { ContainerElement } from "./MatrixElement/ContainerElement";
import { Y } from "./UtilityTypes/Axes";
import { ParentElement } from "./MatrixElement/ParentElement";
import { RealPoint } from "./UtilityTypes/RealPoint";
import {
  DEFAULT_BACKGROUND_CHAR,
  MOBILE_WIDTH,
  NUM_PARTICLES,
  NUM_PARTICLES_MOBILE,
} from "./constants";
import { NavigateFunction } from "react-router";

interface TopSimilar {
  [key: string]: string[];
}

const TOP_SIMILAR: TopSimilar = topSimilarData;

// add character itself to the top similar list
for (const key in TOP_SIMILAR) {
  TOP_SIMILAR[key].unshift(key);
}

type Event =
  | {
      type: "mouseDown";
      position: { x: number; y: number };
    }
  | { type: "mouseUp" }
  | { type: "resize"; position: { x: number; y: number } };

type MouseVoveEvent = { x: number; y: number };

class MatrixView extends ParentElement {
  private size: IntPoint = ZERO_POINT;
  private pixelOffset: IntPoint = ZERO_POINT;
  private am: CharMatrix = new CharMatrix(ZERO_POINT); // animation matrix
  private cm: CharMatrix = new CharMatrix(ZERO_POINT); // content matrix
  private fm: CharMatrix = new CharMatrix(ZERO_POINT); // final matrix
  private isInitialized: boolean = false;
  private springLattice: SpringLattice = new SpringLattice();
  private mouseDown: boolean = false;
  private rootElement: Element = new ContainerElement({
    key: "root",
    view: this,
    mainAxis: Y,
  });
  private elements: { [key: string]: Element } = {};
  private fontSize: number = 0;
  private matrixController: MatrixController = new MatrixController(this);
  private eventQueue: Event[] = [];
  private mouseMoveEvent: MouseVoveEvent | null = null;
  private isMobile: boolean = false;

  public initialize(
    width: number,
    height: number,
    lattice: SpringLattice,
    fontSize: number
  ) {
    if (this.isInitialized) {
      return;
    }
    this.springLattice = lattice;
    this.size = new IntPoint(width, height);
    this.fontSize = fontSize;
    this.size = this.calculateDimensions(width, height);
    if (this.size.getX() < MOBILE_WIDTH) {
      this.isMobile = true;
    }

    console.log("initializing matrix with", this.size.getX(), this.size.getY());

    this.cm.resize(this.size);
    this.am.resize(this.size);
    this.fm.resize(this.size);

    this.isInitialized = true;
    this.matrixController.initialize();

    //this.setRoot(this.rootElement);
  }

  public getPixelOffset = () => this.pixelOffset;
  public setPixelOffset = (offset: IntPoint) => (this.pixelOffset = offset);
  public getSize = () => this.size;
  public getIsMobile = () => this.isMobile;
  public getNumColumns = () => this.size.getX();
  public getNumRows = () => this.size.getY();
  public getBackgroundChar = () => DEFAULT_BACKGROUND_CHAR;
  public setRoute = (route: string) => this.matrixController.setRoute(route);
  public setNavigate = (navigate: NavigateFunction) =>
    this.matrixController.setNavigate(navigate);

  public getContentOffset = () => ZERO_POINT;

  public getContentAreaSize = () => this.size;

  public getContentLayerChar(
    location: IntPoint,
    offset: IntPoint = ZERO_POINT
  ) {
    return this.cm.getChar(location, offset);
  }

  public setContentLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT
  ) {
    this.cm.setChar(location, char, offset);
  }

  public setAnimationLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT
  ) {
    this.am.setChar(location, char, offset);
  }

  public handleChildResize(): void {
    this.cm.clear();
  }

  public getSizingMethod(): { x: SizingMethod; y: SizingMethod } {
    return { x: "absolute", y: "absolute" };
  }

  public getIsOnView = () => true;
  public getTotalBoundarySize = () => ZERO_POINT;
  public getContentEndOffset = () => this.size;
  public getScrollOffset = () => ZERO_POINT;

  // Element management --------------------------------------------------------

  public registerElement(element: Element) {
    console.log("!!!registering element", element.getKey());
    this.elements[element.getKey()] = element;
  }

  public unregisterElement(element: Element) {
    delete this.elements[element.getKey()];
  }

  public getElement(key: string) {
    console.log("all elements", this.elements);
    return this.elements[key];
  }

  public getRoot = () => this.rootElement;

  public setRoot(element: Element) {
    const oldRoot = this.rootElement;
    console.log("unregistering old root", oldRoot.getKey());
    oldRoot.unregisterWithView();

    this.children = [element];
    element.setParent(this);
    this.rootElement = element;
    element.registerWithView();
    this.resizeChildren();
  }

  public update() {
    // STEP 1: Prune exited children
    this.rootElement.pruneExitedChildren();

    // STEP 2: Handle events
    this.processEvents();

    // STEP 3: update content matrix
    this.rootElement.draw(ZERO_POINT);

    // STEP 4: update animation matrix
    this.rootElement.runAnimationStep(ZERO_POINT);

    // throttledLog("final matrix:");
    // throttledLog(this.fm.getRawMatrix());
  }

  public getSurfaceMatrix() {
    this.am.map((c: string, p: IntPoint) => {
      const x = p.getX() / this.size.getX();
      const y = p.getY() / this.size.getY();
      const position = this.springLattice.sample(x, y);
      const index = Math.min(Math.floor(Math.abs(position) * 10), 99);
      let newChar = c;
      if (c in TOP_SIMILAR) {
        newChar = TOP_SIMILAR[c][index];
      }
      return newChar;
    }, this.fm);

    const matrix = this.fm.getRawMatrix();
    //throttledLog(matrix);

    return matrix;
  }

  // Event handling -----------------------------------------------------------

  public handleMouseDown(x: number, y: number) {
    const event: Event = {
      type: "mouseDown",
      position: { x, y },
    };
    this.eventQueue.push(event);
  }

  public handleMouseMove(x: number, y: number) {
    const event: MouseVoveEvent = { x, y };
    this.mouseMoveEvent = event;
  }

  public handleMouseUp() {
    const event: Event = {
      type: "mouseUp",
    };
    this.eventQueue.push(event);
  }

  public handleResize(x: number, y: number) {
    const event: Event = {
      type: "resize",
      position: { x, y },
    };
    this.eventQueue.push(event);
  }

  private processEvents() {
    if (this.mouseMoveEvent) {
      this.processMouseMove(this.mouseMoveEvent.x, this.mouseMoveEvent.y);
      this.mouseMoveEvent = null;
    }
    for (let i = this.eventQueue.length - 1; i >= 0; i--) {
      const event = this.eventQueue[i];
      switch (event.type) {
        case "mouseDown":
          this.processMouseDown(event.position.x, event.position.y);
          break;
        case "mouseUp":
          this.processMouseUp();
          break;
        case "resize":
          this.processResize(event.position.x, event.position.y);
          break;
      }
    }
    this.eventQueue = [];
  }

  private processMouseUp() {
    this.mouseDown = false;
    this.springLattice.setAttractorOff();
  }

  private processMouseDown(x: number, y: number) {
    this.mouseDown = true;
    this.springLattice.setAttractorPosition(x, y);
    this.springLattice.setAttractorOn();

    const p = new RealPoint(x * this.size.getX(), y * this.size.getY());
    this.rootElement.handleMouseDown(p);
  }

  private processMouseMove(x: number, y: number) {
    if (this.mouseDown) {
      this.springLattice.setAttractorPosition(x, y);
    }
    const p = new RealPoint(x * this.size.getX(), y * this.size.getY());
    this.rootElement.handleMouseMove(p);
  }

  private processResize(x: number, y: number) {
    const size = this.calculateDimensions(x, y);
    if (!size.equals(this.size)) {
      const isMobile = size.getX() < MOBILE_WIDTH;
      this.cm.resize(size);
      this.am.resize(size);
      this.fm.resize(size);
      this.springLattice.resize(
        x,
        y,
        isMobile ? NUM_PARTICLES_MOBILE : NUM_PARTICLES
      );
      this.size = size;
      this.resizeChildren();
      if (isMobile !== this.isMobile) {
        this.isMobile = isMobile;
        this.matrixController.handleMobileChange();
      }
    }
  }

  public calculateDimensions(width: number, height: number) {
    const charWidth = this.fontSize / 2;
    const charHeight = this.fontSize;
    return new IntPoint(width / charWidth, height / charHeight);
  }
}

export default MatrixView;
