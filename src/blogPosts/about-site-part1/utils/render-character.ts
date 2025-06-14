import "../../../index.css";

export function renderCharacter(
  character: string,
  canvasCtx: CanvasRenderingContext2D,
  size: number,
  fontSize: number
): Uint8Array {
  // Validate the input character
  if (character.length !== 1) {
    throw new Error("Invalid character");
  }

  // Render the character and return a size x size image

  canvasCtx.clearRect(0, 0, size, size);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, size, size);

  canvasCtx.font = `${fontSize}px "Times New Roman"`;
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  canvasCtx.fillStyle = "white";
  canvasCtx.fillText(character, size / 2, size / 2);

  const imageData = canvasCtx.getImageData(0, 0, size, size);
  const binaryImage = new Uint8Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    const brightness = imageData.data[offset]; // grayscale, R=G=B
    binaryImage[i] = brightness > 128 ? 1 : 0;
  }

  return binaryImage;
}
