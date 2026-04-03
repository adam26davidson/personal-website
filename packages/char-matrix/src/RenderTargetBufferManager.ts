import { CharMatrix } from "./types/CharMatrix";
import { IntPoint, ZERO_POINT } from "./types/IntPoint";
import { SPACE_CHAR } from "./constants";
import { SurfaceTransform } from "./interfaces/SurfaceTransform";

export class RenderTargetBufferManager {
  readonly contentLayer: CharMatrix;
  readonly animationLayer: CharMatrix;
  private surfaceBuffer: CharMatrix;
  private transformOutput: CharMatrix;

  private contentZBuffer: number[][];
  private animationZBuffer: number[][];
  private size: IntPoint;
  private dirty: boolean = true;

  constructor(size: IntPoint) {
    this.size = size;
    this.contentLayer = new CharMatrix(size);
    this.animationLayer = new CharMatrix(size);
    this.surfaceBuffer = new CharMatrix(size);
    this.transformOutput = new CharMatrix(size);
    this.contentZBuffer = this.makeZBuffer();
    this.animationZBuffer = this.makeZBuffer();
  }

  private makeZBuffer(): number[][] {
    const w = this.size.getX();
    const h = this.size.getY();
    return Array.from({ length: h }, () => new Array(w).fill(-Infinity));
  }

  setContentLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT,
    zIndex: number = 0
  ): void {
    const x = location.getX() + offset.getX();
    const y = location.getY() + offset.getY();
    if (
      x >= 0 &&
      x < this.size.getX() &&
      y >= 0 &&
      y < this.size.getY() &&
      zIndex >= this.contentZBuffer[y][x]
    ) {
      this.contentLayer.setChar(location, char, offset);
      this.contentZBuffer[y][x] = zIndex;
      this.dirty = true;
    }
  }

  getContentLayerChar(
    location: IntPoint,
    offset: IntPoint = ZERO_POINT
  ): string {
    return this.contentLayer.getChar(location, offset);
  }

  setAnimationLayerChar(
    char: string,
    location: IntPoint,
    offset: IntPoint = ZERO_POINT,
    zIndex: number = 0
  ): void {
    const x = location.getX() + offset.getX();
    const y = location.getY() + offset.getY();
    if (
      x >= 0 &&
      x < this.size.getX() &&
      y >= 0 &&
      y < this.size.getY() &&
      zIndex >= this.animationZBuffer[y][x]
    ) {
      this.animationLayer.setChar(location, char, offset);
      this.animationZBuffer[y][x] = zIndex;
      this.dirty = true;
    }
  }

  resetZBuffers(): void {
    const w = this.size.getX();
    const h = this.size.getY();
    for (let y = 0; y < h; y++) {
      const cRow = this.contentZBuffer[y];
      const aRow = this.animationZBuffer[y];
      for (let x = 0; x < w; x++) {
        cRow[x] = -Infinity;
        aRow[x] = -Infinity;
      }
    }
  }

  compositeLayers(): void {
    const rows = this.size.getY();
    const cols = this.size.getX();
    const contentRaw = this.contentLayer.getRawMatrix();
    const animRaw = this.animationLayer.getRawMatrix();
    const surfaceRaw = this.surfaceBuffer.getRawMatrix();

    for (let y = 0; y < rows; y++) {
      const contentRow = contentRaw[y];
      const animRow = animRaw[y];
      const surfaceRow = surfaceRaw[y];
      const contentZRow = this.contentZBuffer[y];
      const animZRow = this.animationZBuffer[y];

      for (let x = 0; x < cols; x++) {
        const animChar = animRow[x];
        if (animChar !== SPACE_CHAR && animZRow[x] >= contentZRow[x]) {
          surfaceRow[x] = animChar;
        } else {
          surfaceRow[x] = contentRow[x];
        }
      }
    }
  }

  getSurfaceBuffer(): CharMatrix {
    return this.surfaceBuffer;
  }

  applyTransforms(transforms: SurfaceTransform[]): CharMatrix {
    if (transforms.length === 0) {
      return this.surfaceBuffer;
    }

    let source = this.surfaceBuffer;
    let output = this.transformOutput;

    for (const transform of transforms) {
      transform.transform(source, output, this.size);
      const tmp = source;
      source = output;
      output = tmp;
    }

    return source;
  }

  getSurface(transforms: SurfaceTransform[]): string[][] {
    this.compositeLayers();
    return this.applyTransforms(transforms).getRawMatrix();
  }

  resize(newSize: IntPoint): void {
    this.size = newSize;
    this.contentLayer.resize(newSize);
    this.animationLayer.resize(newSize);
    this.surfaceBuffer.resize(newSize);
    this.transformOutput.resize(newSize);
    this.contentZBuffer = this.makeZBuffer();
    this.animationZBuffer = this.makeZBuffer();
    this.dirty = true;
  }

  clearContentLayer(): void {
    this.contentLayer.clear();
    this.dirty = true;
  }

  clearAnimationLayer(): void {
    this.animationLayer.clear();
    this.dirty = true;
  }

  markDirty(): void {
    this.dirty = true;
  }

  consumeDirty(): boolean {
    const wasDirty = this.dirty;
    this.dirty = false;
    return wasDirty;
  }
}
