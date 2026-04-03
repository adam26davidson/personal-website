import {
  SizingMethod,
  SurfaceTransform,
  CharMatrix,
  IntPoint,
  ZERO_POINT,
  Y,
  RealPoint,
  DEFAULT_BACKGROUND_CHAR,
  FONT_SIZE,
  MOBILE_WIDTH,
  NUM_PARTICLES,
  NUM_PARTICLES_MOBILE,
  Element,
  ContainerElement,
  ParentElement,
  CursorType,
} from "@adam26davidson/char-matrix";
import { ReactRenderTarget } from "@adam26davidson/char-matrix-react";
import { SpringLattice } from "@adam26davidson/char-matrix-fx";
import MatrixController from "./matrixController";
import { NavigateFunction } from "react-router";
import { ReactNodeConfig } from "@adam26davidson/char-matrix-react";

type Event =
  | {
      type: "mouseDown";
      position: { x: number; y: number };
    }
  | { type: "mouseUp" }
  | { type: "resize"; position: { x: number; y: number } }
  | { type: "wheel"; position: { x: number; y: number }; deltaY: number };

type MouseVoveEvent = { x: number; y: number };

class MatrixView extends ParentElement implements ReactRenderTarget {
  private size: IntPoint = ZERO_POINT;
  private pixelOffset: IntPoint = ZERO_POINT;
  private am: CharMatrix = new CharMatrix(ZERO_POINT); // animation matrix
  private cm: CharMatrix = new CharMatrix(ZERO_POINT); // content matrix
  private fm: CharMatrix = new CharMatrix(ZERO_POINT); // final matrix
  private surfaceTransforms: SurfaceTransform[] = [];
  private isInitialized: boolean = false;
  private springLattice: SpringLattice = new SpringLattice();
  private mouseDown: boolean = false;
  private rootElement: Element = new ContainerElement({
    key: "root",
    view: this,
    mainAxis: Y,
  });
  private elements: { [key: string]: Element } = {};
  private reactNodeConfigs: { [key: string]: ReactNodeConfig } = {};
  private setReactNodeConfigs: (components: Array<ReactNodeConfig>) => void =
    () => {};
  private fontSize: number = 0;
  private matrixController: MatrixController = new MatrixController(this);
  private eventQueue: Event[] = [];
  private mouseMoveEvent: MouseVoveEvent | null = null;
  private isMobile: boolean = false;

  public initialize(
    width: number,
    height: number,
    lattice: SpringLattice,
    fontSize: number,
    setReactComponents: (components: Array<ReactNodeConfig>) => void = () => {}
  ) {
    if (this.isInitialized) {
      return;
    }
    this.springLattice = lattice;
    this.size = new IntPoint(width, height);
    this.fontSize = fontSize;
    this.size = this.calculateDimensions(width, height);
    this.setReactNodeConfigs = setReactComponents;
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

  public setCursor(cursor: CursorType): void {
    if (document.body.style.cursor !== cursor) {
      document.body.style.cursor = cursor;
    }
  }

  public getContentOffset = () => ZERO_POINT;

  public getContentAreaSize = () => this.size;

  public getStage = () => "main";

  public getParent = () => null;

  public getContentLayerChar(
    location: IntPoint,
    offset: IntPoint = ZERO_POINT
  ) {
    return this.cm.getChar(location, offset);
  }

  public setContentLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT,
    _zIndex: number = 0
  ) {
    this.cm.setChar(location, char, offset);
  }

  public setAnimationLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT,
    _zIndex: number = 0
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

  public addSurfaceTransform(transform: SurfaceTransform): void {
    this.surfaceTransforms.push(transform);
  }

  public getSurfaceMatrix() {
    if (this.surfaceTransforms.length === 0) {
      // No transforms — use animation matrix directly (preserves existing behavior)
      return this.am.getRawMatrix();
    }

    let source = this.am;
    for (const transform of this.surfaceTransforms) {
      transform.transform(source, this.fm, this.size);
      source = this.fm;
    }

    return this.fm.getRawMatrix();
  }

  public updateReactNodeConfig(key: string, reactNode: ReactNodeConfig) {
    this.reactNodeConfigs[key] = reactNode;
    this.setReactNodeConfigs(Object.values(this.reactNodeConfigs));
  }

  public removeReactNodeConfig(key: string) {
    delete this.reactNodeConfigs[key];
    this.setReactNodeConfigs(Object.values(this.reactNodeConfigs));
  }

  public getReactNodeConfig(key: string) {
    return this.reactNodeConfigs[key];
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

  public handleWheel(x: number, y: number, deltaY: number) {
    const event: Event = {
      type: "wheel",
      position: { x, y },
      deltaY,
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
        case "wheel":
          this.processWheel(event.position.x, event.position.y, event.deltaY);
          break;
      }
    }
    this.eventQueue = [];
  }

  private processMouseUp() {
    this.mouseDown = false;
    this.springLattice.setAttractorOff();
    const p = new RealPoint(this.size.getX() / 2, this.size.getY() / 2);
    this.rootElement.handleMouseUp(p);
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

  private processWheel(x: number, y: number, deltaY: number) {
    const charDelta = deltaY / FONT_SIZE;
    const p = new RealPoint(x * this.size.getX(), y * this.size.getY());
    this.rootElement.handleWheel(p, charDelta);
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
