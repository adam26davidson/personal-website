import { useEffect, useRef, useState } from "react";
import { renderCharacter } from "../../utils/render-character";
import { extractOrderedBoundaryPoints } from "../../utils/character-contours";
import { resampleBoundaryPoints } from "../../utils/sample-character-points";
import "./character-sampler.css";
import { CharacterCanvas } from "../character-canvas/character-canvas";
import { CharacterInput } from "../character-input/character-input";

const imageSize = 300;
const fontSize = 250;
const canvasSize = 300;
const numPoints = 70;
const charColor = "rgb(136, 255, 219)";
const contourColor = "rgb(136, 255, 219)";
const samplePointColor = "rgb(136, 255, 219)";
const defaultCharacter = "A";
const bgColor = "#111111";

export function CharacterSampler() {
  const [character, setCharacter] = useState("B");
  const [processing, setProcessing] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const characterCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  const samplePointCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!renderCanvasRef.current || !characterCanvasRef.current) return;
    if (!contourCanvasRef.current || !samplePointCanvasRef.current) return;
    if (character.length === 0) {
      return; // user pressed backspace
    }
    setProcessing(true);
    renderCanvasRef.current.width = imageSize;
    renderCanvasRef.current.height = imageSize;
    const renderCtx = renderCanvasRef.current.getContext("2d");
    const characterCtx = characterCanvasRef.current.getContext("2d");
    const contourCtx = contourCanvasRef.current.getContext("2d");
    const samplePointCtx = samplePointCanvasRef.current.getContext("2d");

    if (!renderCtx || !characterCtx || !contourCtx || !samplePointCtx) {
      console.error("One or more canvas contexts not found");
      setProcessing(false);
      return;
    }
    const binaryImage = renderCharacter(
      character,
      renderCtx,
      imageSize,
      fontSize
    );
    const contours = extractOrderedBoundaryPoints(binaryImage, imageSize);
    const samplePoints = resampleBoundaryPoints(contours, numPoints);

    // Clear the canvases
    const clearCtx = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      return ctx;
    };

    clearCtx(characterCtx);
    clearCtx(contourCtx);
    clearCtx(samplePointCtx);

    const scale = canvasSize / imageSize;

    // Draw the character on the canvas
    characterCtx.fillStyle = charColor;
    characterCtx.font = `${fontSize * scale}px "Times New Roman"`;
    characterCtx.textAlign = "center";
    characterCtx.textBaseline = "middle";
    characterCtx.fillText(character, canvasSize / 2, canvasSize / 2);

    // Draw the contours
    contourCtx.strokeStyle = contourColor;
    contourCtx.lineWidth = 2;
    contourCtx.beginPath();
    for (const contour of contours) {
      contourCtx.moveTo(contour[0][0] * scale, contour[0][1] * scale);
      for (const point of contour) {
        contourCtx.lineTo(point[0] * scale, point[1] * scale);
      }
      contourCtx.closePath();
      contourCtx.stroke();
    }

    // Draw the sampled points
    samplePointCtx.fillStyle = samplePointColor;
    samplePointCtx.beginPath();
    for (const point of samplePoints) {
      samplePointCtx.moveTo(point[0] * scale, point[1] * scale);
      samplePointCtx.arc(
        point[0] * scale,
        point[1] * scale,
        3,
        0,
        Math.PI * 2,
        false
      );
      samplePointCtx.fill();
    }
    samplePointCtx.closePath();

    setProcessing(false);
  }, [character]);

  useEffect(() => {
    setCharacter(defaultCharacter);
  }, []);

  return (
    <div className="flex flex-row flex-wrap gap-5 justify-center items-center">
      <CharacterInput
        char={character}
        label="Character"
        setChar={setCharacter}
      />
      <canvas ref={renderCanvasRef} style={{ display: "none" }}></canvas>
      {processing ? (
        <p>Processing...</p>
      ) : (
        <div className="flex flex-row flex-wrap justify-center">
          <CharacterCanvas
            canvasRef={characterCanvasRef}
            label="Render Character"
            size={canvasSize}
          />
          <CharacterCanvas
            canvasRef={contourCanvasRef}
            label="Calculate Contours"
            size={canvasSize}
          />
          <CharacterCanvas
            canvasRef={samplePointCanvasRef}
            label="Sample Points"
            size={canvasSize}
          />
        </div>
      )}
    </div>
  );
}
